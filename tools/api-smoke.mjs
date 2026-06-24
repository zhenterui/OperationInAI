import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const port = 4189;
const baseUrl = `http://127.0.0.1:${port}`;
const smokeSqlitePath = "server/data/smoke-runtime-store.sqlite";
const adminToken = "smoke-admin-token";
rmSync(smokeSqlitePath, { force: true });
const server = spawn(process.execPath, ["./server/index.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(port),
    OPERATION_API_TOKENS: JSON.stringify({
      "smoke-reader-token": { role: "reader", user: "smoke-reader" },
      "smoke-operator-token": { role: "operator", user: "smoke-operator" },
      [adminToken]: { role: "admin", user: "smoke-admin" }
    })
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let stderr = "";
server.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options) {
  const { headers = {}, ...rest } = options || {};
  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", "X-Operation-Token": adminToken, ...headers }
  });
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response.json();
}

async function expectStatus(path, status, options) {
  const { headers = {}, ...rest } = options || {};
  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...headers }
  });
  assert(response.status === status, `${path} expected ${status}, got ${response.status}`);
  return response;
}

async function requestText(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response.text();
}

async function waitForServer() {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    try {
      await request("/api/health");
      return;
    } catch {
      await wait(120);
    }
  }
  throw new Error(`backend did not start\n${stderr}`);
}

