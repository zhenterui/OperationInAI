// scheduler / auth-refresh / live-mode 单元验证
// 覆盖 P0 三项能力:
//   1. cron 解析与 nextFire
//   2. schedules CRUD + nextRunAt 计算
//   3. live 模式禁 mock 兜底
//   4. 认证声明式登录刷新(本地 HTTP server 集成)
// 运行: npm run scheduler:unit

import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { runtimeStorePath, storagePointerPath } from "../server/data/storage-adapter.mjs";
import { parseCron, nextFire, createSchedule, updateSchedule, deleteSchedule } from "../server/services/scheduler-service.mjs";
import { createAuthConfig, deleteAuthConfig, refreshAuthConfig } from "../server/services/config-service.mjs";
import { createDataSource, deleteDataSource, testDataSource } from "../server/services/sync-service.mjs";

// 备份持久化文件, 避免污染开发者 runtime-store
const backups = [
  { path: runtimeStorePath, had: existsSync(runtimeStorePath), data: existsSync(runtimeStorePath) ? readFileSync(runtimeStorePath, "utf8") : null },
  { path: storagePointerPath, had: existsSync(storagePointerPath), data: existsSync(storagePointerPath) ? readFileSync(storagePointerPath, "utf8") : null }
];

const createdScheduleIds = [];
const createdAuthIds = [];
const createdSourceIds = [];
let loginServer;
let loginServerHits = [];

function startLoginServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        loginServerHits.push({ url: req.url, method: req.method, body });
        if (req.url === "/login") {
          // 同时返回 Set-Cookie 头与 JSON body, 供 header/body 两种提取方式测试
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Set-Cookie": "TESTSESSION=abc123; Path=/; HttpOnly"
          });
          res.end(JSON.stringify({ token: "body-token-xyz" }));
        } else {
          res.writeHead(404);
          res.end("not found");
        }
      });
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function restorePersistedFiles() {
  for (const item of backups) {
    try {
      if (item.had) writeFileSync(item.path, item.data, "utf8");
      else if (existsSync(item.path)) unlinkSync(item.path);
    } catch {
      // 还原失败不阻断测试结论
    }
  }
}

function cleanupAll() {
  for (const id of createdScheduleIds) {
    try { deleteSchedule(id); } catch {}
  }
  for (const id of createdAuthIds) {
    try { deleteAuthConfig(id); } catch {}
  }
  for (const id of createdSourceIds) {
    try { deleteDataSource(id); } catch {}
  }
  if (loginServer) {
    try { loginServer.close(); } catch {}
  }
}

