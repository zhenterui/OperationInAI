import { applyStoragePolicy, persistStore, store } from "../data/store.mjs";
import { createStorageAdapter } from "../data/storage-adapter.mjs";
import { persistBusinessTable } from "./business-data-service.mjs";
import { applyFieldMappings, assertSafeSourceUrl, executeDataSourcePlan, getByPath, matchesFilter, mergeDataSourceResults, runWithConcurrency, testDataSource } from "./sync-service.mjs";

function uniqueId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeList(value, fallback = []) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[\n,，]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
}

function toSituationFilter(input = {}, existing = {}) {
  return {
    id: existing.id || input.id || uniqueId("situation_filter"),
    label: input.label || existing.label || "自定义筛选",
    field: input.field || existing.field || "",
    type: ["select", "multi-select", "text"].includes(input.type) ? input.type : existing.type || "select",
    source: ["auto", "dictionary", "manual"].includes(input.source) ? input.source : existing.source || "auto",
    dictionaryRef: input.dictionaryRef ?? existing.dictionaryRef ?? "",
    options: normalizeList(input.options, existing.options || []),
    defaultVisible: input.defaultVisible ?? existing.defaultVisible ?? true,
    defaultValue: input.defaultValue ?? existing.defaultValue ?? "",
    updatedAt: new Date().toISOString()
  };
}

export function createSituationFilter(input = {}) {
  const filter = toSituationFilter(input);
  store.situationFilters.unshift(filter);
  if (input.timeFields !== undefined) {
    updateSituationTimeFilter({ fields: input.timeFields });
  }
  return filter;
}

export function updateSituationFilter(id, input = {}) {
  const index = store.situationFilters.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Situation filter not found");
    error.status = 404;
    throw error;
  }
  const updated = toSituationFilter(input, store.situationFilters[index]);
  store.situationFilters[index] = updated;
  if (input.timeFields !== undefined) {
    updateSituationTimeFilter({ fields: input.timeFields });
  }
  return updated;
}

export function deleteSituationFilter(id) {
  const index = store.situationFilters.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Situation filter not found");
    error.status = 404;
    throw error;
  }
  const [removed] = store.situationFilters.splice(index, 1);
  return removed;
}

export function updateSituationTimeFilter(input = {}) {
  store.situationTimeFilter = {
    ...(store.situationTimeFilter || {}),
    fields: normalizeList(input.fields, store.situationTimeFilter?.fields || ["event_time", "created_at", "updated_at", "time", "时间"]),
    defaultRange: input.defaultRange || store.situationTimeFilter?.defaultRange || "24h"
  };
  return store.situationTimeFilter;
}

function positiveNumber(value, fallback = 1) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function nonNegativeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function getSourceExecutionConfig(node = {}, source = {}) {
  const sourceParameterConfig = source.parameterConfig || {};
  const sourcePagination = source.kind === "api" ? source.requestConfig?.pagination || source.pagination || "" : "";
  const config = node.executionConfig || {};
  const supportedModes = ["off", "page-number", "auto", "has-more", "empty-result", "next-token", "inherit"];
  const rawMode = config.pagination?.mode || (sourcePagination ? "page-number" : "off");
  const pagination = {
    mode: supportedModes.includes(rawMode) ? rawMode : "off",
    pageSize: positiveNumber(config.pagination?.pageSize, 100),
    maxPages: positiveNumber(config.pagination?.maxPages, sourcePagination ? 2 : 1),
    pageParam: config.pagination?.pageParam || "page",
    pageSizeParam: config.pagination?.pageSizeParam || "pageSize",
    startPage: nonNegativeNumber(config.pagination?.startPage, 1),
    nextTokenPath: config.pagination?.nextTokenPath || "",
    hasNextPath: config.pagination?.hasNextPath || "data.has_more",
    totalCountPath: config.pagination?.totalCountPath || "data.total",
    totalPagesPath: config.pagination?.totalPagesPath || "data.totalPages",
    totalPages: nonNegativeNumber(config.pagination?.totalPages, 0),
    pagesPerShard: nonNegativeNumber(config.pagination?.pagesPerShard, 0),
    paginateIn: config.pagination?.paginateIn || "query"
  };
  if (pagination.mode === "inherit") {
    pagination.mode = sourcePagination ? "page-number" : "off";
  }
  const iteration = {
    mode: config.iteration?.mode || "single",
    batchSize: positiveNumber(config.iteration?.batchSize, 100),
    concurrency: positiveNumber(config.iteration?.concurrency, 1),
    recordLimit: nonNegativeNumber(config.iteration?.recordLimit, 0),
    lockKey: config.iteration?.lockKey || "",
    lockStrategy: config.iteration?.lockStrategy || "none",
    sourceType: sourceParameterConfig.sourceType || "static",
    sourceId: sourceParameterConfig.sourceId || ""
  };
  if (iteration.mode === "inherit") {
    iteration.mode = "single";
  }
  return { pagination, iteration };
}

function buildPageShards(pagination = {}, concurrency = 1) {
  if (pagination.mode !== "page-number" || !pagination.totalPages) {
    return [];
  }
  const totalPages = positiveNumber(pagination.totalPages, 1);
  const startPage = nonNegativeNumber(pagination.startPage, 1);
  const shardSize = pagination.pagesPerShard > 0
    ? positiveNumber(pagination.pagesPerShard, totalPages)
    : Math.max(1, Math.ceil(totalPages / positiveNumber(concurrency, 1)));
  const shards = [];
  let current = startPage;
  const finalPage = startPage + totalPages - 1;
  while (current <= finalPage) {
    const end = Math.min(finalPage, current + shardSize - 1);
    shards.push({ start: current, end, pages: end - current + 1 });
    current = end + 1;
  }
  return shards;
}

function estimateSourceNodePlan(node = {}, source = {}) {
  const { pagination, iteration } = getSourceExecutionConfig(node, source);
  const sourceType = iteration.sourceType;
  const defaultRecordCount = sourceType === "database" ? 2 : 1;
  let recordCount;
  if (iteration.mode === "domain-driven") {
    const domainCfg = node.executionConfig?.iteration?.domain || {};
    recordCount = Math.max(1, buildDomainValues(domainCfg).length);
  } else if (iteration.mode === "single") {
    recordCount = 1;
  } else {
    recordCount = iteration.recordLimit || defaultRecordCount;
  }
  const batchCount = iteration.mode === "batch" ? Math.max(1, Math.ceil(recordCount / iteration.batchSize)) : recordCount;
  const pageCount = pagination.mode === "off" ? 1 : pagination.totalPages || pagination.maxPages;
  const pageShards = buildPageShards(pagination, iteration.concurrency);
  const callCount = Math.max(1, batchCount * pageCount);
  return {
    nodeId: node.id,
    nodeName: node.name || source.name || "数据源节点",
    sourceId: source.id,
    sourceName: source.name || node.refId,
    paginationMode: pagination.mode,
    pageCount,
    pageSize: pagination.pageSize,
    iterationMode: iteration.mode,
    sourceType,
    sourceIdForInput: iteration.sourceId,
    recordCount,
    batchSize: iteration.batchSize,
    batchCount,
    concurrency: iteration.concurrency,
    pageShards,
    pageShardSize: pagination.pagesPerShard || (pageShards[0]?.pages || 0),
    lockKey: iteration.lockKey,
    lockStrategy: iteration.lockStrategy,
    callCount,
    lockEnabled: Boolean(iteration.lockKey && iteration.lockStrategy !== "none")
  };
}

function flattenBusinessRecord(record = {}, prefix = "", output = {}) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    if (prefix) output[prefix] = record;
    return output;
  }
  Object.entries(record).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenBusinessRecord(value, path, output);
    } else if (Array.isArray(value)) {
      output[path] = value.join(",");
    } else {
      output[path] = value;
    }
  });
  return output;
}

function buildBusinessFields(records = []) {
  const preferred = ["alarmName", "event_name", "事件名称", "level", "severity", "等级", "service.name", "owner", "归属对象", "occurTime", "event_time", "时间", "duration", "status", "状态/影响"];
  const seen = new Set();
  const fields = [];
  preferred.forEach((field) => {
    if (records.some((record) => Object.prototype.hasOwnProperty.call(record, field))) {
      seen.add(field);
      fields.push(field);
    }
  });
  records.forEach((record) => {
    Object.keys(record).forEach((field) => {
      if (!seen.has(field)) {
        seen.add(field);
        fields.push(field);
      }
    });
  });
  return fields.slice(0, 12);
}

function toBusinessRows(sourceResults = [], fallbackRow = []) {
  const flattenedRecords = sourceResults.flatMap(({ result, source }) => {
    const records = Array.isArray(result.mappedRecords) && result.mappedRecords.length
      ? result.mappedRecords
      : result.selectedRecords || [];
    return records.map((record) => ({
      source_name: source?.name || "",
      ...flattenBusinessRecord(record)
    }));
  });
  if (!flattenedRecords.length) {
    return { fields: ["事件名称", "等级", "归属对象", "时间", "状态/影响"], rows: [fallbackRow] };
  }
  const fields = buildBusinessFields(flattenedRecords);
  return {
    fields,
    rows: flattenedRecords.map((record) => fields.map((field) => record[field] ?? ""))
  };
}

