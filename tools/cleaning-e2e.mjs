import { spawn } from "node:child_process";

const port = 4191;
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

async function requestText(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${text}`);
  }
  return text;
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
  [
    "cleaningMode",
    "addSourceBtn",
    "testSourceBtn",
    "responseKeepModeSelect",
    "responseFilterInput",
    "responseFieldSelect",
    "mapDefaultInput",
    "mapRuleSelect",
    "addMappingBtn",
    "ruleActionSelect",
    "ruleSourceFieldInput",
    "ruleParamInput",
    "flowDesigner",
    "flowNodeTypeSelect",
    "flowNodeRefSelect",
    "flowNodeInspector"
  ].forEach((id) => assert(html.includes(`id="${id}"`), `missing UI control: ${id}`));

  const auth = await request("/api/auth-configs", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E Cookie 认证",
      type: "api-cookie",
      cookieName: "E2E_SESSION",
      cookieValue: "e2e_cookie_value"
    })
  });

  const source = await request("/api/data-sources", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E 多层 API 数据源",
      kind: "api",
      type: "POST /api/e2e/list",
      authConfigId: auth.data.id,
      authType: auth.data.type,
      method: "POST",
      queryParams: { startTime: "{{start_time}}", endTime: "{{end_time}}" },
      headers: { "X-E2E": "cleaning" },
      body: { severity: ["P0", "P1"] },
      pagination: "page=1&pageSize=100",
      responsePath: "data.items",
      responseConfig: {
        keepMode: "filter",
        filterCondition: "level in [P0,P1]"
      },
      parameterConfig: {
        sourceType: "database",
        sourceId: "src_cmdb_pg",
        query: "select service_id, owner, env from asset_service_relation where env = 'prod'",
        mappings: [
          { from: "service_id", to: "body.serviceId" },
          { from: "owner", to: "query.owner" }
        ],
        iterationMode: "per-record",
        strategy: "concurrency=3; retries=2; continueOnError=true"
      }
    })
  });

  const sourceTest = await request("/api/data-sources/test", {
    method: "POST",
    body: JSON.stringify({ sourceId: source.data.id, ...source.data })
  });
  assert(sourceTest.data.recordCount === 2, "source test should expose sampled records");
  assert(sourceTest.data.recordFields.includes("data.items[].service.metadata.tags[]"), "nested array field should be selectable");
  assert(sourceTest.data.recordFields.includes("data.items[].extra.queue.lag"), "multi-record-only nested field should be merged");
  assert(new Set(sourceTest.data.recordFields).size === sourceTest.data.recordFields.length, "record fields should be unique");
  assert(sourceTest.data.request.keepMode === "filter", "response keep mode should round-trip");
  assert(sourceTest.data.request.parameterConfig.sourceType === "database", "parameter source should round-trip");
  assert(sourceTest.data.request.parameterConfig.iterationMode === "per-record", "iteration mode should round-trip");

  const rule = await request("/api/cleaning-rules", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E 等级枚举转换",
      type: "normalize",
      expression: "data.items[].level -> severity | enum(P0=高,P1=中,P2=低)",
      description: "把接口等级转换成业务展示等级",
      config: {
        action: "enum",
        sourceField: "data.items[].level",
        targetField: "severity",
        param: "P0=高,P1=中,P2=低"
      }
    })
  });

  const mapping = await request("/api/field-mappings", {
    method: "POST",
    body: JSON.stringify({
      sourceId: source.data.id,
      sourceField: "data.items[].service.metadata.region",
      targetField: "region",
      type: "字符串",
      defaultValue: "unknown",
      ruleId: rule.data.id,
      ruleParam: "trim",
      rule: rule.data.expression,
      output: "内部业务库"
    })
  });
  assert(mapping.data.defaultValue === "unknown", "mapping default value should be saved");
  assert(mapping.data.ruleId === rule.data.id, "mapping should bind selected cleaning rule");

  const updatedMapping = await request(`/api/field-mappings/${mapping.data.id}`, {
    method: "PUT",
    body: JSON.stringify({
      sourceId: source.data.id,
      sourceField: "data.items[].extra.queue.lag",
      targetField: "queue_lag",
      type: "数字",
      defaultValue: "0",
      ruleId: rule.data.id,
      ruleParam: "toNumber",
      rule: "数值转换",
      output: "内部业务库"
    })
  });
  assert(updatedMapping.data.targetField === "queue_lag", "mapping edit should update target field");
  assert(updatedMapping.data.defaultValue === "0", "mapping edit should update default value");

  const deletedMapping = await request(`/api/field-mappings/${updatedMapping.data.id}`, {
    method: "DELETE"
  });
  assert(deletedMapping.data.id === updatedMapping.data.id, "mapping delete should return deleted mapping");

  const flow = await request("/api/business-flows", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E 数据清洗业务流",
      businessName: "E2E 清洗业务",
      dataSourceIds: [source.data.id],
      ruleIds: [rule.data.id],
      nodes: [
        { id: "e2e_context", type: "context", refId: "time-window", name: "E2E 时间窗口", executionMode: "serial", param: "context.start_time/context.end_time" },
        { id: "e2e_source_api", type: "source", refId: source.data.id, name: "E2E 多层 API 数据源", executionMode: "parallel", param: "数据库逐条入参" },
        { id: "e2e_source_cmdb", type: "source", refId: "src_cmdb_pg", name: "CMDB PostgreSQL", executionMode: "parallel", param: "负责人补齐" },
        { id: "e2e_rule_enum", type: "rule", refId: rule.data.id, name: "E2E 等级枚举转换", executionMode: "join", param: "P0/P1/P2" },
        { id: "e2e_output", type: "output", refId: "business-table", name: "biz_e2e_event", executionMode: "serial", param: "upsert" }
      ],
      timeField: "event_time",
      outputMode: "upsert-business",
      outputConfig: {
        writeStrategy: "upsert",
        primaryKey: "event_id",
        rawTable: "raw_e2e_api",
        cleanTable: "clean_e2e_event",
        businessTable: "biz_e2e_event",
        dedupeStrategy: "primary-key"
      }
    })
  });
  const duplicateBusinessFlow = await request("/api/business-flows", {
    method: "POST",
    body: JSON.stringify({
      ...flow.data,
      name: "E2E 同业务唯一流校验",
      nodes: flow.data.nodes
    })
  });
  assert(duplicateBusinessFlow.data.id === flow.data.id, "same business should keep exactly one business flow");
  assert(duplicateBusinessFlow.data.name === "E2E 同业务唯一流校验", "same business flow should be updated by duplicate create");
  const updatedFlow = await request(`/api/business-flows/${flow.data.id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...duplicateBusinessFlow.data,
      name: "E2E 数据清洗业务流已编辑",
      nodes: duplicateBusinessFlow.data.nodes.map((node) => (node.id === "e2e_output" ? { ...node, param: "upsert edited" } : node))
    })
  });
  const flowRun = await request("/api/business-flows/run", {
    method: "POST",
    body: JSON.stringify({ flowId: updatedFlow.data.id })
  });
  assert(flowRun.data.business.name === "E2E 清洗业务", "business flow should create target business data");
  assert(flowRun.data.outputConfig.businessTable === "biz_e2e_event", "business table should round-trip");
  assert(flowRun.data.parameterPlan.loopCalls === 3, "flow graph should combine database-driven API calls and static source calls");
  assert(flowRun.data.executionPlan.parallel === 2, "flow graph should support parallel source nodes");
  assert(flowRun.data.executionPlan.join === 1, "flow graph should support join nodes");

  await request(`/api/cleaning-rules/${rule.data.id}`, { method: "DELETE" });
  const deletedFlow = await request(`/api/business-flows/${updatedFlow.data.id}`, { method: "DELETE" });
  await request(`/api/data-sources/${source.data.id}`, { method: "DELETE" });
  await request(`/api/auth-configs/${auth.data.id}`, { method: "DELETE" });

  console.log(
    JSON.stringify(
      {
        page: "ok",
        auth: auth.data.name,
        source: source.data.name,
        recordFields: sourceTest.data.recordFields.length,
        nestedJson: "ok",
        parameterSource: sourceTest.data.request.parameterConfig.sourceType,
        rule: rule.data.name,
        mappingCreated: mapping.data.targetField,
        mappingEdited: updatedMapping.data.targetField,
        mappingDeleted: deletedMapping.data.targetField,
        flow: flowRun.data.business.name,
        flowName: updatedFlow.data.name,
        businessTable: flowRun.data.outputConfig.businessTable,
        loopCalls: flowRun.data.parameterPlan.loopCalls,
        parallelNodes: flowRun.data.executionPlan.parallel,
        deletedFlow: deletedFlow.data.name
      },
      null,
      2
    )
  );
} finally {
  server.kill();
}
