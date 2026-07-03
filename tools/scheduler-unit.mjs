import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createAuthConfig, deleteAuthConfig, refreshAuthConfig } from "../server/services/config-service.mjs";
import { createDataSource, deleteDataSource, testDataSource } from "../server/services/sync-service.mjs";
import { createSchedule, deleteSchedule, nextFire, parseCron, updateSchedule } from "../server/services/scheduler-service.mjs";

const createdAuthIds = [];
const createdSourceIds = [];
const createdScheduleIds = [];
const receivedLoginBodies = [];
let loginServer;

function startLoginServer() {
  return new Promise((resolve) => {
    const server = createServer((request, response) => {
      let body = "";
      request.on("data", (chunk) => { body += chunk; });
      request.on("end", () => {
        if (request.url === "/login") {
          // Token is only issued when the resolved credentials actually arrive
          // in the login body — this gates success on real credential delivery,
          // so the refresh test fails (instead of false-passing) if the
          // {{username}}/{{password}} templates resolve to empty strings.
          receivedLoginBodies.push(body);
          let parsed = {};
          try { parsed = body ? JSON.parse(body) : {}; } catch {}
          const ok = parsed.username === "ops_user" && parsed.password === "secret";
          response.writeHead(200, {
            "Content-Type": "application/json",
            "Set-Cookie": `TESTSESSION=${ok ? "abc123" : "denied"}; Path=/; HttpOnly`
          });
          response.end(JSON.stringify({ token: ok ? "body-token-xyz" : "" }));
          return;
        }
        response.writeHead(404);
        response.end("not found");
      });
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

try {
  const every5 = parseCron("*/5 * * * *");
  assert(every5.minute.has(0) && every5.minute.has(55), "cron step should expand minutes");
  assert.throws(() => parseCron("* * * *"), "invalid cron should throw");
  const fire = nextFire(new Date("2026-01-01T08:00:00"), "*/5 * * * *");
  assert(fire instanceof Date && fire.getMinutes() % 5 === 0, "nextFire should find next matching minute");

  const schedule = createSchedule({ flowId: "flow_alarm_ops", mode: "interval", intervalSeconds: 120, name: "unit schedule" });
  createdScheduleIds.push(schedule.id);
  assert(schedule.nextRunAt, "created interval schedule should have nextRunAt");
  const disabled = updateSchedule(schedule.id, { enabled: false });
  assert.equal(disabled.nextRunAt, null, "disabled schedule should clear nextRunAt");
  const enabled = updateSchedule(schedule.id, { enabled: true, intervalSeconds: 180 });
  assert(enabled.nextRunAt, "re-enabled schedule should recompute nextRunAt");

  const source = createDataSource({ name: "live mode unit", kind: "api", type: "GET /api/no-host", responsePath: "data.items" });
  createdSourceIds.push(source.id);
  const preview = await testDataSource({ sourceId: source.id });
  assert.equal(preview.ok, true, "preview mode can use mock fallback");
  const live = await testDataSource({ sourceId: source.id, mode: "live" });
  assert.equal(live.ok, false, "live mode should not use mock fallback");
  assert.equal(live.recordCount, 0, "live mode should not produce mock records");

  loginServer = await startLoginServer();
  const port = loginServer.address().port;
  const auth = createAuthConfig({
    name: "unit auth refresh",
    type: "api-cookie",
    cookieName: "TESTSESSION",
    username: "ops_user",
    password: "secret",
    refresh: {
      enabled: true,
      cycleSeconds: 60,
      login: {
        url: `http://127.0.0.1:${port}/login`,
        method: "POST",
        bodyType: "json",
        body: { username: "{{username}}", password: "{{password}}" }
      },
      extract: { from: "body", cookieName: "TESTSESSION", cookiePath: "token" }
    }
  });
  createdAuthIds.push(auth.id);
  const refreshed = await refreshAuthConfig(auth.id);
  assert.equal(refreshed.refresh.lastRefreshStatus, "success", "auth refresh should record success");
  const lastLoginBody = receivedLoginBodies.length ? JSON.parse(receivedLoginBodies[receivedLoginBodies.length - 1]) : {};
  assert.equal(lastLoginBody.username, "ops_user", "login refresh should deliver resolved username");
  assert.equal(lastLoginBody.password, "secret", "login refresh should deliver resolved password");

  console.log(JSON.stringify({ status: "ok", liveBlocked: !live.ok, authRefresh: refreshed.refresh.lastRefreshStatus }, null, 2));
} finally {
  for (const id of createdScheduleIds) { try { deleteSchedule(id); } catch {} }
  for (const id of createdAuthIds) { try { deleteAuthConfig(id); } catch {} }
  for (const id of createdSourceIds) { try { deleteDataSource(id); } catch {} }
  if (loginServer) loginServer.close();
}