try {
  // ---------- 1. cron 解析 ----------
  const every5 = parseCron("*/5 * * * *");
  assert(every5.minute.has(0) && every5.minute.has(5) && every5.minute.has(55), "*/5 分钟集合应含 0/5/55");
  assert(!every5.minute.has(3), "*/5 分钟集合不应含 3");

  const weekday9am = parseCron("0 9 * * 1-5");
  assert(weekday9am.hour.has(9) && weekday9am.dow.has(1) && weekday9am.dow.has(5) && !weekday9am.dow.has(0), "0 9 * * 1-5 应为工作日 9 点");

  assert.throws(() => parseCron("bad cron"), "非法 cron 应抛错");
  assert.throws(() => parseCron("* * * *"), "4 段 cron 应抛错");

  // ---------- 2. nextFire ----------
  const base = new Date("2026-01-01T08:00:00");
  const fire1 = nextFire(base, "*/5 * * * *");
  assert(fire1 instanceof Date && fire1 > base, "nextFire 应返回更晚的 Date");
  assert(fire1.getMinutes() % 5 === 0, "*/5 的下次触发分钟应是 5 的倍数");

  const fireWeekday = nextFire(base, "0 9 * * 1-5");
  assert([1, 2, 3, 4, 5].includes(fireWeekday.getDay()), "工作日 cron 触发应落在周一至周五");
  assert(fireWeekday.getHours() === 9 && fireWeekday.getMinutes() === 0, "工作日 cron 应在 9:00 触发");

  // ---------- 3. schedules CRUD + nextRunAt ----------
  const intervalSched = createSchedule({ flowId: "flow_alarm_ops", name: "测试间隔调度", mode: "interval", intervalSeconds: 120 });
  createdScheduleIds.push(intervalSched.id);
  assert(intervalSched.mode === "interval" && intervalSched.nextRunAt, "interval 调度应计算 nextRunAt");
  assert(intervalSched.flowName === "告警业务", "调度应回填 flowName");

  const cronSched = createSchedule({ flowId: "flow_alarm_ops", name: "测试 cron 调度", mode: "cron", cronExpr: "*/10 * * * *" });
  createdScheduleIds.push(cronSched.id);
  assert(cronSched.mode === "cron" && cronSched.nextRunAt, "cron 调度应计算 nextRunAt");

  const onceSched = createSchedule({ flowId: "flow_alarm_ops", name: "测试单次", mode: "once" });
  createdScheduleIds.push(onceSched.id);
  assert(onceSched.mode === "once", "once 调度应创建");

  const disabled = updateSchedule(intervalSched.id, { enabled: false });
  assert(disabled.enabled === false && disabled.nextRunAt === null, "禁用调度应清空 nextRunAt");

  const reenabled = updateSchedule(intervalSched.id, { enabled: true });
  assert(reenabled.enabled === true && reenabled.nextRunAt, "重新启用应重算 nextRunAt");

  assert.throws(() => createSchedule({ flowId: "nonexistent_flow" }), "绑定不存在业务流应报错");

  // ---------- 4. live 模式禁 mock 兜底 ----------
  const fakeApiSource = createDataSource({
    name: "live-mode 测试源",
    kind: "api",
    type: "GET /api/no-host",   // 无 host, 真实采集取不到
    responsePath: "data.items"
  });
  createdSourceIds.push(fakeApiSource.id);

  const previewResult = await testDataSource({ sourceId: fakeApiSource.id });
  assert(previewResult.ok === true && previewResult.recordCount === 2, "preview 模式应回退 mock(2 条)");

  const liveResult = await testDataSource({ sourceId: fakeApiSource.id, mode: "live" });
  assert(liveResult.ok === false, "live 模式应返回失败而非 mock");
  assert(liveResult.recordCount === 0, "live 模式不应产出 mock 记录");
  assert(liveResult.sourceMode === "real", "live 模式 sourceMode 应为 real");
  assert(String(liveResult.error).includes("live 模式"), "live 失败应带 live 模式说明");

  // ---------- 5. 认证声明式登录刷新 ----------
  loginServer = await startLoginServer();
  const port = loginServer.address().port;
  loginServerHits = [];

  // 5a. header 提取
  const headerAuth = createAuthConfig({
    name: "测试 header 刷新",
    type: "api-cookie",
    cookieName: "TESTSESSION",
    username: "ops_user",
    password: "secret",
    refresh: {
      enabled: true,
      cycleSeconds: 60,
      login: {
        method: "POST",
        url: `http://127.0.0.1:${port}/login`,
        bodyType: "json",
        body: { username: "{{username}}", password: "{{password}}" }
      },
      extract: { from: "header", cookieName: "TESTSESSION" }
    }
  });
  createdAuthIds.push(headerAuth.id);
  const refreshedHeader = await refreshAuthConfig(headerAuth.id);
  assert(refreshedHeader.refresh.lastRefreshStatus === "success", "header 提取刷新应成功");
  assert(loginServerHits.some((hit) => hit.body.includes("ops_user") && hit.body.includes("secret")), "登录请求应替换 {{username}}/{{password}} 占位");

  // 5b. body 提取
  const bodyAuth = createAuthConfig({
    name: "测试 body 刷新",
    type: "api-cookie",
    cookieName: "TOKEN",
    refresh: {
      enabled: true,
      cycleSeconds: 60,
      login: { method: "POST", url: `http://127.0.0.1:${port}/login`, bodyType: "json", body: {} },
      extract: { from: "body", cookieName: "TOKEN", cookiePath: "token" }
    }
  });
  createdAuthIds.push(bodyAuth.id);
  const refreshedBody = await refreshAuthConfig(bodyAuth.id);
  assert(refreshedBody.refresh.lastRefreshStatus === "success", "body 提取刷新应成功");

  // 5c. SSRF 守卫: 元数据地址应被拦截
  const ssrfAuth = createAuthConfig({
    name: "测试 SSRF 拦截",
    type: "api-cookie",
    cookieName: "X",
    refresh: {
      enabled: true,
      cycleSeconds: 60,
      login: { method: "GET", url: "http://169.254.169.254/latest/meta-data/", bodyType: "json", body: {} },
      extract: { from: "header", cookieName: "X" }
    }
  });
  createdAuthIds.push(ssrfAuth.id);
  let ssrfThrew = false;
  try {
    await refreshAuthConfig(ssrfAuth.id);
  } catch {
    ssrfThrew = true;
  }
  assert(ssrfThrew, "SSRF 危险地址应被拦截");

  // 5d. 未启用刷新应报错
  const noRefreshAuth = createAuthConfig({ name: "无刷新", type: "api-cookie", cookieName: "C" });
  createdAuthIds.push(noRefreshAuth.id);
  await assert.rejects(refreshAuthConfig(noRefreshAuth.id), { message: /未启用自动刷新/ }, "未启用刷新的认证应报错");

  console.log(JSON.stringify({
    status: "ok",
    cronParse: "ok",
    nextFireEvery5Min: fire1.getMinutes(),
    nextFireWeekdayDay: fireWeekday.getDay(),
    schedules: createdScheduleIds.length,
    livePreviewOk: previewResult.ok,
    liveBlocked: !liveResult.ok,
    authHeaderRefresh: refreshedHeader.refresh.lastRefreshStatus,
    authBodyRefresh: refreshedBody.refresh.lastRefreshStatus,
    ssrfBlocked: ssrfThrew
  }, null, 2));
} catch (error) {
  console.error("scheduler-unit FAILED:", error);
  process.exitCode = 1;
} finally {
  cleanupAll();
  restorePersistedFiles();
}