function toBusinessRowsFromRecords(records = [], fallbackRow = []) {
  const flattenedRecords = records.map((record) => flattenBusinessRecord(record));
  if (!flattenedRecords.length) {
    return { fields: ["事件名称", "等级", "归属对象", "时间", "状态/影响"], rows: [fallbackRow] };
  }
  const fields = buildBusinessFields(flattenedRecords);
  return {
    fields,
    rows: flattenedRecords.map((record) => fields.map((field) => record[field] ?? ""))
  };
}

function parseFieldList(value = "") {
  return String(value || "")
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getDedupeFields(outputConfig = {}) {
  if (outputConfig.dedupeStrategy === "none") return [];
  if (outputConfig.dedupeStrategy === "field-combo" && outputConfig.dedupeFields) {
    return parseFieldList(outputConfig.dedupeFields);
  }
  return parseFieldList(outputConfig.primaryKey);
}

function rowKey(fields = [], row = [], keyFields = []) {
  if (!keyFields.length) return "";
  const parts = keyFields.map((field) => {
    const index = fields.indexOf(field);
    return index >= 0 ? String(row[index] ?? "") : "";
  });
  return parts.some(Boolean) ? parts.join("\u0001") : "";
}

function readBusinessTableAsRecords(inputTable = "") {
  if (!inputTable) return [];
  const business = store.businesses.find((item) => item.name === inputTable || item.id === inputTable);
  if (!business) return [];
  const fields = Array.isArray(business.fields) ? business.fields : [];
  return (business.rows || []).map((row) => {
    if (Array.isArray(row)) {
      const obj = {};
      fields.forEach((field, index) => { obj[field] = row[index]; });
      return obj;
    }
    return { ...row };
  });
}

function sourceFieldsFromPlan(plan = {}, source = {}) {
  const fields = Array.isArray(plan.fields) && plan.fields.length ? plan.fields : [];
  if (fields.length) return fields;
  const sourceFields = Array.isArray(source.responseConfig?.keepFields) ? source.responseConfig.keepFields : [];
  return sourceFields;
}

// 参数维度展开(通用化老系统 start_year 年份展开): range/dictionary/list 生成取值域
function buildDomainValues(domain = {}) {
  if (!domain || typeof domain !== "object") return [];
  const source = domain.source || "list";
  if (source === "list") {
    return Array.isArray(domain.values) ? domain.values.filter((v) => v !== undefined && v !== null && v !== "") : [];
  }
  if (source === "range") {
    const rangeCfg = domain.range || {};
    const from = Number(rangeCfg.from);
    const to = Number(rangeCfg.to);
    const step = Math.max(1, Number(rangeCfg.step || 1));
    const format = rangeCfg.format || "";
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return [];
    const values = [];
    for (let v = from; v <= to; v += step) {
      values.push(format ? String(format).replace(/\{value\}/g, String(v)) : v);
    }
    return values;
  }
  if (source === "dictionary") {
    const cfg = domain.dictionary || {};
    const dict = store.dictionarySets.find((item) => item.id === cfg.dictionaryId || item.name === cfg.dictionaryName);
    if (!dict) return [];
    const column = cfg.column || dict.columns?.[0];
    return (dict.rows || []).map((row) => row?.[column]).filter((v) => v !== undefined && v !== null && v !== "");
  }
  return [];
}

// 字段级展示元数据(E4): alias/isDisplay/isCreateTime/isHtml/isJump
// 首次产出按启发式生成草稿, 已有字段保留用户编辑, 新字段补默认值
const FIELD_SCHEMA_TIME_HINTS = new Set([
  "event_time", "created_at", "updated_at", "occur_time", "occurtime",
  "time", "时间", "fetched_at", "_fetched_at", "checked_at"
]);

export function reconcileFieldSchema(existingSchema, fields = []) {
  const existing = Array.isArray(existingSchema) ? existingSchema : [];
  const byName = new Map(existing.filter((s) => s && s.name).map((s) => [s.name, s]));
  const jumpFields = new Set(
    fields.filter((f) => String(f).startsWith("_jumpurl_")).map((f) => String(f).slice("_jumpurl_".length))
  );
  return fields.map((field) => {
    const f = String(field);
    const prev = byName.get(f);
    if (prev) return { ...prev, name: f };
    return {
      name: f,
      alias: f,
      isDisplay: !f.startsWith("_"),
      isCreateTime: FIELD_SCHEMA_TIME_HINTS.has(f.toLowerCase()),
      isHtml: false,
      isJump: jumpFields.has(f)
    };
  });
}

export function normalizeFieldSchemaInput(input = []) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item) => item && item.name)
    .map((item) => ({
      name: String(item.name),
      alias: item.alias != null ? String(item.alias) : String(item.name),
      isDisplay: item.isDisplay !== false,
      isCreateTime: item.isCreateTime === true,
      isHtml: item.isHtml === true,
      isJump: item.isJump === true,
      jumpUrl: item.jumpUrl || ""
    }));
}

function extractAggregateValues(recordRows = [], fields = [], aggregateConfig = {}) {
  if (!recordRows.length) return [];
  const extractField = aggregateConfig.extractField;
  const extractPath = aggregateConfig.extractPath;
  if (extractPath) {
    return recordRows.flatMap((row) => {
      const value = getByPath(row, extractPath);
      return Array.isArray(value) ? value.filter((v) => v !== undefined && v !== null && v !== "") : (value === undefined || value === null || value === "" ? [] : [value]);
    }).map((value) => String(value));
  }
  if (!extractField) return [];
  return recordRows.map((row) => {
    if (Array.isArray(row)) {
      const index = fields.indexOf(extractField);
      return index >= 0 ? row[index] : "";
    }
    return row?.[extractField] ?? "";
  }).filter((value) => value !== undefined && value !== null && value !== "").map((value) => String(value));
}

