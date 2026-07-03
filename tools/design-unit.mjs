import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { applyFieldMappings, buildPagedRequestConfig } from "../server/services/sync-service.mjs";
import { reconcileFieldSchema } from "../server/services/config-service.mjs";
import { dropBusinessTable, getBusinessDataDbPath, persistBusinessTable, queryBusinessTable } from "../server/services/business-data-service.mjs";

const testTable = `design_test_${Date.now()}`;

try {
  const multi = applyFieldMappings([{ a: "x" }], [{ sourceField: "a", targetField: ["c1", "c2"], type: "字符串" }], "");
  assert.equal(multi[0].c1, "x", "source value should map to first target");
  assert.equal(multi[0].c2, "x", "source value should map to second target");

  const bodyPage = buildPagedRequestConfig(
    { requestConfig: { queryParams: {}, body: {} } },
    { executionConfig: { pagination: { mode: "page-number", paginateIn: "body", pageSize: 50 } } },
    {},
    2
  );
  assert.equal(bodyPage.body.page, 2, "paginateIn=body should write page into body");
  assert.equal(bodyPage.queryParams.page, undefined, "paginateIn=body should not write page into query");

  const schema = reconcileFieldSchema([{ name: "event_name", alias: "事件名", isDisplay: true }], ["event_name", "event_time", "_jumpurl_event_name"]);
  assert.equal(schema.find((item) => item.name === "event_name").alias, "事件名", "fieldSchema should keep edited alias");
  assert.equal(schema.find((item) => item.name === "event_time").isCreateTime, true, "event_time should be marked as time field");
  assert.equal(schema.find((item) => item.name === "_jumpurl_event_name").isDisplay, false, "internal jump url field should be hidden");

  const fields = ["event_id", "service", "event_time"];
  const persisted = persistBusinessTable(testTable, fields, [
    ["e1", "支付服务", "2026-07-01T10:00:00Z"],
    ["e2", "订单服务", "2026-07-01T11:00:00Z"]
  ], { writeStrategy: "overwrite", primaryKeys: ["event_id"] });
  assert.equal(persisted.ok, true, `table persist should succeed: ${persisted.error || ""}`);

  const upserted = persistBusinessTable(testTable, fields, [["e1", "支付服务2", "2026-07-01T10:30:00Z"]], {
    writeStrategy: "upsert",
    primaryKeys: ["event_id"]
  });
  assert.equal(upserted.ok, true, `table upsert should succeed: ${upserted.error || ""}`);
  const queried = queryBusinessTable(testTable, { limit: 100 });
  assert.equal(queried.ok, true, `query should succeed: ${queried.error || ""}`);
  assert.equal(queried.rows.find((row) => row.event_id === "e1").service, "支付服务2", "upsert should replace matching row");
  assert(existsSync(getBusinessDataDbPath()), "business sqlite file should exist after persist");

  console.log(JSON.stringify({ status: "ok", multiTargets: true, tableRows: queried.rowCount }, null, 2));
} finally {
  try { dropBusinessTable(testTable); } catch {}
}
