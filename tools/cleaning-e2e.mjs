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
    "configureValueFiltersBtn",
    "mapDefaultInput",
    "mapRuleSelect",
    "mapRecordModeSelect",
    "mapRecordFilterInput",
    "mapAggregateModeSelect",
    "mapAggregateSeparatorInput",
    "addMappingBtn",
    "ruleActionSelect",
    "ruleParamInput",
    "ruleDictionarySelect",
    "addDictionaryBtn",
    "dictionarySetList",
    "paramPlaceholderInput",
    "flowDesigner",
    "flowNodeTypeSelect",
    "flowNodeRefSelect",
    "flowNodeBranchModeSelect",
    "flowNodeBranchFromSelect",
    "flowNodeBranchConditionInput",
    "flowNodeInspector",
    "flowNodePaginationModeSelect",
    "flowNodeTotalPagesInput",
    "flowNodePagesPerShardInput",
    "flowNodeInputIterationSelect",
    "flowNodeConcurrencyInput",
    "flowNodeBatchSizeInput",
    "flowNodeLockKeyInput",
    "flowDedupeFieldsInput",
    "overviewFilterBar",
    "configureSituationFiltersBtn",
    "situationFilterModal",
    "situationFilterFieldInput",
    "situationTimeFieldsInput"
  ].forEach((id) => assert(html.includes(`id="${id}"`), `missing UI control: ${id}`));

  const situationFilter = await request("/api/situation-filters", {
    method: "POST",
    body: JSON.stringify({
      label: "E2E 环境",
      field: "env",
      type: "select",
      source: "manual",
      options: ["prod", "test"],
      defaultVisible: true,
      timeFields: ["event_time", "created_at", "时间"]
    })
  });
  assert(situationFilter.data.field === "env", "situation filter should be configurable globally");
  const updatedSituationFilter = await request(`/api/situation-filters/${situationFilter.data.id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...situationFilter.data,
      label: "E2E 环境筛选",
      options: ["prod", "stage"]
    })
  });
  assert(updatedSituationFilter.data.label === "E2E 环境筛选", "situation filter should be editable");
  const timeFilter = await request("/api/situation-time-filter", {
    method: "PUT",
    body: JSON.stringify({ fields: ["event_time", "time", "时间"] })
  });
  assert(timeFilter.data.fields.includes("时间"), "global situation time filter should save candidate fields");

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

  const nestedSingleRecordTest = await request("/api/data-sources/test", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E 单对象内嵌数组数据源",
      kind: "api",
      type: "POST /api/e2e/nested-single",
      method: "POST",
      responsePath: "data.metrics[]",
      responseBody: {
        code: 0,
        data: {
          host: "ops-node-01",
          metrics: [
            { name: "cpu", value: 91, labels: { region: "cn-east", core: true } },
            { name: "mem", value: 62, labels: { region: "cn-east", core: false } }
          ],
          detail: {
            owner: "platform",
            tags: ["hot", "prod"]
          }
        }
      },
      responseConfig: {
        keepMode: "filter",
        filterCondition: "data.metrics[].name == cpu && value >= 90",
        fieldKeepMode: "value-filter",
        keepFields: ["data.metrics[].name", "data.metrics[].value", "data.metrics[].labels.region"],
        valueFilters: [
          { field: "data.metrics[].name", matchMode: "exact", value: "cpu", enabled: true },
          { field: "data.metrics[].labels.region", matchMode: "contains", value: "cn-", enabled: true }
        ]
      }
    })
  });
  assert(nestedSingleRecordTest.data.recordCount === 2, "nested single object should expose inner list records");
  assert(nestedSingleRecordTest.data.filteredRecordCount === 1, "nested list filter should keep only matching inner item");
  assert(nestedSingleRecordTest.data.recordFields.includes("data.metrics[].labels.region"), "nested dict field should remain selectable after filtering");
  assert(nestedSingleRecordTest.data.selectedRecords[0]["data.metrics[].name"] === "cpu", "selected nested field should be extracted");

  const dictionaryFilterTest = await request("/api/data-sources/test", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E 字典引用过滤",
      kind: "api",
      responsePath: "data.products[]",
      responseBody: {
        data: {
          products: [
            { name: "pay-gateway", dept: "交易产品部" },
            { name: "unknown-service", dept: "未知产品部" }
          ]
        }
      },
      responseConfig: {
        fieldKeepMode: "value-filter",
        keepFields: ["data.products[].name", "data.products[].dept"],
        valueFilters: [
          {
            field: "data.products[].name",
            matchMode: "exact",
            dictionaryId: "dict_product_catalog",
            dictionaryColumn: "别名列表",
            dictionaryScopeColumn: "产品部",
            dictionaryScopeValue: "交易产品部",
            enabled: true
          }
        ]
      }
    })
  });
  assert(dictionaryFilterTest.data.filteredRecordCount === 1, "dictionary referenced value filter should keep matching product");
  assert(dictionaryFilterTest.data.selectedRecords[0]["data.products[].name"] === "pay-gateway", "dictionary filter should preserve matching row");

  const dictionaryContainsTest = await request("/api/data-sources/test", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E 字典反向包含过滤",
      kind: "api",
      responsePath: "data.products[]",
      responseBody: {
        data: {
          products: [
            { title: "支付网关 pay-gateway v3 告警" },
            { title: "未知服务告警" }
          ]
        }
      },
      responseConfig: {
        fieldKeepMode: "value-filter",
        keepFields: ["data.products[].title"],
        valueFilters: [
          {
            field: "data.products[].title",
            dictionaryId: "dict_product_catalog",
            dictionaryColumn: "别名列表",
            dictionaryMatchMode: "dictionary-in-field",
            enabled: true
          }
        ]
      }
    })
  });
  assert(dictionaryContainsTest.data.filteredRecordCount === 1, "dictionary value should match inside field content");

  const dictionaryExpressionTest = await request("/api/data-sources/test", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E 字典表达式过滤",
      kind: "api",
      responsePath: "data.products[]",
      responseBody: {
        data: {
          products: [
            { name: "pay-gateway" },
            { name: "unknown-service" }
          ]
        }
      },
      responseConfig: {
        keepMode: "filter",
        filterCondition: "name in dict(产品列表.别名列表 where 产品部=交易产品部)"
      }
    })
  });
  assert(dictionaryExpressionTest.data.filteredRecordCount === 1, "filter condition should support dictionary membership");

  const productAliasDictionary = await request("/api/dictionary-sets", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E Product Alias Catalog",
      category: "E2E",
      description: "Dictionary used by value filter transform and aggregation tests.",
      columns: ["Dept", "Product", "Aliases", "Version"],
      rows: [
        { Dept: "App", Product: "ROMAConnect", Aliases: "ROMAConnect,ServiceStage", Version: "2.x" }
      ]
    })
  });

  const transformedOriginalOutputTest = await request("/api/data-sources/test", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E transformed value filter keeps original output",
      kind: "api",
      responsePath: "data.items[]",
      responseBody: {
        data: {
          items: [
            { value: "应用服务|ROMAConnect|2.2.0", time: "2026-06-13T10:00:00Z" },
            { value: "应用服务|ROMAConnect|2.3.0", time: "2026-06-13T10:01:00Z" },
            { value: "应用服务|ServiceStage|2.2.0", time: "2026-06-13T10:02:00Z" },
            { value: "应用服务|Unknown|1.0.0", time: "2026-06-13T10:03:00Z" }
          ]
        }
      },
      responseConfig: {
        fieldKeepMode: "value-filter",
        keepFields: ["data.items[].value"],
        valueFilters: [
          {
            field: "data.items[].value",
            extractMode: "split",
            splitDelimiter: "|",
            splitIndex: "2",
            dictionaryId: productAliasDictionary.data.id,
            dictionaryColumn: "Aliases",
            dictionaryMatchMode: "field-in-dictionary",
            outputMode: "original",
            aggregateOutput: true,
            aggregateSeparator: ",",
            enabled: true
          }
        ]
      }
    })
  });
  assert(transformedOriginalOutputTest.data.filteredRecordCount === 3, "transformed dictionary filter should keep matching records");
  assert(
    transformedOriginalOutputTest.data.selectedRecords[0]["data.items[].value"] === "应用服务|ROMAConnect|2.2.0,应用服务|ROMAConnect|2.3.0,应用服务|ServiceStage|2.2.0",
    "transformed dictionary filter should aggregate original output values"
  );

  const transformedMatchedOutputTest = await request("/api/data-sources/test", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E transformed value filter keeps matched fragment",
      kind: "api",
      responsePath: "data.items[]",
      responseBody: {
        data: {
          items: [
            { value: "应用服务|ROMAConnect|2.2.0" },
            { value: "应用服务|ROMAConnect|2.3.0" },
            { value: "应用服务|ServiceStage|2.2.0" }
          ]
        }
      },
      responseConfig: {
        fieldKeepMode: "value-filter",
        keepFields: ["data.items[].value"],
        valueFilters: [
          {
            field: "data.items[].value",
            extractMode: "split",
            splitDelimiter: "|",
            splitIndex: "2",
            dictionaryId: productAliasDictionary.data.id,
            dictionaryColumn: "Aliases",
            dictionaryMatchMode: "field-in-dictionary",
            outputMode: "matched-fragment",
            aggregateOutput: true,
            aggregateSeparator: ",",
            enabled: true
          }
        ]
      }
    })
  });
  assert(
    transformedMatchedOutputTest.data.selectedRecords[0]["data.items[].value"] === "ROMAConnect,ServiceStage",
    "transformed dictionary filter should optionally aggregate only matched fragments"
  );

  const rule = await request("/api/cleaning-rules", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E 等级枚举转换",
      type: "normalize",
      expression: "data.items[].level -> severity | enum(P0=高,P1=中,P2=低)",
      description: "把接口等级转换成业务展示等级",
      config: {
        action: "enum",
        param: "P0=高,P1=中,P2=低"
      }
    })
  });

  const extractRule = await request("/api/cleaning-rules", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E 正则提取数字",
      type: "normalize",
      expression: "extract(\\d+)",
      description: "从输入内容中提取第一个数字片段",
      config: {
        action: "extract",
        param: "\\d+"
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
      ruleParam: "",
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
      ruleId: extractRule.data.id,
      ruleParam: "",
      rule: extractRule.data.expression,
      output: "内部业务库"
    })
  });
  assert(updatedMapping.data.targetField === "queue_lag", "mapping edit should update target field");
  assert(updatedMapping.data.defaultValue === "0", "mapping edit should update default value");
  const transformTest = await request("/api/data-sources/test", {
    method: "POST",
    body: JSON.stringify({ sourceId: source.data.id, ...source.data })
  });
  assert(transformTest.data.mappedRecords.length > 0, "source test should return mapped records");
  assert(transformTest.data.mappedRecords[0].queue_lag !== undefined, "mapped records should include cleaned target field");

  const deletedMapping = await request(`/api/field-mappings/${updatedMapping.data.id}`, {
    method: "DELETE"
  });
  assert(deletedMapping.data.id === updatedMapping.data.id, "mapping delete should return deleted mapping");

  const aggregateSource = await request("/api/data-sources", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E 多对象合并映射 API",
      kind: "api",
      type: "POST /api/e2e/aggregate-mapping",
      method: "POST",
      responsePath: "data.items[]",
      responseBody: {
        data: {
          items: [
            { value: "应用服务|ROMAConnect|2.2.0", level: "P0" },
            { value: "应用服务|ROMAConnect|2.3.0", level: "P1" },
            { value: "应用服务|ServiceStage|2.2.0", level: "P1" },
            { value: "应用服务|Unknown|1.0.0", level: "P2" }
          ]
        }
      }
    })
  });
  await request("/api/field-mappings", {
    method: "POST",
    body: JSON.stringify({
      sourceId: aggregateSource.data.id,
      sourceField: "data.items[].value",
      targetField: "matched_products",
      type: "字符串",
      defaultValue: "",
      ruleId: "",
      recordMode: "aggregate-records",
      recordFilter: "value contains ROMAConnect || value contains ServiceStage",
      aggregateMode: "join",
      aggregateSeparator: ",",
      output: "内部业务库"
    })
  });
  const aggregateMappingTest = await request("/api/data-sources/test", {
    method: "POST",
    body: JSON.stringify({ sourceId: aggregateSource.data.id, ...aggregateSource.data })
  });
  assert(aggregateMappingTest.data.mappedRecords.length === 1, "aggregate mapping should produce one target record");
  assert(
    aggregateMappingTest.data.mappedRecords[0].matched_products === "应用服务|ROMAConnect|2.2.0,应用服务|ROMAConnect|2.3.0,应用服务|ServiceStage|2.2.0",
    "aggregate mapping should join filtered values into the same target field"
  );

  const flow = await request("/api/business-flows", {
    method: "POST",
    body: JSON.stringify({
      name: "E2E 数据清洗业务流",
      businessName: "E2E 清洗业务",
      dataSourceIds: [source.data.id],
      ruleIds: [rule.data.id],
      nodes: [
        { id: "e2e_context", type: "context", refId: "time-window", name: "E2E 时间窗口", executionMode: "serial", param: "context.start_time/context.end_time" },
        {
          id: "e2e_source_api",
          type: "source",
          refId: source.data.id,
          name: "E2E 多层 API 数据源",
          executionMode: "parallel",
          param: "数据库批量入参 + 自动分页",
          branchFromId: "e2e_context",
          branchName: "告警接口分支",
          branchCondition: "severity in [P0,P1]",
          executionConfig: {
            pagination: {
              mode: "page-number",
              pageParam: "page",
              pageSizeParam: "pageSize",
              pageSize: 50,
              startPage: 1,
              hasNextPath: "data.pageInfo.hasNext",
              maxPages: 120,
              totalPages: 100,
              pagesPerShard: 50
            },
            iteration: {
              mode: "batch",
              batchSize: 2,
              concurrency: 2,
              recordLimit: 5,
              lockKey: "service_id",
              lockStrategy: "skip-locked"
            }
          }
        },
        { id: "e2e_source_cmdb", type: "source", refId: "src_cmdb_pg", name: "CMDB PostgreSQL", executionMode: "parallel", param: "负责人补齐", branchFromId: "e2e_context", branchName: "CMDB 补齐分支", branchCondition: "service_id exists" },
        { id: "e2e_rule_enum", type: "rule", refId: rule.data.id, name: "E2E 等级枚举转换", executionMode: "join", param: "P0/P1/P2" },
        { id: "e2e_output", type: "output", refId: "business-table", name: "biz_e2e_event", executionMode: "serial", param: "upsert" }
      ],
      timeField: "event_time",
      outputMode: "upsert-business",
      outputConfig: {
        writeStrategy: "upsert",
        primaryKey: "event_id,source_id",
        rawTable: "raw_e2e_api",
        cleanTable: "clean_e2e_event",
        businessTable: "biz_e2e_event",
        dedupeStrategy: "field-combo",
        dedupeFields: "product_dept,service_name,event_time"
      }
    })
  });
  assert(flow.data.outputConfig.primaryKey === "event_id,source_id", "business flow should support composite primary key config");
  assert(flow.data.outputConfig.dedupeFields === "product_dept,service_name,event_time", "business flow should save field-combo dedupe fields");
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
    body: JSON.stringify({
      flowId: updatedFlow.data.id,
      flow: {
        ...updatedFlow.data,
        nodes: updatedFlow.data.nodes.map((node) =>
          node.id === "e2e_source_api" ? { ...node, branchName: "E2E 运行时分支", branchCondition: "runtime severity = P0" } : node
        )
      }
    })
  });
  assert(flowRun.data.business.name === "E2E 清洗业务", "business flow should create target business data");
  assert(flowRun.data.outputConfig.businessTable === "biz_e2e_event", "business table should round-trip");
  assert(flowRun.data.rows.length > 1, "business flow should materialize real source records instead of one placeholder row");
  assert(!String(flowRun.data.row[0]).includes("聚合数据"), "business flow first row should come from source data, not placeholder text");
  assert(flowRun.data.parameterPlan.loopCalls === 301, "flow graph should combine paginated batch API calls and static source calls");
  const apiSourcePlan = flowRun.data.executionPlan.sourcePlans.find((plan) => plan.nodeId === "e2e_source_api");
  assert(apiSourcePlan.pageCount === 100, "source node plan should let business config control total pages");
  assert(apiSourcePlan.pageShards.length === 2, "source node plan should split pages into concurrency shards");
  assert(apiSourcePlan.pageShards[0].start === 1 && apiSourcePlan.pageShards[0].end === 50, "first page shard should cover pages 1-50");
  assert(apiSourcePlan.pageShards[1].start === 51 && apiSourcePlan.pageShards[1].end === 100, "second page shard should cover pages 51-100");
  assert(apiSourcePlan.batchCount === 3, "source node plan should support batched database-driven calls");
  assert(apiSourcePlan.concurrency === 2, "source node plan should keep concurrency config");
  assert(apiSourcePlan.lockEnabled === true && apiSourcePlan.lockKey === "service_id", "source node plan should keep record lock config");
  assert(flowRun.data.executionPlan.parallel === 2, "flow graph should support parallel source nodes");
  assert(flowRun.data.executionPlan.branches === 2, "flow graph should support conditional branch lanes");
  assert(flowRun.data.executionPlan.conditionalBranches === 2, "flow graph should keep branch conditions");
  assert(flowRun.data.executionPlan.summary.includes("E2E 运行时分支"), "run should use latest flow payload from the page");
  assert(flowRun.data.executionPlan.join === 1, "flow graph should support join nodes");
  const storedFlowsAfterRun = await request("/api/business-flows");
  const storedFlowAfterRun = storedFlowsAfterRun.data.find((item) => item.id === updatedFlow.data.id);
  const storedRuntimeNode = storedFlowAfterRun.nodes.find((node) => node.id === "e2e_source_api");
  assert(storedRuntimeNode.branchName !== "E2E 运行时分支", "runtime flow payload should not overwrite stored flow config");

  await request(`/api/cleaning-rules/${rule.data.id}`, { method: "DELETE" });
  await request(`/api/cleaning-rules/${extractRule.data.id}`, { method: "DELETE" });
  await request(`/api/dictionary-sets/${productAliasDictionary.data.id}`, { method: "DELETE" });
  await request(`/api/situation-filters/${updatedSituationFilter.data.id}`, { method: "DELETE" });
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