function applyAggregateTools(values = [], tools = []) {
  let result = [...values];
  for (const tool of tools) {
    if (!tool?.name) continue;
    const params = tool.params || {};
    if (tool.name === "filter_empty") {
      result = result.filter((value) => value !== "" && value !== null && value !== undefined);
    } else if (tool.name === "unique") {
      const seen = new Set();
      result = result.filter((value) => {
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    } else if (tool.name === "sort") {
      result = result.sort((a, b) => params.reverse ? String(b).localeCompare(String(a)) : String(a).localeCompare(String(b)));
    } else if (tool.name === "limit") {
      result = result.slice(0, Math.max(0, Number(params.maxCount ?? params.limit ?? params.max_count ?? 100)));
    } else if (tool.name === "join") {
      result = [result.join(params.separator ?? ",")];
    }
  }
  return result;
}

function mergeBusinessRows(existingRows = [], newRows = [], fields = [], outputConfig = {}) {
  const strategy = outputConfig.writeStrategy || "upsert";
  const rowLimit = 1000;
  // replicate 与 preserve-unmatched / upsert-keep-others 同义(保留未匹配旧行);
  // 老系统的 1:N 展开用 explode action 实现, 不在此处
  const isPreserveUnmatched = ["replicate", "preserve-unmatched", "upsert-keep-others"].includes(strategy);
  if (strategy === "overwrite") {
    return [...newRows].slice(0, rowLimit);
  }
  if (strategy === "append") {
    return [...newRows, ...existingRows].slice(0, rowLimit);
  }
  if (isPreserveUnmatched) {
    const keyFields = getDedupeFields(outputConfig);
    if (!keyFields.length) return [...newRows, ...existingRows].slice(0, rowLimit);
    const newKeys = new Set(newRows.map((row) => rowKey(fields, row, keyFields)).filter(Boolean));
    const replicated = existingRows.filter((row) => {
      const key = rowKey(fields, row, keyFields);
      return !key || !newKeys.has(key);
    });
    return [...newRows, ...replicated].slice(0, rowLimit);
  }
  const keyFields = getDedupeFields(outputConfig);
  if (!keyFields.length) {
    return [...newRows, ...existingRows].slice(0, rowLimit);
  }
  const newKeys = new Set(newRows.map((row) => rowKey(fields, row, keyFields)).filter(Boolean));
  const updateFields = Array.isArray(outputConfig.updateFields) && outputConfig.updateFields.length
    ? new Set(outputConfig.updateFields)
    : null;
  if (!updateFields) {
    const keptRows = existingRows.filter((row) => {
      const key = rowKey(fields, row, keyFields);
      return !key || !newKeys.has(key);
    });
    return [...newRows, ...keptRows].slice(0, rowLimit);
  }
  const updatedRows = existingRows.map((row) => {
    const key = rowKey(fields, row, keyFields);
    if (!key || !newKeys.has(key)) return row;
    const matchingNew = newRows.find((newRow) => rowKey(fields, newRow, keyFields) === key);
    if (!matchingNew) return row;
    const newRow = [...row];
    updateFields.forEach((field) => {
      const index = fields.indexOf(field);
      if (index >= 0 && matchingNew[index] !== undefined && matchingNew[index] !== null) {
        newRow[index] = matchingNew[index];
      }
    });
    return newRow;
  });
  const existingKeys = new Set(existingRows.map((row) => rowKey(fields, row, keyFields)).filter(Boolean));
  const insertedRows = newRows.filter((row) => {
    const key = rowKey(fields, row, keyFields);
    return key && !existingKeys.has(key);
  });
  return [...insertedRows, ...updatedRows].slice(0, rowLimit);
}

function getNodePredecessors(nodes = [], node = {}, edges = []) {
  const incoming = edges.filter((edge) => edge.to === node.id).map((edge) => edge.from).filter(Boolean);
  if (incoming.length) return incoming;
  if (Array.isArray(node.predecessors) && node.predecessors.length) return node.predecessors;
  if (node.branchFromId) return [node.branchFromId];
  const index = nodes.findIndex((item) => item.id === node.id);
  return index > 0 ? [nodes[index - 1].id] : [];
}

function buildFlowEdges(nodes = [], explicitEdges = []) {
  if (Array.isArray(explicitEdges) && explicitEdges.length) return explicitEdges;
  const edges = [];
  const branchLeaves = new Set();
  let previousMainNode = null;
  nodes.forEach((node) => {
    if (!node?.id) return;
    if (node.branchFromId) {
      edges.push({
        id: uniqueId("edge"),
        from: node.branchFromId,
        to: node.id,
        type: "branch",
        condition: ""
      });
      branchLeaves.add(node.id);
      return;
    }
    const isJoinLike = node.executionMode === "join" || node.type === "join";
    if (isJoinLike && branchLeaves.size) {
      branchLeaves.forEach((from) => {
        edges.push({ id: uniqueId("edge"), from, to: node.id, type: "join", condition: "" });
      });
      branchLeaves.clear();
    } else if (previousMainNode) {
      edges.push({ id: uniqueId("edge"), from: previousMainNode.id, to: node.id, type: "serial", condition: "" });
    }
    previousMainNode = node;
  });
  return edges;
}

function getSourceDependencies(node = {}, nodesById = new Map(), edges = [], visited = new Set()) {
  if (visited.has(node.id)) return [];
  visited.add(node.id);
  return getNodePredecessors([...nodesById.values()], node, edges).flatMap((predecessorId) => {
    const predecessor = nodesById.get(predecessorId);
    if (!predecessor) return [];
    if (predecessor.type === "source") return [predecessor.id];
    return getSourceDependencies(predecessor, nodesById, edges, visited);
  });
}

function getIncomingEdges(node = {}, edges = []) {
  return edges.filter((edge) => edge.to === node.id);
}

function getOutgoingEdges(node = {}, edges = []) {
  return edges.filter((edge) => edge.from === node.id);
}

function getNodeOutputRecords(output = {}) {
  return Array.isArray(output.records) ? output.records : [];
}

function mergeRecordsFromOutputs(outputs = []) {
  return outputs.flatMap(getNodeOutputRecords);
}

function getPredecessorOutputs(node = {}, nodes = [], edges = [], outputByNode = new Map()) {
  const predecessorIds = getNodePredecessors(nodes, node, edges);
  return predecessorIds.map((id) => outputByNode.get(id)).filter(Boolean);
}

function shouldRunNodeByEdges(node = {}, edges = [], outputByNode = new Map()) {
  const incoming = getIncomingEdges(node, edges).filter((edge) => edge.type === "condition" && edge.condition);
  if (!incoming.length) return true;
  return incoming.some((edge) => {
    const records = getNodeOutputRecords(outputByNode.get(edge.from));
    return records.length ? records.some((record) => matchesFilter(record, edge.condition)) : true;
  });
}

function normalizeFlowMappings(value = []) {
  return Array.isArray(value)
    ? value.filter((item) => item && item.sourceField && item.targetField)
    : [];
}

function getRuleNodeMappings(node = {}, rule = {}) {
  const configuredMappings = normalizeFlowMappings(node.fieldMappings || node.mappings || rule.config?.mappings);
  if (configuredMappings.length) {
    return configuredMappings.map((mapping) => ({
      ...mapping,
      ruleId: mapping.ruleId || rule.id || node.refId || ""
    }));
  }
  if (node.sourceField && node.targetField) {
    return [{
      sourceId: node.id,
      sourceField: node.sourceField,
      targetField: node.targetField,
      defaultValue: node.defaultValue || "",
      ruleId: rule.id || node.refId || "",
      ruleParam: node.ruleParam || rule.config?.param || "",
      recordMode: node.recordMode || "per-record",
      recordFilter: node.recordFilter || "",
      aggregateMode: node.aggregateMode || "join",
      aggregateSeparator: node.aggregateSeparator || ","
    }];
  }
  return [];
}

async function executeFlowNode(node = {}, context = {}) {
  const { nodes, edges, outputByNode, sourceExecutionPlans } = context;
  const upstreamOutputs = getPredecessorOutputs(node, nodes, edges, outputByNode);
  const upstreamRecords = mergeRecordsFromOutputs(upstreamOutputs);
  if (!shouldRunNodeByEdges(node, edges, outputByNode)) {
    return { node, skipped: true, records: [], sourceResults: [], message: "edge condition not matched" };
  }
  if (node.type === "context") {
    const preActions = Array.isArray(node.preActions) ? node.preActions : (Array.isArray(node.executionConfig?.preActions) ? node.executionConfig.preActions : []);
    const flowContext = { ...(context.flowContext || {}) };
    const sourceResults = [];
    const mode = context.mode || "preview";
    if (preActions.length) {
      for (const action of preActions) {
        if (!action?.sourceId && !action?.refId) continue;
        const actionSource = store.dataSources.find((entry) => entry.id === (action.sourceId || action.refId));
        if (!actionSource) continue;
        const actionResult = await testDataSource({
          sourceId: actionSource.id,
          ...actionSource,
          parameterConfig: { ...(actionSource.parameterConfig || {}), context: flowContext },
          previewLimit: 0,
          mode
        });
        sourceResults.push({ node, source: actionSource, result: actionResult });
        if (!actionResult.ok) {
          // P1-3: preAction 失败默认 fail-flow, 可被 action.onError=continue 覆盖
          if (action.onError !== "continue") {
            return { node, records: [flowContext], sourceResults, error: `preAction ${action.sourceId || action.refId} 失败: ${actionResult.error || ""}` };
          }
          continue;
        }
        const variables = Array.isArray(action.variables) ? action.variables : (action.variableName ? [{ name: action.variableName, valuePath: action.valuePath || "" }] : []);
        variables.forEach((variable) => {
          if (!variable?.name) return;
          const extracted = variable.valuePath ? getByPath(actionResult.responseBody, variable.valuePath) : actionResult.responseBody;
          flowContext[variable.name] = extracted;
        });
      }
    }
    context.flowContext = flowContext;
    return { node, records: [flowContext], sourceResults };
  }
  if (node.type === "source") {
    const source = store.dataSources.find((entry) => entry.id === node.refId);
    if (!source) return { node, records: [], sourceResults: [], error: "source not found" };
    const plan = sourceExecutionPlans.find((entry) => entry.nodeId === node.id) || estimateSourceNodePlan(node, source);
    const mode = context.mode || "preview";
    const responseCache = context.responseCache;
    const cachedSource = responseCache ? { ...source, _responseCache: responseCache } : source;
    const inputTable = node.executionConfig?.inputTable || node.inputTable || source.parameterConfig?.inputTable || "";
    if (source.parameterConfig?.sourceType === "database" && inputTable) {
      const tableRecords = readBusinessTableAsRecords(inputTable);
      const result = { ok: true, recordCount: tableRecords.length, mappedRecords: tableRecords, selectedRecords: tableRecords, fields: [], responseBody: { records: tableRecords }, durationMs: 0, attempts: 1 };
      return { node, source, result, plan, records: tableRecords, sourceResults: [{ node, source, result, plan }] };
    }
    const iterationMode = plan.iterationMode || node.executionConfig?.iteration?.mode || "single";
    if (iterationMode === "record-driven" && upstreamRecords.length) {
      const concurrency = Math.max(1, Number(plan.concurrency || node.executionConfig?.iteration?.concurrency || 1));
      const maxRecordCalls = Math.max(1, Number(process.env.OPERATION_FLOW_MAX_CALLS || 500));
      const limit = upstreamRecords.length > maxRecordCalls ? upstreamRecords.slice(0, maxRecordCalls) : upstreamRecords;
      const aggregateConfig = node.executionConfig?.aggregate || node.aggregate || null;
      const tasks = limit.map((record) => {
        const sourceWithRecord = {
          ...cachedSource,
          parameterConfig: {
            ...(source.parameterConfig || {}),
            context: { ...(context.flowContext || {}), record, upstream: record }
          }
        };
        return () => executeDataSourcePlan(sourceWithRecord, node, plan, mode);
      });
      const perRecordResults = await runWithConcurrency(tasks, concurrency);
      const mergedResult = mergeDataSourceResults(perRecordResults, source, node, plan);
      let records;
      if (aggregateConfig?.targetField && (aggregateConfig.extractField || aggregateConfig.extractPath)) {
        records = limit.map((record, index) => {
          const recordResult = perRecordResults[index];
          const recordRows = Array.isArray(recordResult?.mappedRecords) && recordResult.mappedRecords.length
            ? recordResult.mappedRecords
            : (recordResult?.selectedRecords || []);
          const sourceFields = recordResult?.fields || sourceFieldsFromPlan(plan, source);
          let values = extractAggregateValues(recordRows, sourceFields, aggregateConfig);
          values = applyAggregateTools(values, aggregateConfig.tools || []);
          const aggregated = aggregateConfig.joinSeparator !== undefined
            ? values.join(aggregateConfig.joinSeparator)
            : values;
          return { ...record, [aggregateConfig.targetField]: aggregated };
        });
      } else {
        records = Array.isArray(mergedResult.mappedRecords) && mergedResult.mappedRecords.length
          ? mergedResult.mappedRecords
          : mergedResult.selectedRecords || [];
      }
      return { node, source, result: mergedResult, plan, records, sourceResults: [{ node, source, result: mergedResult, plan }] };
    }
    if (iterationMode === "domain-driven") {
      const domainCfg = node.executionConfig?.iteration?.domain || node.domain || {};
      const domainValues = buildDomainValues(domainCfg);
      if (domainValues.length) {
        const domainConcurrency = Math.max(1, Number(plan.concurrency || node.executionConfig?.iteration?.concurrency || 1));
        const maxDomainCalls = Math.max(1, Number(process.env.OPERATION_FLOW_MAX_CALLS || 500));
        const domainLimit = domainValues.length > maxDomainCalls ? domainValues.slice(0, maxDomainCalls) : domainValues;
        const paramField = domainCfg.paramField || "domain_value";
        const tasks = domainLimit.map((value) => {
          const sourceWithDomain = {
            ...cachedSource,
            parameterConfig: {
              ...(source.parameterConfig || {}),
              context: { ...(context.flowContext || {}), [paramField]: value }
            }
          };
          return () => executeDataSourcePlan(sourceWithDomain, node, plan, mode);
        });
        const perDomainResults = await runWithConcurrency(tasks, domainConcurrency);
        const mergedResult = mergeDataSourceResults(perDomainResults, source, node, plan);
        const records = Array.isArray(mergedResult.mappedRecords) && mergedResult.mappedRecords.length
          ? mergedResult.mappedRecords
          : mergedResult.selectedRecords || [];
        return { node, source, result: mergedResult, plan, records, sourceResults: [{ node, source, result: mergedResult, plan }] };
      }
    }
    const sourceWithContext = {
      ...cachedSource,
      parameterConfig: {
        ...(source.parameterConfig || {}),
        context: context.flowContext || {}
      }
    };
    const result = await executeDataSourcePlan(sourceWithContext, node, plan, mode);
    const records = Array.isArray(result.mappedRecords) && result.mappedRecords.length
      ? result.mappedRecords
      : result.selectedRecords || [];
    return { node, source, result, plan, records, sourceResults: [{ node, source, result, plan }] };
  }
  if (node.type === "rule") {
    const rule = store.cleaningRules.find((item) => item.id === node.refId) || {};
    const mappings = getRuleNodeMappings(node, rule);
    const records = mappings.length ? applyFieldMappings(upstreamRecords, mappings, node.responsePath || "") : upstreamRecords;
    return { node, rule, records, sourceResults: upstreamOutputs.flatMap((item) => item.sourceResults || []) };
  }
  if (node.type === "join") {
    const mode = node.joinMode || node.executionMode || "append";
    const records = mode === "first" ? getNodeOutputRecords(upstreamOutputs[0]) : upstreamRecords;
    return { node, records, sourceResults: upstreamOutputs.flatMap((item) => item.sourceResults || []) };
  }
  if (node.type === "output") {
    const records = upstreamRecords;
    return { node, records, sourceResults: upstreamOutputs.flatMap((item) => item.sourceResults || []), outputTarget: node.refId || node.param || "" };
  }
  return { node, records: upstreamRecords, sourceResults: upstreamOutputs.flatMap((item) => item.sourceResults || []) };
}

async function executeFlowDag(flowNodes = [], sourceExecutionPlans = [], explicitEdges = [], flowContext = {}, mode = "preview", responseCache = null) {
  const nodes = flowNodes.filter((node) => node && node.id);
  const edges = buildFlowEdges(nodes, explicitEdges);
  const completed = new Set();
  const outputByNode = new Map();
  const executionOrder = [];
  const remaining = new Set(nodes.map((node) => node.id));
  while (remaining.size) {
    let ready = nodes.filter((node) => {
      if (!remaining.has(node.id)) return false;
      return getNodePredecessors(nodes, node, edges).every((id) => completed.has(id) || !remaining.has(id));
    });
    if (!ready.length) {
      ready = [nodes.find((node) => remaining.has(node.id))].filter(Boolean);
    }
    const outputs = await Promise.all(ready.map((node) =>
      executeFlowNode(node, { nodes, edges, outputByNode, sourceExecutionPlans, flowContext, mode, responseCache })
    ));
    ready.forEach((node, index) => {
      outputByNode.set(node.id, outputs[index]);
      executionOrder.push(node.id);
      completed.add(node.id);
      remaining.delete(node.id);
    });
  }
  const terminalNodes = nodes.filter((node) => !getOutgoingEdges(node, edges).length);
  const terminalOutputs = terminalNodes.map((node) => outputByNode.get(node.id)).filter(Boolean);
  const outputRecords = mergeRecordsFromOutputs(terminalOutputs.length ? terminalOutputs : [...outputByNode.values()]);
  const sourceResultByNode = new Map();
  [...outputByNode.values()].flatMap((item) => item.sourceResults || []).forEach((item) => {
    sourceResultByNode.set(item.node.id, item);
  });
  return {
    edges,
    executionOrder,
    nodeResults: [...outputByNode.values()],
    sourceResults: [...sourceResultByNode.values()],
    outputRecords
  };
}

async function executeSourceNodes(flowNodes = [], sourceExecutionPlans = [], flowEdges = []) {
  const sourceNodes = flowNodes.filter((node) => node.type === "source");
  const nodesById = new Map(flowNodes.map((node) => [node.id, node]));
  const results = [];
  const completed = new Set();
  const remaining = new Set(sourceNodes.map((node) => node.id));
  const dependencyMap = new Map(sourceNodes.map((node) => [node.id, [...new Set(getSourceDependencies(node, nodesById, flowEdges))]]));
  const runNode = async (item) => {
    const source = store.dataSources.find((entry) => entry.id === item.refId);
    if (!source) return null;
    const plan = sourceExecutionPlans.find((entry) => entry.nodeId === item.id) || estimateSourceNodePlan(item, source);
    const result = await executeDataSourcePlan(source, item, plan);
    return { node: item, source, result, plan };
  };
  while (remaining.size) {
    let ready = sourceNodes.filter((node) =>
      remaining.has(node.id) && (dependencyMap.get(node.id) || []).every((dependencyId) => completed.has(dependencyId))
    );
    if (!ready.length) {
      ready = [sourceNodes.find((node) => remaining.has(node.id))].filter(Boolean);
    }
    const outputs = (await Promise.all(ready.map(runNode))).filter(Boolean);
    results.push(...outputs);
    ready.forEach((node) => {
      remaining.delete(node.id);
      completed.add(node.id);
    });
  }
  return results;
}

export function createFieldMapping(input = {}) {
  const mapping = {
    id: input.id || uniqueId("map"),
    sourceId: input.sourceId || store.dataSources[0]?.id || "",
    sourceField: input.sourceField || "raw.status",
    targetField: input.targetField || "status",
    type: input.type || "字符串",
    defaultValue: input.defaultValue || "",
    ruleId: input.ruleId || "",
    ruleParam: input.ruleParam || "",
    rule: input.rule || "trim",
    recordMode: input.recordMode === "aggregate-records" ? "aggregate-records" : "per-record",
    recordFilter: input.recordFilter || "",
    aggregateMode: ["first", "join", "array"].includes(input.aggregateMode) ? input.aggregateMode : "join",
    aggregateSeparator: input.aggregateSeparator ?? ",",
    output: input.output || "内部业务库",
    isJump: input.isJump === true,
    jumpUrl: input.jumpUrl || ""
  };
  store.fieldMappings.push(mapping);
  return mapping;
}

export function updateFieldMapping(id, input = {}) {
  const index = store.fieldMappings.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Field mapping not found");
    error.status = 404;
    throw error;
  }
  const existing = store.fieldMappings[index];
  const updated = {
    ...existing,
    sourceId: input.sourceId || existing.sourceId,
    sourceField: input.sourceField || existing.sourceField,
    targetField: input.targetField || existing.targetField,
    type: input.type || existing.type,
    defaultValue: input.defaultValue ?? existing.defaultValue ?? "",
    ruleId: input.ruleId ?? existing.ruleId ?? "",
    ruleParam: input.ruleParam ?? existing.ruleParam ?? "",
    rule: input.rule || existing.rule,
    recordMode: input.recordMode === "aggregate-records" ? "aggregate-records" : "per-record",
    recordFilter: input.recordFilter ?? existing.recordFilter ?? "",
    aggregateMode: ["first", "join", "array"].includes(input.aggregateMode) ? input.aggregateMode : existing.aggregateMode || "join",
    aggregateSeparator: input.aggregateSeparator ?? existing.aggregateSeparator ?? ",",
    output: input.output || existing.output,
    isJump: input.isJump === true ? true : (input.isJump === false ? false : existing.isJump === true),
    jumpUrl: input.jumpUrl ?? existing.jumpUrl ?? "",
    updatedAt: new Date().toISOString()
  };
  store.fieldMappings[index] = updated;
  return updated;
}

export function deleteFieldMapping(id) {
  const index = store.fieldMappings.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Field mapping not found");
    error.status = 404;
    throw error;
  }
  const [removed] = store.fieldMappings.splice(index, 1);
  return removed;
}

