import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { createStorageAdapter } from "../server/data/storage-adapter.mjs";
import { store, buildStorageSnapshot } from "../server/data/store.mjs";
import { assertAuthorized } from "../server/core/security.mjs";
import { createAuthConfig, deleteAuthConfig, updateAuthConfig } from "../server/services/config-service.mjs";
import { callConfiguredModel } from "../server/services/model-service.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

process.env.OPERATION_API_TOKENS = JSON.stringify({
  "unit-reader": { role: "reader", user: "reader" },
  "unit-admin": { role: "admin", user: "admin" }
});

let blocked = false;
try {
  assertAuthorized({
    method: "DELETE",
    headers: {
      "x-operation-token": "unit-reader",
      "x-operation-role": "admin"
    }
  }, "admin");
} catch (error) {
  blocked = error.status === 403;
}
assert(blocked, "reader token must not become admin via X-Operation-Role");
assertAuthorized({ method: "DELETE", headers: { "x-operation-token": "unit-admin" } }, "admin");

const dbAuth = createAuthConfig({
  name: "Unit DB Auth",
  type: "db-account-password",
  username: "unit",
  password: "unit-secret"
});
const storedAuth = store.authConfigs.find((item) => item.id === dbAuth.id);
assert(storedAuth.password === "unit-secret", "db auth password should be stored in password field");
assert(storedAuth.cookieValue === "", "db auth password must not be stored in cookieValue");
const cookieAuth = createAuthConfig({
  name: "Unit Cookie Auth",
  type: "api-cookie",
  cookieName: "UNIT_SESSION",
  cookieValue: "cookie-secret"
});
const storedCookieAuth = store.authConfigs.find((item) => item.id === cookieAuth.id);
assert(storedCookieAuth.password === "", "api cookie auth should not store cookie in password field");
assert(storedCookieAuth.cookieValue === "cookie-secret", "api cookie auth should store secret in cookieValue");
const updatedAuth = updateAuthConfig(dbAuth.id, {
  name: "Unit DB Auth Edited",
  type: "db-account-password",
  username: "unit",
  password: ""
});
assert(updatedAuth.password === "******", "db auth update should return masked password");
assert(store.authConfigs.find((item) => item.id === dbAuth.id).password === "unit-secret", "blank edit must preserve password");
deleteAuthConfig(dbAuth.id);
deleteAuthConfig(cookieAuth.id);

const sqlitePath = resolve(process.cwd(), "server/data/security-unit.sqlite");
rmSync(sqlitePath, { force: true });
const sqlite = createStorageAdapter({ type: "database", database: "sqlite", host: sqlitePath });
sqlite.write({ unit: true, rows: [{ id: 1 }] });
assert(sqlite.read().rows[0].id === 1, "sqlite adapter should read back written snapshot");
rmSync(sqlitePath, { force: true });

const configSnapshot = buildStorageSnapshot("copy-config");
assert(Array.isArray(configSnapshot.dataSources), "copy-config should include configuration arrays");
assert(Array.isArray(configSnapshot.businesses) && configSnapshot.businesses.length === 0, "copy-config should exclude business runtime rows");
assert(Array.isArray(configSnapshot.syncLogs) && configSnapshot.syncLogs.length === 0, "copy-config should exclude sync logs");
const switchOnlySnapshot = buildStorageSnapshot("switch-only");
assert(Array.isArray(switchOnlySnapshot.dataSources) && switchOnlySnapshot.dataSources.length === 0, "switch-only should exclude configuration arrays");
assert(Array.isArray(switchOnlySnapshot.businesses) && switchOnlySnapshot.businesses.length === 0, "switch-only should exclude runtime rows");
const copyAllSnapshot = buildStorageSnapshot("copy-all");
assert((copyAllSnapshot.businesses || []).length === (store.businesses || []).length, "copy-all should preserve runtime business rows");

const modelResponse = await callConfiguredModel(
  { vendor: "openai-compatible", model: "fake", baseUrl: "http://127.0.0.1:1/v1", apiKey: "fake-key" },
  [{ role: "user", content: "hello" }]
);
assert(modelResponse.used === false && modelResponse.reason === "live model disabled", "model call should default to local fallback");

console.log(JSON.stringify({
  status: "ok",
  rbacPrivilegeEscalationBlocked: blocked,
  dbAuthSecretPreserved: true,
  authSecretsSeparated: true,
  sqliteReadWrite: true,
  copyConfigExcludesRuntime: true,
  switchOnlyExcludesConfig: true,
  copyAllPreservesRuntime: true,
  modelFallback: modelResponse.reason
}, null, 2));
