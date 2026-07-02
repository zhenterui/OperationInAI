import assert from "node:assert/strict";
import { createDataSource, deleteDataSource } from "../server/services/sync-service.mjs";
import {
  createBusinessFlow,
  createCleaningRule,
  createFieldMapping,
  deleteBusinessFlow,
  deleteCleaningRule,
  deleteFieldMapping,
  runBusinessFlow
} from "../server/services/config-service.mjs";

const cleanup = [];

function track(kind, value) {
  cleanup.push({ kind, value });
  return value;
}

async function cleanupCreated() {
  for (const item of cleanup.reverse()) {
    try {
      if (item.kind === "flow") deleteBusinessFlow(item.value.id);
      if (item.kind === "mapping") deleteFieldMapping(item.value.id);
      if (item.kind === "rule") deleteCleaningRule(item.value.id);
      if (item.kind === "source") deleteDataSource(item.value.id);
    } catch {
      // Best-effort cleanup keeps the test repeatable after assertion failures.
    }
  }
}

try {
  const trimRule = track("rule", createCleaningRule({
    name: "Flow unit trim rule",
    category: "unit",
    type: "normalize",
    config: { action: "trim", param: "" }
  }));
  const source = track("source", createDataSource({
    name: "Flow unit source",
    kind: "api",
    responsePath: "data.items[]",
    responseBody: {
      data: {
        items: [
          { name: "  ROMAConnect  ", level: "P0", event_id: "evt-1" },
          { name: "  ServiceStage  ", level: "P1", event_id: "evt-2" }
        ]
      }
    }
  }));
  track("mapping", createFieldMapping({
    sourceId: source.id,
    sourceField: "data.items[].name",
    targetField: "raw_name",
    fieldAlias: "原始服务名",
    type: "字符串"
  }));
  track("mapping", createFieldMapping({
    sourceId: source.id,
    sourceField: "data.items[].event_id",
    targetField: "event_id",
    type: "字符串"
  }));
  const flow = track("flow", createBusinessFlow({
    name: "Flow unit DAG",
    businessName: `Flow unit business ${Date.now()}`,
    dataSourceIds: [source.id],
    ruleIds: [trimRule.id],
    nodes: [
      { id: "unit_source", type: "source", refId: source.id, name: "source" },
      {
        id: "unit_rule",
        type: "rule",
        refId: trimRule.id,
        name: "trim rule",
        fieldMappings: [
          {
            sourceField: "raw_name",
            targetField: "service_name",
            ruleId: trimRule.id,
            fieldAlias: "服务名称",
            linkConfig: {
              enabled: true,
              urlTemplate: "/service/detail?name={{service}}&event={{event_id}}",
              placeholders: [
                { name: "service", source: "field", from: "service_name" },
                { name: "event_id", source: "field", from: "event_id" }
              ]
            }
          },
          { sourceField: "event_id", targetField: "event_id" }
        ]
      },
      { id: "unit_output", type: "output", refId: "business-table", name: "output" }
    ],
    edges: [
      { id: "edge_source_rule", from: "unit_source", to: "unit_rule", type: "serial" },
      { id: "edge_rule_output", from: "unit_rule", to: "unit_output", type: "serial" }
    ],
    outputConfig: {
      writeStrategy: "upsert",
      primaryKey: "event_id",
      businessTable: "biz_flow_unit"
    }
  }));

  const result = await runBusinessFlow({ flowId: flow.id });
  assert.equal(result.rows.length, 2);
  assert(result.executionPlan.executionOrder.includes("unit_rule"));
  assert.equal(result.executionPlan.nodeResults.find((item) => item.nodeId === "unit_rule")?.recordCount, 2);
  const serviceNameIndex = result.business.fields.indexOf("service_name");
  assert(serviceNameIndex >= 0);
  assert.deepEqual(result.rows.map((row) => row[serviceNameIndex]), ["ROMAConnect", "ServiceStage"]);
  assert.equal(result.business.fieldAliases.service_name, "服务名称");
  assert.equal(result.business.fieldLinks.service_name.urlTemplate, "/service/detail?name={{service}}&event={{event_id}}");

  console.log(JSON.stringify({
    status: "ok",
    business: result.business.name,
    executionOrder: result.executionPlan.executionOrder,
    fields: result.business.fields,
    fieldAliases: result.business.fieldAliases,
    fieldLinks: result.business.fieldLinks,
    rows: result.rows
  }, null, 2));
} finally {
  await cleanupCreated();
}