try {
  await waitForServer();
  const html = await requestText("/");
  const bootstrap = await request("/api/bootstrap");
  await expectStatus("/api/storage-configs/storage_local_default", 403, {
    method: "DELETE",
    headers: { "X-Operation-Token": "smoke-reader-token", "X-Operation-Role": "admin" }
  });
  const authList = await request("/api/auth-configs");
  const auth = await request("/api/auth-configs", {
    method: "POST",
    body: JSON.stringify({
      name: "冒烟 Cookie 认证",
      type: "cookie",
      cookieName: "SMOKE_SESSION",
      cookieValue: "smoke_cookie_value"
    })
  });
  const updatedAuth = await request(`/api/auth-configs/${auth.data.id}`, {
    method: "PUT",
    body: JSON.stringify({ name: "冒烟 Cookie 认证已编辑", type: "cookie", cookieName: "SMOKE_SESSION", cookieValue: "edited_cookie_value" })
  });
  const dbAuth = await request("/api/auth-configs", {
    method: "POST",
    body: JSON.stringify({
      name: "冒烟数据库认证",
      type: "db-account-password",
      username: "smoke_db",
      password: "db-secret"
    })
  });
  const updatedDbAuth = await request(`/api/auth-configs/${dbAuth.data.id}`, {
    method: "PUT",
    body: JSON.stringify({ name: "冒烟数据库认证已编辑", type: "db-account-password", username: "smoke_db", password: "" })
  });
  assert(updatedDbAuth.data.password === "******", "db auth password should be preserved and masked");
  assert(updatedDbAuth.data.cookieValue === "", "db auth should not store password in cookieValue");
  const source = await request("/api/data-sources", {
    method: "POST",
    body: JSON.stringify({
      name: "冒烟测试 API",
      type: "GET /api/smoke",
      authConfigId: updatedAuth.data.id,
      authType: updatedAuth.data.type,
      method: "POST",
      queryParams: { startTime: "{{start_time}}" },
      headers: { "X-Smoke": "yes" },
      body: { severity: ["P0"] },
      pagination: "page=1&pageSize=50"
    })
  });
  const updatedSource = await request(`/api/data-sources/${source.data.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: "冒烟测试 API 已编辑",
      type: "POST /api/smoke/edit",
      authConfigId: updatedAuth.data.id,
      authType: updatedAuth.data.type,
      method: "POST",
      queryParams: { startTime: "{{start_time}}", endTime: "{{end_time}}" },
      headers: { "X-Smoke": "edited" },
      body: { severity: ["P0", "P1"] },
      pagination: "page=2&pageSize=100"
    })
  });
  const sourceTest = await request("/api/data-sources/test", {
    method: "POST",
    body: JSON.stringify({ sourceId: updatedSource.data.id, ...updatedSource.data })
  });
  const uniqueTestFields = new Set(sourceTest.data.fields);
  if (uniqueTestFields.size !== sourceTest.data.fields.length) {
    throw new Error("Source test fields should be unique");
  }
  const sync = await request("/api/sync-jobs/run", {
    method: "POST",
    body: JSON.stringify({ sourceId: updatedSource.data.id })
  });
  const mapping = await request("/api/field-mappings", {
    method: "POST",
    body: JSON.stringify({
      sourceId: updatedSource.data.id,
      sourceField: "smoke.raw",
      targetField: "smoke_clean",
      defaultValue: "unknown",
      ruleId: "rule_alarm_normalize",
      ruleParam: ""
    })
  });
  const updatedMapping = await request(`/api/field-mappings/${mapping.data.id}`, {
    method: "PUT",
    body: JSON.stringify({
      sourceId: updatedSource.data.id,
      sourceField: "smoke.raw.edited",
      targetField: "smoke_clean_edited",
      defaultValue: "edited_default",
      ruleId: "rule_alarm_normalize",
      ruleParam: ""
    })
  });
  const rule = await request("/api/cleaning-rules", {
    method: "POST",
    body: JSON.stringify({ name: "冒烟清洗规则", type: "normalize", expression: "trim + lower", description: "冒烟测试规则" })
  });
  const updatedRule = await request(`/api/cleaning-rules/${rule.data.id}`, {
    method: "PUT",
    body: JSON.stringify({ name: "冒烟清洗规则已编辑", type: "normalize", expression: "trim + upper", description: "冒烟测试规则已编辑" })
  });
  const dictionary = await request("/api/dictionary-sets", {
    method: "POST",
    body: JSON.stringify({
      name: "冒烟产品字典",
      category: "业务字典",
      columns: ["产品部", "产品名", "别名列表"],
      rows: [{ "产品部": "交易产品部", "产品名": "支付网关", "别名列表": "pay-gateway,payment-api" }]
    })
  });
  const updatedDictionary = await request(`/api/dictionary-sets/${dictionary.data.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: "冒烟产品字典已编辑",
      category: "业务字典",
      columns: ["产品部", "产品名", "别名列表"],
      rows: [{ "产品部": "交易产品部", "产品名": "支付网关", "别名列表": "pay-gateway,payment-api" }]
    })
  });
  const flow = await request("/api/business-flows", {
    method: "POST",
    body: JSON.stringify({
      name: "冒烟业务流",
      businessName: "冒烟业务模块",
      dataSourceIds: [updatedSource.data.id, "src_cmdb_pg"],
      ruleIds: [updatedRule.data.id],
      nodes: [
        { id: "smoke_context", type: "context", refId: "time-window", name: "冒烟上下文", executionMode: "serial", param: "context.time" },
        { id: "smoke_source_api", type: "source", refId: updatedSource.data.id, name: "冒烟 API", executionMode: "parallel", param: "api" },
        { id: "smoke_source_cmdb", type: "source", refId: "src_cmdb_pg", name: "CMDB", executionMode: "parallel", param: "db" },
        { id: "smoke_rule", type: "rule", refId: updatedRule.data.id, name: "冒烟规则", executionMode: "join", param: "clean" }
      ],
      edges: [
        { id: "edge_smoke_context_api", from: "smoke_context", to: "smoke_source_api", type: "parallel", label: "API branch" },
        { id: "edge_smoke_context_cmdb", from: "smoke_context", to: "smoke_source_cmdb", type: "parallel", label: "CMDB branch" },
        { id: "edge_smoke_api_rule", from: "smoke_source_api", to: "smoke_rule", type: "join", label: "join API" },
        { id: "edge_smoke_cmdb_rule", from: "smoke_source_cmdb", to: "smoke_rule", type: "join", label: "join CMDB" }
      ],
      timeField: "event_time"
    })
  });
  const updatedFlow = await request(`/api/business-flows/${flow.data.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: "冒烟业务流已编辑",
      businessName: "冒烟业务模块",
      dataSourceIds: [updatedSource.data.id, "src_cmdb_pg"],
      ruleIds: [updatedRule.data.id],
      nodes: flow.data.nodes,
      edges: flow.data.edges,
      timeField: "event_time"
    })
  });
  const flowRun = await request("/api/business-flows/run", {
    method: "POST",
    body: JSON.stringify({ flowId: updatedFlow.data.id })
  });
  assert(updatedFlow.data.edges.length >= 4, "business flow should persist explicit DAG edges");
  assert(flowRun.data.executionPlan.edges >= 4, "business flow run should include DAG edges in execution plan");
  const business = await request("/api/businesses/query", {
    method: "POST",
    body: JSON.stringify({ businessName: "告警业务", keyword: "支付", view: "top" })
  });
  const knowledge = await request("/api/knowledge-sources", {
    method: "POST",
    body: JSON.stringify({ name: "冒烟测试知识源", path: "D:/ops/smoke" })
  });
  const modelConfig = await request("/api/model-configs", {
    method: "POST",
    body: JSON.stringify({
      name: "冒烟模型配置",
      vendor: "openai-compatible",
      model: "smoke-model",
      baseUrl: "http://localhost:11434/v1",
      apiKey: "smoke-api-key-123456"
    })
  });
  const updatedModelConfig = await request(`/api/model-configs/${modelConfig.data.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: "冒烟模型配置已编辑",
      vendor: "deepseek",
      model: "smoke-model-edited",
      baseUrl: "https://api.deepseek.com/v1",
      apiKey: "smoke-api-key-edited"
    })
  });
  const storageConfig = await request("/api/storage-configs", {
    method: "POST",
    body: JSON.stringify({
      name: "Smoke SQLite Storage",
      database: "sqlite",
      host: smokeSqlitePath,
      port: "",
      username: "",
      password: ""
    })
  });
  const updatedStorageConfig = await request(`/api/storage-configs/${storageConfig.data.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: "Smoke SQLite Storage Edited",
      database: "sqlite",
      host: smokeSqlitePath,
      port: "",
      username: "",
      password: ""
    })
  });
  const storageSwitchToDb = await request("/api/storage-configs/switch", {
    method: "POST",
    body: JSON.stringify({
      targetStorageId: updatedStorageConfig.data.id,
      migrationPolicy: "copy-all"
    })
  });
  const sqliteDb = new DatabaseSync(smokeSqlitePath);
  const sqliteRow = sqliteDb.prepare("select store_value from operation_store where store_key = ?").get("runtime");
  sqliteDb.close();
  assert(sqliteRow?.store_value?.includes(updatedStorageConfig.data.id), "sqlite storage should contain switched runtime snapshot");
  const analysis = await request("/api/analysis/run", {
    method: "POST",
    body: JSON.stringify({
      businessNames: ["告警业务", "工单业务"],
      fields: ["事件名称", "等级", "归属对象", "时间"],
      comboFields: "等级 + 归属对象 + 时间",
      scope: "compare",
      modelConfigId: updatedModelConfig.data.id,
      filterContext: {
        selectedValues: { severity: "P0" },
        filters: [{ id: "severity", label: "Severity", field: "等级", type: "select", source: "manual", options: ["P0", "P1"] }],
        timeFields: ["event_time", "时间"]
      }
    })
  });
  assert(analysis.data.filterContext.filteredRows <= analysis.data.filterContext.totalRows, "analysis should apply filter context");
  assert(analysis.data.modelProvider === "local", "analysis should default to local fallback when live model is disabled");
  const search = await request("/api/search/query", {
    method: "POST",
    body: JSON.stringify({ question: "支付和订单告警怎么处理？", modelConfigId: updatedModelConfig.data.id })
  });
  assert(search.data.modelProvider === "local", "search should default to local fallback when live model is disabled");
  const deletedSource = await request(`/api/data-sources/${updatedSource.data.id}`, {
    method: "DELETE"
  });
  const deletedMapping = await request(`/api/field-mappings/${updatedMapping.data.id}`, {
    method: "DELETE"
  });
  const deletedRule = await request(`/api/cleaning-rules/${updatedRule.data.id}`, {
    method: "DELETE"
  });
  const deletedDictionary = await request(`/api/dictionary-sets/${updatedDictionary.data.id}`, {
    method: "DELETE"
  });
  const deletedFlow = await request(`/api/business-flows/${updatedFlow.data.id}`, {
    method: "DELETE"
  });
  const deletedModelConfig = await request(`/api/model-configs/${updatedModelConfig.data.id}`, {
    method: "DELETE"
  });
  const deletedDbAuth = await request(`/api/auth-configs/${updatedDbAuth.data.id}`, {
    method: "DELETE"
  });
  const storageSwitchToLocal = await request("/api/storage-configs/switch", {
    method: "POST",
    body: JSON.stringify({
      targetStorageId: "storage_local_default",
      migrationPolicy: "copy-config"
    })
  });
  const deletedStorageConfig = await request(`/api/storage-configs/${updatedStorageConfig.data.id}`, {
    method: "DELETE"
  });

  console.log(
    JSON.stringify(
      {
        health: "ok",
        page: html.includes("OperationInAI") ? "ok" : "missing",
        metrics: bootstrap.data.metrics.length,
        authConfigs: authList.data.length,
        auth: updatedAuth.data.name,
        source: source.data.name,
        updatedSource: updatedSource.data.name,
        sourceAuthConfigId: updatedSource.data.authConfigId,
        requestMethod: updatedSource.data.requestConfig.method,
        testFields: sourceTest.data.fields.length,
        deletedSource: deletedSource.data.name,
        mapping: updatedMapping.data.targetField,
        mappingDefault: updatedMapping.data.defaultValue,
        deletedMapping: deletedMapping.data.targetField,
        rule: updatedRule.data.name,
        deletedRule: deletedRule.data.name,
        dictionary: updatedDictionary.data.name,
        deletedDictionary: deletedDictionary.data.name,
        flow: flowRun.data.business.name,
        flowName: updatedFlow.data.name,
        flowParallel: flowRun.data.executionPlan.parallel,
        flowEdges: updatedFlow.data.edges.length,
        flowRunEdges: flowRun.data.executionPlan.edges,
        deletedFlow: deletedFlow.data.name,
        businessRows: business.data.rows.length,
        knowledge: knowledge.data.name,
        modelConfig: updatedModelConfig.data.name,
        modelConfigMasked: updatedModelConfig.data.apiKeyMasked,
        deletedModelConfig: deletedModelConfig.data.name,
        storageConfig: updatedStorageConfig.data.name,
        storagePasswordReturned: updatedStorageConfig.data.password === "" ? "masked" : "plain",
        storageSwitchToDb: storageSwitchToDb.data.currentStorageId,
        storageSwitchToLocal: storageSwitchToLocal.data.currentStorageId,
        storageMigrationPolicy: storageSwitchToDb.data.migration.migrationPolicy,
        deletedStorageConfig: deletedStorageConfig.data.name,
        syncStatus: sync.data.status,
        analysisSections: analysis.data.sections.length,
        analysisBusinesses: analysis.data.businessNames.length,
        analysisModel: analysis.data.model,
        analysisFilteredRows: analysis.data.filterContext.filteredRows,
        searchSources: search.data.sources.length
      },
      null,
      2
    )
  );
} finally {
  server.kill();
  await wait(50);
  rmSync(smokeSqlitePath, { force: true });
}
