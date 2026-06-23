import { store } from "../data/store.mjs";

const semanticFieldAliases = {
  severity: ["severity", "level", "priority", "alarm_level", "risk_level", "等级", "级别", "优先级", "告警级别"],
  service: ["service", "service_name", "app", "application", "system", "module", "归属对象", "服务", "应用", "系统", "模块"],
  owner: ["owner", "assignee", "handler", "team", "owner_team", "负责人", "责任人", "处理人", "团队"],
  time: ["event_time", "created_at", "updated_at", "time", "timestamp", "发生时间", "创建时间", "更新时间", "时间"],
  event: ["event", "event_name", "title", "name", "事件", "事件名称", "告警", "告警名称"]
};

function normalizeList(value, fallback = []) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,+]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
}

function parseListValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (value === undefined || value === null) return [];
  return String(value)
    .split(/[\n,，;；|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeFieldName(value) {
  return String(value || "").trim().toLowerCase();
}

function getBusinessFields(business) {
  return business?.fields || business?.columns || business?.headers || [];
}

function resolveBusinessFieldName(business, field) {
  const fields = getBusinessFields(business);
  const candidates = [
    field,
    ...(semanticFieldAliases[normalizeFieldName(field)] || []),
    ...Object.values(semanticFieldAliases)
      .filter((aliases) => aliases.some((alias) => normalizeFieldName(alias) === normalizeFieldName(field)))
      .flat()
  ].filter(Boolean);
  return fields.find((item) => candidates.some((candidate) => normalizeFieldName(candidate) === normalizeFieldName(item))) || field;
}

function getRowValueByField(business, row, field) {
  const fields = getBusinessFields(business);
  const resolved = resolveBusinessFieldName(business, field);
  const index = fields.findIndex((item) => normalizeFieldName(item) === normalizeFieldName(resolved));
  if (index >= 0) return row[index];
  return undefined;
}

function getSemanticValue(business, row, semantic, fallbackIndex = -1) {
  const aliases = semanticFieldAliases[semantic] || [semantic];
  for (const alias of aliases) {
    const value = getRowValueByField(business, row, alias);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  if (fallbackIndex >= 0) return row[fallbackIndex];
  return "";
}

function getDictionaryColumnValues(ref) {
  if (!ref) return [];
  const [setName, column] = String(ref).split(".").map((item) => item.trim());
  const dictionary = store.dictionarySets.find((item) => item.name === setName || item.id === setName);
  if (!dictionary) return [];
  const targetColumn = column || dictionary.columns?.[0];
  return (dictionary.rows || [])
    .flatMap((row) => parseListValue(row[targetColumn]))
    .filter(Boolean);
}

function getFilterOptions(filter) {
  if (filter.source === "dictionary") return getDictionaryColumnValues(filter.dictionaryRef);
  return parseListValue(filter.options || filter.defaultValue);
}

function hasFilterValue(value, expected, filterType = "select") {
  if (!expected || (Array.isArray(expected) && !expected.length)) return true;
  const source = String(value ?? "").trim().toLowerCase();
  if (!source) return false;
  const expectedValues = parseListValue(expected).map((item) => item.toLowerCase());
  if (!expectedValues.length) return true;
  if (filterType === "text") return expectedValues.every((item) => source.includes(item));
  return expectedValues.some((item) => source === item || source.includes(item));
}

function getSelectedFilterValue(filterContext = {}, filter) {
  const values = filterContext.selectedValues || {};
  return values[filter.id] ?? values[filter.field] ?? filter.defaultValue ?? "";
}

function parseTimeValue(value) {
  if (!value) return 0;
  const parsed = Date.parse(String(value).replace(" ", "T"));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getConfiguredTimeValue(business, row, filterContext = {}) {
  const timeFields = filterContext.timeFields || store.situationTimeFilter?.fields || semanticFieldAliases.time;
  for (const field of timeFields) {
    const value = getRowValueByField(business, row, field);
    if (value) return value;
  }
  return getSemanticValue(business, row, "time", 3);
}

function passesFilterContext(business, row, filterContext = {}) {
  const filters = (filterContext.filters || store.situationFilters || []).filter((filter) => filter.defaultVisible !== false);
  const selectedValues = filterContext.selectedValues || {};
  const hasSelection = Object.values(selectedValues).some((value) => {
    if (Array.isArray(value)) return value.length;
    return String(value || "").trim();
  });
  for (const filter of filters) {
    const selected = getSelectedFilterValue(filterContext, filter);
    const expected = selected;
    if (!expected || (Array.isArray(expected) && !expected.length)) continue;
    const value = getRowValueByField(business, row, filter.field);
    if (!hasFilterValue(value, expected, filter.type)) return false;
  }
  const start = parseTimeValue(filterContext.timeStart);
  const end = parseTimeValue(filterContext.timeEnd);
  if (start || end) {
    const rowTime = parseTimeValue(getConfiguredTimeValue(business, row, filterContext));
    if (!rowTime) return true;
    if (start && rowTime < start) return false;
    if (end && rowTime > end) return false;
  }
  return hasSelection || start || end ? true : true;
}

export function runAnalysis(payload = {}) {
  // Accept both the old single-business payload and the newer multi-business analysis payload.
  const businessNames = normalizeList(payload.businessNames || payload.businessName, [store.businesses[0]?.name].filter(Boolean));
  const selectedBusinesses = businessNames
    .map((name) => store.businesses.find((item) => item.name === name))
    .filter(Boolean);
  const businesses = selectedBusinesses.length ? selectedBusinesses : [store.businesses[0]].filter(Boolean);
  const rawRows = businesses.flatMap((business) => business.rows.map((row) => ({ business, row })));
  const filterContext = payload.filterContext || {};
  const allRows = rawRows.filter(({ business, row }) => passesFilterContext(business, row, filterContext));
  const highRiskRows = allRows.filter(({ business, row }) => ["P0", "P1"].includes(String(getSemanticValue(business, row, "severity", 1)).toUpperCase()));
  const affectedServices = [...new Set(highRiskRows.map(({ business, row }) => getSemanticValue(business, row, "service", 2)).filter(Boolean))];
  const fields = normalizeList(payload.fields, ["severity", "service", "owner", "event_time"]);
  const comboFields = normalizeList(payload.comboFields);
  const modelConfig = store.modelConfigs.find((item) => item.id === payload.modelConfigId) || store.modelConfigs[0];
  const scopeLabels = {
    single: "按业务分别分析",
    combined: "多业务合并分析",
    compare: "多业务对比分析"
  };
  const filterSummary = rawRows.length === allRows.length ? "未启用额外筛选" : `已按全局筛选从 ${rawRows.length} 条收敛到 ${allRows.length} 条`;
  const result = {
    id: `analysis_${Date.now()}`,
    businessName: businesses.map((item) => item.name).join(" + "),
    businessNames: businesses.map((item) => item.name),
    model: modelConfig?.name || payload.model || "OpenAI Compatible",
    modelConfigId: modelConfig?.id || "",
    fields,
    comboFields,
    scope: payload.scope || "single",
    generatedAt: new Date().toISOString(),
    filterContext: {
      applied: rawRows.length !== allRows.length || Boolean(filterContext.timeStart || filterContext.timeEnd),
      totalRows: rawRows.length,
      filteredRows: allRows.length,
      selectedValues: filterContext.selectedValues || {},
      timeStart: filterContext.timeStart || "",
      timeEnd: filterContext.timeEnd || ""
    },
    sections: [
      {
        title: "结论",
        content: `${businesses.map((item) => item.name).join("、")} 当前按“${scopeLabels[payload.scope] || scopeLabels.single}”完成分析，${filterSummary}，覆盖 ${allRows.length} 条记录、${fields.length} 个字段，发现 ${highRiskRows.length} 条高优先级信号，集中在 ${affectedServices.join("、") || "暂无集中对象"}。`
      },
      {
        title: "风险",
        content: `重点组合字段为 ${comboFields.join("、") || fields.slice(0, 3).join("、")}。P0/P1 事件会影响核心业务链路，若 MQ 堆积、接口 5xx 或处理时长继续扩大，可能引发状态延迟和告警风暴。`
      },
      {
        title: "改进措施",
        content: `使用模型配置“${modelConfig?.name || "默认模型"}”。建议建立服务负责人自动补齐、发布风险联动、慢查询治理和 MQ 消费延迟告警；分析报告保留 ${fields.join("、")} 作为证据字段。`
      }
    ],
    evidence: highRiskRows.map(({ business, row }) => ({
      business: business.name,
      event: getSemanticValue(business, row, "event", 0),
      severity: getSemanticValue(business, row, "severity", 1),
      service: getSemanticValue(business, row, "service", 2),
      time: getSemanticValue(business, row, "time", 3)
    }))
  };
  store.analysisResults.unshift(result);
  return result;
}

export function listAnalysisResults() {
  return store.analysisResults;
}
