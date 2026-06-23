import { store } from "../data/store.mjs";
import { executeDataSourcePlan } from "./sync-service.mjs";

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
    id: existing.id || input.id || `situation_filter_${Date.now()}`,
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
  const pagination = {
    mode: config.pagination?.mode || (sourcePagination ? "page-number" : "off"),
    pageSize: positiveNumber(config.pagination?.pageSize, 100),
    maxPages: positiveNumber(config.pagination?.maxPages, sourcePagination ? 2 : 1),
    pageParam: config.pagination?.pageParam || "page",
    pageSizeParam: config.pagination?.pageSizeParam || "pageSize",
    startPage: nonNegativeNumber(config.pagination?.startPage, 1),
    nextTokenPath: config.pagination?.nextTokenPath || "",
    hasNextPath: config.pagination?.hasNextPath || "",
    totalPages: nonNegativeNumber(config.pagination?.totalPages, 0),
    pagesPerShard: nonNegativeNumber(config.pagination?.pagesPerShard, 0)
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
  const recordCount = iteration.mode === "single"
    ? 1
    : iteration.recordLimit || defaultRecordCount;
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

function parseFieldList(value = "") {
  return String(value || "")
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getDedupeFields(outputConfig = {}) {
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

function mergeBusinessRows(existingRows = [], newRows = [], fields = [], outputConfig = {}) {
  const strategy = outputConfig.writeStrategy || "upsert";
  if (strategy === "append") {
    return [...newRows, ...existingRows].slice(0, 1000);
  }
  const keyFields = getDedupeFields(outputConfig);
  if (!keyFields.length) {
    return [...newRows, ...existingRows].slice(0, 1000);
  }
  const newKeys = new Set(newRows.map((row) => rowKey(fields, row, keyFields)).filter(Boolean));
  const keptRows = existingRows.filter((row) => {
    const key = rowKey(fields, row, keyFields);
    return !key || !newKeys.has(key);
  });
  return [...newRows, ...keptRows].slice(0, 1000);
}

function getNodePredecessors(nodes = [], node = {}, edges = []) {
  const incoming = edges.filter((edge) => edge.to === node.id).map((edge) => edge.from).filter(Boolean);
  if (incoming.length) return incoming;
  if (Array.isArray(node.predecessors) && node.predecessors.length) return node.predecessors;
  if (node.branchFromId) return [node.branchFromId];
  const index = nodes.findIndex((item) => item.id === node.id);
  return index > 0 ? [nodes[index - 1].id] : [];
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
    output: input.output || "内部业务库"
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

export function createAuthConfig(input = {}) {
  const config = {
    id: `auth_${Date.now()}`,
    name: input.name || "自定义认证配置",
    category: input.category || "认证配置",
    type: input.type || "cookie",
    username: input.username || "",
    password: input.password ? "******" : "",
    cookieValue: input.cookieValue || input.password || "",
    loginUrl: input.loginUrl || "",
    cookieName: input.cookieName || "",
    tokenHeader: input.tokenHeader || "",
    refreshCycle: input.refreshCycle || "手动",
    status: "可用",
    updatedAt: new Date().toISOString()
  };
  store.authConfigs.unshift(config);
  return config;
}

export function updateAuthConfig(id, input = {}) {
  const index = store.authConfigs.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Auth config not found");
    error.status = 404;
    throw error;
  }
  const existing = store.authConfigs[index];
  const updated = {
    ...existing,
    name: input.name || existing.name,
    category: input.category || existing.category || "认证配置",
    type: input.type || existing.type,
    username: input.username ?? existing.username,
    password: input.password ? "******" : existing.password,
    cookieValue: input.cookieValue || input.password || existing.cookieValue || "",
    loginUrl: input.loginUrl ?? existing.loginUrl,
    cookieName: input.cookieName ?? existing.cookieName,
    tokenHeader: input.tokenHeader ?? existing.tokenHeader,
    refreshCycle: input.refreshCycle || existing.refreshCycle,
    updatedAt: new Date().toISOString()
  };
  store.authConfigs[index] = updated;
  return updated;
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

function maskApiKey(value = "") {
  const key = String(value || "").trim();
  if (!key) return "未配置";
  if (key.length <= 8) return "已配置";
  return `${key.slice(0, 4)}****${key.slice(-4)}`;
}

export function createModelConfig(input = {}) {
  const config = {
    id: `model_${Date.now()}`,
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
    id: `storage_${Date.now()}`,
    name: input.name || "数据库存储",
    category: input.category || "数据库存储",
    type: "database",
    database: input.database || "postgresql",
    host: input.host || "127.0.0.1",
    port: input.port || "5432",
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
  const previous = store.storageConfigs.find((item) => item.id === store.currentStorageId) || store.storageConfigs[0];
  const migrationPolicy = input.migrationPolicy || "copy-config";
  const migrationLog = {
    id: `storage_migration_${Date.now()}`,
    fromStorageId: previous?.id || "",
    fromStorageName: previous?.name || "",
    toStorageId: target.id,
    toStorageName: target.name,
    migrationPolicy,
    dataScope: getStorageDataScope(migrationPolicy),
    status: migrationPolicy === "switch-only" ? "switched-without-copy" : "migration-plan-recorded",
    message:
      migrationPolicy === "switch-only"
        ? "已切换当前存储，旧存储中的数据不会自动复制。"
        : migrationPolicy === "copy-all"
          ? "已记录全量数据复制计划；接入数据库适配器后可执行真实迁移。"
          : "已记录配置数据复制计划；业务运行数据仍保留在旧存储。",
    createdAt: new Date().toISOString()
  };
  store.currentStorageId = target.id;
  store.storageConfigs = store.storageConfigs.map((item) => ({
    ...item,
    active: item.id === target.id,
    status: item.id === target.id ? "当前使用" : item.status === "当前使用" ? "已配置" : item.status
  }));
  store.storageMigrationLogs.unshift(migrationLog);
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
    id: `dict_${Date.now()}`,
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
    id: `flow_${Date.now()}`,
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
      dedupeFields: input.outputConfig?.dedupeFields || ""
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
  const rules = nodeRuleIds
    .map((id) => store.cleaningRules.find((rule) => rule.id === id))
    .filter(Boolean);
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
    summary: (flow.nodes || [])
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
  const sourceResults = await executeSourceNodes(flow.nodes?.length ? flow.nodes : sourceNodes, sourceExecutionPlans, flow.edges || []);
  const materialized = toBusinessRows(sourceResults, row);
  const runFailedRows = sourceResults.filter((item) => !item.result.ok).length;
  const fetchedRows = sourceResults.reduce((sum, item) => sum + Number(item.result.recordCount || 0), 0);
  const cleanedRows = materialized.rows.length;
  const durationMs = sourceResults.reduce((sum, item) => sum + Number(item.result.durationMs || 0), 0);

  let business = store.businesses.find((item) => item.name === flow.businessName);
  if (!business) {
    business = {
      id: `biz_${Date.now()}`,
      name: flow.businessName,
      timeField: flow.timeField,
      fields: materialized.fields,
      rows: []
    };
    store.businesses.unshift(business);
  }
  business.timeField = flow.timeField;
  business.fields = materialized.fields;
  business.rows = mergeBusinessRows(business.rows || [], materialized.rows, materialized.fields, flow.outputConfig);
  flow.status = "success";
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
    id: `flow_run_${Date.now()}`,
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
    parameterPlan,
    executionPlan
  };
}

export function createKnowledgeSource(input = {}) {
  const source = {
    id: `ks_${Date.now()}`,
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

export function queryBusiness(input = {}) {
  const business = store.businesses.find((item) => item.name === input.businessName) || store.businesses[0];
  let rows = [...business.rows];
  const keyword = String(input.keyword || "").trim().toLowerCase();
  const fields = business.fields || [];
  const severityIndex = findFieldIndex(fields, ["等级", "level", "severity", "alarmLevel", "result"], 1);
  const timeIndex = findFieldIndex(fields, ["时间", "occurTime", "event_time", "time", "updated_at", "checked_at", "created_at"], 3);
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