function normalizeAuthType(type = "api-cookie") {
  if (["cookie", "api-cookie"].includes(type)) return "api-cookie";
  if (["db", "database", "db-account-password"].includes(type)) return "db-account-password";
  if (["none", "no-auth"].includes(type)) return "none";
  return type || "api-cookie";
}

// 声明式登录刷新配置(对齐老系统 cookie_updater)
// login: 声明登录请求(method/url/body/bodyType/headers), body 支持 {{username}}/{{password}} 占位
// extract: cookie 提取方式(from=header 读 Set-Cookie | from=body 读响应体路径)
// cycleSeconds: 刷新周期, 由调度器按周期触发
function normalizeRefresh(input) {
  if (!input || typeof input !== "object") return undefined;
  const loginInput = input.login && typeof input.login === "object" ? input.login : {};
  const extractInput = input.extract && typeof input.extract === "object" ? input.extract : {};
  const cycleSeconds = Number(input.cycleSeconds || 0);
  return {
    enabled: input.enabled === true,
    cycleSeconds: Number.isFinite(cycleSeconds) && cycleSeconds > 0 ? Math.max(60, Math.round(cycleSeconds)) : 0,
    timeoutMs: Math.max(1000, Number(input.timeoutMs || 10000)),
    login: {
      method: String(loginInput.method || "POST").toUpperCase(),
      url: String(loginInput.url || "").trim(),
      bodyType: loginInput.bodyType === "form" ? "form" : "json",
      body: loginInput.body && typeof loginInput.body === "object" ? loginInput.body : {},
      headers: loginInput.headers && typeof loginInput.headers === "object" ? loginInput.headers : {}
    },
    extract: {
      from: extractInput.from === "body" ? "body" : "header",
      cookieName: String(extractInput.cookieName || "").trim(),
      cookiePath: String(extractInput.cookiePath || "").trim()
    },
    lastRefreshAt: input.lastRefreshAt || "",
    lastRefreshStatus: input.lastRefreshStatus || "",
    lastError: input.lastError || ""
  };
}

