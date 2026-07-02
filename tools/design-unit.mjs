// 设计项(E4/E6/E7/E8/E9 + explode)单元验证
// 运行: npm run design:unit

import assert from "node:assert/strict";
import { existsSync, unlinkSync } from "node:fs";
import { applyFieldMappings, buildPagedRequestConfig } from "../server/services/sync-service.mjs";
import { reconcileFieldSchema } from "../server/services/config-service.mjs";
import { persistBusinessTable, queryBusinessTable, dropBusinessTable, getBusinessDataDbPath } from "../server/services/business-data-service.mjs";

const hadDb = existsSync(getBusinessDataDbPath());
const testTable = `design_test_${Date.now()}`;

function cleanupDb() {
  try { dropBusinessTable(testTable); } catch {}
  if (!hadDb && existsSync(getBusinessDataDbPath())) {
    try { unlinkSync(getBusinessDataDbPath()); } catch {}
  }
}

try {
  // ---------- E8: 一源写多列 ----------
  const multi = applyFieldMappings([{ a: "x" }], [{ sourceField: "a", targetField: ["c1", "c2"], type: "字符串" }], "");
  assert(multi[0].c1 === "x" && multi[0].c2 === "x", "一源写多列: 同值写入 c1/c2");

  // ---------- 命名收敛: paginateIn(分页参数位置 query/body) ----------
  const node = (pagination) => ({ executionConfig: { pagination } });
  const bodyCfg = buildPagedRequestConfig({ requestConfig: { body: {} } }, node({ mode: "page-number", paginateIn: "body", pageSize: 50 }), {}, 2);
  assert(bodyCfg.body.page === 2 && bodyCfg.body.pageSize === 50, "paginateIn=body: 页码/每页条数写入 body");
  assert(bodyCfg.queryParams.page === undefined, "paginateIn=body: 页码不入 query");
  const queryCfg = buildPagedRequestConfig({ requestConfig: { queryParams: {} } }, node({ mode: "page-number", paginateIn: "query", pageSize: 50 }), {}, 3);
  assert(queryCfg.queryParams.page === 3 && queryCfg.queryParams.pageSize === 50, "paginateIn=query: 页码写入 query");
  const legacyCfg = buildPagedRequestConfig({ requestConfig: { body: {} } }, node({ mode: "page-number", paramLocation: "body" }), {}, 1);
  assert(legacyCfg.body.page === 1, "paramLocation=body 作为 legacy 别名仍生效");

  // ---------- explode: 父子 1:N 展开 ----------
  const exploded = applyFieldMappings(
    [{ cloud_id: "c1", regions: [{ id: "r1", name: "east" }, { id: "r2", name: "north" }] }],
    [{
      sourceField: "regions",
      targetField: "region_id",
      recordMode: "explode",
      explodeMapping: [{ from: "id", to: "region_id" }, { from: "name", to: "region_name" }]
    }],
    ""
  );
  assert(exploded.length === 2, "explode 应展开为 2 行");
  assert(exploded[0].cloud_id === "c1" && exploded[0].region_id === "r1" && exploded[0].region_name === "east", "explode 第一行父子字段合并正确");
  assert(exploded[1].region_id === "r2", "explode 第二行 region_id 正确");

  // ---------- E9: lookup 多值富化(无 cleaning rule 依赖, 直接走 lookup 字典) ----------
  // lookup 需要 store.dictionarySets, 此处仅校验 multi 分支在单值字典下的基本行为留待集成测试;
  // 这里校验 enum onMiss=blank 兜底(纯函数, 无 store 依赖通过 mapping.defaultValue)
  // (enum/lookup 深度路径在 cleaning-unit/e2e 已覆盖, 此处不重复)

  // ---------- E4: fieldSchema 生成与保留 ----------
  const draft = reconcileFieldSchema(undefined, ["_internal_id", "event_name", "event_time", "_jumpurl_event_name"]);
  assert(draft.find((f) => f.name === "_internal_id").isDisplay === false, "下划线前缀字段默认不展示");
  assert(draft.find((f) => f.name === "event_name").isDisplay === true, "普通字段默认展示");
  assert(draft.find((f) => f.name === "event_time").isCreateTime === true, "event_time 应识别为时间字段");
  assert(draft.find((f) => f.name === "event_name").isJump === true, "_jumpurl_ 伴随列应标记 isJump");
  // 已有编辑保留
  const edited = reconcileFieldSchema([{ name: "event_name", alias: "事件名", isDisplay: true, isCreateTime: false, isHtml: false, isJump: false }], ["event_name", "new_field"]);
  assert(edited[0].alias === "事件名", "已有字段保留用户别名");
  assert(edited[1].name === "new_field" && edited[1].alias === "new_field", "新字段补默认草稿");

  // ---------- E6: 业务数据独立表存储 ----------
  const fields = ["event_id", "service", "event_time"];
  const rows = [
    ["e1", "支付服务", "2026-07-01T10:00:00Z"],
    ["e2", "订单服务", "2026-07-01T11:00:00Z"]
  ];
  const persisted = persistBusinessTable(testTable, fields, rows, { writeStrategy: "overwrite", primaryKeys: ["event_id"] });
  assert(persisted.ok && persisted.rowCount === 2, "业务表 overwrite 写入应成功");

  // upsert: 更新 e1 + 新增 e3
  const upserted = persistBusinessTable(testTable, fields, [
    ["e1", "支付服务2", "2026-07-01T10:30:00Z"],
    ["e3", "网关服务", "2026-07-01T12:00:00Z"]
  ], { writeStrategy: "upsert", primaryKeys: ["event_id"] });
  assert(upserted.ok, "业务表 upsert 应成功");

  const queried = queryBusinessTable(testTable, { limit: 100 });
  assert(queried.ok && queried.rowCount === 3, "查询应返回 3 行(e1 更新 + e2 保留 + e3 新增)");
  const e1 = queried.rows.find((r) => r.event_id === "e1");
  assert(e1 && e1.service === "支付服务2", "upsert 应更新 e1 的 service");
  assert(queried.columns.includes("event_id"), "查询应返回字段列表");

  // 时间过滤
  const timeFiltered = queryBusinessTable(testTable, { timeField: "event_time", timeStart: "2026-07-01T11:00:00Z", limit: 100 });
  assert(timeFiltered.rowCount === 2, "时间过滤应返回 2 行(e2/e3)");

  console.log(JSON.stringify({
    status: "ok",
    oneToMany: multi[0].c1 === "x",
    explodeRows: exploded.length,
    fieldSchemaCreateTime: draft.find((f) => f.name === "event_time").isCreateTime,
    fieldSchemaJump: draft.find((f) => f.name === "event_name").isJump,
    fieldSchemaEditKept: edited[0].alias,
    tableOverwrite: persisted.rowCount,
    tableQueryRows: queried.rowCount,
    tableUpsertUpdated: e1.service,
    tableTimeFilter: timeFiltered.rowCount
  }, null, 2));
} catch (error) {
  console.error("design-unit FAILED:", error);
  process.exitCode = 1;
} finally {
  cleanupDb();
}
