import { spawn } from "node:child_process";

const port = 4189;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["./server/index.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"]
});

let stderr = "";
server.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response.json();
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
    body: JSON.stringify({ sourceId: updatedSource.data.id, sourceField: "smoke.raw", targetField: "smoke_clean" })
  });
  const rule = await request("/api/cleaning-rules", {
    method: "POST",
    body: JSON.stringify({ name: "冒烟清洗规则", type: "normalize", expression: "trim + lower", description: "冒烟测试规则" })
  });
  const updatedRule = await request(`/api/cleaning-rules/${rule.data.id}`, {
    method: "PUT",
    body: JSON.stringify({ name: "冒烟清洗规则已编辑", type: "normalize", expression: "trim + upper", description: "冒烟测试规则已编辑" })
  });
  const flow = await request("/api/business-flows", {
    method: "POST",
    body: JSON.stringify({
      name: "冒烟业务流",
      businessName: "冒烟业务模块",
      dataSourceIds: [updatedSource.data.id, "src_cmdb_pg"],
      ruleIds: [updatedRule.data.id],
      timeField: "event_time"
    })
  });
  const flowRun = await request("/api/business-flows/run", {
    method: "POST",
    body: JSON.stringify({ flowId: flow.data.id })
  });
  const business = await request("/api/businesses/query", {
    method: "POST",
    body: JSON.stringify({ businessName: "告警业务", keyword: "支付", view: "top" })
  });
  const knowledge = await request("/api/knowledge-sources", {
    method: "POST",
    body: JSON.stringify({ name: "冒烟测试知识源", path: "D:/ops/smoke" })
  });
  const analysis = await request("/api/analysis/run", {
    method: "POST",
    body: JSON.stringify({ businessName: "告警业务" })
  });
  const search = await request("/api/search/query", {
    method: "POST",
    body: JSON.stringify({ question: "支付和订单告警怎么处理？" })
  });
  const deletedSource = await request(`/api/data-sources/${updatedSource.data.id}`, {
    method: "DELETE"
  });
  const deletedRule = await request(`/api/cleaning-rules/${updatedRule.data.id}`, {
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
        mapping: mapping.data.targetField,
        rule: updatedRule.data.name,
        deletedRule: deletedRule.data.name,
        flow: flowRun.data.business.name,
        businessRows: business.data.rows.length,
        knowledge: knowledge.data.name,
        syncStatus: sync.data.status,
        analysisSections: analysis.data.sections.length,
        searchSources: search.data.sources.length
      },
      null,
      2
    )
  );
} finally {
  server.kill();
}