function sanitizeAuthConfig(config = {}) {
  return {
    ...config,
    password: config.password ? "******" : "",
    cookieValue: "",
    tokenHeader: config.tokenHeader ? "******" : ""
  };
}

export function createAuthConfig(input = {}) {
  const type = normalizeAuthType(input.type);
  const refresh = normalizeRefresh(input.refresh);
  // 启用刷新的 cookie 认证需要保留登录凭据(对齐老系统 cookie_updater)
  const keepCreds = type === "db-account-password" || Boolean(refresh && refresh.enabled);
  const config = {
    id: input.id || uniqueId("auth"),
    name: input.name || "自定义认证配置",
    category: input.category || "认证配置",
    type,
    username: keepCreds ? input.username || "" : "",
    password: keepCreds ? input.password || "" : "",
    cookieValue: type === "api-cookie" ? input.cookieValue || input.password || "" : "",
    loginUrl: input.loginUrl || "",
    cookieName: type === "api-cookie" ? input.cookieName || "" : "",
    tokenHeader: input.tokenHeader || "",
    refreshCycle: input.refreshCycle || "手动",
    refresh,
    status: "可用",
    updatedAt: new Date().toISOString()
  };
  store.authConfigs.unshift(config);
  return sanitizeAuthConfig(config);
}

export function updateAuthConfig(id, input = {}) {
  const index = store.authConfigs.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Auth config not found");
    error.status = 404;
    throw error;
  }
  const existing = store.authConfigs[index];
  const type = normalizeAuthType(input.type || existing.type);
  const refresh = normalizeRefresh(input.refresh ?? existing.refresh);
  const keepCreds = type === "db-account-password" || Boolean(refresh && refresh.enabled);
  const password = input.password && input.password !== "******" ? input.password : existing.password || "";
  const cookieValue = input.cookieValue && input.cookieValue !== "******" ? input.cookieValue : existing.cookieValue || "";
  const updated = {
    ...existing,
    name: input.name || existing.name,
    category: input.category || existing.category || "认证配置",
    type,
    username: keepCreds ? (input.username ?? existing.username) : "",
    password: keepCreds ? password : "",
    cookieValue: type === "api-cookie" ? cookieValue : "",
    loginUrl: input.loginUrl ?? existing.loginUrl,
    cookieName: type === "api-cookie" ? input.cookieName ?? existing.cookieName : "",
    tokenHeader: input.tokenHeader ?? existing.tokenHeader,
    refreshCycle: input.refreshCycle || existing.refreshCycle,
    refresh,
    updatedAt: new Date().toISOString()
  };
  store.authConfigs[index] = updated;
  return sanitizeAuthConfig(updated);
}

export function deleteAuthConfig(id) {
  const index = store.authConfigs.findIndex((item) => item.id === id);
  if (index < 0 || id === "auth_none") {
    const error = new Error(index < 0 ? "Auth config not found" : "Default auth config cannot be deleted");
    error.status = index < 0 ? 404 : 400;
    throw error;
  }
  const [removed] = store.authConfigs.splice(index, 1);
  store.dataSources = store.dataSources.map((source) =>
    source.authConfigId === id ? { ...source, authConfigId: "auth_none", authType: "none" } : source
  );
  return removed;
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveRefreshTemplate(value, authConfig) {
  return String(value ?? "")
    .replace(/\{\{\s*username\s*\}\}/g, authConfig.username || "")
    .replace(/\{\{\s*password\s*\}\}/g, authConfig.password || "");
}

// 按声明式 login spec 发起登录请求, 提取 cookie
async function performLoginRefresh(authConfig) {
  const refresh = authConfig.refresh || {};
  const login = refresh.login || {};
  const url = String(login.url || "").trim();
  if (!url) throw new Error("刷新配置缺少 login.url");
  assertSafeSourceUrl(url);
  const method = String(login.method || "POST").toUpperCase();
  const bodyType = login.bodyType === "form" ? "form" : "json";
  const body = login.body && typeof login.body === "object"
    ? Object.fromEntries(Object.entries(login.body).map(([key, value]) => [key, resolveRefreshTemplate(value, authConfig)]))
    : {};
  const headers = { ...(login.headers || {}) };
  let requestBody;
  if (["GET", "HEAD"].includes(method)) {
    requestBody = undefined;
  } else if (bodyType === "form") {
    const form = new URLSearchParams();
    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      form.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    });
    requestBody = form;
    if (!headers["Content-Type"] && !headers["content-type"]) headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else {
    requestBody = JSON.stringify(body);
    if (!headers["Content-Type"] && !headers["content-type"]) headers["Content-Type"] = "application/json";
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(refresh.timeoutMs || 10000));
  try {
    const response = await fetch(url, { method, headers, body: requestBody, signal: controller.signal, redirect: "manual" });
    const extract = refresh.extract || {};
    const cookieName = extract.cookieName || authConfig.cookieName;
    let cookieValue = "";
    if (extract.from === "body") {
      const text = await response.text();
      let parsed = {};
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { text };
      }
      cookieValue = String(extract.cookiePath ? getByPath(parsed, extract.cookiePath) : "") || "";
    } else {
      const setCookie = typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : (response.headers.get("set-cookie") ? [response.headers.get("set-cookie")] : []);
      for (const entry of setCookie) {
        if (!cookieName) {
          const match = String(entry).match(/^([^=]+)=([^;]+)/);
          if (match) {
            cookieValue = match[2];
            break;
          }
          continue;
        }
        const match = String(entry).match(new RegExp(`${escapeRegExp(cookieName)}=([^;]+)`));
        if (match) {
          cookieValue = match[1];
          break;
        }
      }
    }
    if (!cookieValue) {
      throw new Error(cookieName ? `登录响应未提取到 cookie(${cookieName})` : "登录响应未提取到任何 cookie");
    }
    return { cookieName: cookieName || "", cookieValue };
  } finally {
    clearTimeout(timer);
  }
}

export async function refreshAuthConfig(authId) {
  const authConfig = store.authConfigs.find((item) => item.id === authId);
  if (!authConfig) {
    const error = new Error("Auth config not found");
    error.status = 404;
    throw error;
  }
  const refresh = authConfig.refresh;
  if (!refresh || !refresh.enabled) {
    const error = new Error("该认证配置未启用自动刷新");
    error.status = 400;
    throw error;
  }
  try {
    const { cookieName, cookieValue } = await performLoginRefresh(authConfig);
    if (cookieName) authConfig.cookieName = cookieName;
    authConfig.cookieValue = cookieValue;
    authConfig.status = "可用";
    refresh.lastRefreshAt = new Date().toISOString();
    refresh.lastRefreshStatus = "success";
    refresh.lastError = "";
    authConfig.updatedAt = new Date().toISOString();
    persistStore();
    return sanitizeAuthConfig(authConfig);
  } catch (error) {
    refresh.lastRefreshAt = new Date().toISOString();
    refresh.lastRefreshStatus = "failed";
    refresh.lastError = error?.message || "登录刷新失败";
    authConfig.status = "刷新失败";
    authConfig.updatedAt = new Date().toISOString();
    persistStore();
    throw error;
  }
}

export function listAuthConfigsDueForRefresh() {
  const now = Date.now();
  return store.authConfigs.filter((item) => {
    const refresh = item.refresh;
    if (!refresh || !refresh.enabled || !refresh.cycleSeconds) return false;
    if (!refresh.lastRefreshAt) return true;
    const last = Date.parse(refresh.lastRefreshAt);
    if (Number.isNaN(last)) return true;
    return now - last >= refresh.cycleSeconds * 1000;
  });
}

// 由调度器每 tick 调用: 刷新所有到期的认证配置
export async function refreshDueAuths() {
  const due = listAuthConfigsDueForRefresh();
  for (const item of due) {
    try {
      await refreshAuthConfig(item.id);
    } catch {
      // 失败已记录到 refresh.lastError, 不阻断其他刷新
    }
  }
  return due.length;
}

function maskApiKey(value = "") {
  const key = String(value || "").trim();
  if (!key) return "未配置";
  if (key.length <= 8) return "已配置";
  return `${key.slice(0, 4)}****${key.slice(-4)}`;
}

export function createModelConfig(input = {}) {
  const config = {
    id: input.id || uniqueId("model"),
    name: input.name || "自定义模型配置",
    category: input.category || "模型配置",
    vendor: input.vendor || "openai-compatible",
    model: input.model || "gpt-4.1-mini",
    baseUrl: input.baseUrl || "https://api.openai.com/v1",
    apiKey: input.apiKey || "",
    apiKeyMasked: maskApiKey(input.apiKey),
    status: input.apiKey ? "可用" : "待配置 Key",
    updatedAt: new Date().toISOString()
  };
  store.modelConfigs.unshift(config);
  return { ...config, apiKey: "" };
}

export function updateModelConfig(id, input = {}) {
  const index = store.modelConfigs.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Model config not found");
    error.status = 404;
    throw error;
  }
  const existing = store.modelConfigs[index];
  const apiKey = input.apiKey ? input.apiKey : existing.apiKey || "";
  const updated = {
    ...existing,
    name: input.name || existing.name,
    category: input.category || existing.category || "模型配置",
    vendor: input.vendor || existing.vendor,
    model: input.model || existing.model,
    baseUrl: input.baseUrl || existing.baseUrl,
    apiKey,
    apiKeyMasked: maskApiKey(apiKey),
    status: apiKey ? "可用" : "待配置 Key",
    updatedAt: new Date().toISOString()
  };
  store.modelConfigs[index] = updated;
  return { ...updated, apiKey: "" };
}

export function deleteModelConfig(id) {
  const index = store.modelConfigs.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Model config not found");
    error.status = 404;
    throw error;
  }
  const [removed] = store.modelConfigs.splice(index, 1);
  return { ...removed, apiKey: "" };
}

function maskStoragePassword(value = "") {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= 4) return "******";
  return `${text.slice(0, 2)}****${text.slice(-2)}`;
}

function sanitizeStorageConfig(config = {}) {
  return { ...config, active: config.id === store.currentStorageId, password: "" };
}

export function createStorageConfig(input = {}) {
  const existingDatabaseStorage = store.storageConfigs.find((item) => item.type === "database");
  if (existingDatabaseStorage) {
    const error = new Error("Only one database storage config is supported");
    error.status = 400;
    throw error;
  }
  const password = input.password || "";
  const config = {
    id: input.id || uniqueId("storage"),
    name: input.name || "数据库存储",
    category: input.category || "数据库存储",
    type: "database",
    database: input.database || "sqlite",
    host: input.host || (input.database === "sqlite" || !input.database ? "server/data/runtime-store.sqlite" : "127.0.0.1"),
    port: input.port || (input.database === "sqlite" || !input.database ? "" : "5432"),
    username: input.username || "",
    password,
    passwordMasked: maskStoragePassword(password),
    status: input.host ? "已配置" : "待配置",
    readonly: false,
    active: false,
    updatedAt: new Date().toISOString()
  };
  store.storageConfigs.push(config);
  return sanitizeStorageConfig(config);
}

export function updateStorageConfig(id, input = {}) {
  const index = store.storageConfigs.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Storage config not found");
    error.status = 404;
    throw error;
  }
  const existing = store.storageConfigs[index];
  if (existing.readonly) {
    const error = new Error("Default local storage config cannot be edited");
    error.status = 400;
    throw error;
  }
  const password = input.password ? input.password : existing.password || "";
  const updated = {
    ...existing,
    name: input.name || existing.name,
    category: input.category || existing.category || "数据库存储",
    type: "database",
    database: input.database || existing.database || "postgresql",
    host: input.host ?? existing.host,
    port: input.port ?? existing.port,
    username: input.username ?? existing.username,
    password,
    passwordMasked: maskStoragePassword(password),
    status: input.host || existing.host ? "已配置" : "待配置",
    updatedAt: new Date().toISOString()
  };
  store.storageConfigs[index] = updated;
  return sanitizeStorageConfig(updated);
}

export function deleteStorageConfig(id) {
  const index = store.storageConfigs.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Storage config not found");
    error.status = 404;
    throw error;
  }
  if (store.storageConfigs[index].readonly) {
    const error = new Error("Default local storage config cannot be deleted");
    error.status = 400;
    throw error;
  }
  if (store.currentStorageId === id) {
    const error = new Error("Active storage config cannot be deleted");
    error.status = 400;
    throw error;
  }
  const [removed] = store.storageConfigs.splice(index, 1);
  return sanitizeStorageConfig(removed);
}

function getStorageDataScope(policy = "copy-config") {
  const configCounts = {
    authConfigs: store.authConfigs.length,
    dataSources: store.dataSources.length,
    fieldMappings: store.fieldMappings.length,
    cleaningRules: store.cleaningRules.length,
    dictionarySets: store.dictionarySets.length,
    businessFlows: store.businessFlows.length,
    situationFilters: store.situationFilters.length,
    modelConfigs: store.modelConfigs.length
  };
  const businessCounts = {
    businesses: store.businesses.length,
    syncLogs: store.syncLogs.length,
    analysisResults: store.analysisResults.length,
    knowledge: store.knowledge.length
  };
  if (policy === "switch-only") return {};
  if (policy === "copy-all") return { ...configCounts, ...businessCounts };
  return configCounts;
}

export function switchStorageConfig(input = {}) {
  const targetId = input.targetStorageId || input.storageId;
  const target = store.storageConfigs.find((item) => item.id === targetId);
  if (!target) {
    const error = new Error("Target storage config not found");
    error.status = 404;
    throw error;
  }
  if (target.type === "database") {
    try {
      createStorageAdapter(target).probe();
    } catch (error) {
      error.status = error.status || 501;
      throw error;
    }
  }
  const previous = store.storageConfigs.find((item) => item.id === store.currentStorageId) || store.storageConfigs[0];
  const migrationPolicy = input.migrationPolicy || "copy-config";
  const migrationLog = {
    id: uniqueId("storage_migration"),
    fromStorageId: previous?.id || "",
    fromStorageName: previous?.name || "",
    toStorageId: target.id,
    toStorageName: target.name,
    migrationPolicy,
    dataScope: getStorageDataScope(migrationPolicy),
    status: migrationPolicy === "switch-only" ? "switched-without-copy" : "migrated",
    message:
      migrationPolicy === "switch-only"
        ? "已切换当前存储，旧存储中的数据不会自动复制。"
        : migrationPolicy === "copy-all"
          ? "已完成全量数据复制，后续写入会进入当前存储。"
          : "已完成配置数据复制；业务运行数据仍保留在旧存储。",
    createdAt: new Date().toISOString()
  };
  store.currentStorageId = target.id;
  store.storageConfigs = store.storageConfigs.map((item) => ({
    ...item,
    active: item.id === target.id,
    status: item.id === target.id ? "当前使用" : item.status === "当前使用" ? "已配置" : item.status
  }));
  store.storageMigrationLogs.unshift(migrationLog);
  applyStoragePolicy(migrationPolicy);
  return {
    currentStorageId: store.currentStorageId,
    currentStorage: sanitizeStorageConfig(store.storageConfigs.find((item) => item.id === store.currentStorageId)),
    previousStorage: sanitizeStorageConfig(previous),
    migration: migrationLog,
    storageConfigs: store.storageConfigs.map(sanitizeStorageConfig)
  };
}

function normalizeDictionaryRows(rows = [], columns = []) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) =>
    columns.reduce((output, column) => {
      output[column] = row?.[column] ?? "";
      return output;
    }, {})
  );
}

function inferDictionaryColumns(rows = []) {
  if (!Array.isArray(rows)) return [];
  return [...new Set(rows.flatMap((row) => Object.keys(row || {})))];
}

export function createDictionarySet(input = {}) {
  const rows = Array.isArray(input.rows) ? input.rows : [];
  const columns = Array.isArray(input.columns) && input.columns.length ? input.columns : inferDictionaryColumns(rows);
  const dictionary = {
    id: input.id || uniqueId("dict"),
    name: input.name || "自定义字典集",
    category: input.category || "通用字典",
    description: input.description || "",
    columns: columns.length ? columns : ["名称", "值"],
    rows: normalizeDictionaryRows(rows, columns.length ? columns : ["名称", "值"]),
    updatedAt: new Date().toISOString()
  };
  store.dictionarySets.unshift(dictionary);
  return dictionary;
}

export function updateDictionarySet(id, input = {}) {
  const index = store.dictionarySets.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Dictionary set not found");
    error.status = 404;
    throw error;
  }
  const existing = store.dictionarySets[index];
  const rows = Array.isArray(input.rows) ? input.rows : existing.rows;
  const columns = Array.isArray(input.columns) && input.columns.length ? input.columns : inferDictionaryColumns(rows);
  const updated = {
    ...existing,
    name: input.name || existing.name,
    category: input.category || existing.category,
    description: input.description ?? existing.description,
    columns: columns.length ? columns : existing.columns,
    rows: normalizeDictionaryRows(rows, columns.length ? columns : existing.columns),
    updatedAt: new Date().toISOString()
  };
  store.dictionarySets[index] = updated;
  return updated;
}

export function deleteDictionarySet(id) {
  const index = store.dictionarySets.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Dictionary set not found");
    error.status = 404;
    throw error;
  }
  const [removed] = store.dictionarySets.splice(index, 1);
  return removed;
}

export function createCleaningRule(input = {}) {
  const rule = {
    id: input.id || uniqueId("rule"),
    name: input.name || "自定义清洗规则",
    category: input.category || "清洗规则",
    type: input.type || "mapping",
    expression: input.expression || "trim + normalize",
    description: input.description || "用户自定义清洗规则",
    config: input.config || {},
    enabled: input.enabled !== false,
    updatedAt: new Date().toISOString()
  };
  store.cleaningRules.unshift(rule);
  return rule;
}

export function updateCleaningRule(id, input = {}) {
  const index = store.cleaningRules.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Cleaning rule not found");
    error.status = 404;
    throw error;
  }
  const existing = store.cleaningRules[index];
  const updated = {
    ...existing,
    name: input.name || existing.name,
    category: input.category || existing.category || "清洗规则",
    type: input.type || existing.type,
    expression: input.expression || existing.expression,
    description: input.description || existing.description,
    config: input.config || existing.config || {},
    enabled: input.enabled !== undefined ? input.enabled : existing.enabled,
    updatedAt: new Date().toISOString()
  };
  store.cleaningRules[index] = updated;
  return updated;
}

export function deleteCleaningRule(id) {
  const index = store.cleaningRules.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Cleaning rule not found");
    error.status = 404;
    throw error;
  }
  const [removed] = store.cleaningRules.splice(index, 1);
  store.businessFlows = store.businessFlows.map((flow) => ({
    ...flow,
    ruleIds: flow.ruleIds.filter((ruleId) => ruleId !== id)
  }));
  return removed;
}

export function createBusinessFlow(input = {}) {
  const businessName = (input.businessName || "新业务模块").trim();
  const existing = store.businessFlows.find((item) => (item.businessName || "").trim().toLowerCase() === businessName.toLowerCase());
  if (existing) {
    return updateBusinessFlow(existing.id, { ...input, businessName });
  }
  const flow = {
    id: input.id || uniqueId("flow"),
    name: input.name || "自定义业务流",
    businessName,
    dataSourceIds: Array.isArray(input.dataSourceIds) ? input.dataSourceIds : [],
    ruleIds: Array.isArray(input.ruleIds) ? input.ruleIds : [],
    dagVersion: input.dagVersion || 2,
    nodes: Array.isArray(input.nodes) ? input.nodes : [],
    edges: Array.isArray(input.edges) ? input.edges : [],
    timeField: input.timeField || "event_time",
    outputMode: input.outputMode || "upsert-business",
    outputConfig: {
      writeStrategy: input.outputConfig?.writeStrategy || "upsert",
      primaryKey: input.outputConfig?.primaryKey || "event_id",
      rawTable: input.outputConfig?.rawTable || `raw_${input.businessName || "business"}`,
      cleanTable: input.outputConfig?.cleanTable || `clean_${input.businessName || "business"}`,
      businessTable: input.outputConfig?.businessTable || `biz_${input.businessName || "business"}`,
      dedupeStrategy: input.outputConfig?.dedupeStrategy || "primary-key",
      dedupeFields: input.outputConfig?.dedupeFields || "",
      updateFields: Array.isArray(input.outputConfig?.updateFields) ? input.outputConfig.updateFields : [],
      atomicWrite: input.outputConfig?.atomicWrite === true
    },
    status: "ready",
    lastRunAt: "",
    updatedAt: new Date().toISOString()
  };
  store.businessFlows.unshift(flow);
  return flow;
}

export function updateBusinessFlow(id, input = {}) {
  const index = store.businessFlows.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Business flow not found");
    error.status = 404;
    throw error;
  }
  const existing = store.businessFlows[index];
  const updated = {
    ...existing,
    name: input.name || existing.name,
    businessName: input.businessName || existing.businessName,
    dataSourceIds: Array.isArray(input.dataSourceIds) ? input.dataSourceIds : existing.dataSourceIds,
    ruleIds: Array.isArray(input.ruleIds) ? input.ruleIds : existing.ruleIds,
    dagVersion: input.dagVersion || existing.dagVersion || 2,
    nodes: Array.isArray(input.nodes) ? input.nodes : existing.nodes || [],
    edges: Array.isArray(input.edges) ? input.edges : existing.edges || [],
    timeField: input.timeField || existing.timeField,
    outputMode: input.outputMode || existing.outputMode,
    outputConfig: {
      ...(existing.outputConfig || {}),
      ...(input.outputConfig || {})
    },
    updatedAt: new Date().toISOString()
  };
  store.businessFlows[index] = updated;
  return updated;
}

export function deleteBusinessFlow(id) {
  const index = store.businessFlows.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Business flow not found");
    error.status = 404;
    throw error;
  }
  const [removed] = store.businessFlows.splice(index, 1);
  store.syncLogs = store.syncLogs.filter((log) => log.sourceId !== id);
  return removed;
}

export async function runBusinessFlow(input = {}) {
  const runtimeFlow = input.flow && typeof input.flow === "object" ? input.flow : null;
  const storedIndex = store.businessFlows.findIndex((item) => item.id === (runtimeFlow?.id || input.flowId));
  const storedFlow = storedIndex >= 0 ? store.businessFlows[storedIndex] : store.businessFlows[0];
  const flow = runtimeFlow
    ? {
        ...(storedFlow || {}),
        ...runtimeFlow,
        outputConfig: {
          ...(storedFlow?.outputConfig || {}),
          ...(runtimeFlow.outputConfig || {})
        }
      }
    : storedFlow;
  if (!flow) {
    const error = new Error("Business flow not found");
    error.status = 404;
    throw error;
  }
  const nodeSourceIds = Array.isArray(flow.nodes) && flow.nodes.length
    ? flow.nodes.filter((node) => node.type === "source").map((node) => node.refId)
    : flow.dataSourceIds;
  const nodeRuleIds = Array.isArray(flow.nodes) && flow.nodes.length
    ? flow.nodes.filter((node) => node.type === "rule").map((node) => node.refId)
    : flow.ruleIds;
  const sources = nodeSourceIds
    .map((id) => store.dataSources.find((source) => source.id === id))
    .filter(Boolean);
  const sourceNodes = Array.isArray(flow.nodes) && flow.nodes.length
    ? flow.nodes.filter((node) => node.type === "source")
    : sources.map((source) => ({ id: `node_source_${source.id}`, type: "source", refId: source.id, name: source.name }));
  const flowNodes = Array.isArray(flow.nodes) && flow.nodes.length ? flow.nodes : sourceNodes;
  const rules = nodeRuleIds
    .map((id) => store.cleaningRules.find((rule) => rule.id === id))
    .filter(Boolean);
  const runAt = new Date();
  const defaultStart = new Date(runAt.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const flowContext = {
    start_time: defaultStart,
    end_time: runAt.toISOString(),
    businessName: flow.businessName,
    batchId: uniqueId("batch"),
    tenant: input.context?.tenant || "default",
    env: input.context?.env || "prod",
    ...(input.context || {})
  };
  flow.outputConfig = flow.outputConfig || {
    writeStrategy: "upsert",
    primaryKey: "event_id",
    rawTable: `raw_${flow.businessName}`,
    cleanTable: `clean_${flow.businessName}`,
    businessTable: `biz_${flow.businessName}`,
    dedupeStrategy: "primary-key",
    dedupeFields: ""
  };
  const nowText = new Date().toISOString().slice(0, 16).replace("T", " ");
  const sourceText = sources.map((source) => source.name).join(" + ") || "未选择数据源";
  const ruleText = rules.map((rule) => rule.name).join(" + ") || "未选择规则";
  const branchKeys = new Set((flow.nodes || []).filter((node) => node.branchFromId).map((node) => `${node.branchFromId}:${node.branchName || node.id}`));
  const sourceExecutionPlans = sourceNodes
    .map((node) => {
      const source = store.dataSources.find((item) => item.id === node.refId);
      return source ? estimateSourceNodePlan(node, source) : null;
    })
    .filter(Boolean);
  const executionPlan = {
    serial: (flow.nodes || []).filter((node) => (node.executionMode || "serial") === "serial").length,
    parallel: (flow.nodes || []).filter((node) => node.executionMode === "parallel").length,
    join: (flow.nodes || []).filter((node) => node.executionMode === "join").length,
    branches: branchKeys.size,
    conditionalBranches: (flow.nodes || []).filter((node) => node.branchFromId && node.branchCondition).length,
    dagVersion: flow.dagVersion || 1,
    edges: (flow.edges || []).length,
    conditionalEdges: (flow.edges || []).filter((edge) => edge.type === "condition" && edge.condition).length,
    sourcePlans: sourceExecutionPlans,
    maxConcurrency: Math.max(1, ...sourceExecutionPlans.map((plan) => plan.concurrency || 1)),
    lockedSources: sourceExecutionPlans.filter((plan) => plan.lockEnabled).length,
    summary: flowNodes
      .map((node, index) => {
        const branchText = node.branchFromId ? `, 分支:${node.branchName || "未命名"}${node.branchCondition ? ` if ${node.branchCondition}` : ""}` : "";
        return `${index + 1}.${node.name || node.type}(${node.executionMode || "serial"}${branchText})`;
      })
      .join(" -> ")
  };
  const loopCalls = sourceExecutionPlans.reduce((sum, plan) => sum + plan.callCount, 0);
  const parameterPlan = {
    loopCalls,
    summary: sources
      .map((source) => sourceExecutionPlans.find((plan) => plan.sourceId === source.id))
      .filter(Boolean)
      .map((plan) => {
        const shardText = plan.pageShards?.length
          ? `，页段 ${plan.pageShards.map((shard) => `${shard.start}-${shard.end}`).join("、")}`
          : "";
        return `${plan.sourceName} ${plan.sourceType === "database" ? `从数据库来源 ${plan.sourceIdForInput || "未选择"} 读取 ${plan.recordCount} 条记录` : "使用配置入参"}，${plan.iterationMode === "batch" ? `${plan.batchCount} 批` : `${plan.recordCount} 轮`}，分页 ${plan.pageCount} 页，并发 ${plan.concurrency}${shardText}${plan.lockEnabled ? `，按 ${plan.lockKey} ${plan.lockStrategy} 防重` : ""}`;
      })
      .join("；")
  };
  const row = [
    `${flow.businessName} 聚合数据`,
    "P1",
    sourceText,
    nowText,
    `${rules.length} 条规则 / ${loopCalls} 次调用`
  ];
  const mode = input.mode === "live" ? "live" : "preview";
  const responseCache = new Map();
  const flowExecution = await executeFlowDag(flowNodes, sourceExecutionPlans, flow.edges || [], flowContext, mode, responseCache);
  const sourceResults = flowExecution.sourceResults;
  const materialized = flowExecution.outputRecords.length
    ? toBusinessRowsFromRecords(flowExecution.outputRecords, row)
    : toBusinessRows(sourceResults, row);
  const runFailedRows = sourceResults.filter((item) => !item.result.ok).length;
  const fetchedRows = sourceResults.reduce((sum, item) => sum + Number(item.result.recordCount || 0), 0);
  const cleanedRows = materialized.rows.length;
  const durationMs = sourceResults.reduce((sum, item) => sum + Number(item.result.durationMs || 0), 0);

  let business = store.businesses.find((item) => item.name === flow.businessName);
  if (!business) {
    business = {
      id: uniqueId("biz"),
      name: flow.businessName,
      timeField: flow.timeField,
      fields: materialized.fields,
      rows: []
    };
    store.businesses.unshift(business);
  }
  business.timeField = flow.timeField;
  business.fields = materialized.fields;
  business.fieldSchema = reconcileFieldSchema(business.fieldSchema, materialized.fields);
  const atomicWrite = flow.outputConfig?.atomicWrite === true || flow.outputConfig?.writeStrategy === "overwrite";
  let tableStorageResult = null;
  if (atomicWrite && runFailedRows > 0 && fetchedRows > 0) {
    flow.status = "failed";
  } else {
    business.rows = mergeBusinessRows(business.rows || [], materialized.rows, materialized.fields, flow.outputConfig);
    flow.status = runFailedRows > 0 ? "warning" : "success";
    if (flow.outputConfig?.useTableStorage && flow.outputConfig.businessTable) {
      tableStorageResult = persistBusinessTable(
        flow.outputConfig.businessTable,
        materialized.fields,
        business.rows,
        { writeStrategy: flow.outputConfig.writeStrategy, primaryKeys: parseFieldList(flow.outputConfig.primaryKey) }
      );
    }
  }
  flow.lastRunAt = new Date().toISOString();
  flow.updatedAt = flow.lastRunAt;
  if (storedIndex >= 0) {
    store.businessFlows[storedIndex] = {
      ...store.businessFlows[storedIndex],
      status: flow.status,
      lastRunAt: flow.lastRunAt,
      updatedAt: flow.updatedAt
    };
  }
  store.syncLogs.unshift({
    id: uniqueId("flow_run"),
    sourceId: flow.id,
    sourceName: flow.name,
    status: runFailedRows ? "warning" : "success",
    fetchedRows,
    cleanedRows,
    failedRows: runFailedRows,
    durationMs,
    startedAt: flow.lastRunAt,
    message: `已编排 ${sources.length} 个数据源，执行 ${rules.length} 条规则，输出到 ${flow.outputConfig.businessTable}。规则：${ruleText}`
  });
  return {
    flow,
    business,
    row: materialized.rows[0] || row,
    rows: materialized.rows,
    sources,
    rules,
    sourceResults: sourceResults.map(({ node, source, result }) => ({
      nodeId: node.id,
      sourceId: source.id,
      sourceName: source.name,
      ok: result.ok,
      sourceMode: result.sourceMode,
      recordCount: result.recordCount,
      filteredRecordCount: result.filteredRecordCount,
      mappedRecordCount: result.mappedRecords?.length || 0,
      plannedCalls: result.plannedCalls || 1,
      actualCalls: result.actualCalls || 1,
      error: result.error || ""
    })),
    outputConfig: flow.outputConfig,
    context: flowContext,
    mode,
    tableStorage: tableStorageResult,
    parameterPlan,
    executionPlan: {
      ...executionPlan,
      executionOrder: flowExecution.executionOrder,
      edges: flowExecution.edges.length,
      nodeResults: flowExecution.nodeResults.map((item) => ({
        nodeId: item.node.id,
        type: item.node.type,
        name: item.node.name || item.node.type,
        skipped: Boolean(item.skipped),
        recordCount: item.records?.length || 0,
        error: item.error || ""
      }))
    }
  };
}

export function createKnowledgeSource(input = {}) {
  const source = {
    id: input.id || uniqueId("ks"),
    name: input.name || "新知识源",
    desc: input.desc || `本地路径 ${input.path || "D:/ops/new-source"}，待索引`,
    icon: input.icon || (String(input.path || "").startsWith("http") ? "cloud" : "file"),
    chunks: Number(input.chunks || 0),
    path: input.path || "D:/ops/new-source",
    indexedAt: new Date().toISOString()
  };
  store.knowledge.unshift(source);
  return source;
}

const severityWeight = {
  P0: 3,
  P1: 2,
  P2: 1
};

function impactValue(value) {
  const matched = String(value).match(/\d+/);
  return matched ? Number(matched[0]) : 0;
}

function parseBusinessTime(value) {
  const timestamp = Date.parse(String(value || "").replace(" ", "T"));
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function findFieldIndex(fields = [], candidates = [], fallback = 0) {
  const normalized = fields.map((field) => String(field).toLowerCase());
  const index = candidates
    .map((candidate) => normalized.indexOf(String(candidate).toLowerCase()))
    .find((item) => item >= 0);
  return index ?? fallback;
}

export function updateBusinessFieldSchema(businessId, fieldSchemaInput) {
  const business = store.businesses.find((item) => item.id === businessId || item.name === businessId);
  if (!business) {
    const error = new Error("Business not found");
    error.status = 404;
    throw error;
  }
  const normalized = normalizeFieldSchemaInput(fieldSchemaInput);
  const allowed = new Set((business.fields || []).map(String));
  business.fieldSchema = normalized.filter((item) => allowed.has(item.name));
  // 确保当前 fields 中存在但 schema 缺失的字段补默认
  business.fieldSchema = reconcileFieldSchema(business.fieldSchema, business.fields);
  return business;
}

export function queryBusiness(input = {}) {
  const business = store.businesses.find((item) => item.name === input.businessName) || store.businesses[0];
  let rows = [...business.rows];
  const keyword = String(input.keyword || "").trim().toLowerCase();
  const fields = business.fields || [];
  const fieldSchema = Array.isArray(business.fieldSchema) ? business.fieldSchema : [];
  const severityIndex = findFieldIndex(fields, ["等级", "level", "severity", "alarmLevel", "result"], 1);
  const createTimeName = fieldSchema.find((item) => item.isCreateTime)?.name;
  const timeIndex = createTimeName && fields.includes(createTimeName)
    ? fields.indexOf(createTimeName)
    : findFieldIndex(fields, ["时间", "occurTime", "event_time", "time", "updated_at", "checked_at", "created_at"], 3);
  const impactIndex = findFieldIndex(fields, ["状态/影响", "duration", "queue_lag", "lag", "impact"], 4);

  if (keyword) {
    rows = rows.filter((row) => row.some((cell) => String(cell).toLowerCase().includes(keyword)));
  }

  const startTime = input.timeStart ? Date.parse(input.timeStart) : 0;
  const endTime = input.timeEnd ? Date.parse(input.timeEnd) : 0;
  if (startTime || endTime) {
    // Dynamic business fields are generated from source records, so resolve the time column by field name first.
    rows = rows.filter((row) => {
      const rowTime = parseBusinessTime(row[timeIndex]);
      if (!rowTime) return true;
      return (!startTime || rowTime >= startTime) && (!endTime || rowTime <= endTime);
    });
  }

  if (input.sort === "time") {
    rows.sort((a, b) => String(b[timeIndex]).localeCompare(String(a[timeIndex])));
  } else if (input.sort === "impact") {
    rows.sort((a, b) => impactValue(b[impactIndex]) - impactValue(a[impactIndex]));
  } else {
    rows.sort((a, b) => (severityWeight[b[severityIndex]] || 0) - (severityWeight[a[severityIndex]] || 0));
  }

  if (input.view === "top") {
    rows = rows.slice(0, 3);
  }

  return {
    ...business,
    rows,
    query: {
      keyword,
      sort: input.sort || "risk",
      view: input.view || "table",
      timeField: input.timeField || business.timeField,
      timeRange: input.timeRange || "最近 24 小时",
      timeStart: input.timeStart || "",
      timeEnd: input.timeEnd || ""
    }
  };
}
