const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const appState = {
  selectedSourceId: "src_alarm_api",
  selectedAuthId: "auth_cookie_ops",
  editingSourceId: "",
  editingAuthId: "",
  editingDictionaryId: "",
  editingRuleId: "",
  editingMappingId: "",
  editingStorageConfigId: "",
  editingSituationFilterId: "",
  selectedFlowId: "",
  selectedFlowNodeId: "",
  selectedFlowEdgeId: "",
  businessDetailMode: "list",
  sourceDetailMode: "list",
  flowNodes: [],
  flowEdges: [],
  lastSourceTest: null,
  viewMode: "table",
  chartType: "line",
  lastDisplayResult: null,
  responseValueFilters: [],
  overviewFilters: {},
  overviewTimeStart: "",
  overviewTimeEnd: "",
  displayFilters: {},
  displayTimeStart: "",
  displayTimeEnd: "",
  filterControlRenderKeys: {},
  cleaningTab: "business",
  analysisTab: "config",
  editingModelConfigId: ""
};

const icons = {
  radar: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 3a9 9 0 1 1-9 9"/><path d="M12 7a5 5 0 1 1-5 5"/><path d="M12 11a1 1 0 1 1-1 1"/><path d="M12 3v4M21 12h-4M5.6 18.4l2.8-2.8"/></svg>',
  pipeline: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 6h6v6H4zM14 12h6v6h-6z"/><path d="M10 9h2a4 4 0 0 1 4 4v1M7 12v2a4 4 0 0 0 4 4h3"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5M12 16V8M16 16v-8"/></svg>',
  "line-chart": '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-5 3 3 5-7"/></svg>',
  "bar-chart": '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-4M12 16V8M16 16v-7"/></svg>',
  "pie-chart": '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 3v9h9"/><path d="M21 12a9 9 0 1 1-9-9"/></svg>',
  brain: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M8 6a4 4 0 0 0-4 4 4 4 0 0 0 1 7.7A4 4 0 0 0 12 20V5a4 4 0 0 0-4-4"/><path d="M16 6a4 4 0 0 1 4 4 4 4 0 0 1-1 7.7A4 4 0 0 1 12 20"/><path d="M8 10h1M15 10h1M8 15h2M14 15h2"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20 11a8 8 0 0 0-14.8-4"/><path d="M4 5v5h5"/><path d="M4 13a8 8 0 0 0 14.8 4"/><path d="M20 19v-5h-5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M13 2 4 14h7l-1 8 10-13h-7z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  "git-branch": '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 15V6a3 3 0 0 1 3-3h6"/><path d="M9 18h6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M8 5v14l11-7z"/></svg>',
  database: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M17.5 18H8a5 5 0 1 1 1-9.9A6 6 0 0 1 20 11a3.5 3.5 0 0 1-2.5 7z"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/></svg>'
};

const multiSelectConfigs = {
  paramSourceSelect: { label: "入参来源对象", empty: "未选择来源对象" },
  paramFieldSelect: { label: "来源字段勾选", empty: "未选择来源字段" },
  responseKeepFieldsSelect: { label: "保留字段勾选", empty: "未选择保留字段" },
  analysisBusinessSelect: { label: "分析业务选择", empty: "未选择分析业务" },
  analysisFieldSelect: { label: "分析字段选择", empty: "未选择分析字段" }
};

const popularModelPresets = [
  { id: "preset_deepseek_chat", name: "DeepSeek Chat", category: "中国热门模型", vendor: "deepseek", model: "deepseek-chat", baseUrl: "https://api.deepseek.com/v1" },
  { id: "preset_qwen_plus", name: "通义千问 Qwen Plus", category: "中国热门模型", vendor: "qwen", model: "qwen-plus", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  { id: "preset_kimi_k2", name: "Kimi K2", category: "中国热门模型", vendor: "moonshot", model: "kimi-k2-0711-preview", baseUrl: "https://api.moonshot.cn/v1" },
  { id: "preset_hunyuan_turbo", name: "腾讯混元 Turbo", category: "中国热门模型", vendor: "hunyuan", model: "hunyuan-turbos-latest", baseUrl: "https://api.hunyuan.cloud.tencent.com/v1" },
  { id: "preset_gpt_4o_mini", name: "OpenAI GPT-4o mini", category: "美国热门模型", vendor: "openai-compatible", model: "gpt-4o-mini", baseUrl: "https://api.openai.com/v1" },
  { id: "preset_claude_sonnet", name: "Claude Sonnet", category: "美国热门模型", vendor: "anthropic", model: "claude-3-5-sonnet-latest", baseUrl: "https://api.anthropic.com/v1" },
  { id: "preset_gemini_flash", name: "Gemini Flash", category: "美国热门模型", vendor: "gemini", model: "gemini-1.5-flash", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai" }
];

const placeholderConfigExample = [
  { name: "start_time", source: "mapping", from: "context.start_time" },
  { name: "env", source: "custom", value: "prod" },
  { name: "product", source: "dictionary", from: "产品列表.产品名", mode: "array" }
];

function getPlaceholderConfigExample() {
  return JSON.stringify(placeholderConfigExample, null, 2);
}

function formatOptionalJsonArray(value) {
  return Array.isArray(value) && value.length ? JSON.stringify(value, null, 2) : "";
}

function syncPlaceholderTextareaHint() {
  const input = $("#paramPlaceholderInput");
  if (input) input.placeholder = getPlaceholderConfigExample();
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    throw new Error(`API ${path} returned ${response.status}`);
  }
  const payload = await response.json();
  return payload.data;
}

async function loadBootstrapData() {
  try {
    const data = await apiRequest("/api/bootstrap");
    window.opsData = data;
    normalizeOpsData();
    document.body.dataset.api = "online";
    $("#apiStatus").textContent = "API 在线";
    $("#apiStatus").classList.add("ok");
  } catch (error) {
    normalizeOpsData();
    document.body.dataset.api = "offline";
    $("#apiStatus").textContent = "离线模拟";
    $("#apiStatus").classList.remove("ok");
    console.warn("Using local mock data:", error.message);
  }
}

function normalizeOpsData() {
  window.opsData = window.opsData || {};
  window.opsData.metrics = window.opsData.metrics || [];
  window.opsData.flowNodes = window.opsData.flowNodes || [];
  window.opsData.sources = window.opsData.sources || [];
  window.opsData.authConfigs = window.opsData.authConfigs || [
    {
      id: "auth_none",
      name: "无认证",
      category: "通用认证",
      type: "none",
      username: "",
      password: "",
      loginUrl: "",
      cookieName: "",
      tokenHeader: "",
      refreshCycle: "手动",
      status: "本地默认"
    }
  ];
  window.opsData.fieldMappings = window.opsData.fieldMappings || [];
  window.opsData.mappings = window.opsData.mappings || [];
  window.opsData.businesses = window.opsData.businesses || [];
  window.opsData.situationFilters = window.opsData.situationFilters || [
    { id: "situation_filter_severity", label: "等级", field: "等级", type: "select", source: "auto", dictionaryRef: "", options: [], defaultVisible: true, defaultValue: "" },
    { id: "situation_filter_owner", label: "归属对象", field: "归属对象", type: "select", source: "auto", dictionaryRef: "", options: [], defaultVisible: true, defaultValue: "" }
  ];
  window.opsData.situationTimeFilter = window.opsData.situationTimeFilter || {
    fields: ["event_time", "created_at", "updated_at", "time", "时间"],
    defaultRange: "24h"
  };
  window.opsData.cleaningRules = window.opsData.cleaningRules || [];
  window.opsData.dictionarySets = window.opsData.dictionarySets || [
    {
      id: "dict_product_catalog",
      name: "产品列表",
      category: "业务字典",
      description: "用于过滤条件和清洗规则引用的产品字典。",
      columns: ["产品部", "产品名", "别名列表", "版本号"],
      rows: [{ "产品部": "交易产品部", "产品名": "支付网关", "别名列表": "pay-gateway,payment-api", "版本号": "v3" }]
    }
  ];
  window.opsData.storageConfigs = window.opsData.storageConfigs || [
    {
      id: "storage_local_default",
      name: "默认本地存储",
      category: "系统默认",
      type: "local",
      database: "local-json",
      host: "当前工作目录",
      port: "",
      username: "",
      password: "",
      passwordMasked: "",
      status: "默认启用",
      readonly: true
    }
  ];
  window.opsData.currentStorageId = window.opsData.currentStorageId || window.opsData.storageConfigs.find((item) => item.active)?.id || "storage_local_default";
  window.opsData.storageMigrationLogs = window.opsData.storageMigrationLogs || [];
  window.opsData.businessFlows = window.opsData.businessFlows || [];
  window.opsData.modelConfigs = window.opsData.modelConfigs || [
    {
      id: "model_openai_compatible",
      name: "OpenAI Compatible",
      vendor: "openai-compatible",
      model: "gpt-4.1-mini",
      baseUrl: "https://api.openai.com/v1",
      apiKeyMasked: "未配置",
      status: "本地默认"
    }
  ];
  const existingModelIds = new Set(window.opsData.modelConfigs.map((config) => config.id));
  popularModelPresets.forEach((preset) => {
    if (existingModelIds.has(preset.id)) return;
    window.opsData.modelConfigs.push({
      ...preset,
      apiKey: "",
      apiKeyMasked: "未配置",
      status: "预置模板，待配置 API Key",
      updatedAt: new Date().toISOString()
    });
  });
  window.opsData.signals = window.opsData.signals || [];
  window.opsData.knowledge = window.opsData.knowledge || [];
}

const authTypeLabels = {
  "api-cookie": "Cookie",
  "db-account-password": "账号密码",
  cookie: "Cookie",
  "account-password": "账号密码",
  none: "无认证"
};

const authCategoryLabels = {
  "api-cookie": "API 认证",
  "db-account-password": "数据库认证",
  none: "通用认证"
};

const authTypeByCategory = {
  "API 认证": "api-cookie",
  "数据库认证": "db-account-password",
  "通用认证": "none"
};

const paramSourceTypeTips = {
  static: "固定入参：直接使用 Query/Header/Body 中配置的值。",
  database: "数据库查询：先查出记录，再按字段映射逐条或批量调用。",
  source: "上游数据源：用另一个数据源输出字段驱动当前调用。",
  flow: "业务流上下文：使用业务流运行时自动生成的公共变量，例如开始时间、结束时间、业务名称、批次号、租户和环境。",
  dictionary: "字典集：从自定义字典列取值，可用于产品、部门、环境等枚举入参。",
  "flow-node": "业务节点输出：从当前业务流中一个或多个上游节点取字段，适合并发分支汇聚后调用。"
};

const flowContextFields = [
  { value: "context.start_time", label: "开始时间", desc: "本次业务流时间窗口的开始时间，常用于 startTime、beginTime。" },
  { value: "context.end_time", label: "结束时间", desc: "本次业务流时间窗口的结束时间，常用于 endTime、finishTime。" },
  { value: "context.businessName", label: "业务名称", desc: "当前业务配置的名称，常用于业务标识或查询过滤。" },
  { value: "context.batchId", label: "运行批次号", desc: "本次业务流运行的批次标识，常用于链路追踪和幂等。" },
  { value: "context.tenant", label: "租户", desc: "当前业务或运行环境所属租户。" },
  { value: "context.env", label: "环境", desc: "当前运行环境，例如 prod、test、dev。" }
];

const flowNodeTypeLabels = {
  context: "上下文",
  source: "数据源",
  rule: "清洗",
  output: "输出"
};

function normalizeAuthType(type) {
  if (type === "cookie") return "api-cookie";
  if (type === "account-password") return "db-account-password";
  return type || "none";
}

function getAuthCategory(type) {
  return authCategoryLabels[normalizeAuthType(type)] || "通用认证";
}

function getAuthTypeFromCategory(category) {
  return authTypeByCategory[category] || "none";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderIcons() {
  $$("[data-icon]").forEach((node) => {
    node.innerHTML = icons[node.dataset.icon] || icons.spark;
  });
}

function setPanel(panelId) {
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.panel === panelId));
  $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === panelId));
  const active = $(`.nav-item[data-panel="${panelId}"] span:last-child`);
  $("#panelTitle").textContent = active ? active.textContent : "态势总览";
  if (panelId === "overview") {
    requestAnimationFrame(() => renderOverview());
  }
  if (panelId === "display") {
    requestAnimationFrame(() => renderBusinessTable());
  }
}

function setCleaningTab(tab) {
  if (!$("#cleaningMode")) return;
  appState.cleaningTab = tab;
  $$("#cleaningMode button").forEach((button) => button.classList.toggle("active", button.dataset.cleaningTab === tab));
  $$("[data-cleaning-section]").forEach((section) => {
    section.classList.toggle("hidden", section.dataset.cleaningSection !== tab);
  });
}

function normalizeCategory(value, fallback = "未分类") {
  return String(value || fallback).trim() || fallback;
}

function renderGroupedConfigList(selector, items, options = {}) {
  const container = $(selector);
  if (!container) return;
  const groups = new Map();
  (items || []).forEach((item) => {
    const category = normalizeCategory(options.getCategory?.(item), options.fallbackCategory || "未分类");
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(item);
  });
  container.innerHTML = [...groups.entries()]
    .map(
      ([category, groupItems], index) => `
        <details class="config-group" ${(options.isOpen?.(category, groupItems, index) ?? index === 0) ? "open" : ""}>
          <summary>
            <span>${escapeHtml(category)}</span>
            <span class="status-pill">${groupItems.length} 项</span>
          </summary>
          <div class="${escapeHtml(options.bodyClass || "config-group-body")}">
            ${options.headerHtml || ""}
            ${groupItems.map((item) => options.renderItem(item)).join("")}
          </div>
        </details>
      `
    )
    .join("");
}

function setAnalysisTab(tab) {
  if (!$("#analysisMode")) return;
  appState.analysisTab = tab;
  $$("#analysisMode button").forEach((button) => button.classList.toggle("active", button.dataset.analysisTab === tab));
  $$("[data-analysis-section]").forEach((section) => {
    section.classList.toggle("hidden", section.dataset.analysisSection !== tab);
  });
}

function formatDateTimeLocal(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function applyTimePreset(preset = $("#timePresetSelect")?.value || "24h") {
  const end = new Date();
  const start = new Date(end);
  if (preset === "7d") start.setDate(end.getDate() - 7);
  else if (preset === "30d") start.setDate(end.getDate() - 30);
  else start.setHours(end.getHours() - 24);
  if (preset !== "custom") {
    $("#timeStartInput").value = formatDateTimeLocal(start);
    $("#timeEndInput").value = formatDateTimeLocal(end);
  }
}

function getDisplayTimeRangePayload() {
  const preset = $("#timePresetSelect")?.value || "24h";
  const presetLabel = $("#timePresetSelect")?.selectedOptions?.[0]?.textContent || "最近 24 小时";
  return {
    timeRange: preset === "custom" ? `${$("#timeStartInput").value} ~ ${$("#timeEndInput").value}` : presetLabel,
    timeStart: $("#timeStartInput").value,
    timeEnd: $("#timeEndInput").value
  };
}

function getBusinessFields(business) {
  return business?.fields?.length ? business.fields : ["事件名称", "等级", "归属对象", "时间", "状态/影响"];
}

function getNestedValue(record, path = "") {
  if (!path) return undefined;
  return String(path)
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((current, part) => (current && typeof current === "object" ? current[part] : undefined), record);
}

function getBusinessFieldValue(business, row, field = "") {
  const key = String(field || "").trim();
  if (!key) return undefined;
  if (row && typeof row === "object" && !Array.isArray(row)) {
    return getNestedValue(row, key) ?? row[key];
  }
  const fields = getBusinessFields(business);
  const exactIndex = fields.findIndex((item) => item === key);
  if (exactIndex >= 0) return row?.[exactIndex];
  const aliasMap = {
    event_name: 0,
    name: 0,
    severity: 1,
    level: 1,
    owner: 2,
    service: 2,
    object: 2,
    event_time: 3,
    created_at: 3,
    updated_at: 3,
    time: 3,
    status: 4,
    impact: 4
  };
  return aliasMap[key] !== undefined ? row?.[aliasMap[key]] : undefined;
}

const semanticFieldAliases = {
  severity: ["等级", "级别", "风险等级", "level", "severity", "risk", "priority"],
  owner: ["归属对象", "对象", "服务", "应用", "owner", "service", "object", "app", "application"],
  time: ["时间", "事件时间", "event_time", "created_at", "updated_at", "occurTime", "time", "date"],
  name: ["事件名称", "名称", "name", "event", "title"],
  status: ["状态", "影响", "status", "impact", "state"]
};

function resolveBusinessFieldName(business, requestedField = "", semanticKey = "") {
  const fields = getBusinessFields(business);
  const normalized = fields.map((field) => String(field).toLowerCase());
  const candidates = [
    requestedField,
    ...(semanticKey ? semanticFieldAliases[semanticKey] || [] : []),
    ...(semanticFieldAliases[requestedField] || [])
  ].filter(Boolean);
  for (const candidate of candidates) {
    const index = normalized.indexOf(String(candidate).toLowerCase());
    if (index >= 0) return fields[index];
  }
  return "";
}

function getRowBySemanticField(business, row, candidates = [], fallback = 0) {
  const fields = getBusinessFields(business);
  const matchedField = candidates.find((candidate) => fields.some((field) => String(field).toLowerCase() === String(candidate).toLowerCase()));
  if (matchedField) return getBusinessFieldValue(business, row, matchedField);
  return row?.[Math.min(fallback, Math.max(fields.length - 1, 0))];
}

function hasBusinessFieldValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function parseOptionList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getDictionaryRefValues(ref = "") {
  const [dictionaryName, columnName] = String(ref || "").split(".");
  if (!dictionaryName || !columnName) return [];
  const dictionary = (window.opsData.dictionarySets || []).find((item) => item.name === dictionaryName || item.id === dictionaryName);
  if (!dictionary) return [];
  return [
    ...new Set(
      (dictionary.rows || [])
        .flatMap((row) => parseOptionList(row[columnName]))
        .filter(Boolean)
    )
  ];
}

function getSituationFilterOptions(filter) {
  if (filter.source === "manual") return parseOptionList(filter.options);
  if (filter.source === "dictionary") return getDictionaryRefValues(filter.dictionaryRef);
  const values = (window.opsData.businesses || []).flatMap((business) =>
    (business.rows || []).map((row) => getFilterFieldValue(business, row, filter)).filter(hasBusinessFieldValue)
  );
  return [...new Set(values.map((value) => String(value)))];
}

function getFilterFieldValue(business, row, filter = {}) {
  const resolvedField = resolveBusinessFieldName(business, filter.field);
  return getBusinessFieldValue(business, row, resolvedField || filter.field);
}

function getScopedFilterValue(scope, filter) {
  const state = scope === "display" ? appState.displayFilters : appState.overviewFilters;
  if (Object.prototype.hasOwnProperty.call(state, filter.id)) {
    return state[filter.id];
  }
  return filter.defaultValue || "";
}

function getConfiguredTimeValue(business, row) {
  const candidates = window.opsData.situationTimeFilter?.fields?.length
    ? window.opsData.situationTimeFilter.fields
    : ["event_time", "created_at", "updated_at", "time", "时间"];
  for (const field of candidates) {
    const resolvedField = resolveBusinessFieldName(business, field, "time");
    const value = getBusinessFieldValue(business, row, resolvedField || field);
    if (hasBusinessFieldValue(value)) return value;
  }
  return undefined;
}

function passesConfiguredFilters(business, row, scope = "overview") {
  const activeFilters = (window.opsData.situationFilters || []).filter((filter) => filter.defaultVisible !== false);
  const filterMatched = activeFilters.every((filter) => {
    const selected = getScopedFilterValue(scope, filter);
    const selectedValues = Array.isArray(selected) ? selected.filter(Boolean) : [selected].filter(Boolean);
    if (!selectedValues.length) return true;
    const value = getFilterFieldValue(business, row, filter);
    if (!hasBusinessFieldValue(value)) return true;
    const text = String(value);
    if (filter.type === "text") return selectedValues.some((item) => text.includes(String(item)));
    return selectedValues.includes(text);
  });
  if (!filterMatched) return false;
  const timeStart = scope === "display" ? appState.displayTimeStart : appState.overviewTimeStart;
  const timeEnd = scope === "display" ? appState.displayTimeEnd : appState.overviewTimeEnd;
  if (!timeStart && !timeEnd) return true;
  const value = getConfiguredTimeValue(business, row);
  if (!hasBusinessFieldValue(value)) return true;
  const timestamp = Date.parse(String(value).replace(" ", "T"));
  if (Number.isNaN(timestamp)) return true;
  const start = timeStart ? Date.parse(timeStart) : 0;
  const end = timeEnd ? Date.parse(timeEnd) : 0;
  return (!start || timestamp >= start) && (!end || timestamp <= end);
}

function getFilteredOverviewBusinesses() {
  return (window.opsData.businesses || []).map((business) => ({
    ...business,
    rows: (business.rows || []).filter((row) => passesConfiguredFilters(business, row, "overview"))
  }));
}

function renderTimeFieldOptions() {
  const business = getCurrentBusiness();
  const selected = $("#timeFieldSelect")?.value || business?.timeField || "event_time";
  const fields = getBusinessFields(business);
  const timeLikeFields = fields.filter((field) => /time|date|时间|日期|created|updated|occur/i.test(field));
  const options = [...new Set([business?.timeField, ...timeLikeFields, ...fields, "event_time", "created_at", "updated_at", "occurTime"].filter(Boolean))];
  $("#timeFieldSelect").innerHTML = options.map((field) => `<option value="${escapeHtml(field)}">${escapeHtml(field)}</option>`).join("");
  setSelectValue("#timeFieldSelect", options.includes(selected) ? selected : options[0]);
}

function getSelectedAnalysisBusinessNames() {
  const select = $("#analysisBusinessSelect");
  if (!select) return [];
  const values = getSelectedValues(select);
  return values.length ? values : [window.opsData.businesses[0]?.name].filter(Boolean);
}

function renderAnalysisBusinessSelect() {
  const select = $("#analysisBusinessSelect");
  if (!select) return;
  const selected = new Set(getSelectedValues(select));
  select.innerHTML = (window.opsData.businesses || [])
    .map((business, index) => {
      const isSelected = selected.size ? selected.has(business.name) : index === 0;
      return `<option value="${escapeHtml(business.name)}" ${isSelected ? "selected" : ""}>${escapeHtml(business.name)}</option>`;
    })
    .join("");
  refreshMultiSelectControl(select);
}

function renderAnalysisFieldSelect() {
  const select = $("#analysisFieldSelect");
  if (!select) return;
  const selected = new Set(getSelectedValues(select));
  const businessNames = getSelectedAnalysisBusinessNames();
  const fields = [
    ...new Set(
      (window.opsData.businesses || [])
        .filter((business) => businessNames.includes(business.name))
        .flatMap((business) => getBusinessFields(business))
    )
  ];
  select.innerHTML = fields
    .map((field, index) => {
      const isSelected = selected.size ? selected.has(field) : index < 5;
      return `<option value="${escapeHtml(field)}" ${isSelected ? "selected" : ""}>${escapeHtml(field)}</option>`;
    })
    .join("");
  refreshMultiSelectControl(select);
}

function renderModelConfigSelect() {
  const select = $("#analysisModelSelect");
  if (!select) return;
  const selected = select.value;
  const configs = window.opsData.modelConfigs || [];
  select.innerHTML = configs
    .map((config) => `<option value="${escapeHtml(config.id)}">${escapeHtml(config.name)} · ${escapeHtml(config.model || config.vendor)}</option>`)
    .join("");
  setSelectValue("#analysisModelSelect", selected || configs[0]?.id || "");
}

function renderAnalysisControls() {
  renderAnalysisBusinessSelect();
  renderAnalysisFieldSelect();
  renderModelConfigSelect();
  renderModelConfigList();
}

function getConfiguredBusinessSummary() {
  const rawFlows = window.opsData.businessFlows || [];
  const flowByBusiness = new Map();
  rawFlows.forEach((flow) => {
    const key = (flow.businessName || flow.name || flow.id || "").trim().toLowerCase();
    if (key && !flowByBusiness.has(key)) {
      flowByBusiness.set(key, flow);
    }
  });
  const flows = [...flowByBusiness.values()];
  const businesses = getFilteredOverviewBusinesses();
  const sources = window.opsData.sources || [];
  const rules = window.opsData.cleaningRules || [];
  const mappings = window.opsData.fieldMappings || [];
  const businessNames = new Set([
    ...businesses.map((item) => item.name).filter(Boolean),
    ...flows.map((flow) => flow.businessName).filter(Boolean)
  ]);
  const flowNodes = flows.flatMap((flow) => flow.nodes || []);
  const sourceIds = new Set(flowNodes.filter((node) => node.type === "source" && node.refId).map((node) => node.refId));
  flows.forEach((flow) => (flow.dataSourceIds || []).forEach((id) => sourceIds.add(id)));
  const ruleIds = new Set(flowNodes.filter((node) => node.type === "rule" && node.refId).map((node) => node.refId));
  flows.forEach((flow) => (flow.ruleIds || []).forEach((id) => ruleIds.add(id)));
  const branchKeys = new Set(flowNodes.filter((node) => node.branchFromId).map((node) => `${node.branchFromId}:${node.branchName || node.id}`));
  const businessRows = businesses.reduce((sum, business) => sum + (business.rows || []).length, 0);
  const highRiskRows = businesses.reduce(
    (sum, business) => sum + (business.rows || []).filter((row) => ["P0", "P1", "高", "严重"].includes(String(getRowBySemanticField(business, row, ["等级", "level", "severity", "risk"], 1) || "").toUpperCase())).length,
    0
  );
  const configuredSources = sourceIds.size ? sources.filter((source) => sourceIds.has(source.id)) : sources;
  const runningSources = configuredSources.filter((source) => source.health !== "pending").length;
  return {
    flows,
    businesses,
    sources,
    rules,
    mappings,
    businessNames,
    flowNodes,
    sourceIds,
    ruleIds,
    branchKeys,
    businessRows,
    highRiskRows,
    runningSources,
    configuredSourceCount: sourceIds.size || sources.length,
    configuredRuleCount: ruleIds.size || rules.length
  };
}

// The overview is derived from user configuration instead of static dashboard data,
// so every source/rule/flow edit can immediately change the operational picture.
function buildOverviewModel() {
  const summary = getConfiguredBusinessSummary();
  const cleaningScore = summary.configuredSourceCount
    ? Math.round((summary.runningSources / Math.max(summary.sources.length, 1)) * 1000) / 10
    : 0;
  const mappingCoverage = summary.configuredSourceCount
    ? Math.round((summary.mappings.length / Math.max(summary.configuredSourceCount * 2, 1)) * 100)
    : 0;
  const pendingFlowCount = summary.flows.filter((flow) => {
    const business = summary.businesses.find((item) => item.name === flow.businessName);
    return !(business?.rows || []).length;
  }).length;
  const attentionCount = summary.highRiskRows + pendingFlowCount;
  const metrics = [
    { label: "配置业务", value: String(summary.businessNames.size), delta: `${summary.flows.length} 条业务流 / ${summary.branchKeys.size} 条分支`, icon: "pipeline" },
    { label: "接入数据源", value: String(summary.configuredSourceCount), delta: `${summary.runningSources} 个运行中，${summary.mappings.length} 条字段映射`, icon: "database" },
    { label: "清洗规则", value: String(summary.configuredRuleCount), delta: `映射覆盖度约 ${Math.min(mappingCoverage, 100)}%`, icon: "spark" },
    { label: "需关注项", value: String(attentionCount), delta: `${summary.businessRows} 条业务记录参与分析`, icon: "radar" }
  ];
  const flowCards = summary.flows.length
    ? summary.flows.map((flow) => {
        const nodes = flow.nodes || [];
        const sourceCount = new Set(nodes.filter((node) => node.type === "source").map((node) => node.refId)).size || (flow.dataSourceIds || []).length;
        const branchCount = new Set(nodes.filter((node) => node.branchFromId).map((node) => `${node.branchFromId}:${node.branchName || node.id}`)).size;
        const ruleCount = new Set(nodes.filter((node) => node.type === "rule").map((node) => node.refId)).size || (flow.ruleIds || []).length;
        return {
          title: flow.businessName || flow.name,
          desc: `${sourceCount} 数据源 / ${ruleCount} 规则 / ${branchCount} 分支 / ${nodes.length || sourceCount + ruleCount} 节点`,
          icon: branchCount ? "pipeline" : sourceCount ? "database" : "cloud"
        };
      })
    : window.opsData.flowNodes || [];
  const signals = summary.flows.length
    ? summary.flows.slice(0, 5).map((flow) => {
        const business = summary.businesses.find((item) => item.name === flow.businessName);
        const rows = business?.rows || [];
        const riskRows = rows.filter((row) => ["P0", "P1", "高", "严重"].includes(String(getRowBySemanticField(business, row, ["等级", "level", "severity", "risk"], 1) || "").toUpperCase()));
        const nodes = flow.nodes || [];
        const branchCount = new Set(nodes.filter((node) => node.branchFromId).map((node) => `${node.branchFromId}:${node.branchName || node.id}`)).size;
        const pending = rows.length === 0;
        return {
          title: `${flow.businessName || flow.name} 自动分析`,
          desc: pending
            ? `尚未产生业务数据，建议执行业务流；${branchCount} 条分支，输出 ${flow.outputConfig?.businessTable || "业务表"}`
            : `${riskRows.length} 条风险记录，${branchCount} 条分支，输出 ${flow.outputConfig?.businessTable || "业务表"}`,
          icon: riskRows.length || pending ? "radar" : "brain",
          level: riskRows.length || pending ? "danger" : "ok"
        };
      })
    : window.opsData.signals || [];
  const radarValues = [
    Math.min((summary.highRiskRows || 1) / Math.max(summary.businessRows || 1, 1), 1),
    Math.min(summary.configuredSourceCount / Math.max(summary.sources.length || 1, 1), 1),
    Math.min(summary.branchKeys.size / Math.max(summary.flows.length * 2 || 1, 1), 1),
    Math.min(summary.configuredRuleCount / Math.max(summary.rules.length || 1, 1), 1),
    Math.min(summary.mappings.length / Math.max(summary.configuredSourceCount * 3 || 1, 1), 1),
    Math.min(cleaningScore / 100, 1)
  ];
  return { metrics, flowCards, signals, radarValues, highRiskCount: attentionCount };
}

function renderOverviewFilters() {
  const filters = (window.opsData.situationFilters || []).filter((filter) => filter.defaultVisible !== false);
  const timeFields = window.opsData.situationTimeFilter?.fields || [];
  const filterControls = filters.map((filter) => {
    if (filter.type === "text") {
      return `
        <label>
          <span>${escapeHtml(filter.label)}</span>
          <input data-overview-filter="${escapeHtml(filter.id)}" type="search" value="${escapeHtml(appState.overviewFilters[filter.id] || "")}" placeholder="输入关键词" />
        </label>
      `;
    }
    const options = getSituationFilterOptions(filter);
    const selected = getScopedFilterValue("overview", filter);
    return `
      <label>
        <span>${escapeHtml(filter.label)}</span>
        <select data-overview-filter="${escapeHtml(filter.id)}" ${filter.type === "multi-select" ? "multiple" : ""}>
          ${filter.type === "multi-select" ? "" : '<option value="">全部</option>'}
          ${options.map((option) => `<option value="${escapeHtml(option)}" ${Array.isArray(selected) ? selected.includes(option) ? "selected" : "" : selected === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
        </select>
      </label>
    `;
  });
  $("#overviewFilterBar").innerHTML = [
    ...filterControls,
    `
      <label>
        <span class="label-with-help">
          时间开始
          <button class="help-dot" type="button" aria-label="态势时间筛选说明" data-tooltip="时间筛选会按候选字段顺序查找，例如 ${escapeHtml(timeFields.join(", ") || "event_time,time")}；某条数据没有候选时间字段时自动跳过时间过滤。">?</button>
        </span>
        <input id="overviewTimeStartInput" type="datetime-local" value="${escapeHtml(appState.overviewTimeStart || "")}" />
      </label>
      <label>
        <span>时间结束</span>
        <input id="overviewTimeEndInput" type="datetime-local" value="${escapeHtml(appState.overviewTimeEnd || "")}" />
      </label>
      <button class="small-button" id="resetOverviewFiltersBtn" type="button">重置筛选</button>
    `
  ].join("");
  renderIcons();
}

function renderConfiguredFilterControls(containerSelector, scope = "overview", options = {}) {
  const container = $(containerSelector);
  if (!container) return;
  const filters = (window.opsData.situationFilters || []).filter((filter) => filter.defaultVisible !== false);
  const timeFields = window.opsData.situationTimeFilter?.fields || [];
  const renderKey = JSON.stringify({
    scope,
    filters: filters.map((filter) => ({
      id: filter.id,
      label: filter.label,
      field: filter.field,
      type: filter.type,
      source: filter.source,
      dictionaryRef: filter.dictionaryRef,
      options: filter.options
    })),
    timeFields
  });
  if (!options.force && appState.filterControlRenderKeys[containerSelector] === renderKey) return;
  appState.filterControlRenderKeys[containerSelector] = renderKey;
  const filterControls = filters.map((filter) => {
    const selected = getScopedFilterValue(scope, filter);
    if (filter.type === "text") {
      return `
        <label>
          <span>${escapeHtml(filter.label)}</span>
          <input data-${scope}-configured-filter="${escapeHtml(filter.id)}" type="search" value="${escapeHtml(String(selected || ""))}" placeholder="输入关键词" />
        </label>
      `;
    }
    const options = getSituationFilterOptions(filter);
    return `
      <label>
        <span>${escapeHtml(filter.label)}</span>
        <select data-${scope}-configured-filter="${escapeHtml(filter.id)}" ${filter.type === "multi-select" ? "multiple" : ""}>
          ${filter.type === "multi-select" ? "" : '<option value="">全部</option>'}
          ${options.map((option) => `<option value="${escapeHtml(option)}" ${Array.isArray(selected) ? selected.includes(option) ? "selected" : "" : selected === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
        </select>
      </label>
    `;
  });
  const timeStart = scope === "display" ? appState.displayTimeStart : appState.overviewTimeStart;
  const timeEnd = scope === "display" ? appState.displayTimeEnd : appState.overviewTimeEnd;
  container.innerHTML = [
    ...filterControls,
    `
      <label>
        <span class="label-with-help">
          时间开始
          <button class="help-dot" type="button" aria-label="筛选时间说明" data-tooltip="按配置的候选时间字段顺序查找：${escapeHtml(timeFields.join(", ") || "event_time,time")}；业务没有这些字段时不参与时间过滤。">?</button>
        </span>
        <input id="${scope}ConfiguredTimeStartInput" type="datetime-local" value="${escapeHtml(timeStart || "")}" />
      </label>
      <label>
        <span>时间结束</span>
        <input id="${scope}ConfiguredTimeEndInput" type="datetime-local" value="${escapeHtml(timeEnd || "")}" />
      </label>
      <button class="small-button" data-${scope}-filter-reset type="button">重置筛选</button>
    `
  ].join("");
  renderIcons();
}

function resetSituationFilterForm() {
  appState.editingSituationFilterId = "";
  $("#situationFilterLabelInput").value = "环境";
  $("#situationFilterFieldInput").value = "env";
  setSelectValue("#situationFilterTypeSelect", "select");
  setSelectValue("#situationFilterSourceSelect", "auto");
  $("#situationFilterDictionaryInput").value = "";
  $("#situationFilterDefaultInput").value = "";
  $("#situationFilterOptionsInput").value = "";
  setSelectValue("#situationFilterVisibleSelect", "true");
  $("#situationTimeFieldsInput").value = (window.opsData.situationTimeFilter?.fields || ["event_time", "created_at", "updated_at", "time", "时间"]).join(",");
  $("#saveSituationFilterBtn").textContent = "保存筛选项";
  updateSituationFilterSourceVisibility();
}

function populateSituationFilterForm(filter) {
  if (!filter) return;
  appState.editingSituationFilterId = filter.id;
  $("#situationFilterLabelInput").value = filter.label || "";
  $("#situationFilterFieldInput").value = filter.field || "";
  setSelectValue("#situationFilterTypeSelect", filter.type || "select");
  setSelectValue("#situationFilterSourceSelect", filter.source || "auto");
  $("#situationFilterDictionaryInput").value = filter.dictionaryRef || "";
  $("#situationFilterDefaultInput").value = filter.defaultValue || "";
  $("#situationFilterOptionsInput").value = (filter.options || []).join("\n");
  setSelectValue("#situationFilterVisibleSelect", filter.defaultVisible === false ? "false" : "true");
  $("#situationTimeFieldsInput").value = (window.opsData.situationTimeFilter?.fields || []).join(",");
  $("#saveSituationFilterBtn").textContent = "保存修改";
  updateSituationFilterSourceVisibility();
}

function updateSituationFilterSourceVisibility() {
  const source = $("#situationFilterSourceSelect")?.value || "auto";
  $$("[data-situation-source-field]").forEach((field) => {
    field.classList.toggle("hidden", field.dataset.situationSourceField !== source);
  });
}

function collectSituationFilterForm() {
  return {
    label: $("#situationFilterLabelInput").value.trim() || "自定义筛选",
    field: $("#situationFilterFieldInput").value.trim(),
    type: $("#situationFilterTypeSelect").value,
    source: $("#situationFilterSourceSelect").value,
    dictionaryRef: $("#situationFilterDictionaryInput").value.trim(),
    defaultValue: $("#situationFilterDefaultInput").value.trim(),
    options: parseOptionList($("#situationFilterOptionsInput").value),
    defaultVisible: $("#situationFilterVisibleSelect").value === "true",
    timeFields: parseOptionList($("#situationTimeFieldsInput").value)
  };
}

function renderSituationFilterList() {
  const filters = window.opsData.situationFilters || [];
  $("#situationFilterList").innerHTML = filters.length
    ? filters
        .map((filter) => `
          <div class="support-list-item ${filter.id === appState.editingSituationFilterId ? "selected" : ""}">
            <div>
              <strong>${escapeHtml(filter.label)}</strong>
              <small>${escapeHtml(filter.field || "-")} · ${escapeHtml(filter.type || "select")} · ${filter.defaultVisible === false ? "隐藏" : "展示"}</small>
            </div>
            <div class="row-actions">
              <button class="small-button" type="button" data-situation-filter-action="edit" data-situation-filter-id="${escapeHtml(filter.id)}">编辑</button>
              <button class="small-button danger" type="button" data-situation-filter-action="delete" data-situation-filter-id="${escapeHtml(filter.id)}">删除</button>
            </div>
          </div>
        `)
        .join("")
    : '<div class="support-list-item"><div><strong>暂无筛选项</strong><small>新增后会显示在态势总览筛选区。</small></div></div>';
}

async function saveSituationFilter() {
  const payload = collectSituationFilterForm();
  if (!payload.field) return;
  const editingId = appState.editingSituationFilterId;
  try {
    const saved = await apiRequest(editingId ? `/api/situation-filters/${encodeURIComponent(editingId)}` : "/api/situation-filters", {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    await apiRequest("/api/situation-time-filter", {
      method: "PUT",
      body: JSON.stringify({ fields: payload.timeFields })
    });
    window.opsData.situationFilters = editingId
      ? (window.opsData.situationFilters || []).map((item) => (item.id === saved.id ? saved : item))
      : [saved, ...(window.opsData.situationFilters || [])];
  } catch {
    const local = { id: editingId || `situation_filter_${Date.now()}`, ...payload };
    window.opsData.situationFilters = editingId
      ? (window.opsData.situationFilters || []).map((item) => (item.id === editingId ? local : item))
      : [local, ...(window.opsData.situationFilters || [])];
  }
  window.opsData.situationTimeFilter = { ...(window.opsData.situationTimeFilter || {}), fields: payload.timeFields };
  resetSituationFilterForm();
  renderSituationFilterList();
  renderOverview();
}

function renderMetrics() {
  const metrics = buildOverviewModel().metrics;
  $("#metricGrid").innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric-card">
          <div class="metric-top">
            <span>${metric.label}</span>
            <span class="icon" data-icon="${metric.icon}"></span>
          </div>
          <div class="value">${metric.value}</div>
          <div class="delta">${metric.delta}</div>
        </article>
      `
    )
    .join("");
}

function renderFlow() {
  const flowCards = buildOverviewModel().flowCards;
  $("#flowBoard").innerHTML = flowCards
    .map(
      (node) => `
        <div class="flow-node">
          <span class="icon" data-icon="${node.icon}"></span>
          <strong>${node.title}</strong>
          <small>${node.desc}</small>
        </div>
      `
    )
    .join("");
}

function renderSources() {
  renderGroupedConfigList("#sourceStack", window.opsData.sources, {
    bodyClass: "source-group-body",
    getCategory: (source) => source.category || (source.kind === "database" ? "数据库" : source.kind === "file" ? "本地文件" : "API"),
    isOpen: (_category, groupItems, index) => groupItems.some((source) => source.id === appState.selectedSourceId) || (!appState.selectedSourceId && index === 0),
    renderItem: (source) => `
        <div class="source-card ${source.id === appState.selectedSourceId ? "selected" : ""}" data-source-id="${escapeHtml(source.id || "")}" role="button" tabindex="0">
          <span class="icon" data-icon="${source.icon}"></span>
          <div>
            <strong>${escapeHtml(source.name)}</strong>
            <small>${escapeHtml(source.type)} · ${escapeHtml(source.status)}</small>
          </div>
          <span class="status-pill ${source.health === "pending" ? "" : "ok"}">${source.health === "pending" ? "待配置" : "运行中"}</span>
          <span class="row-actions source-card-actions">
            <button class="small-button" data-source-action="preview" data-source-id="${escapeHtml(source.id || "")}" type="button">预览</button>
            <button class="small-button" data-source-action="edit" data-source-id="${escapeHtml(source.id || "")}" type="button">编辑</button>
            <button class="small-button danger" data-source-action="delete" data-source-id="${escapeHtml(source.id || "")}" type="button">删除</button>
          </span>
        </div>
      `
  });
}

function renderAuthConfigs() {
  const groups = [
    ["API 认证", ["api-cookie"]],
    ["数据库认证", ["db-account-password"]],
    ["通用认证", ["none"]]
  ];
  const options = groups
    .map(([label, types]) => {
      const items = (window.opsData.authConfigs || []).filter((auth) => types.includes(normalizeAuthType(auth.type)));
      if (!items.length) return "";
      return `<optgroup label="${label}">${items
        .map((auth) => `<option value="${escapeHtml(auth.id)}">${escapeHtml(auth.name)} · ${escapeHtml(authTypeLabels[normalizeAuthType(auth.type)] || auth.type)}</option>`)
        .join("")}</optgroup>`;
    })
    .join("");
  $("#sourceAuthConfigSelect").innerHTML = options;
  if (appState.selectedSourceId) {
    const source = getSelectedSource();
    setSelectValue("#sourceAuthConfigSelect", source?.authConfigId || "auth_none");
  }
  renderGroupedConfigList("#authConfigList", window.opsData.authConfigs || [], {
    bodyClass: "support-group-body",
    getCategory: (auth) => auth.category || getAuthCategory(auth.type),
    renderItem: (auth) => `
        <div class="support-list-item ${auth.id === appState.selectedAuthId ? "selected" : ""}" data-auth-id="${escapeHtml(auth.id)}">
          <div>
            <strong>${escapeHtml(auth.name)}</strong>
            <small>${escapeHtml(authTypeLabels[normalizeAuthType(auth.type)] || auth.type)}${auth.cookieName ? ` · ${escapeHtml(auth.cookieName)}` : ""}</small>
          </div>
          <div class="row-actions">
            <button class="small-button" data-auth-action="edit" data-auth-id="${escapeHtml(auth.id)}">编辑</button>
            <button class="small-button danger" data-auth-action="delete" data-auth-id="${escapeHtml(auth.id)}" ${auth.id === "auth_none" ? "disabled" : ""}>删除</button>
          </div>
        </div>
      `
  });
}

function renderMappingSourceSelect() {
  $("#mappingSourceSelect").innerHTML = (window.opsData.sources || [])
    .map((source) => `<option value="${escapeHtml(source.id)}">${escapeHtml(source.name)} · ${escapeHtml(source.type)}</option>`)
    .join("");
  if (appState.selectedSourceId) {
    setSelectValue("#mappingSourceSelect", appState.selectedSourceId);
  }
  const source = getSelectedSource();
  $("#mappingResponsePathInput").value = source?.responsePath || "data.items";
  setSelectValue("#responseKeepModeSelect", source?.responseConfig?.keepMode || source?.responseKeepMode || "all");
  $("#responseFilterInput").value = source?.responseConfig?.filterCondition || source?.responseFilter || "";
  setSelectValue("#responseFieldKeepModeSelect", source?.responseConfig?.fieldKeepMode || "all");
  appState.responseValueFilters = Array.isArray(source?.responseConfig?.valueFilters) ? source.responseConfig.valueFilters : [];
  renderResponseKeepFieldOptions(source?.responseConfig?.keepFields || []);
  updateResponseKeepFieldsState();
  setSelectValue("#responsePersistModeSelect", source?.responseConfig?.persistMode || "none");
  $("#responseTargetTableInput").value = source?.responseConfig?.targetTable || "";
  updateResponsePersistState();
}

function getParamSourceOptions(sourceType = $("#paramSourceTypeSelect")?.value || "static") {
  if (sourceType === "dictionary") {
    return (window.opsData.dictionarySets || []).map((dictionary) => ({
      value: `dict:${dictionary.id}`,
      label: `${dictionary.name} · 字典集`
    }));
  }
  if (sourceType === "flow-node") {
    return (appState.flowNodes || [])
      .filter((node) => node.type !== "output")
      .map((node, index) => ({
        value: `node:${node.id}`,
        label: `${index + 1}. ${node.name || getFlowRefLabel(node.type, node.refId)} · 节点输出`
      }));
  }
  if (sourceType === "database") {
    return (window.opsData.sources || [])
      .filter((source) => source.id !== appState.selectedSourceId && source.kind === "database")
      .map((source) => ({ value: `source:${source.id}`, label: `${source.name} · 数据库` }));
  }
  if (sourceType === "source") {
    return (window.opsData.sources || [])
      .filter((source) => source.id !== appState.selectedSourceId)
      .map((source) => ({ value: `source:${source.id}`, label: `${source.name} · ${source.kind}` }));
  }
  return [];
}

function renderParamSourceSelect(selectedIds = []) {
  const sourceType = $("#paramSourceTypeSelect")?.value || "static";
  const options = getParamSourceOptions(sourceType);
  const optionValues = new Set(options.map((option) => option.value));
  const normalizedSelected = (Array.isArray(selectedIds) ? selectedIds : [selectedIds])
    .filter(Boolean)
    .map((value) => (String(value).includes(":") ? String(value) : `source:${value}`))
    .filter((value) => optionValues.has(value));
  if (!normalizedSelected.length && options.length && sourceType !== "static" && sourceType !== "flow") {
    normalizedSelected.push(options[0].value);
  }
  $("#paramSourceSelect").innerHTML = [
    ...(options.length ? [] : ['<option value="">不依赖外部来源</option>']),
    ...options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
  ].join("");
  setSelectValues("#paramSourceSelect", normalizedSelected);
}

function stripParamSourceValue(value = "") {
  return String(value || "").replace(/^(source|dict|node):/, "");
}

function getSourceFieldCandidates(sourceRef) {
  const sourceId = stripParamSourceValue(sourceRef);
  const source = (window.opsData.sources || []).find((item) => item.id === sourceId);
  const mappingFields = (window.opsData.fieldMappings || [])
    .filter((mapping) => mapping.sourceId === sourceId)
    .flatMap((mapping) => [mapping.sourceField, mapping.targetField])
    .filter(Boolean);
  if (mappingFields.length) return [...new Set(mappingFields)];
  if (source?.kind === "database") return ["service_id", "service_name", "owner", "env", "labels.tier", "updated_at"];
  if (source?.kind === "file") return ["check_item", "service", "result", "duration", "checked_at"];
  return ["alarmName", "level", "occurTime", "duration", "service.id", "service.owner", "extra.queue.lag"];
}

function getDictionaryFieldCandidates(dictionaryRef) {
  const dictionaryId = stripParamSourceValue(dictionaryRef);
  const dictionary = getDictionarySetById(dictionaryId);
  return dictionary?.columns?.length ? dictionary.columns.map((column) => `${dictionary.name}.${column}`) : [];
}

function getFlowNodeFieldCandidates(nodeRef) {
  const nodeId = stripParamSourceValue(nodeRef);
  const node = (appState.flowNodes || []).find((item) => item.id === nodeId);
  if (!node) return [];
  if (node.type === "context") {
    return flowContextFields.map((field) => field.value);
  }
  if (node.type === "source") {
    const nodeLabel = (node.name || getFlowRefLabel(node.type, node.refId) || "source").replace(/\s+/g, "_");
    return getSourceFieldCandidates(`source:${node.refId}`).map((field) => `${nodeLabel}.${field}`);
  }
  if (node.type === "rule") {
    const nodeLabel = (node.name || getFlowRefLabel(node.type, node.refId) || "rule").replace(/\s+/g, "_");
    return ["input", "output", "status"].map((field) => `${nodeLabel}.${field}`);
  }
  return [];
}

function getParamFieldCandidates() {
  const sourceType = $("#paramSourceTypeSelect")?.value || "static";
  if (sourceType === "flow") {
    return flowContextFields.map((field) => field.value);
  }
  if (sourceType === "static") {
    return ["start_time", "end_time", "severity", "owner", "env"];
  }
  const selectedSources = getSelectedValues($("#paramSourceSelect"));
  if (sourceType === "dictionary") {
    return selectedSources.flatMap((source) => getDictionaryFieldCandidates(source));
  }
  if (sourceType === "flow-node") {
    return selectedSources.flatMap((source) => getFlowNodeFieldCandidates(source));
  }
  return selectedSources.flatMap((source) => getSourceFieldCandidates(source));
}

function getParamFieldLabel(field) {
  const contextField = flowContextFields.find((item) => item.value === field);
  return contextField ? `${contextField.value} · ${contextField.label}` : field;
}

function renderFlowContextGuide() {
  const guide = $("#flowContextGuide");
  const list = $("#flowContextTokenList");
  if (!guide || !list) return;
  list.innerHTML = flowContextFields
    .map(
      (field) => `
        <span class="context-token" title="${escapeHtml(field.desc)}">
          <code>${escapeHtml(field.value)}</code>
          <small>${escapeHtml(field.label)}</small>
        </span>
      `
    )
    .join("");
}

function renderParamFieldSelect(selectedFields = []) {
  const fields = getParamFieldCandidates();
  const selected = new Set(selectedFields.filter((field) => fields.includes(field)));
  $("#paramFieldSelect").innerHTML = fields
    .map((field, index) => {
      const checked = selected.size ? selected.has(field) : index < Math.min(fields.length, 3);
      return `<option value="${escapeHtml(field)}" ${checked ? "selected" : ""}>${escapeHtml(getParamFieldLabel(field))}</option>`;
    })
    .join("");
  refreshMultiSelectControl($("#paramFieldSelect"));
}

function setFieldVisible(selector, visible) {
  const element = $(selector);
  const label = element?.closest("label");
  if (label) label.classList.toggle("hidden", !visible);
}

function setFieldHelp(selector, text) {
  const element = $(selector);
  const label = element?.closest("label");
  if (!label) return;
  label.querySelector(".field-help.generated-help")?.remove();
  let help = label.querySelector(".help-dot.generated-help-dot") || label.querySelector(".label-with-help .help-dot");
  if (!text) {
    help?.remove();
    return;
  }
  if (!help) {
    help = document.createElement("button");
    help.type = "button";
    help.className = "help-dot generated-help-dot";
    help.textContent = "?";
    const title = label.querySelector("span");
    if (title) title.append(help);
    else label.prepend(help);
  }
  help.setAttribute("aria-label", text);
  help.dataset.tooltip = text;
}

function updateSourceModalVisibility() {
  const kind = $("#sourceKindSelect")?.value || "api";
  const method = ($("#apiMethodSelect")?.value || "GET").toUpperCase();
  const paramSourceType = $("#paramSourceTypeSelect")?.value || "static";
  const keepMode = $("#responseKeepModeSelect")?.value || "all";
  const fieldKeepMode = $("#responseFieldKeepModeSelect")?.value || "all";
  const persistMode = $("#responsePersistModeSelect")?.value || "none";
  const isApi = kind === "api";
  const isDatabase = kind === "database";
  const supportsBody = isApi && !["GET", "DELETE", "HEAD"].includes(method);
  const sourceTypeInput = $("#sourceTypeInput");
  const sourceTypeLabel = sourceTypeInput?.closest("label")?.querySelector("span");
  if (sourceTypeLabel) {
    sourceTypeLabel.textContent = isApi ? "API 地址" : isDatabase ? "数据库表名 / SQL 标识" : "本地文件路径";
  }
  if (sourceTypeInput) {
    sourceTypeInput.placeholder = isApi ? "如 https://example.com/api/list" : isDatabase ? "如 asset_service_relation 或 select ..." : "如 D:/ops/report.xlsx";
  }
  setFieldVisible("#apiMethodSelect", isApi);
  setFieldVisible("#paginationInput", isApi);
  setFieldVisible("#queryParamsInput", isApi);
  setFieldVisible("#headerParamsInput", isApi);
  setFieldVisible("#bodyParamsInput", supportsBody);
  setFieldVisible("#paramSourceTypeSelect", isApi);
  setFieldVisible("#paramSourceSelect", isApi && !["static", "flow"].includes(paramSourceType));
  setFieldVisible("#paramFieldSelect", isApi && paramSourceType !== "static");
  setFieldVisible("#paramMappingInput", isApi && !["static"].includes(paramSourceType));
  setFieldVisible("#paramPlaceholderInput", isApi);
  setFieldVisible("#autoParamMappingBtn", isApi);
  setFieldVisible("#paramQueryInput", isApi ? paramSourceType !== "static" : isDatabase);
  setFieldVisible("#paramFilterInput", isApi && !["static"].includes(paramSourceType));
  $("#flowContextGuide")?.classList.toggle("hidden", !(isApi && paramSourceType === "flow"));
  setFieldVisible("#responseFilterInput", keepMode === "filter");
  setFieldVisible("#responseKeepFieldsSelect", fieldKeepMode !== "all");
  setFieldVisible("#configureValueFiltersBtn", fieldKeepMode === "value-filter");
  setFieldVisible("#responseTargetTableInput", persistMode !== "none");
  setFieldHelp("#sourceAuthConfigSelect", getSourceAuthConfig() ? `${authTypeLabels[normalizeAuthType(getSourceAuthConfig().type)] || "认证配置"}，保存时只记录认证名称引用。` : "未选择认证时将按无认证处理。");
  setFieldHelp("#responsePathInput", isApi ? "填写记录数组所在路径，如 data.items；如果接口只返回单对象，可填写对象路径或留空。" : isDatabase ? "数据库默认使用 rows；如返回结构不同，可填写实际记录路径。" : "表格文件默认使用 sheets[0].rows，可按解析结果调整。");
}

function updateRequestParamVisibility() {
  const method = ($("#apiMethodSelect")?.value || "GET").toUpperCase();
  const isApi = ($("#sourceKindSelect")?.value || "api") === "api";
  const supportsBody = !["GET", "DELETE", "HEAD"].includes(method);
  $$("[data-request-param]").forEach((item) => {
    const param = item.dataset.requestParam;
    item.classList.toggle("hidden", !isApi || (param === "body" && !supportsBody));
  });
  updateSourceModalVisibility();
}

function updateParamSourceTypeHelp() {
  const value = $("#paramSourceTypeSelect")?.value || "static";
  if ($("#paramSourceTypeHelp")) {
    $("#paramSourceTypeHelp").textContent = paramSourceTypeTips[value] || paramSourceTypeTips.static;
  }
  $("#flowContextGuide")?.classList.toggle("hidden", value !== "flow");
  renderFlowContextGuide();
  const queryLabel = $("#paramQueryInput")?.closest("label")?.querySelector("span");
  const sourceLabel = $("#paramSourceSelect")?.closest("label")?.querySelector("span");
  const filter = $("#paramFilterInput");
  if (sourceLabel) {
    sourceLabel.textContent =
      value === "database"
        ? "来源数据库"
        : value === "source"
          ? "上游数据源"
          : value === "dictionary"
            ? "字典集"
            : value === "flow-node"
              ? "业务节点输出"
              : "来源对象";
  }
  if (queryLabel) {
    queryLabel.textContent =
      value === "database"
        ? "来源 SQL"
        : value === "flow"
          ? "上下文使用说明"
          : value === "source"
            ? "上游过滤条件"
            : value === "dictionary"
              ? "字典过滤条件"
              : value === "flow-node"
                ? "节点输出过滤条件"
                : "固定条件";
  }
  if (filter) {
    filter.placeholder =
      value === "database"
        ? "如 env == prod，SQL 可自动建议 where 条件"
        : value === "flow"
          ? "如 context.env == prod。常用字段：context.start_time、context.end_time、context.businessName"
          : value === "source"
            ? "如 level == P0 或 service.owner != ''"
            : value === "dictionary"
              ? "如 产品部 == 交易产品部，为空表示使用全部字典值"
              : value === "flow-node"
                ? "如 节点名.level == P0，多个节点字段会带节点名前缀"
                : "固定入参通常无需过滤";
  }
  renderParamSourceSelect(getSelectedValues($("#paramSourceSelect")));
  $("#paramSourceSelect").disabled = value === "static" || value === "flow";
  refreshMultiSelectControl($("#paramSourceSelect"));
  renderParamFieldSelect(getSelectedValues($("#paramFieldSelect")));
  updateSourceModalVisibility();
}

function autoGenerateParamMapping() {
  const fields = getSelectedValues($("#paramFieldSelect"));
  const effectiveFields = fields.length ? fields : getParamFieldCandidates().slice(0, 3);
  const method = ($("#apiMethodSelect")?.value || "GET").toUpperCase();
  const sourceType = $("#paramSourceTypeSelect").value;
  const targetScope = ["GET", "DELETE", "HEAD"].includes(method) ? "query" : "body";
  const mappings = effectiveFields.map((field) => ({
    from: field,
    to: `${targetScope}.${field.replace(/^context\./, "").replace(/[^a-zA-Z0-9_]/g, "_")}`
  }));
  $("#paramMappingInput").value = JSON.stringify(mappings, null, 2);
  const placeholders = effectiveFields
    .filter((field) => /^context\.|start|end|time|env|tenant|产品|product/i.test(field))
    .map((field) => ({
      name: field.replace(/^context\./, "").replace(/[^a-zA-Z0-9_]/g, "_"),
      source: sourceType === "dictionary" ? "dictionary" : field.startsWith("context.") ? "mapping" : "custom",
      from: sourceType === "dictionary" || field.startsWith("context.") ? field : "",
      value: sourceType === "dictionary" || field.startsWith("context.") ? "" : field
    }));
  $("#paramPlaceholderInput").value = formatOptionalJsonArray(placeholders);
  syncPlaceholderTextareaHint();
  const filter = $("#paramFilterInput").value.trim();
  if (sourceType === "database") {
    const selected = effectiveFields.length ? effectiveFields.join(", ") : "service_id, owner, env";
    $("#paramQueryInput").value = `select ${selected} from upstream_table${filter ? ` where ${filter}` : " where env = 'prod'"}`;
  } else if (sourceType === "source") {
    $("#paramQueryInput").value = filter || (effectiveFields.includes("level") ? "level == 'P0' || level == 'P1'" : "保留上游输出记录");
  } else if (sourceType === "flow") {
    $("#paramQueryInput").value = filter || "可勾选 context.start_time、context.end_time 等字段，然后生成入参映射；这些值由业务流运行时自动提供。";
  } else if (sourceType === "dictionary") {
    $("#paramQueryInput").value = filter || "使用所选字典集字段作为入参，可在过滤条件中限定字典行";
  } else if (sourceType === "flow-node") {
    $("#paramQueryInput").value = filter || "等待所选业务节点完成后，从节点输出字段组装当前数据源入参";
  }
}

function renderResponseFieldOptions(fields = appState.lastSourceTest?.fields || []) {
  const uniqueFields = [...new Set(fields.filter(Boolean))];
  $("#responseFieldSelect").innerHTML = [
    '<option value="">选择测试响应字段</option>',
    ...uniqueFields.map((field) => `<option value="${escapeHtml(field)}">${escapeHtml(field)}</option>`)
  ].join("");
}

function renderResponseKeepFieldOptions(selectedFields = []) {
  const fields = appState.lastSourceTest?.recordFields?.length ? appState.lastSourceTest.recordFields : appState.lastSourceTest?.fields || selectedFields;
  const uniqueFields = [...new Set((fields || []).filter(Boolean))];
  const selected = new Set(selectedFields);
  $("#responseKeepFieldsSelect").innerHTML = uniqueFields
    .map((field) => `<option value="${escapeHtml(field)}" ${selected.has(field) ? "selected" : ""}>${escapeHtml(field)}</option>`)
    .join("");
  refreshMultiSelectControl($("#responseKeepFieldsSelect"));
}

function updateResponseKeepFieldsState() {
  const mode = $("#responseFieldKeepModeSelect")?.value || "all";
  const selectedOnly = mode === "selected" || mode === "value-filter";
  $("#responseKeepFieldsSelect").disabled = !selectedOnly;
  $("#configureValueFiltersBtn").disabled = mode !== "value-filter";
  refreshMultiSelectControl($("#responseKeepFieldsSelect"));
  updateSourceModalVisibility();
}

function suggestSourceTableName(prefix = "raw") {
  const source = getSelectedSource();
  const base = (source?.name || $("#sourceNameInput")?.value || "data_source")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return `${prefix}_${base || "data_source"}`;
}

function updateResponsePersistState() {
  const mode = $("#responsePersistModeSelect")?.value || "none";
  const tableInput = $("#responseTargetTableInput");
  if (!tableInput) return;
  tableInput.disabled = mode === "none";
  if (mode === "none") {
    tableInput.value = "";
  } else if (!tableInput.value.trim()) {
    tableInput.value = suggestSourceTableName(mode === "clean-table" ? "clean" : "raw");
  }
  updateSourceModalVisibility();
}

function formatJsonPreview(value, maxLength = 12000) {
  const text = JSON.stringify(value, null, 2) ?? "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n... 已截断预览 ${text.length - maxLength} 个字符，避免页面卡顿`;
}

function renderSourceTestResult(result) {
  if (!result) {
    $("#sourceTestResult").innerHTML = '<div class="module-status">配置入参后点击“测试联通”，这里会显示返回状态、响应字段和响应体。</div>';
    renderResponseFieldOptions([]);
    return;
  }
  const displayFields = result.recordFields?.length ? result.recordFields : result.fields;
  const uniqueFields = [...new Set((displayFields || []).filter(Boolean))];
  const previewFields = uniqueFields.slice(0, 300);
  $("#sourceTestResult").innerHTML = `
    <div class="test-summary">
      <span class="status-pill ${result.ok === false ? "danger" : "ok"}">HTTP ${escapeHtml(result.status)}</span>
      <span class="status-pill ${result.sourceMode === "real" ? "ok" : ""}">${result.sourceMode === "real" ? "真实请求" : "模拟响应"}</span>
      <span>${escapeHtml(result.durationMs)} ms</span>
      <span>${escapeHtml(result.testedAt)}</span>
      <span>${escapeHtml(uniqueFields.length)} 个可选字段</span>
      <span>${escapeHtml(result.recordCount ?? 0)} 条样本记录</span>
      <span>${escapeHtml(result.filteredRecordCount ?? result.recordCount ?? 0)} 条过滤后记录</span>
      <span>${escapeHtml(result.request?.keepMode === "filter" ? "按条件过滤" : "全部保留")}</span>
      <span>${escapeHtml(result.request?.fieldKeepMode === "value-filter" ? `值过滤 ${result.request?.valueFilters?.filter((filter) => filter.enabled)?.length || 0} 项` : result.request?.fieldKeepMode === "selected" ? `保留 ${result.request?.keepFields?.length || 0} 个字段` : "保留全部字段")}</span>
      <span>${escapeHtml(result.request?.persistMode === "none" ? "不单独存储" : `存储到 ${result.request?.targetTable || "-"}`)}</span>
      ${result.error ? `<span class="status-pill danger">${escapeHtml(result.error)}</span>` : ""}
    </div>
    <div class="field-chip-list">
      ${previewFields.map((field) => `<button class="field-chip" data-response-field="${escapeHtml(field)}">${escapeHtml(field)}</button>`).join("")}
      ${uniqueFields.length > previewFields.length ? `<span class="status-pill">另有 ${uniqueFields.length - previewFields.length} 个字段未展开</span>` : ""}
    </div>
    ${result.selectedRecords?.length ? `<div class="module-status">过滤/字段保留后的样本</div><pre class="response-preview">${escapeHtml(formatJsonPreview(result.selectedRecords, 8000))}</pre>` : ""}
    ${result.mappedRecords?.length ? `<div class="module-status">字段映射与清洗后的样本</div><pre class="response-preview">${escapeHtml(formatJsonPreview(result.mappedRecords, 8000))}</pre>` : ""}
    <div class="module-status">原始响应体</div>
    <pre class="response-preview">${escapeHtml(formatJsonPreview(result.responseBody))}</pre>
  `;
  renderResponseFieldOptions(uniqueFields);
  renderResponseKeepFieldOptions(getSelectedValues($("#responseKeepFieldsSelect")));
  updateResponseKeepFieldsState();
}

function getSelectedAuthConfig() {
  return (window.opsData.authConfigs || []).find((auth) => auth.id === appState.selectedAuthId) || window.opsData.authConfigs?.[0];
}

function setAuthCategoryValue(value) {
  const category = value || "API 认证";
  const select = $("#authCategoryInput");
  if (!select) return;
  if (![...select.options].some((option) => option.value === category)) {
    select.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`);
  }
  select.value = category;
}

function syncAuthFormByCategory() {
  const category = $("#authCategoryInput")?.value || "API 认证";
  const type = getAuthTypeFromCategory(category);
  setSelectValue("#authConfigTypeSelect", type);
  $("#authConfigTypeSelect").disabled = true;
  $$("[data-auth-field]").forEach((field) => {
    const name = field.dataset.authField;
    const visible =
      (type === "api-cookie" && ["cookie", "secret"].includes(name)) ||
      (type === "db-account-password" && ["username", "secret"].includes(name));
    field.classList.toggle("hidden", !visible);
  });
  if ($("#authSecretLabel")) {
    $("#authSecretLabel").textContent = type === "db-account-password" ? "密码" : "Cookie 值";
  }
  if (type === "none") {
    $("#authUsernameInput").value = "";
    $("#authCookieNameInput").value = "";
    $("#authPasswordInput").value = "";
  }
}

function populateAuthForm(auth = getSelectedAuthConfig()) {
  if (!auth) return;
  appState.selectedAuthId = auth.id;
  appState.editingAuthId = auth.id;
  $("#authNameInput").value = auth.name || "";
  setAuthCategoryValue(auth.category || getAuthCategory(auth.type));
  setSelectValue("#authConfigTypeSelect", normalizeAuthType(auth.type));
  $("#authUsernameInput").value = auth.username || "";
  $("#authCookieNameInput").value = auth.cookieName || "";
  $("#authPasswordInput").value = auth.cookieValue || auth.password || "";
  syncAuthFormByCategory();
  renderAuthConfigs();
}

function resetAuthForm() {
  appState.editingAuthId = "";
  $("#authModalTitle").textContent = "新增认证";
  $("#authNameInput").value = "自定义 Cookie 认证";
  setAuthCategoryValue("API 认证");
  setSelectValue("#authConfigTypeSelect", "api-cookie");
  $("#authUsernameInput").value = "";
  $("#authCookieNameInput").value = "OPS_SESSION";
  $("#authPasswordInput").value = "";
  syncAuthFormByCategory();
}

function collectAuthForm() {
  const type = getAuthTypeFromCategory($("#authCategoryInput").value);
  const secret = $("#authPasswordInput").value;
  return {
    name: $("#authNameInput").value.trim() || "自定义认证配置",
    category: $("#authCategoryInput").value.trim() || "认证配置",
    type,
    username: type === "db-account-password" ? $("#authUsernameInput").value.trim() : "",
    password: type === "db-account-password" ? secret : "",
    cookieValue: type === "api-cookie" ? secret : "",
    loginUrl: "",
    cookieName: type === "api-cookie" ? $("#authCookieNameInput").value.trim() : "",
    tokenHeader: "",
    refreshCycle: "手动"
  };
}

function getSourceAuthConfig() {
  return (window.opsData.authConfigs || []).find((auth) => auth.id === $("#sourceAuthConfigSelect").value);
}

function getSelectedSource() {
  return window.opsData.sources.find((source) => source.id === appState.selectedSourceId) || window.opsData.sources[0];
}

function setSelectValue(selector, value) {
  const element = $(selector);
  if (!element) return;
  if ([...element.options].some((option) => option.value === value)) {
    element.value = value;
  }
}

function setSelectValues(selector, values = []) {
  const element = $(selector);
  if (!element) return;
  const selectedValues = new Set((Array.isArray(values) ? values : [values]).filter(Boolean));
  [...element.options].forEach((option) => {
    option.selected = selectedValues.has(option.value);
  });
  refreshMultiSelectControl(element);
}

function populateSourceForm(source = getSelectedSource()) {
  if (!source) return;
  appState.editingSourceId = source.id;
  appState.selectedSourceId = source.id;
  $("#sourceNameInput").value = source.name || "";
  $("#sourceCategoryInput").value = source.category || (source.kind === "database" ? "数据库" : source.kind === "file" ? "本地文件" : "API");
  $("#sourceTypeInput").value = source.type || "";
  setSelectValue("#sourceKindSelect", source.kind || "api");
  setSelectValue("#sourceAuthConfigSelect", source.authConfigId || "auth_none");
  $("#responsePathInput").value = source.responsePath || "data.items";
  setSelectValue("#apiMethodSelect", source.requestConfig?.method || "GET");
  updateRequestParamVisibility();
  $("#paginationInput").value = source.requestConfig?.pagination || "";
  $("#queryParamsInput").value = JSON.stringify(source.requestConfig?.queryParams || {}, null, 2);
  $("#headerParamsInput").value = JSON.stringify(source.requestConfig?.headers || {}, null, 2);
  $("#bodyParamsInput").value = JSON.stringify(source.requestConfig?.body || {}, null, 2);
  setSelectValue("#responseKeepModeSelect", source.responseConfig?.keepMode || source.responseKeepMode || "all");
  $("#responseFilterInput").value = source.responseConfig?.filterCondition || source.responseFilter || "";
  setSelectValue("#responseFieldKeepModeSelect", source.responseConfig?.fieldKeepMode || "all");
  appState.responseValueFilters = Array.isArray(source.responseConfig?.valueFilters) ? source.responseConfig.valueFilters : [];
  const parameterConfig = source.parameterConfig || {};
  setSelectValue("#paramSourceTypeSelect", parameterConfig.sourceType || "static");
  const selectedSourceIds = parameterConfig.sourceIds?.length ? parameterConfig.sourceIds : [parameterConfig.sourceId].filter(Boolean);
  renderParamSourceSelect(selectedSourceIds);
  updateParamSourceTypeHelp();
  renderParamFieldSelect(parameterConfig.selectedFields || []);
  $("#paramFilterInput").value = parameterConfig.filterCondition || "";
  $("#paramQueryInput").value = parameterConfig.query || "";
  $("#paramMappingInput").value = JSON.stringify(parameterConfig.mappings || [], null, 2);
  $("#paramPlaceholderInput").value = formatOptionalJsonArray(parameterConfig.placeholders || []);
  syncPlaceholderTextareaHint();
  setSelectValue("#paramIterationModeSelect", parameterConfig.iterationMode || "single");
  $("#paramStrategyInput").value = parameterConfig.strategy || "concurrency=5; retries=2; continueOnError=true";
  if ($("#mappingSourceSelect").options.length) {
    renderMappingSourceSelect();
  }
  updateSourceModalVisibility();
}

function resetSourceForm() {
  appState.editingSourceId = "";
  $("#sourceNameInput").value = "新增 API 数据源";
  $("#sourceCategoryInput").value = "默认数据源";
  $("#sourceTypeInput").value = "GET /api/custom/list";
  setSelectValue("#sourceKindSelect", "api");
  setSelectValue("#sourceAuthConfigSelect", "auth_none");
  $("#responsePathInput").value = "data.items";
  setSelectValue("#apiMethodSelect", "GET");
  $("#paginationInput").value = "page=1&pageSize=100";
  $("#queryParamsInput").value = JSON.stringify({ startTime: "{{start_time}}", endTime: "{{end_time}}" }, null, 2);
  $("#headerParamsInput").value = JSON.stringify({ "X-System": "OperationInAI" }, null, 2);
  $("#bodyParamsInput").value = JSON.stringify({ severity: ["P0", "P1"], includeRecovered: false }, null, 2);
  setSelectValue("#responseKeepModeSelect", "all");
  $("#responseFilterInput").value = "";
  setSelectValue("#responseFieldKeepModeSelect", "all");
  appState.responseValueFilters = [];
  renderParamSourceSelect("");
  setSelectValue("#paramSourceTypeSelect", "static");
  updateParamSourceTypeHelp();
  renderParamFieldSelect();
  $("#paramFilterInput").value = "";
  $("#paramQueryInput").value = "";
  $("#paramMappingInput").value = "[]";
  $("#paramPlaceholderInput").value = getPlaceholderConfigExample();
  syncPlaceholderTextareaHint();
  setSelectValue("#paramIterationModeSelect", "single");
  $("#paramStrategyInput").value = "concurrency=5; retries=2; continueOnError=true";
  appState.lastSourceTest = null;
  renderSourceTestResult();
  updateSourceModalVisibility();
}

function setSourceFormReadonly(readonly) {
  $$("#sourceModal input, #sourceModal select, #sourceModal textarea").forEach((element) => {
    element.disabled = readonly;
  });
  $("#testSourceBtn").classList.remove("hidden");
  $("#testSourceBtn").disabled = false;
  $("#saveSourceBtn").classList.toggle("hidden", readonly);
  $("#deleteSourceBtn").classList.toggle("hidden", readonly || appState.sourceDetailMode === "create");
  $$("#sourceModal #runSyncBtn, #sourceModal #addMappingBtn, #sourceModal [data-mapping-action], #sourceModal #configureValueFiltersBtn").forEach((button) => {
    button.disabled = readonly || (button.id === "configureValueFiltersBtn" && $("#responseFieldKeepModeSelect")?.value !== "value-filter");
  });
  refreshMultiSelectControls();
}

function openSourceModal(mode, source = getSelectedSource()) {
  appState.sourceDetailMode = mode;
  if (mode === "create") {
    resetSourceForm();
    $("#sourceModalTitle").textContent = "新建数据源";
  } else {
    populateSourceForm(source);
    $("#sourceModalTitle").textContent = mode === "preview" ? "数据源预览" : "编辑数据源";
  }
  setSourceFormReadonly(mode === "preview");
  updateSourceModalVisibility();
  openDialog("#sourceModal");
  renderIcons();
}

function parseJsonInput(selector, fallback = {}) {
  try {
    const value = $(selector).value.trim();
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function collectSourceForm() {
  const auth = getSourceAuthConfig();
  const authType = normalizeAuthType(auth?.type);
  const authName = auth?.name || "无认证";
  // Data sources only store an auth config reference; secret values stay in the auth library.
  return {
    name: $("#sourceNameInput").value.trim() || "未命名数据源",
    category: $("#sourceCategoryInput").value.trim() || "默认数据源",
    type: $("#sourceTypeInput").value.trim() || "GET /api/custom/list",
    kind: $("#sourceKindSelect").value,
    authType,
    authConfigId: $("#sourceAuthConfigSelect").value,
    loginUrl: "",
    refreshCycle: "",
    cookieName: "",
    cookieValue: "",
    responsePath: $("#responsePathInput").value.trim() || "data.items",
    method: $("#apiMethodSelect").value,
    queryParams: parseJsonInput("#queryParamsInput"),
    headers: parseJsonInput("#headerParamsInput"),
    body: parseJsonInput("#bodyParamsInput"),
    pagination: $("#paginationInput").value.trim(),
    responseConfig: {
      keepMode: $("#responseKeepModeSelect")?.value || "all",
      filterCondition: $("#responseFilterInput")?.value.trim() || "",
      fieldKeepMode: $("#responseFieldKeepModeSelect")?.value || "all",
      keepFields: getSelectedValues($("#responseKeepFieldsSelect")),
      valueFilters: appState.responseValueFilters || [],
      persistMode: $("#responsePersistModeSelect")?.value || "none",
      targetTable: $("#responseTargetTableInput")?.value.trim() || ""
    },
    parameterConfig: {
      sourceType: $("#paramSourceTypeSelect").value,
      sourceId: getSelectedValues($("#paramSourceSelect"))[0] || "",
      sourceIds: getSelectedValues($("#paramSourceSelect")),
      selectedFields: getSelectedValues($("#paramFieldSelect")),
      filterCondition: $("#paramFilterInput").value.trim(),
      query: $("#paramQueryInput").value.trim(),
      mappings: parseJsonInput("#paramMappingInput", []),
      placeholders: parseJsonInput("#paramPlaceholderInput", []),
      iterationMode: $("#paramIterationModeSelect").value,
      strategy: $("#paramStrategyInput").value.trim()
    },
    status: authType.includes("none") ? "无认证" : `${authTypeLabels[authType] || authType}：${authName}`
  };
}

async function deleteSelectedSource(source = getSelectedSource()) {
  if (!source?.id) return;
  try {
    await apiRequest(`/api/data-sources/${encodeURIComponent(source.id)}`, {
      method: "DELETE"
    });
  } catch {
    // Local fallback keeps the UI usable when the API is offline.
  }
  window.opsData.sources = window.opsData.sources.filter((item) => item.id !== source.id);
  appState.selectedSourceId = window.opsData.sources[0]?.id || "";
  appState.editingSourceId = "";
  $("#sourceActionStatus").textContent = `已删除：${source.name}`;
  if ($("#sourceModal")?.open) closeDialog("#sourceModal");
  if (appState.selectedSourceId) populateSourceForm();
  renderSources();
  renderMappingSourceSelect();
  renderMappings();
  renderOverview();
  renderIcons();
}

async function saveSourceFromModal() {
  const payload = collectSourceForm();
  const editingId = appState.sourceDetailMode === "create" ? "" : appState.editingSourceId || appState.selectedSourceId;
  if (!editingId) {
    $("#sourceActionStatus").textContent = "正在新增数据源...";
    try {
      const source = await apiRequest("/api/data-sources", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      appState.selectedSourceId = source.id;
      appState.editingSourceId = source.id;
      window.opsData.sources.unshift(source);
      $("#sourceActionStatus").textContent = `已新增并选中：${source.name}`;
    } catch {
      const localSource = {
        id: `local_${Date.now()}`,
        ...payload,
        status: "本地新增，待后端保存",
        icon: "cloud"
      };
      appState.selectedSourceId = localSource.id;
      appState.editingSourceId = localSource.id;
      window.opsData.sources.unshift(localSource);
      $("#sourceActionStatus").textContent = `后端不可用，已在本地新增：${localSource.name}`;
    }
  } else {
    try {
      const saved = await apiRequest(`/api/data-sources/${encodeURIComponent(editingId)}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      appState.selectedSourceId = saved.id;
      appState.editingSourceId = saved.id;
      window.opsData.sources = window.opsData.sources.map((item) => (item.id === saved.id ? saved : item));
      $("#sourceActionStatus").textContent = `已保存：${saved.name}`;
    } catch {
      window.opsData.sources = window.opsData.sources.map((item) => (item.id === editingId ? { ...item, ...payload, updatedAt: new Date().toISOString() } : item));
      appState.selectedSourceId = editingId;
      appState.editingSourceId = editingId;
      $("#sourceActionStatus").textContent = `后端不可用，已本地保存：${payload.name}`;
    }
  }
  populateSourceForm();
  closeDialog("#sourceModal");
  renderSources();
  renderMappingSourceSelect();
  renderMappings();
  renderOverview();
  renderIcons();
}

function renderRuleTable() {
  const headerHtml = `
        <div class="mapping-row support-rule-row header">
          ${["规则名称", "类型", "表达式", "说明", "操作"].map((cell) => `<span>${escapeHtml(cell)}</span>`).join("")}
        </div>
      `;
  renderGroupedConfigList("#ruleTable", window.opsData.cleaningRules || [], {
    bodyClass: "rule-group-body",
    headerHtml,
    getCategory: (rule) => rule.category || rule.type || "清洗规则",
    renderItem: (rule) => `
        <div class="mapping-row support-rule-row">
          <span>${escapeHtml(rule.name)}</span>
          <span>${escapeHtml(rule.type)}</span>
          <span>${escapeHtml(rule.expression)}</span>
          <span>${escapeHtml(rule.description)}</span>
          <span class="row-actions">
            <button class="small-button" data-rule-action="edit" data-rule-id="${escapeHtml(rule.id)}">编辑</button>
            <button class="small-button danger" data-rule-action="delete" data-rule-id="${escapeHtml(rule.id)}">删除</button>
          </span>
        </div>
      `
  });
}

function getRuleById(id) {
  return (window.opsData.cleaningRules || []).find((rule) => rule.id === id);
}

function getDictionarySetById(id) {
  return (window.opsData.dictionarySets || []).find((dictionary) => dictionary.id === id);
}

function getStorageConfigById(id) {
  return (window.opsData.storageConfigs || []).find((config) => config.id === id);
}

function getMappingById(id) {
  return (window.opsData.fieldMappings || []).find((mapping) => mapping.id === id);
}

function renderDictionarySets() {
  renderGroupedConfigList("#dictionarySetList", window.opsData.dictionarySets || [], {
    bodyClass: "support-group-body",
    getCategory: (dictionary) => dictionary.category || "未分组",
    renderItem: (dictionary) => `
      <div class="support-list-item" data-dictionary-id="${escapeHtml(dictionary.id)}">
        <div>
          <strong>${escapeHtml(dictionary.name)}</strong>
          <small>${escapeHtml((dictionary.columns || []).join(" / "))} · ${(dictionary.rows || []).length} 行</small>
        </div>
        <div class="row-actions">
          <button class="small-button" data-dictionary-action="edit" data-dictionary-id="${escapeHtml(dictionary.id)}">编辑</button>
          <button class="small-button danger" data-dictionary-action="delete" data-dictionary-id="${escapeHtml(dictionary.id)}">删除</button>
        </div>
      </div>
    `
  });
}

function renderStorageConfigs() {
  const configs = window.opsData.storageConfigs || [];
  const currentStorageId = window.opsData.currentStorageId || configs.find((config) => config.active)?.id || "storage_local_default";
  const hasDatabaseStorage = configs.some((config) => config.type === "database");
  const addButton = $("#addStorageConfigBtn");
  if (addButton) {
    addButton.disabled = hasDatabaseStorage;
    addButton.title = hasDatabaseStorage ? "当前仅支持配置 1 个数据库存储" : "";
  }
  renderGroupedConfigList("#storageConfigList", configs, {
    bodyClass: "support-group-body",
    getCategory: (config) => config.category || (config.type === "local" ? "系统默认" : "数据库存储"),
    renderItem: (config) => {
      const active = config.id === currentStorageId || config.active;
      return `
      <div class="support-list-item" data-storage-id="${escapeHtml(config.id)}">
        <div>
          <strong>${escapeHtml(config.name)} ${active ? '<span class="status-pill ok">当前使用</span>' : ""}</strong>
          <small>${escapeHtml(config.type === "local" ? "本地存储" : `${config.database}://${config.host || "-"}${config.port ? `:${config.port}` : ""}`)} · ${escapeHtml(config.status || "-")}</small>
        </div>
        <div class="row-actions">
          <button class="small-button" data-storage-action="switch" data-storage-id="${escapeHtml(config.id)}" ${active ? "disabled" : ""}>设为当前</button>
          <button class="small-button" data-storage-action="edit" data-storage-id="${escapeHtml(config.id)}" ${config.readonly ? "disabled" : ""}>编辑</button>
          <button class="small-button danger" data-storage-action="delete" data-storage-id="${escapeHtml(config.id)}" ${config.readonly || active ? "disabled" : ""}>删除</button>
        </div>
      </div>
    `;
    }
  });
}

function syncStorageDefaultPort() {
  const defaults = {
    postgresql: "5432",
    mysql: "3306",
    mariadb: "3306",
    sqlserver: "1433",
    oracle: "1521"
  };
  const portInput = $("#storagePortInput");
  const database = $("#storageDatabaseSelect")?.value || "postgresql";
  if (portInput && !portInput.value.trim()) {
    portInput.value = defaults[database] || "";
  }
}

function resetStorageConfigForm() {
  appState.editingStorageConfigId = "";
  $("#storageConfigModalTitle").textContent = "新增数据库存储";
  $("#storageNameInput").value = "业务数据库存储";
  setSelectValue("#storageDatabaseSelect", "postgresql");
  $("#storageHostInput").value = "127.0.0.1";
  $("#storagePortInput").value = "5432";
  $("#storageUsernameInput").value = "";
  $("#storagePasswordInput").value = "";
  $("#storagePasswordInput").placeholder = "请输入数据库密码";
  $("#deleteStorageConfigBtn").classList.add("hidden");
}

function populateStorageConfigForm(config) {
  if (!config || config.readonly) return;
  appState.editingStorageConfigId = config.id;
  $("#storageConfigModalTitle").textContent = "编辑数据库存储";
  $("#storageNameInput").value = config.name || "";
  setSelectValue("#storageDatabaseSelect", config.database || "postgresql");
  $("#storageHostInput").value = config.host || "";
  $("#storagePortInput").value = config.port || "";
  $("#storageUsernameInput").value = config.username || "";
  $("#storagePasswordInput").value = "";
  $("#storagePasswordInput").placeholder = config.passwordMasked ? "已配置，留空表示不修改" : "请输入数据库密码";
  $("#deleteStorageConfigBtn").classList.remove("hidden");
}

function collectStorageConfigForm() {
  return {
    name: $("#storageNameInput").value.trim() || "数据库存储",
    category: "数据库存储",
    type: "database",
    database: $("#storageDatabaseSelect").value,
    host: $("#storageHostInput").value.trim(),
    port: $("#storagePortInput").value.trim(),
    username: $("#storageUsernameInput").value.trim(),
    password: $("#storagePasswordInput").value
  };
}

function getStorageMigrationPolicyDesc(policy = "copy-config") {
  if (policy === "switch-only") {
    return "仅把当前存储指向目标存储，不复制旧数据。旧数据仍留在原存储中；切换后如果目标存储为空，页面可能只看到目标存储中的新数据。";
  }
  if (policy === "copy-all") {
    return "复制配置数据、业务数据、同步日志、分析结果和知识源索引等全部数据。当前版本会记录迁移计划；接入真实数据库适配器后可执行实际迁移。";
  }
  return "复制数据源、认证、字段映射、清洗规则、字典集、业务流和模型配置等配置数据；业务运行数据和历史日志仍留在旧存储。推荐用于首次从本地切到数据库。";
}

function openStorageSwitchModal(config) {
  if (!config) return;
  $("#storageSwitchModal").dataset.targetStorageId = config.id;
  const current = getStorageConfigById(window.opsData.currentStorageId) || (window.opsData.storageConfigs || []).find((item) => item.active);
  $("#storageSwitchTargetInput").value = `${config.name} (${config.type === "local" ? "本地存储" : config.database})`;
  $("#storageSwitchSummary").textContent = `当前：${current?.name || "-"}，目标：${config.name}`;
  setSelectValue("#storageMigrationPolicySelect", "copy-config");
  $("#storageMigrationPolicyDesc").value = getStorageMigrationPolicyDesc("copy-config");
  openDialog("#storageSwitchModal");
}

function applyStorageSwitchResult(result = {}) {
  if (Array.isArray(result.storageConfigs)) {
    window.opsData.storageConfigs = result.storageConfigs;
  } else {
    window.opsData.storageConfigs = (window.opsData.storageConfigs || []).map((config) => ({
      ...config,
      active: config.id === result.currentStorageId
    }));
  }
  window.opsData.currentStorageId = result.currentStorageId || window.opsData.currentStorageId;
  if (result.migration) {
    window.opsData.storageMigrationLogs = [result.migration, ...(window.opsData.storageMigrationLogs || [])];
  }
  renderStorageConfigs();
}

function renderDictionarySelectOptions(selector, selectedId = "", emptyText = "不引用字典集") {
  const select = $(selector);
  if (!select) return;
  select.innerHTML = [
    `<option value="">${escapeHtml(emptyText)}</option>`,
    ...(window.opsData.dictionarySets || []).map((dictionary) => `<option value="${escapeHtml(dictionary.id)}">${escapeHtml(dictionary.name)}</option>`)
  ].join("");
  setSelectValue(selector, selectedId);
}

function renderDictionaryColumnOptions(selector, dictionaryId, selectedColumn = "", emptyText = "选择字段") {
  const select = $(selector);
  if (!select) return;
  const dictionary = getDictionarySetById(dictionaryId);
  select.innerHTML = [
    `<option value="">${escapeHtml(emptyText)}</option>`,
    ...((dictionary?.columns || []).map((column) => `<option value="${escapeHtml(column)}">${escapeHtml(column)}</option>`))
  ].join("");
  setSelectValue(selector, selectedColumn);
}

function setDictionaryCategoryValue(value = "业务字典") {
  const input = $("#dictionaryCategoryInput");
  if (!input) return;
  input.value = value || "业务字典";
}

function parseDictionaryColumns() {
  const inferred = inferDictionaryColumns(parseDictionaryRows());
  if (inferred.length) {
    $("#dictionaryColumnsInput").value = inferred.join(",");
    return inferred;
  }
  return $("#dictionaryColumnsInput").value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDictionaryRows() {
  try {
    const rows = JSON.parse($("#dictionaryRowsInput").value || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function inferDictionaryColumns(rows = []) {
  if (!Array.isArray(rows)) return [];
  return [...new Set(rows.flatMap((row) => Object.keys(row || {})))];
}

function syncDictionaryColumnsFromRows() {
  const columns = inferDictionaryColumns(parseDictionaryRows());
  if (columns.length) {
    $("#dictionaryColumnsInput").value = columns.join(",");
  }
}

function resetDictionaryForm() {
  appState.editingDictionaryId = "";
  $("#dictionaryModalTitle").textContent = "新增字典集";
  $("#dictionaryNameInput").value = "产品列表";
  setDictionaryCategoryValue("业务字典");
  $("#dictionaryColumnsInput").value = "产品部,产品名,别名列表,版本号";
  $("#dictionaryRowsInput").value = JSON.stringify([{ "产品部": "交易产品部", "产品名": "支付网关", "别名列表": "pay-gateway,payment-api", "版本号": "v3" }], null, 2);
  syncDictionaryColumnsFromRows();
  $("#dictionaryDescInput").value = "可被过滤条件、字段值过滤和清洗规则引用。";
  $("#deleteDictionaryBtn").classList.add("hidden");
}

function populateDictionaryForm(dictionary) {
  if (!dictionary) return;
  appState.editingDictionaryId = dictionary.id;
  $("#dictionaryModalTitle").textContent = "编辑字典集";
  $("#dictionaryNameInput").value = dictionary.name || "";
  setDictionaryCategoryValue(dictionary.category || "未分组");
  $("#dictionaryColumnsInput").value = (dictionary.columns || []).join(",");
  $("#dictionaryRowsInput").value = JSON.stringify(dictionary.rows || [], null, 2);
  syncDictionaryColumnsFromRows();
  $("#dictionaryDescInput").value = dictionary.description || "";
  $("#deleteDictionaryBtn").classList.remove("hidden");
}

function collectDictionaryForm() {
  const columns = parseDictionaryColumns();
  return {
    name: $("#dictionaryNameInput").value.trim() || "自定义字典集",
    category: $("#dictionaryCategoryInput").value.trim() || "未分组",
    description: $("#dictionaryDescInput").value.trim(),
    columns,
    rows: parseDictionaryRows()
  };
}

function buildRuleExpression() {
  const action = $("#ruleActionSelect")?.value || "trim";
  const param = $("#ruleParamInput")?.value.trim();
  const dictionary = getDictionarySetById($("#ruleDictionarySelect")?.value);
  const dictionaryColumn = $("#ruleDictionaryColumnSelect")?.value;
  const dictionaryRef = dictionary ? ` @${dictionary.name}${dictionaryColumn ? `.${dictionaryColumn}` : ""}` : "";
  return `${action}${param ? `(${param})` : ""}${dictionaryRef}`;
}

function syncRuleExpressionPreview() {
  if ($("#ruleExpressionInput")) {
    $("#ruleExpressionInput").value = buildRuleExpression();
  }
}

function renderMappingRuleSelect(selectedRuleId = "") {
  const rules = window.opsData.cleaningRules || [];
  $("#mapRuleSelect").innerHTML = [
    '<option value="">不使用规则</option>',
    ...rules.map((rule) => `<option value="${escapeHtml(rule.id)}">${escapeHtml(rule.name)} · ${escapeHtml(rule.type)}</option>`)
  ].join("");
  setSelectValue("#mapRuleSelect", selectedRuleId);
}

function populateRuleForm(rule) {
  if (!rule) return;
  appState.editingRuleId = rule.id;
  $("#ruleModalTitle").textContent = "编辑规则";
  $("#ruleNameInput").value = rule.name || "";
  $("#ruleCategoryInput").value = rule.category || rule.type || "清洗规则";
  setSelectValue("#ruleTypeSelect", rule.type || "mapping");
  setSelectValue("#ruleActionSelect", rule.config?.action || "trim");
  $("#ruleParamInput").value = rule.config?.param || "";
  renderDictionarySelectOptions("#ruleDictionarySelect", rule.config?.dictionaryId || "");
  renderDictionaryColumnOptions("#ruleDictionaryColumnSelect", rule.config?.dictionaryId || "", rule.config?.dictionaryColumn || "");
  $("#ruleExpressionInput").value = rule.expression || "";
  $("#ruleDescInput").value = rule.description || "";
}

function resetRuleForm() {
  appState.editingRuleId = "";
  $("#ruleModalTitle").textContent = "新增规则";
  $("#ruleNameInput").value = "服务名标准化";
  $("#ruleCategoryInput").value = "字段标准化";
  setSelectValue("#ruleTypeSelect", "normalize");
  setSelectValue("#ruleActionSelect", "trim");
  $("#ruleParamInput").value = "";
  renderDictionarySelectOptions("#ruleDictionarySelect");
  renderDictionaryColumnOptions("#ruleDictionaryColumnSelect", "");
  syncRuleExpressionPreview();
  $("#ruleDescInput").value = "对字段输入值执行清洗处理，字段映射会自动把源字段作为输入、目标字段作为输出。";
}

function collectRuleForm() {
  syncRuleExpressionPreview();
  return {
    name: $("#ruleNameInput").value.trim() || "自定义清洗规则",
    category: $("#ruleCategoryInput").value.trim() || "清洗规则",
    type: $("#ruleTypeSelect").value,
    expression: $("#ruleExpressionInput").value.trim() || "trim + normalize",
    description: $("#ruleDescInput").value.trim() || "用户自定义清洗规则",
    config: {
      action: $("#ruleActionSelect").value,
      param: $("#ruleParamInput").value.trim(),
      dictionaryId: $("#ruleDictionarySelect").value,
      dictionaryColumn: $("#ruleDictionaryColumnSelect").value
    },
    enabled: true
  };
}

function getModelConfigById(id) {
  return (window.opsData.modelConfigs || []).find((config) => config.id === id);
}

function ensureModelVendorOptions() {
  const vendorSelect = $("#modelVendorSelect");
  if (!vendorSelect) return;
  const vendorLabels = {
    "openai-compatible": "OpenAI Compatible",
    deepseek: "DeepSeek",
    qwen: "通义千问",
    moonshot: "月之暗面 Kimi",
    hunyuan: "腾讯混元",
    anthropic: "Anthropic Claude",
    gemini: "Google Gemini",
    local: "本地模型"
  };
  Object.entries(vendorLabels).forEach(([value, label]) => {
    if ([...vendorSelect.options].some((option) => option.value === value)) return;
    vendorSelect.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`);
  });
}

function setupModelPresetControls() {
  ensureModelVendorOptions();
  const nameInput = $("#modelConfigNameInput");
  if (!nameInput || $("#modelPresetSelect")) return;
  const label = document.createElement("label");
  label.className = "full model-preset-row";
  label.innerHTML = `
    <span>热门模型模板</span>
    <div class="preset-picker">
      <select id="modelPresetSelect">
        <option value="">自定义配置</option>
        ${popularModelPresets.map((preset) => `<option value="${escapeHtml(preset.id)}">${escapeHtml(preset.category)} / ${escapeHtml(preset.name)}</option>`).join("")}
      </select>
      <button class="small-button" id="applyModelPresetBtn" type="button">应用模板</button>
    </div>
  `;
  nameInput.closest("label")?.before(label);
}

function applyModelPreset(presetId = $("#modelPresetSelect")?.value) {
  const preset = popularModelPresets.find((item) => item.id === presetId);
  if (!preset) return;
  $("#modelConfigNameInput").value = preset.name;
  $("#modelConfigCategoryInput").value = preset.category;
  setSelectValue("#modelVendorSelect", preset.vendor);
  $("#modelNameInput").value = preset.model;
  $("#modelBaseUrlInput").value = preset.baseUrl;
}

function renderModelConfigList() {
  if (!$("#modelConfigList")) return;
  renderGroupedConfigList("#modelConfigList", window.opsData.modelConfigs || [], {
    bodyClass: "model-group-body",
    getCategory: (config) => config.category || config.vendor || "模型配置",
    renderItem: (config) => `
        <div class="model-config-item ${config.id === $("#analysisModelSelect")?.value ? "selected" : ""}" data-model-id="${escapeHtml(config.id)}">
          <div>
            <strong>${escapeHtml(config.name)}</strong>
            <small>${escapeHtml(config.vendor)} · ${escapeHtml(config.model)} · ${escapeHtml(config.baseUrl)} · Key ${escapeHtml(config.apiKeyMasked || "未配置")}</small>
          </div>
          <span class="status-pill ${config.status === "可用" ? "ok" : ""}">${escapeHtml(config.status || "可选")}</span>
          <span class="row-actions">
            <button class="small-button" data-model-action="use" data-model-id="${escapeHtml(config.id)}">使用</button>
            <button class="small-button" data-model-action="edit" data-model-id="${escapeHtml(config.id)}">编辑</button>
            <button class="small-button danger" data-model-action="delete" data-model-id="${escapeHtml(config.id)}">删除</button>
          </span>
        </div>
      `
  });
}

function resetModelConfigForm() {
  ensureModelVendorOptions();
  appState.editingModelConfigId = "";
  setSelectValue("#modelPresetSelect", "");
  $("#modelConfigModalTitle").textContent = "新增模型配置";
  $("#modelConfigNameInput").value = "自定义模型配置";
  $("#modelConfigCategoryInput").value = "通用模型";
  setSelectValue("#modelVendorSelect", "openai-compatible");
  $("#modelNameInput").value = "gpt-4.1-mini";
  $("#modelBaseUrlInput").value = "https://api.openai.com/v1";
  $("#modelApiKeyInput").value = "";
}

function populateModelConfigForm(config) {
  if (!config) return;
  ensureModelVendorOptions();
  appState.editingModelConfigId = config.id;
  setSelectValue("#modelPresetSelect", "");
  $("#modelConfigModalTitle").textContent = "编辑模型配置";
  $("#modelConfigNameInput").value = config.name || "";
  $("#modelConfigCategoryInput").value = config.category || config.vendor || "模型配置";
  setSelectValue("#modelVendorSelect", config.vendor || "openai-compatible");
  $("#modelNameInput").value = config.model || "";
  $("#modelBaseUrlInput").value = config.baseUrl || "";
  $("#modelApiKeyInput").value = "";
}

function collectModelConfigForm() {
  return {
    name: $("#modelConfigNameInput").value.trim() || "自定义模型配置",
    category: $("#modelConfigCategoryInput").value.trim() || "模型配置",
    vendor: $("#modelVendorSelect").value,
    model: $("#modelNameInput").value.trim() || "gpt-4.1-mini",
    baseUrl: $("#modelBaseUrlInput").value.trim() || "https://api.openai.com/v1",
    apiKey: $("#modelApiKeyInput").value.trim()
  };
}

function openDialog(selector) {
  const dialog = $(selector);
  if (dialog?.showModal) {
    dialog.showModal();
  }
}

function closeDialog(selector) {
  const dialog = $(selector);
  if (dialog?.open) {
    dialog.close();
  }
}

function getSelectedValues(select) {
  if (!select) return [];
  return [...select.selectedOptions].map((option) => option.value);
}

function getMultiSelectSummary(select) {
  const values = getSelectedValues(select);
  const config = multiSelectConfigs[select.id] || {};
  if (!values.length) return config.empty || "未选择";
  const labels = [...select.selectedOptions].map((option) => option.textContent || option.value);
  if (labels.length <= 2) return labels.join("、");
  return `${labels.slice(0, 2).join("、")} 等 ${labels.length} 项`;
}

function refreshMultiSelectControl(select) {
  if (!select?.multiple) return;
  const wrapper = select.closest(".multi-select-wrap");
  if (!wrapper) return;
  const summary = $(".multi-select-summary", wrapper);
  const count = $(".multi-select-count", wrapper);
  const trigger = $(".multi-select-trigger", wrapper);
  const values = getSelectedValues(select);
  if (summary) summary.textContent = getMultiSelectSummary(select);
  if (count) count.textContent = `${values.length}/${select.options.length}`;
  if (trigger) trigger.disabled = select.disabled;
}

function refreshMultiSelectControls() {
  Object.keys(multiSelectConfigs).forEach((id) => refreshMultiSelectControl($(`#${id}`)));
}

function setupMultiSelectControls() {
  if (!$("#multiSelectModal")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<dialog class="modal multi-select-modal" id="multiSelectModal">
        <div class="modal-panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Multi Select</p>
              <h2 id="multiSelectTitle">选择字段</h2>
              <small id="multiSelectMeta"></small>
            </div>
          </div>
          <label class="multi-select-search">
            <span>搜索</span>
            <input id="multiSelectSearchInput" type="search" placeholder="输入字段名或路径快速过滤" />
          </label>
          <div class="multi-check-list" id="multiSelectList"></div>
          <div class="module-status hidden" id="multiSelectEmpty">未找到匹配字段。</div>
          <div class="modal-actions">
            <button class="small-button" id="cancelMultiSelectBtn" type="button">取消</button>
            <button class="small-button primary" id="confirmMultiSelectBtn" type="button">确定</button>
          </div>
        </div>
      </dialog>`
    );
  }
  Object.entries(multiSelectConfigs).forEach(([id, config]) => {
    const select = $(`#${id}`);
    if (!select || select.dataset.enhanced === "true") return;
    select.dataset.enhanced = "true";
    select.classList.add("native-multi-select");
    const wrapper = document.createElement("div");
    wrapper.className = "multi-select-wrap";
    select.parentNode.insertBefore(wrapper, select);
    wrapper.append(select);
    wrapper.insertAdjacentHTML(
      "beforeend",
      `<button class="multi-select-trigger" type="button" data-multi-select-trigger="${escapeHtml(id)}">
        <span class="multi-select-summary">${escapeHtml(getMultiSelectSummary(select))}</span>
        <span class="multi-select-count">${getSelectedValues(select).length}/${select.options.length}</span>
      </button>`
    );
    select.addEventListener("change", () => refreshMultiSelectControl(select));
  });
}

function openMultiSelectDialog(selectId) {
  const select = $(`#${selectId}`);
  const dialog = $("#multiSelectModal");
  if (!select || !dialog) return;
  const config = multiSelectConfigs[selectId] || {};
  $("#multiSelectTitle").textContent = config.label || "选择字段";
  $("#multiSelectMeta").textContent = `共 ${select.options.length} 项，可多选`;
  $("#multiSelectSearchInput").value = "";
  const selected = new Set(getSelectedValues(select));
  $("#multiSelectList").innerHTML = [...select.options]
    .map(
      (option) => `
        <label class="multi-check-item" data-search-text="${escapeHtml(`${option.textContent || ""} ${option.value}`.toLowerCase())}">
          <input type="checkbox" value="${escapeHtml(option.value)}" ${selected.has(option.value) ? "checked" : ""} />
          <span>${escapeHtml(option.textContent || option.value)}</span>
        </label>
      `
    )
    .join("");
  dialog.dataset.targetSelect = selectId;
  filterMultiSelectOptions();
  openDialog("#multiSelectModal");
  $("#multiSelectSearchInput").focus();
}

function filterMultiSelectOptions() {
  const keyword = ($("#multiSelectSearchInput")?.value || "").trim().toLowerCase();
  let visibleCount = 0;
  $$("#multiSelectList .multi-check-item").forEach((item) => {
    const matched = !keyword || String(item.dataset.searchText || "").includes(keyword);
    item.classList.toggle("hidden", !matched);
    if (matched) visibleCount += 1;
  });
  $("#multiSelectEmpty")?.classList.toggle("hidden", visibleCount > 0);
  const targetSelect = $(`#${$("#multiSelectModal")?.dataset.targetSelect || ""}`);
  if (targetSelect) {
    $("#multiSelectMeta").textContent = keyword
      ? `匹配 ${visibleCount} / 共 ${targetSelect.options.length} 项，可多选`
      : `共 ${targetSelect.options.length} 项，可多选`;
  }
}

function applyMultiSelectDialog() {
  const dialog = $("#multiSelectModal");
  const select = $(`#${dialog?.dataset.targetSelect || ""}`);
  if (!select) return;
  const selected = new Set($$("#multiSelectList input:checked").map((input) => input.value));
  [...select.options].forEach((option) => {
    option.selected = selected.has(option.value);
  });
  select.dispatchEvent(new Event("change", { bubbles: true }));
  refreshMultiSelectControl(select);
  closeDialog("#multiSelectModal");
}

function getSelectedKeepFieldsForValueFilters() {
  const selected = getSelectedValues($("#responseKeepFieldsSelect"));
  if (selected.length) return selected;
  return [...($("#responseKeepFieldsSelect")?.options || [])].map((option) => option.value);
}

function normalizeValueFiltersForFields(fields = []) {
  const existing = new Map((appState.responseValueFilters || []).map((filter) => [filter.field, filter]));
  return fields.map((field) => ({
    field,
    matchMode: existing.get(field)?.matchMode || "exact",
    value: existing.get(field)?.value || "",
    preRuleId: existing.get(field)?.preRuleId || "",
    extractMode: existing.get(field)?.extractMode || "none",
    splitDelimiter: existing.get(field)?.splitDelimiter || "|",
    splitIndex: existing.get(field)?.splitIndex || "",
    extractRegex: existing.get(field)?.extractRegex || "",
    dictionaryId: existing.get(field)?.dictionaryId || "",
    dictionaryColumn: existing.get(field)?.dictionaryColumn || "",
    dictionaryMatchMode: existing.get(field)?.dictionaryMatchMode || "field-in-dictionary",
    dictionaryScopeColumn: existing.get(field)?.dictionaryScopeColumn || "",
    dictionaryScopeValue: existing.get(field)?.dictionaryScopeValue || "",
    outputMode: existing.get(field)?.outputMode || "original",
    aggregateOutput: Boolean(existing.get(field)?.aggregateOutput),
    aggregateSeparator: existing.get(field)?.aggregateSeparator || ",",
    uniqueOutput: existing.get(field)?.uniqueOutput !== false,
    enabled: existing.get(field)?.enabled !== false
  }));
}

function renderValueFilterList() {
  const fields = getSelectedKeepFieldsForValueFilters();
  const filters = normalizeValueFiltersForFields(fields);
  const dictionaries = window.opsData.dictionarySets || [];
  const rules = window.opsData.cleaningRules || [];
  if (!fields.length) {
    $("#valueFilterList").innerHTML = '<div class="module-status">请先在“保留字段”中选择字段，再配置字段值过滤。</div>';
    return;
  }
  $("#valueFilterList").innerHTML = filters
    .map(
      (filter) => `
        <div class="value-filter-row" data-value-filter-field="${escapeHtml(filter.field)}">
          <label>
            <span>字段</span>
            <input value="${escapeHtml(filter.field)}" readonly />
          </label>
          <label>
            <span>匹配方式</span>
            <select data-value-filter-mode>
              <option value="exact" ${filter.matchMode === "exact" ? "selected" : ""}>完整匹配</option>
              <option value="contains" ${filter.matchMode === "contains" ? "selected" : ""}>模糊包含</option>
              <option value="startsWith" ${filter.matchMode === "startsWith" ? "selected" : ""}>前缀匹配</option>
              <option value="endsWith" ${filter.matchMode === "endsWith" ? "selected" : ""}>后缀匹配</option>
              <option value="regex" ${filter.matchMode === "regex" ? "selected" : ""}>正则匹配</option>
            </select>
          </label>
          <label>
            <span>匹配值</span>
            <input data-value-filter-value value="${escapeHtml(filter.value)}" placeholder="为空则不启用该字段过滤" />
          </label>
          <label>
            <span>引用字典集</span>
            <select data-value-filter-dictionary>
              <option value="">不引用</option>
              ${dictionaries.map((dictionary) => `<option value="${escapeHtml(dictionary.id)}" ${filter.dictionaryId === dictionary.id ? "selected" : ""}>${escapeHtml(dictionary.name)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>匹配列</span>
            <select data-value-filter-dictionary-column></select>
          </label>
          <label>
            <span>字典匹配</span>
            <select data-value-filter-dictionary-match>
              <option value="field-in-dictionary" ${filter.dictionaryMatchMode === "field-in-dictionary" ? "selected" : ""}>字段值在字典列中</option>
              <option value="dictionary-in-field" ${filter.dictionaryMatchMode === "dictionary-in-field" ? "selected" : ""}>字典值在字段内容中</option>
            </select>
          </label>
          <label>
            <span>范围列</span>
            <select data-value-filter-scope-column></select>
          </label>
          <label>
            <span>范围值</span>
            <input data-value-filter-scope-value value="${escapeHtml(filter.dictionaryScopeValue || "")}" placeholder="为空表示全部" />
          </label>
        </div>
      `
    )
    .join("");
  $$(".value-filter-row", $("#valueFilterList")).forEach((row, index) => {
    updateValueFilterDictionaryColumns(row, filters[index]);
    enhanceValueFilterRow(row, filters[index]);
  });
}

function enhanceValueFilterRow(row, filter = {}) {
  if (!row || row.dataset.enhancedOutputFilter === "true") return;
  row.dataset.enhancedOutputFilter = "true";
  const rules = window.opsData.cleaningRules || [];
  row.insertAdjacentHTML(
    "beforeend",
    `
      <label>
        <span>过滤前清洗规则</span>
        <select data-value-filter-rule>
          <option value="">不使用规则</option>
          ${rules.map((rule) => `<option value="${escapeHtml(rule.id)}" ${filter.preRuleId === rule.id ? "selected" : ""}>${escapeHtml(rule.name)}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>过滤取值方式</span>
        <select data-value-filter-extract-mode>
          <option value="none" ${filter.extractMode === "none" ? "selected" : ""}>直接使用字段值</option>
          <option value="split" ${filter.extractMode === "split" ? "selected" : ""}>按分隔符取片段</option>
          <option value="regex" ${filter.extractMode === "regex" ? "selected" : ""}>按正则提取</option>
        </select>
      </label>
      <label>
        <span>分隔符</span>
        <input data-value-filter-split-delimiter value="${escapeHtml(filter.splitDelimiter || "|")}" placeholder="如 |" />
      </label>
      <label>
        <span>片段序号</span>
        <input data-value-filter-split-index value="${escapeHtml(filter.splitIndex || "")}" placeholder="从 1 开始，如 2" />
      </label>
      <label>
        <span>提取正则</span>
        <input data-value-filter-regex value="${escapeHtml(filter.extractRegex || "")}" placeholder="如 ^[^|]+\\|([^|]+)\\|" />
      </label>
      <label>
        <span>命中后输出</span>
        <select data-value-filter-output-mode>
          <option value="original" ${(filter.outputMode || "original") === "original" ? "selected" : ""}>保留原字段值</option>
          <option value="matched-fragment" ${filter.outputMode === "matched-fragment" ? "selected" : ""}>只保留命中内容</option>
          <option value="filter-value" ${filter.outputMode === "filter-value" ? "selected" : ""}>保留过滤取值</option>
        </select>
      </label>
      <label>
        <span>聚合输出</span>
        <select data-value-filter-aggregate>
          <option value="false" ${filter.aggregateOutput ? "" : "selected"}>不聚合</option>
          <option value="true" ${filter.aggregateOutput ? "selected" : ""}>命中记录合并为一个值</option>
        </select>
      </label>
      <label>
        <span>聚合分隔符</span>
        <input data-value-filter-aggregate-separator value="${escapeHtml(filter.aggregateSeparator || ",")}" placeholder="如 ," />
      </label>
      <label>
        <span>重复值处理</span>
        <select data-value-filter-unique>
          <option value="true" ${filter.uniqueOutput === false ? "" : "selected"}>自动去重</option>
          <option value="false" ${filter.uniqueOutput === false ? "selected" : ""}>保留重复</option>
        </select>
      </label>
    `
  );
  syncValueFilterRowVisibility(row);
}

function updateValueFilterDictionaryColumns(row, filter = {}) {
  const dictionaryId = $("[data-value-filter-dictionary]", row)?.value || filter.dictionaryId || "";
  const dictionary = getDictionarySetById(dictionaryId);
  const columnSelect = $("[data-value-filter-dictionary-column]", row);
  const scopeColumnSelect = $("[data-value-filter-scope-column]", row);
  const options = [
    '<option value="">选择列</option>',
    ...((dictionary?.columns || []).map((column) => `<option value="${escapeHtml(column)}">${escapeHtml(column)}</option>`))
  ].join("");
  if (columnSelect) {
    columnSelect.innerHTML = options;
    columnSelect.value = filter.dictionaryColumn || columnSelect.value || "";
  }
  if (scopeColumnSelect) {
    scopeColumnSelect.innerHTML = ['<option value="">全部范围</option>', ...((dictionary?.columns || []).map((column) => `<option value="${escapeHtml(column)}">${escapeHtml(column)}</option>`))].join("");
    scopeColumnSelect.value = filter.dictionaryScopeColumn || scopeColumnSelect.value || "";
  }
}

function toggleValueFilterControl(row, selector, visible) {
  const control = $(selector, row);
  const label = control?.closest("label");
  if (!control || !label) return;
  label.classList.toggle("hidden", !visible);
  control.disabled = !visible;
}

function syncValueFilterRowVisibility(row) {
  if (!row) return;
  const extractMode = $("[data-value-filter-extract-mode]", row)?.value || "none";
  const hasDictionary = Boolean($("[data-value-filter-dictionary]", row)?.value);
  const hasScopeColumn = Boolean($("[data-value-filter-scope-column]", row)?.value);
  const shouldAggregate = ($("[data-value-filter-aggregate]", row)?.value || "false") === "true";
  toggleValueFilterControl(row, "[data-value-filter-split-delimiter]", extractMode === "split");
  toggleValueFilterControl(row, "[data-value-filter-split-index]", extractMode === "split");
  toggleValueFilterControl(row, "[data-value-filter-regex]", extractMode === "regex");
  toggleValueFilterControl(row, "[data-value-filter-value]", !hasDictionary);
  toggleValueFilterControl(row, "[data-value-filter-dictionary-column]", hasDictionary);
  toggleValueFilterControl(row, "[data-value-filter-dictionary-match]", hasDictionary);
  toggleValueFilterControl(row, "[data-value-filter-scope-column]", hasDictionary);
  toggleValueFilterControl(row, "[data-value-filter-scope-value]", hasDictionary && hasScopeColumn);
  toggleValueFilterControl(row, "[data-value-filter-aggregate-separator]", shouldAggregate);
  toggleValueFilterControl(row, "[data-value-filter-unique]", shouldAggregate);
}

function openValueFilterDialog() {
  renderValueFilterList();
  openDialog("#valueFilterModal");
}

function saveValueFilterDialog() {
  appState.responseValueFilters = $$(".value-filter-row", $("#valueFilterList")).map((row) => ({
    field: row.dataset.valueFilterField,
    matchMode: $("[data-value-filter-mode]", row).value,
    value: $("[data-value-filter-value]", row).value.trim(),
    preRuleId: $("[data-value-filter-rule]", row)?.value || "",
    extractMode: $("[data-value-filter-extract-mode]", row)?.value || "none",
    splitDelimiter: $("[data-value-filter-split-delimiter]", row)?.value || "|",
    splitIndex: $("[data-value-filter-split-index]", row)?.value.trim() || "",
    extractRegex: $("[data-value-filter-regex]", row)?.value.trim() || "",
    dictionaryId: $("[data-value-filter-dictionary]", row).value,
    dictionaryColumn: $("[data-value-filter-dictionary-column]", row).value,
    dictionaryMatchMode: $("[data-value-filter-dictionary-match]", row).value,
    dictionaryScopeColumn: $("[data-value-filter-scope-column]", row).value,
    dictionaryScopeValue: $("[data-value-filter-scope-value]", row).value.trim(),
    outputMode: $("[data-value-filter-output-mode]", row)?.value || "original",
    aggregateOutput: ($("[data-value-filter-aggregate]", row)?.value || "false") === "true",
    aggregateSeparator: $("[data-value-filter-aggregate-separator]", row)?.value || ",",
    uniqueOutput: ($("[data-value-filter-unique]", row)?.value || "true") === "true",
    enabled: Boolean($("[data-value-filter-value]", row).value.trim() || ($("[data-value-filter-dictionary]", row).value && $("[data-value-filter-dictionary-column]", row).value))
  }));
  closeDialog("#valueFilterModal");
}

function getFlowRefOptions(type) {
  if (type === "source") {
    return (window.opsData.sources || []).map((source) => ({ value: source.id, label: source.name }));
  }
  if (type === "rule") {
    return (window.opsData.cleaningRules || []).map((rule) => ({ value: rule.id, label: rule.name }));
  }
  if (type === "output") {
    return [{ value: "business-table", label: $("#flowBusinessTableInput")?.value || "业务表输出" }];
  }
  return [
    { value: "time-window", label: "时间窗口" },
    { value: "batch-id", label: "运行批次" },
    { value: "tenant-env", label: "租户/环境" }
  ];
}

function renderFlowNodeRefSelect(selector, type, selectedValue = "") {
  const options = getFlowRefOptions(type);
  $(selector).innerHTML = options
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");
  setSelectValue(selector, selectedValue || options[0]?.value || "");
}

function getBranchSourceOptions(currentNodeId = "") {
  return (appState.flowNodes || [])
    .filter((node) => node.id !== currentNodeId)
    .map((node, index) => ({
      value: node.id,
      label: `${index + 1}. ${node.name || getFlowRefLabel(node.type, node.refId)}`
    }));
}

function renderFlowBranchFromSelect(selectedValue = "", currentNodeId = "") {
  const options = getBranchSourceOptions(currentNodeId);
  $("#flowNodeBranchFromSelect").innerHTML = [
    '<option value="">选择上游节点</option>',
    ...options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
  ].join("");
  setSelectValue("#flowNodeBranchFromSelect", selectedValue || "");
}

function getFlowRefLabel(type, refId) {
  return getFlowRefOptions(type).find((option) => option.value === refId)?.label || refId || "未配置";
}

function getDefaultSourceExecutionConfig() {
  return {
    pagination: {
      mode: "inherit",
      pageParam: "page",
      pageSizeParam: "pageSize",
      pageSize: 100,
      startPage: 1,
      nextTokenPath: "data.pageInfo.nextPageToken",
      hasNextPath: "data.pageInfo.hasNext",
      maxPages: 100,
      totalPages: 0,
      pagesPerShard: 0
    },
    iteration: {
      mode: "inherit",
      batchSize: 100,
      concurrency: 5,
      recordLimit: 0,
      lockKey: "",
      lockStrategy: "none"
    }
  };
}

function normalizeSourceExecutionConfig(config = {}) {
  const defaults = getDefaultSourceExecutionConfig();
  return {
    pagination: {
      ...defaults.pagination,
      ...(config.pagination || {})
    },
    iteration: {
      ...defaults.iteration,
      ...(config.iteration || {})
    }
  };
}

function readIntegerInput(selector, fallback = 0) {
  const value = Number($(selector)?.value || fallback);
  return Number.isFinite(value) ? value : fallback;
}

function collectSourceExecutionConfig() {
  return {
    pagination: {
      mode: $("#flowNodePaginationModeSelect").value,
      pageParam: $("#flowNodePageParamInput").value.trim() || "page",
      pageSizeParam: $("#flowNodePageSizeParamInput").value.trim() || "pageSize",
      pageSize: Math.max(1, readIntegerInput("#flowNodePageSizeInput", 100)),
      startPage: Math.max(0, readIntegerInput("#flowNodeStartPageInput", 1)),
      nextTokenPath: $("#flowNodeNextTokenPathInput").value.trim(),
      hasNextPath: $("#flowNodeHasNextPathInput").value.trim(),
      maxPages: Math.max(1, readIntegerInput("#flowNodeMaxPagesInput", 100)),
      totalPages: Math.max(0, readIntegerInput("#flowNodeTotalPagesInput", 0)),
      pagesPerShard: Math.max(0, readIntegerInput("#flowNodePagesPerShardInput", 0))
    },
    iteration: {
      mode: $("#flowNodeInputIterationSelect").value,
      batchSize: Math.max(1, readIntegerInput("#flowNodeBatchSizeInput", 100)),
      concurrency: Math.max(1, readIntegerInput("#flowNodeConcurrencyInput", 5)),
      recordLimit: Math.max(0, readIntegerInput("#flowNodeRecordLimitInput", 0)),
      lockKey: $("#flowNodeLockKeyInput").value.trim(),
      lockStrategy: $("#flowNodeLockStrategySelect").value
    }
  };
}

function populateSourceExecutionConfig(config = {}) {
  const normalized = normalizeSourceExecutionConfig(config);
  setSelectValue("#flowNodePaginationModeSelect", normalized.pagination.mode);
  $("#flowNodePageParamInput").value = normalized.pagination.pageParam;
  $("#flowNodePageSizeParamInput").value = normalized.pagination.pageSizeParam;
  $("#flowNodePageSizeInput").value = normalized.pagination.pageSize;
  $("#flowNodeStartPageInput").value = normalized.pagination.startPage;
  $("#flowNodeNextTokenPathInput").value = normalized.pagination.nextTokenPath;
  $("#flowNodeHasNextPathInput").value = normalized.pagination.hasNextPath;
  $("#flowNodeMaxPagesInput").value = normalized.pagination.maxPages;
  $("#flowNodeTotalPagesInput").value = normalized.pagination.totalPages;
  $("#flowNodePagesPerShardInput").value = normalized.pagination.pagesPerShard;
  setSelectValue("#flowNodeInputIterationSelect", normalized.iteration.mode);
  $("#flowNodeBatchSizeInput").value = normalized.iteration.batchSize;
  $("#flowNodeConcurrencyInput").value = normalized.iteration.concurrency;
  $("#flowNodeRecordLimitInput").value = normalized.iteration.recordLimit;
  $("#flowNodeLockKeyInput").value = normalized.iteration.lockKey;
  setSelectValue("#flowNodeLockStrategySelect", normalized.iteration.lockStrategy);
}

function makeFlowNode(type = "source", refId = "", overrides = {}) {
  const resolvedRef = refId || getFlowRefOptions(type)[0]?.value || "";
  return {
    id: `node_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`,
    type,
    refId: resolvedRef,
    name: getFlowRefLabel(type, resolvedRef),
    executionMode: type === "source" ? "parallel" : "serial",
    param: type === "context" ? "context.start_time / context.end_time" : "",
    branchFromId: "",
    branchName: "",
    branchCondition: "",
    executionConfig: type === "source" ? getDefaultSourceExecutionConfig() : undefined,
    ...overrides
  };
}

function defaultFlowNodesFromFlow(flow = {}) {
  if (Array.isArray(flow.nodes) && flow.nodes.length) {
    const nodes = flow.nodes.map((node, index) => ({
      id: node.id || `node_${index}_${Date.now()}`,
      type: node.type || "source",
      refId: node.refId || "",
      name: node.name || getFlowRefLabel(node.type || "source", node.refId),
      executionMode: node.executionMode || "serial",
      param: node.param || "",
      branchFromId: node.branchFromId || "",
      branchName: node.branchName || "",
      branchCondition: node.branchCondition || "",
      executionConfig: node.type === "source" ? normalizeSourceExecutionConfig(node.executionConfig) : node.executionConfig
    }));
    appState.flowEdges = normalizeFlowDagGraph(nodes, flow.edges || []).edges;
    appState.selectedFlowEdgeId = appState.flowEdges[0]?.id || "";
    return nodes;
  }
  const nodes = [
    { id: "node_context", type: "context", refId: "time-window", name: "业务时间窗口", executionMode: "serial", param: "context.start_time / context.end_time" },
    ...(flow.dataSourceIds || []).map((id) => ({ id: `node_source_${id}`, type: "source", refId: id, name: getFlowRefLabel("source", id), executionMode: "parallel", param: "", executionConfig: getDefaultSourceExecutionConfig() })),
    ...(flow.ruleIds || []).map((id) => ({ id: `node_rule_${id}`, type: "rule", refId: id, name: getFlowRefLabel("rule", id), executionMode: "join", param: "" })),
    { id: "node_output", type: "output", refId: "business-table", name: flow.outputConfig?.businessTable || "业务表输出", executionMode: "serial", param: flow.outputConfig?.writeStrategy || "upsert" }
  ];
  appState.flowEdges = normalizeFlowDagGraph(nodes, []).edges;
  appState.selectedFlowEdgeId = appState.flowEdges[0]?.id || "";
  return nodes;
}

function selectFlowNode(nodeId) {
  appState.selectedFlowNodeId = nodeId || appState.flowNodes[0]?.id || "";
  const node = appState.flowNodes.find((item) => item.id === appState.selectedFlowNodeId);
  if (!node) {
    $("#flowNodeNameInput").value = "";
    renderFlowNodeRefSelect("#flowNodeRefEditSelect", "source");
    renderFlowBranchFromSelect();
    populateSourceExecutionConfig();
    updateFlowInspectorMode();
    return;
  }
  $("#flowNodeNameInput").value = node.name || "";
  setSelectValue("#flowNodeTypeEditSelect", node.type || "source");
  renderFlowNodeRefSelect("#flowNodeRefEditSelect", node.type || "source", node.refId || "");
  setSelectValue("#flowNodeExecutionSelect", node.executionMode || "serial");
  setSelectValue("#flowNodeBranchModeSelect", node.branchFromId ? "branch" : "main");
  renderFlowBranchFromSelect(node.branchFromId || "", node.id);
  $("#flowNodeBranchNameInput").value = node.branchName || "";
  $("#flowNodeBranchConditionInput").value = node.branchCondition || "";
  $("#flowNodeParamInput").value = node.param || "";
  populateSourceExecutionConfig(node.executionConfig);
  updateFlowInspectorMode();
}

function updateFlowInspectorMode() {
  const inspector = $("#flowNodeInspector");
  if (!inspector) return;
  const nodeType = $("#flowNodeTypeEditSelect")?.value || "source";
  const paginationMode = $("#flowNodePaginationModeSelect")?.value || "inherit";
  const iterationMode = $("#flowNodeInputIterationSelect")?.value || "inherit";
  inspector.classList.toggle("branch-mode", $("#flowNodeBranchModeSelect")?.value === "branch");
  inspector.classList.toggle("source-node-mode", nodeType === "source");
  inspector.classList.toggle("pagination-page-number", paginationMode === "page-number");
  inspector.classList.toggle("pagination-next-token", paginationMode === "next-token");
  inspector.classList.toggle("iteration-per-record", iterationMode === "per-record");
  inspector.classList.toggle("iteration-batch", iterationMode === "batch");
}

function getExecutionLabel(mode) {
  if (mode === "parallel") return "并行分支";
  if (mode === "join") return "等待汇聚";
  return "串行主线";
}

function buildFlowStages(nodes = []) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const branchNodesByParent = new Map();
  nodes.forEach((node, index) => {
    if (!node.branchFromId || !nodeIds.has(node.branchFromId)) return;
    if (!branchNodesByParent.has(node.branchFromId)) {
      branchNodesByParent.set(node.branchFromId, []);
    }
    branchNodesByParent.get(node.branchFromId).push({ node, index });
  });
  const branchNodeIds = new Set([...branchNodesByParent.values()].flat().map((item) => item.node.id));
  const mainNodes = nodes.filter((node) => !branchNodeIds.has(node.id));
  const stages = [];
  for (let index = 0; index < mainNodes.length; index += 1) {
    const node = mainNodes[index];
    if (node.executionMode === "parallel") {
      const branches = [node];
      while (mainNodes[index + 1]?.executionMode === "parallel") {
        index += 1;
        branches.push(mainNodes[index]);
      }
      stages.push({ type: "parallel", nodes: branches });
    } else {
      stages.push({ type: "single", nodes: [node] });
    }
    const parentNodes = stageNodes(stages[stages.length - 1]);
    parentNodes.forEach((parentNode) => {
      const branchEntries = branchNodesByParent.get(parentNode.id) || [];
      if (!branchEntries.length) return;
      const branchesByName = new Map();
      branchEntries.forEach(({ node: branchNode, index: originalIndex }) => {
        const branchKey = branchNode.branchName || `分支 ${branchesByName.size + 1}`;
        if (!branchesByName.has(branchKey)) {
          branchesByName.set(branchKey, {
            name: branchKey,
            condition: branchNode.branchCondition || "",
            nodes: [],
            firstIndex: originalIndex
          });
        }
        const branch = branchesByName.get(branchKey);
        branch.nodes.push(branchNode);
        if (!branch.condition && branchNode.branchCondition) {
          branch.condition = branchNode.branchCondition;
        }
      });
      stages.push({
        type: "branch",
        parent: parentNode,
        branches: [...branchesByName.values()].sort((a, b) => a.firstIndex - b.firstIndex)
      });
    });
  }
  return stages;
}

function stageNodes(stage) {
  if (!stage) return [];
  if (stage.nodes) return stage.nodes;
  if (stage.branches) return stage.branches.flatMap((branch) => branch.nodes);
  return [];
}

function renderFlowNodeCard(node, index, variant = "") {
  return `
    <div class="flow-node-card ${variant} ${node.id === appState.selectedFlowNodeId ? "selected" : ""}" data-flow-node-id="${escapeHtml(node.id)}">
      <div class="flow-node-topline">
        <div class="flow-node-type">${escapeHtml(flowNodeTypeLabels[node.type] || node.type)} #${index + 1}</div>
        <span class="flow-execution-badge ${escapeHtml(node.executionMode || "serial")}">${escapeHtml(getExecutionLabel(node.executionMode))}</span>
      </div>
      <strong>${escapeHtml(node.name || getFlowRefLabel(node.type, node.refId))}</strong>
      <small>${escapeHtml(getFlowRefLabel(node.type, node.refId))}</small>
      ${node.branchFromId ? `<small>分支：${escapeHtml(node.branchName || "未命名分支")}</small>` : ""}
      <small>${escapeHtml(node.param || "无额外参数")}</small>
      <div class="flow-node-actions">
        <button class="small-button" data-flow-node-action="edit" data-flow-node-id="${escapeHtml(node.id)}">编辑</button>
        <button class="small-button danger" data-flow-node-action="delete" data-flow-node-id="${escapeHtml(node.id)}">删除</button>
      </div>
    </div>
  `;
}

function renderFlowDesigner() {
  if (!appState.flowNodes.length) {
    appState.flowNodes = defaultFlowNodesFromFlow({ dataSourceIds: [], ruleIds: [], outputConfig: collectFlowForm().outputConfig });
  }
  appState.flowEdges = normalizeFlowDagGraph(appState.flowNodes, appState.flowEdges).edges;
  if (!appState.selectedFlowNodeId || !appState.flowNodes.some((node) => node.id === appState.selectedFlowNodeId)) {
    appState.selectedFlowNodeId = appState.flowNodes[0]?.id || "";
  }
  let nodeIndex = 0;
  const edgeSummary = renderFlowEdgeSummary(appState.flowEdges);
  $("#flowDesigner").innerHTML = `<svg class="flow-edge-svg" id="flowEdgeSvg" aria-hidden="true"></svg>${edgeSummary}${buildFlowStages(appState.flowNodes)
    .map((stage) => {
      if (stage.type === "parallel") {
        const branchCards = stage.nodes
          .map((node) => renderFlowNodeCard(node, nodeIndex++, "parallel-branch"))
          .join("");
        return `
          <div class="flow-stage parallel-stage">
            <div class="flow-branch-label">并行分支</div>
            <div class="flow-parallel-branches">${branchCards}</div>
          </div>
        `;
      }
      if (stage.type === "branch") {
        const branchLanes = stage.branches
          .map((branch) => `
            <div class="flow-branch-lane">
              <div class="flow-branch-lane-head">
                <strong>${escapeHtml(branch.name)}</strong>
                <small>${escapeHtml(branch.condition || "无条件，进入该分支")}</small>
              </div>
              <div class="flow-branch-lane-body">
                ${branch.nodes.map((node) => renderFlowNodeCard(node, nodeIndex++, "branch-node")).join("")}
              </div>
            </div>
          `)
          .join("");
        return `
          <div class="flow-stage conditional-branch-stage">
            <div class="flow-gateway fork-gateway">
              <span>FORK</span>
              <strong>${escapeHtml(stage.parent.name || getFlowRefLabel(stage.parent.type, stage.parent.refId))}</strong>
              <small>${escapeHtml(String(stage.branches.length))} 条条件分支并行进入，条件不满足的分支会跳过</small>
            </div>
            <div class="flow-conditional-branches">${branchLanes}</div>
            <div class="flow-gateway join-gateway">
              <span>JOIN</span>
              <strong>等待分支汇聚</strong>
              <small>后续 join 节点会等待本组分支输出后继续执行</small>
            </div>
          </div>
        `;
      }
      const node = stage.nodes[0];
      return `<div class="flow-stage ${escapeHtml(node.executionMode || "serial")}-stage">${renderFlowNodeCard(node, nodeIndex++)}</div>`;
    })
    .join("")}`;
  selectFlowNode(appState.selectedFlowNodeId);
  renderFlowEdgeEditor();
  renderIcons();
  requestAnimationFrame(renderFlowEdgeLines);
}

function renderFlowControls() {
  renderFlowNodeRefSelect("#flowNodeRefSelect", $("#flowNodeTypeSelect")?.value || "source");
  const flow = getSelectedFlow() || window.opsData.businessFlows?.[0];
  if (flow) {
    populateFlowForm(flow);
  } else {
    resetFlowForm();
  }
  renderFlowDesigner();
  setBusinessDetailMode(appState.businessDetailMode);
}

function getSelectedFlow() {
  return (window.opsData.businessFlows || []).find((flow) => flow.id === appState.selectedFlowId);
}

function populateFlowForm(flow) {
  if (!flow) return;
  appState.selectedFlowId = flow.id;
  $("#flowNameInput").value = flow.name;
  $("#flowBusinessInput").value = flow.businessName;
  setSelectValue("#flowOutputModeSelect", flow.outputMode);
  const outputConfig = flow.outputConfig || {};
  setSelectValue("#flowWriteStrategySelect", outputConfig.writeStrategy || "upsert");
  $("#flowPrimaryKeyInput").value = outputConfig.primaryKey || "event_id";
  $("#flowRawTableInput").value = outputConfig.rawTable || `raw_${flow.businessName || "business"}`;
  $("#flowCleanTableInput").value = outputConfig.cleanTable || `clean_${flow.businessName || "business"}`;
  $("#flowBusinessTableInput").value = outputConfig.businessTable || `biz_${flow.businessName || "business"}`;
  setSelectValue("#flowDedupeStrategySelect", outputConfig.dedupeStrategy || "primary-key");
  $("#flowDedupeFieldsInput").value = outputConfig.dedupeFields || "";
  updateFlowDedupeVisibility();
  appState.flowNodes = defaultFlowNodesFromFlow(flow);
  appState.selectedFlowNodeId = appState.flowNodes[0]?.id || "";
}

function updateFlowDedupeVisibility() {
  const config = $(".flow-config");
  config?.classList.toggle("is-field-combo", $("#flowDedupeStrategySelect")?.value === "field-combo");
}

function resetFlowForm() {
  appState.selectedFlowId = "";
  $("#flowNameInput").value = "新业务聚合流";
  $("#flowBusinessInput").value = "新业务模块";
  setSelectValue("#flowOutputModeSelect", "upsert-business");
  setSelectValue("#flowWriteStrategySelect", "upsert");
  $("#flowPrimaryKeyInput").value = "event_id";
  $("#flowRawTableInput").value = "raw_new_business";
  $("#flowCleanTableInput").value = "clean_new_business";
  $("#flowBusinessTableInput").value = "biz_new_business";
  setSelectValue("#flowDedupeStrategySelect", "primary-key");
  $("#flowDedupeFieldsInput").value = "";
  updateFlowDedupeVisibility();
  appState.flowNodes = defaultFlowNodesFromFlow({ dataSourceIds: [], ruleIds: [], outputConfig: collectFlowForm().outputConfig });
  appState.selectedFlowNodeId = appState.flowNodes[0]?.id || "";
  renderFlowDesigner();
}

function renderFlowTable() {
  const modernHeader = ["业务", "业务流", "节点", "拓扑", "业务表", "状态", "操作"];
  $("#flowTable").innerHTML = [
    `<div class="flow-list-row header">${modernHeader.map((cell) => `<span>${escapeHtml(cell)}</span>`).join("")}</div>`,
    ...(window.opsData.businessFlows || []).map((flow) => {
      const nodes = flow.nodes || [];
      const parallel = nodes.filter((node) => node.executionMode === "parallel").length;
      const branchCount = new Set(nodes.filter((node) => node.branchFromId).map((node) => `${node.branchFromId}:${node.branchName || node.id}`)).size;
      const edgeCount = (flow.edges || []).length || normalizeFlowDagGraph(nodes, []).edges.length;
      const selected = flow.id === appState.selectedFlowId ? "selected" : "";
      const outputTable = flow.outputConfig?.businessTable || `biz_${flow.businessName || "business"}`;
      const topology = branchCount ? `${branchCount} 分支 / ${edgeCount} 边` : parallel ? `${parallel} 并行 / ${edgeCount} 边` : `串行 / ${edgeCount} 边`;
      return `
        <div class="flow-list-row ${selected}" data-flow-id="${escapeHtml(flow.id)}">
          <span>${escapeHtml(flow.businessName)}</span>
          <span>${escapeHtml(flow.name)}</span>
          <span>${escapeHtml(String(nodes.length || (flow.dataSourceIds?.length || 0) + (flow.ruleIds?.length || 0)))}</span>
          <span>${escapeHtml(topology)}</span>
          <span>${escapeHtml(outputTable)}</span>
          <span>${escapeHtml(flow.status || "ready")}</span>
          <span class="row-actions">
            <button class="small-button" data-flow-action="preview" data-flow-id="${escapeHtml(flow.id)}">预览</button>
            <button class="small-button" data-flow-action="edit" data-flow-id="${escapeHtml(flow.id)}">编辑</button>
            <button class="small-button" data-flow-action="run" data-flow-id="${escapeHtml(flow.id)}">运行</button>
            <button class="small-button danger" data-flow-action="delete" data-flow-id="${escapeHtml(flow.id)}">删除</button>
          </span>
        </div>
      `;
    }),
    ...(window.opsData.businessFlows || []).length
      ? []
      : ['<div class="flow-list-row empty"><span>暂无业务，点击右上角新增业务开始配置。</span></div>']
  ].join("");
}

function normalizeFlowDagGraph(nodes = [], explicitEdges = []) {
  const normalized = nodes.map((node) => ({
    ...node,
    predecessors: [],
    successors: []
  }));
  const branchChildrenByParent = new Map();
  normalized.forEach((node) => {
    if (!node.branchFromId) return;
    if (!branchChildrenByParent.has(node.branchFromId)) branchChildrenByParent.set(node.branchFromId, []);
    branchChildrenByParent.get(node.branchFromId).push(node.id);
  });
  const mainNodes = normalized.filter((node) => !node.branchFromId);
  let previousStageIds = [];
  for (let index = 0; index < mainNodes.length; index += 1) {
    const node = mainNodes[index];
    if (node.executionMode === "parallel") {
      const group = [node];
      while (mainNodes[index + 1]?.executionMode === "parallel") {
        index += 1;
        group.push(mainNodes[index]);
      }
      group.forEach((item) => {
        item.predecessors = [...previousStageIds];
      });
      previousStageIds = group.map((item) => item.id);
      continue;
    }
    const branchOutputs = node.executionMode === "join"
      ? previousStageIds.flatMap((id) => branchChildrenByParent.get(id) || [])
      : [];
    node.predecessors = [...new Set([...previousStageIds, ...branchOutputs])];
    previousStageIds = [node.id];
  }
  normalized.forEach((node) => {
    if (node.branchFromId) {
      node.predecessors = [node.branchFromId];
    }
  });
  const byId = new Map(normalized.map((node) => [node.id, node]));
  const validNodeIds = new Set(normalized.map((node) => node.id));
  const inferredEdges = [];
  const mergedEdges = [];
  const addEdge = (edge, generated = false) => {
    if (!edge?.from || !edge?.to || edge.from === edge.to) return;
    if (!validNodeIds.has(edge.from) || !validNodeIds.has(edge.to)) return;
    const duplicate = mergedEdges.find((item) => item.from === edge.from && item.to === edge.to);
    const nextEdge = {
      id: edge.id || `edge_${edge.from}_${edge.to}`,
      from: edge.from,
      to: edge.to,
      type: edge.type || "serial",
      condition: edge.condition || "",
      label: edge.label || "",
      generated
    };
    if (duplicate) {
      duplicate.type = edge.type || duplicate.type;
      duplicate.condition = edge.condition || duplicate.condition;
      duplicate.label = edge.label || duplicate.label;
      duplicate.generated = duplicate.generated && generated;
      return;
    }
    mergedEdges.push(nextEdge);
  };
  normalized.forEach((node) => {
    (node.predecessors || []).forEach((predecessorId) => {
      const predecessor = byId.get(predecessorId);
      if (!predecessor) return;
      predecessor.successors = [...new Set([...(predecessor.successors || []), node.id])];
      const explicit = explicitEdges.find((edge) => edge.from === predecessorId && edge.to === node.id);
      inferredEdges.push({
        id: explicit?.id || `edge_${predecessorId}_${node.id}`,
        from: predecessorId,
        to: node.id,
        type: node.branchFromId ? "condition" : node.executionMode === "parallel" ? "parallel" : node.executionMode === "join" ? "join" : "serial",
        condition: explicit?.condition || node.branchCondition || "",
        label: explicit?.label || (node.branchName ? `${node.branchName}${node.branchCondition ? `：${node.branchCondition}` : ""}` : "")
      });
    });
  });
  inferredEdges.forEach((edge) => addEdge(edge, true));
  explicitEdges.forEach((edge) => addEdge(edge, Boolean(edge.generated)));
  mergedEdges.forEach((edge) => {
    const predecessor = byId.get(edge.from);
    const successor = byId.get(edge.to);
    if (!predecessor || !successor) return;
    predecessor.successors = [...new Set([...(predecessor.successors || []), edge.to])];
    successor.predecessors = [...new Set([...(successor.predecessors || []), edge.from])];
  });
  return { nodes: normalized, edges: mergedEdges };
}

function getFlowEdgeTypeLabel(type) {
  return {
    serial: "Serial",
    parallel: "Parallel",
    condition: "Condition",
    join: "Join",
    custom: "Custom"
  }[type] || type || "Custom";
}

function renderFlowEdgeSummary(edges = []) {
  if (!edges.length) return "";
  const nodeById = new Map((appState.flowNodes || []).map((node) => [node.id, node]));
  const grouped = edges.reduce((acc, edge) => {
    acc[edge.type] = (acc[edge.type] || 0) + 1;
    return acc;
  }, {});
  return `
    <div class="flow-edge-summary">
      <span>DAG</span>
      ${Object.entries(grouped).map(([type, count]) => `<small>${escapeHtml(getFlowEdgeTypeLabel(type))} ${escapeHtml(String(count))}</small>`).join("")}
      <div class="flow-edge-list">
        ${edges.slice(0, 8).map((edge) => {
          const from = nodeById.get(edge.from);
          const to = nodeById.get(edge.to);
          return `
            <small class="flow-edge-chip" title="${escapeHtml(edge.condition || edge.label || "")}">
              ${escapeHtml(from?.name || edge.from)} -> ${escapeHtml(to?.name || edge.to)}${edge.generated ? " · auto" : " · manual"}
            </small>
          `;
        }).join("")}
        ${edges.length > 8 ? `<small class="flow-edge-chip">+${escapeHtml(String(edges.length - 8))} 条</small>` : ""}
      </div>
    </div>
  `;
}

function renderFlowEdgeEditor() {
  const fromSelect = $("#flowEdgeFromSelect");
  const toSelect = $("#flowEdgeToSelect");
  const list = $("#flowEdgeList");
  if (!fromSelect || !toSelect || !list) return;
  const nodeOptions = (appState.flowNodes || [])
    .map((node) => `<option value="${escapeHtml(node.id)}">${escapeHtml(node.name || getFlowRefLabel(node.type, node.refId) || node.id)}</option>`)
    .join("");
  fromSelect.innerHTML = nodeOptions;
  toSelect.innerHTML = nodeOptions;
  const selectedEdge = appState.flowEdges.find((edge) => edge.id === appState.selectedFlowEdgeId) || appState.flowEdges.find((edge) => !edge.generated) || appState.flowEdges[0];
  appState.selectedFlowEdgeId = selectedEdge?.id || "";
  if (selectedEdge) {
    setSelectValue("#flowEdgeFromSelect", selectedEdge.from);
    setSelectValue("#flowEdgeToSelect", selectedEdge.to);
    setSelectValue("#flowEdgeTypeSelect", selectedEdge.type || "serial");
    $("#flowEdgeConditionInput").value = selectedEdge.condition || "";
    $("#flowEdgeLabelInput").value = selectedEdge.label || "";
  } else {
    setSelectValue("#flowEdgeFromSelect", appState.flowNodes[0]?.id || "");
    setSelectValue("#flowEdgeToSelect", appState.flowNodes[1]?.id || "");
    setSelectValue("#flowEdgeTypeSelect", "serial");
    $("#flowEdgeConditionInput").value = "";
    $("#flowEdgeLabelInput").value = "";
  }
  list.innerHTML = appState.flowEdges.length
    ? appState.flowEdges
        .map((edge) => {
          const from = appState.flowNodes.find((node) => node.id === edge.from);
          const to = appState.flowNodes.find((node) => node.id === edge.to);
          return `
            <button class="flow-edge-editor-item ${edge.id === appState.selectedFlowEdgeId ? "selected" : ""}" type="button" data-flow-edge-id="${escapeHtml(edge.id)}">
              <strong>${escapeHtml(from?.name || edge.from)} -> ${escapeHtml(to?.name || edge.to)}</strong>
              <small>${escapeHtml(getFlowEdgeTypeLabel(edge.type))}${edge.generated ? " / auto" : " / manual"}${edge.condition ? ` / ${escapeHtml(edge.condition)}` : ""}</small>
            </button>
          `;
        })
        .join("")
    : '<small class="muted-text">No DAG edge yet.</small>';
}

function saveFlowEdgeFromEditor() {
  const from = $("#flowEdgeFromSelect")?.value || "";
  const to = $("#flowEdgeToSelect")?.value || "";
  if (!from || !to || from === to) return;
  const edge = {
    id: appState.selectedFlowEdgeId && appState.flowEdges.some((item) => item.id === appState.selectedFlowEdgeId && !item.generated)
      ? appState.selectedFlowEdgeId
      : `edge_${from}_${to}_${Date.now()}`,
    from,
    to,
    type: $("#flowEdgeTypeSelect")?.value || "custom",
    condition: $("#flowEdgeConditionInput")?.value.trim() || "",
    label: $("#flowEdgeLabelInput")?.value.trim() || "",
    generated: false
  };
  appState.flowEdges = appState.flowEdges.filter((item) => item.id !== edge.id && !(item.from === from && item.to === to));
  appState.flowEdges.push(edge);
  appState.selectedFlowEdgeId = edge.id;
  renderFlowDesigner();
}

function deleteFlowEdgeFromEditor() {
  if (!appState.selectedFlowEdgeId) return;
  const selected = appState.flowEdges.find((edge) => edge.id === appState.selectedFlowEdgeId);
  if (!selected || selected.generated) return;
  appState.flowEdges = appState.flowEdges.filter((edge) => edge.id !== appState.selectedFlowEdgeId);
  appState.selectedFlowEdgeId = "";
  renderFlowDesigner();
}

function renderFlowEdgeLines() {
  const designer = $("#flowDesigner");
  const svg = $("#flowEdgeSvg");
  if (!designer || !svg) return;
  const rect = designer.getBoundingClientRect();
  const width = Math.max(designer.scrollWidth, rect.width);
  const height = Math.max(designer.scrollHeight, rect.height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  const paths = appState.flowEdges
    .map((edge) => {
      const fromCard = designer.querySelector(`[data-flow-node-id="${CSS.escape(edge.from)}"]`);
      const toCard = designer.querySelector(`[data-flow-node-id="${CSS.escape(edge.to)}"]`);
      if (!fromCard || !toCard) return "";
      const fromRect = fromCard.getBoundingClientRect();
      const toRect = toCard.getBoundingClientRect();
      const startX = fromRect.right - rect.left + designer.scrollLeft;
      const startY = fromRect.top + fromRect.height / 2 - rect.top + designer.scrollTop;
      const endX = toRect.left - rect.left + designer.scrollLeft;
      const endY = toRect.top + toRect.height / 2 - rect.top + designer.scrollTop;
      const delta = Math.max(60, Math.abs(endX - startX) * 0.45);
      const path = `M ${startX} ${startY} C ${startX + delta} ${startY}, ${endX - delta} ${endY}, ${endX} ${endY}`;
      const className = edge.generated ? "flow-edge-line generated" : "flow-edge-line manual";
      return `<path class="${className}" d="${path}" marker-end="url(#flowArrow)" />`;
    })
    .join("");
  svg.innerHTML = `
    <defs>
      <marker id="flowArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" class="flow-edge-arrow" />
      </marker>
    </defs>
    ${paths}
  `;
}

function collectFlowForm() {
  const dataSourceIds = appState.flowNodes.filter((node) => node.type === "source" && node.refId).map((node) => node.refId);
  const ruleIds = appState.flowNodes.filter((node) => node.type === "rule" && node.refId).map((node) => node.refId);
  const defaultTimeField = window.opsData.situationTimeFilter?.fields?.[0] || "event_time";
  const graph = normalizeFlowDagGraph(appState.flowNodes, appState.flowEdges);
  return {
    name: $("#flowNameInput").value.trim() || "自定义业务流",
    businessName: $("#flowBusinessInput").value.trim() || "新业务模块",
    timeField: defaultTimeField,
    outputMode: $("#flowOutputModeSelect").value,
    dataSourceIds,
    ruleIds,
    dagVersion: 2,
    nodes: graph.nodes,
    edges: graph.edges,
    outputConfig: {
      writeStrategy: $("#flowWriteStrategySelect").value,
      primaryKey: $("#flowPrimaryKeyInput").value.trim(),
      rawTable: $("#flowRawTableInput").value.trim(),
      cleanTable: $("#flowCleanTableInput").value.trim(),
      businessTable: $("#flowBusinessTableInput").value.trim(),
      dedupeStrategy: $("#flowDedupeStrategySelect").value,
      dedupeFields: $("#flowDedupeFieldsInput").value.trim()
    }
  };
}

function renderFlowOutput(result) {
  if (!result) {
    $("#flowOutput").innerHTML = "<h3>业务执行结果</h3><p>保存并执行业务后，会在这里显示这个业务的唯一业务流、组合数据源、清洗规则和最终业务数据。</p>";
    return;
  }
  const sourcePlanItems = (result.executionPlan?.sourcePlans || [])
    .map((plan) => {
      const pageShardText = Array.isArray(plan.pageShards) && plan.pageShards.length
        ? ` / 页段 ${plan.pageShards.map((shard) => `${escapeHtml(String(shard.start))}-${escapeHtml(String(shard.end))}`).join("，")}`
        : "";
      return `<li>${escapeHtml(plan.sourceName)}：${escapeHtml(plan.iterationMode)} / ${escapeHtml(String(plan.recordCount))} 条记录 / ${escapeHtml(String(plan.batchCount))} 批 / ${escapeHtml(String(plan.pageCount))} 页 / 并发 ${escapeHtml(String(plan.concurrency))}${pageShardText}${plan.lockEnabled ? ` / 锁 ${escapeHtml(plan.lockKey)}(${escapeHtml(plan.lockStrategy)})` : ""}</li>`;
    })
    .join("");
  $("#flowOutput").innerHTML = `
    <h3>业务执行结果</h3>
    <p>${escapeHtml(result.business.name)} 已执行唯一业务流 ${escapeHtml(result.flow.name)}，组合 ${result.sources.length} 个数据源和 ${result.rules.length} 条规则。</p>
    <ul>
      <li>新增业务数据：${result.row.map((cell) => escapeHtml(cell)).join(" / ")}</li>
      <li>数据源：${result.sources.map((source) => escapeHtml(source.name)).join("、") || "未选择"}</li>
      <li>规则：${result.rules.map((rule) => escapeHtml(rule.name)).join("、") || "未选择"}</li>
      <li>落库：原始表 ${escapeHtml(result.outputConfig?.rawTable || "-")}，清洗表 ${escapeHtml(result.outputConfig?.cleanTable || "-")}，业务表 ${escapeHtml(result.outputConfig?.businessTable || "-")}</li>
      <li>写入策略：${escapeHtml(result.outputConfig?.writeStrategy || "-")} / 主键 ${escapeHtml(result.outputConfig?.primaryKey || "-")} / 去重 ${escapeHtml(result.outputConfig?.dedupeStrategy || "-")}${result.outputConfig?.dedupeFields ? ` / 组合字段 ${escapeHtml(result.outputConfig.dedupeFields)}` : ""}</li>
      <li>执行计划：DAG v${escapeHtml(String(result.executionPlan?.dagVersion || 1))}，边 ${escapeHtml(String(result.executionPlan?.edges || 0))} 条，条件边 ${escapeHtml(String(result.executionPlan?.conditionalEdges || 0))} 条；串行 ${escapeHtml(String(result.executionPlan?.serial || 0))} 个，并行 ${escapeHtml(String(result.executionPlan?.parallel || 0))} 个，分支 ${escapeHtml(String(result.executionPlan?.branches || 0))} 条，汇聚 ${escapeHtml(String(result.executionPlan?.join || 0))} 个</li>
      <li>入参循环：${escapeHtml(String(result.parameterPlan?.loopCalls || 0))} 次调用，${escapeHtml(result.parameterPlan?.summary || "固定入参")}</li>
      ${sourcePlanItems ? `<li>数据源执行策略：<ul>${sourcePlanItems}</ul></li>` : ""}
    </ul>
  `;
}

function setupBusinessWorkbenchLayout() {
  const workbench = $(".business-workbench");
  const sectionHead = workbench?.querySelector(":scope > .section-head");
  const profile = $(".business-profile", workbench);
  const flowPanel = $(".business-flow-panel", workbench);
  const resultPanel = $(".business-result-panel", workbench);
  const flowTable = $("#flowTable");
  if (!workbench || !sectionHead || !profile || !flowPanel || !resultPanel || !flowTable || $("#businessDetailPanel")) return;

  const listPanel = document.createElement("section");
  listPanel.className = "business-list-panel";
  listPanel.innerHTML = `
    <div class="business-profile-head">
      <div>
        <p class="eyebrow">Business List</p>
        <h3>已有业务</h3>
      </div>
      <span class="status-pill">先预览，再编辑</span>
    </div>
  `;
  listPanel.append(flowTable);
  sectionHead.after(listPanel);

  const detailPanel = document.createElement("div");
  detailPanel.id = "businessDetailPanel";
  detailPanel.className = "business-detail-panel hidden";
  detailPanel.dataset.businessMode = "list";
  detailPanel.innerHTML = `
    <div class="business-detail-head">
      <div>
        <p class="eyebrow" id="businessDetailEyebrow">Business Detail</p>
        <h3 id="businessDetailTitle">业务详情</h3>
      </div>
      <div class="row-actions"></div>
    </div>
  `;
  const actionBar = $(".row-actions", detailPanel);
  ["createFlowBtn", "runFlowBtn", "deleteFlowBtn"].forEach((id) => {
    const button = $(`#${id}`);
    if (button) actionBar.append(button);
  });
  actionBar.insertAdjacentHTML("afterbegin", '<button class="small-button preview-only" id="previewEditFlowBtn">转入编辑</button>');
  actionBar.insertAdjacentHTML("beforeend", '<button class="small-button" id="closeFlowDetailBtn">收起</button>');
  listPanel.after(detailPanel);
  detailPanel.append(profile, flowPanel, resultPanel);

  const flowResultGrid = $(".flow-result-grid", resultPanel);
  if (flowResultGrid) {
    flowResultGrid.replaceWith($("#flowOutput"));
  }
  const resultTitle = $(".business-result-panel h3", detailPanel);
  if (resultTitle) resultTitle.textContent = "执行验证";

  const advanced = $(".flow-advanced-config");
  const flowConfig = $(".flow-config", advanced);
  if (advanced && flowConfig && !$(".flow-storage-guide", advanced)) {
    const guide = document.createElement("div");
    guide.className = "flow-storage-guide";
    guide.innerHTML = `
      <div><strong>原始表</strong><small>保存数据源刚返回的原始记录，方便追溯接口响应、分页结果和采集异常；不填时自动生成 raw_*。</small></div>
      <div><strong>清洗表</strong><small>保存字段映射、默认值、过滤和规则处理后的中间结果；不填时自动生成 clean_*。</small></div>
      <div><strong>业务表</strong><small>保存最终给态势总览、数据展示和智能分析使用的数据；不填时自动生成 biz_*。</small></div>
    `;
    flowConfig.before(guide);
  }
}

function setupSourceWorkbenchLayout() {
  const modalPanel = $(".source-modal-panel");
  const mappingWorkbench = $(".mapping-workbench");
  const testResult = $("#sourceTestResult");
  if (!modalPanel || !mappingWorkbench || !testResult || mappingWorkbench.closest("#sourceModal")) return;
  mappingWorkbench.classList.remove("cleaning-block", "wide");
  mappingWorkbench.classList.add("source-modal-mapping");
  testResult.before(mappingWorkbench);
}

function isBusinessPreviewMode() {
  return appState.businessDetailMode === "preview";
}

function setBusinessDetailMode(mode = "list") {
  appState.businessDetailMode = mode;
  const detailPanel = $("#businessDetailPanel");
  if (!detailPanel) return;
  const isList = mode === "list";
  const isCreate = mode === "create";
  const isPreview = mode === "preview";
  detailPanel.classList.toggle("hidden", isList);
  detailPanel.dataset.businessMode = mode;
  $("#businessDetailEyebrow").textContent = isCreate ? "Create Business" : mode === "edit" ? "Edit Business" : "Preview Business";
  $("#businessDetailTitle").textContent = isCreate ? "新增业务配置" : mode === "edit" ? "编辑业务配置" : "业务预览";

  $$("input, select, textarea", detailPanel).forEach((control) => {
    control.disabled = isPreview;
  });
  $$(".flow-toolbar button, .flow-inspector button", detailPanel).forEach((button) => {
    button.disabled = isPreview;
  });
  $("#createFlowBtn").disabled = isPreview;
  $("#runFlowBtn").disabled = isList || isCreate;
  $("#deleteFlowBtn").disabled = isList || isCreate;
  $("#previewEditFlowBtn").disabled = isList;
  if (!isList) {
    detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function deleteBusinessFlow(flowId = appState.selectedFlowId) {
  const flow = (window.opsData.businessFlows || []).find((item) => item.id === flowId);
  if (!flow) return;
  try {
    await apiRequest(`/api/business-flows/${encodeURIComponent(flowId)}`, { method: "DELETE" });
  } catch {
    // Local fallback keeps the designer responsive while the API is unavailable.
  }
  window.opsData.businessFlows = (window.opsData.businessFlows || []).filter((item) => item.id !== flowId);
  appState.selectedFlowId = window.opsData.businessFlows[0]?.id || "";
  if (appState.selectedFlowId) {
    populateFlowForm(getSelectedFlow());
    setBusinessDetailMode("preview");
  } else {
    resetFlowForm();
    setBusinessDetailMode("list");
  }
  renderFlowDesigner();
  renderFlowTable();
  renderOverview();
}

async function saveBusinessFlow() {
  const payload = collectFlowForm();
  const sameBusinessFlow = (window.opsData.businessFlows || []).find((flow) =>
    flow.id !== appState.selectedFlowId &&
    (flow.businessName || "").trim().toLowerCase() === payload.businessName.trim().toLowerCase()
  );
  const editingId = appState.selectedFlowId || sameBusinessFlow?.id || "";
  try {
    const saved = await apiRequest(editingId ? `/api/business-flows/${encodeURIComponent(editingId)}` : "/api/business-flows", {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    if ((window.opsData.businessFlows || []).some((flow) => flow.id === saved.id)) {
      window.opsData.businessFlows = (window.opsData.businessFlows || []).map((flow) => (flow.id === saved.id ? saved : flow));
    } else {
      window.opsData.businessFlows.unshift(saved);
    }
    appState.selectedFlowId = saved.id;
    populateFlowForm(saved);
    setBusinessDetailMode("preview");
  } catch {
    const localFlow = { id: editingId || `local_flow_${Date.now()}`, ...payload, status: "ready" };
    if ((window.opsData.businessFlows || []).some((flow) => flow.id === localFlow.id)) {
      window.opsData.businessFlows = (window.opsData.businessFlows || []).map((flow) => (flow.id === localFlow.id ? { ...flow, ...localFlow } : flow));
    } else {
      window.opsData.businessFlows.unshift(localFlow);
    }
    appState.selectedFlowId = localFlow.id;
    populateFlowForm(localFlow);
    setBusinessDetailMode("preview");
  }
  renderFlowDesigner();
  renderFlowTable();
  renderOverview();
  return getSelectedFlow();
}

async function runSelectedBusinessFlow() {
  const flow = await saveBusinessFlow();
  if (!flow) return;
  const runtimeFlow = { ...flow, ...collectFlowForm(), id: flow.id, status: flow.status || "ready" };
  try {
    const result = await apiRequest("/api/business-flows/run", {
      method: "POST",
      body: JSON.stringify({ flowId: flow.id, flow: runtimeFlow })
    });
    renderFlowOutput(result);
    await loadBootstrapData();
    appState.selectedFlowId = result.flow.id;
    populateFlowForm(result.flow);
    renderBusinessSelector();
    $("#businessSelect").value = result.business.name;
    renderBusinessRows({ name: result.business.name, rows: result.business.rows });
    renderFlowTable();
    await refreshSyncLogs();
    renderOverview();
  } catch {
    const payload = collectFlowForm();
    // Keep the no-code designer demonstrable even when the backend is temporarily offline.
    renderFlowOutput({
      flow: { ...flow, ...payload },
      sources: window.opsData.sources.filter((source) => payload.dataSourceIds.includes(source.id)),
      rules: window.opsData.cleaningRules.filter((rule) => payload.ruleIds.includes(rule.id)),
      outputConfig: payload.outputConfig,
      parameterPlan: { loopCalls: payload.dataSourceIds.length, summary: "本地模拟执行" },
      business: { name: payload.businessName },
      row: [`${payload.businessName} 聚合数据`, "P1", "本地模拟", new Date().toISOString().slice(0, 16).replace("T", " "), `${payload.ruleIds.length} 条规则`]
    });
    renderOverview();
  }
  renderIcons();
}

function renderMappings() {
  renderMappingSourceSelect();
  renderMappingRuleSelect();
  const selectedSourceId = appState.selectedSourceId;
  const mappings = (window.opsData.fieldMappings || []).filter((item) => item.sourceId === selectedSourceId);
  const fallbackRows = (window.opsData.mappings || []).map((row) => ({
    id: "",
    sourceField: row[0],
    targetField: row[1],
    type: row[2],
    defaultValue: row.length > 5 ? row[3] : "",
    rule: row.length > 5 ? row[4] : row[3],
    recordMode: "per-record",
    output: row.length > 5 ? row[5] : row[4]
  }));
  const header = ["源字段", "目标字段", "映射方式", "类型", "默认值", "清洗规则", "输出目标", "操作"];
  const items = mappings.length ? mappings : fallbackRows;
  $("#mappingTable").innerHTML = [
    `<div class="mapping-row header">${header.map((cell) => `<span>${escapeHtml(cell)}</span>`).join("")}</div>`,
    ...items.map((item) => {
      const rule = getRuleById(item.ruleId);
      const ruleText = item.ruleParam
        ? `${rule?.name || item.rule || "自定义规则"} / ${item.ruleParam}`
        : rule?.name || item.rule || "-";
      const modeText = item.recordMode === "aggregate-records"
        ? `合并${item.aggregateMode === "first" ? "首个值" : item.aggregateMode === "array" ? "数组" : "拼接"}`
        : "逐条";
      return `
        <div class="mapping-row" data-mapping-id="${escapeHtml(item.id || "")}">
          <span>${escapeHtml(item.sourceField)}</span>
          <span>${escapeHtml(item.targetField)}</span>
          <span title="${escapeHtml(item.recordFilter || "")}">${escapeHtml(modeText)}</span>
          <span>${escapeHtml(item.type)}</span>
          <span>${escapeHtml(item.defaultValue || "-")}</span>
          <span title="${escapeHtml(rule?.description || item.rule || "")}">${escapeHtml(ruleText)}</span>
          <span>${escapeHtml(item.output)}</span>
          <span class="row-actions">
            <button class="small-button" type="button" data-mapping-action="edit" data-mapping-id="${escapeHtml(item.id || "")}" ${item.id ? "" : "disabled"}>编辑</button>
            <button class="small-button danger" type="button" data-mapping-action="delete" data-mapping-id="${escapeHtml(item.id || "")}" ${item.id ? "" : "disabled"}>删除</button>
          </span>
        </div>
      `;
    })
  ].join("");
  if ($("#sourceModal")?.open) {
    setSourceFormReadonly(appState.sourceDetailMode === "preview");
  }
}

function updateMappingModeVisibility() {
  const editor = $(".mapping-editor");
  const isAggregate = $("#mapRecordModeSelect")?.value === "aggregate-records";
  editor?.classList.toggle("is-aggregate", Boolean(isAggregate));
}

function resetMappingForm() {
  appState.editingMappingId = "";
  $("#mapSourceInput").value = "raw.status";
  $("#mapTargetInput").value = "status";
  setSelectValue("#mapTypeSelect", "字符串");
  $("#mapDefaultInput").value = "";
  setSelectValue("#mapRecordModeSelect", "per-record");
  $("#mapRecordFilterInput").value = "";
  setSelectValue("#mapAggregateModeSelect", "join");
  $("#mapAggregateSeparatorInput").value = ",";
  renderMappingRuleSelect();
  $("#addMappingBtn").innerHTML = '<span class="icon" data-icon="plus"></span> 添加映射';
  updateMappingModeVisibility();
  renderIcons();
}

function populateMappingForm(mapping) {
  if (!mapping) return;
  appState.editingMappingId = mapping.id;
  $("#mapSourceInput").value = mapping.sourceField || "";
  $("#mapTargetInput").value = mapping.targetField || "";
  setSelectValue("#mapTypeSelect", mapping.type || "字符串");
  $("#mapDefaultInput").value = mapping.defaultValue || "";
  setSelectValue("#mapRecordModeSelect", mapping.recordMode || "per-record");
  $("#mapRecordFilterInput").value = mapping.recordFilter || "";
  setSelectValue("#mapAggregateModeSelect", mapping.aggregateMode || "join");
  $("#mapAggregateSeparatorInput").value = mapping.aggregateSeparator ?? ",";
  renderMappingRuleSelect(mapping.ruleId || "");
  $("#addMappingBtn").innerHTML = '<span class="icon" data-icon="plus"></span> 保存映射';
  updateMappingModeVisibility();
  renderIcons();
}

function renderBusinessSelector() {
  const selectedBusiness = $("#businessSelect")?.value || window.opsData.businesses[0]?.name || "";
  $("#businessSelect").innerHTML = window.opsData.businesses
    .map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`)
    .join("");
  setSelectValue("#businessSelect", selectedBusiness);
  renderTimeFieldOptions();
  renderAnalysisControls();
}

function getCurrentBusiness() {
  const current = window.opsData.businesses.find((item) => item.name === $("#businessSelect").value) || window.opsData.businesses[0];
  return current;
}

function setupDisplayWorkbenchLayout() {
  const displayPanel = $("#display");
  const surface = displayPanel?.querySelector(".surface");
  const filterRow = displayPanel?.querySelector(".filter-row");
  const businessContent = $(".business-content", displayPanel);
  const chartPanel = $(".chart-panel", displayPanel);
  if (!surface || !filterRow || !businessContent || !chartPanel || $("#displayAnalysisResult")) return;

  const advancedFilter = document.createElement("div");
  advancedFilter.className = "filter-row compact display-advanced-filter";
  advancedFilter.innerHTML = `
    <label class="full">
      <span class="label-with-help">
        统一业务筛选
        <button class="help-dot" type="button" aria-label="统一筛选说明" data-tooltip="这里复用态势总览的全局筛选配置。某个业务没有对应字段时，会自动跳过该筛选，不影响其他业务。">?</button>
      </span>
      <div class="filter-row compact configured-filter-bar" id="displayConfiguredFilterBar"></div>
    </label>
    <label><span>字段筛选</span><select id="fieldFilterSelect"></select></label>
    <label><span>字段值</span><input id="fieldValueFilterInput" type="search" placeholder="输入字段值关键词" /></label>
    <button class="small-button" id="resetDisplayFiltersBtn" type="button">重置筛选</button>
  `;
  filterRow.after(advancedFilter);

  const displayLayout = document.createElement("div");
  displayLayout.className = "display-layout";
  businessContent.before(displayLayout);
  displayLayout.append(businessContent);
  displayLayout.insertAdjacentHTML(
    "beforeend",
    `<aside class="display-analysis-panel">
      <div class="section-head compact-head">
        <div><p class="eyebrow">Display Insight</p><h3>分析结果</h3></div>
        <button class="small-button" id="refreshDisplayAnalysisBtn" type="button"><span class="icon" data-icon="spark"></span>刷新</button>
      </div>
      <div id="displayAnalysisResult"></div>
    </aside>`
  );

  chartPanel.insertAdjacentHTML(
    "afterbegin",
    `<div class="chart-toolbar">
      <div><p class="eyebrow">Chart View</p><h3 id="displayChartTitle">业务图表</h3></div>
      <div class="segmented icon-tabs" id="chartTypeMode">
        <button class="active" data-chart-type="line" title="折线图"><span class="icon" data-icon="line-chart"></span>折线</button>
        <button data-chart-type="bar" title="柱状图"><span class="icon" data-icon="bar-chart"></span>柱状</button>
        <button data-chart-type="pie" title="饼图"><span class="icon" data-icon="pie-chart"></span>饼图</button>
      </div>
    </div>`
  );
}

function updateSelectOptions(selector, values, allLabel) {
  const select = $(selector);
  if (!select) return;
  const selected = select.value;
  const uniqueValues = [...new Set(values.filter(Boolean).map(String))];
  select.innerHTML = [`<option value="">${escapeHtml(allLabel)}</option>`, ...uniqueValues.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join("");
  setSelectValue(selector, uniqueValues.includes(selected) ? selected : "");
}

function updateDisplayFilterOptions(business) {
  if (!$("#fieldFilterSelect")) return;
  const fields = getBusinessFields(business);
  const selectedField = $("#fieldFilterSelect")?.value || "";
  $("#fieldFilterSelect").innerHTML = [
    '<option value="">全部字段</option>',
    ...fields.map((field, index) => `<option value="${index}">${escapeHtml(field)}</option>`)
  ].join("");
  if (selectedField && Number(selectedField) < fields.length) setSelectValue("#fieldFilterSelect", selectedField);
}

function applyDisplayFilters(business) {
  if (!business) return { fields: [], rows: [] };
  renderConfiguredFilterControls("#displayConfiguredFilterBar", "display");
  updateDisplayFilterOptions(business);
  const fieldIndex = $("#fieldFilterSelect")?.value || "";
  const fieldValue = ($("#fieldValueFilterInput")?.value || "").trim().toLowerCase();
  let rows = [...(business.rows || [])].filter((row) => passesConfiguredFilters(business, row, "display"));
  if (fieldValue) {
    rows = rows.filter((row) => {
      if (fieldIndex !== "") return String(row[Number(fieldIndex)] || "").toLowerCase().includes(fieldValue);
      return row.some((cell) => String(cell).toLowerCase().includes(fieldValue));
    });
  }
  return { ...business, rows };
}

function renderBusinessRows(current) {
  const filtered = applyDisplayFilters(current);
  appState.lastDisplayResult = filtered;
  const rows = [getBusinessFields(filtered), ...(filtered?.rows || [])];
  $("#businessTable").innerHTML = rows
    .map(
      (row, index) => `
        <div class="table-row ${index === 0 ? "header" : ""}">
          ${row.map((cell) => `<span>${escapeHtml(cell)}</span>`).join("")}
        </div>
      `
    )
    .join("");
  drawDisplayChart(filtered);
  renderDisplayAnalysis(filtered);
}

function renderBusinessTable() {
  renderBusinessRows(getCurrentBusiness());
}

async function queryAndRenderBusiness() {
  const fallback = getCurrentBusiness();
  const timePayload = getDisplayTimeRangePayload();
  try {
    const result = await apiRequest("/api/businesses/query", {
      method: "POST",
      body: JSON.stringify({
        businessName: $("#businessSelect").value,
        keyword: $("#tableSearchInput").value,
        sort: $("#sortSelect").value,
        timeField: $("#timeFieldSelect").value,
        ...timePayload,
        view: appState.viewMode
      })
    });
    renderBusinessRows(result);
  } catch (error) {
    let rows = [...fallback.rows];
    const keyword = $("#tableSearchInput").value.trim().toLowerCase();
    if (keyword) {
      rows = rows.filter((row) => row.some((cell) => String(cell).toLowerCase().includes(keyword)));
    }
    const startTime = timePayload.timeStart ? Date.parse(timePayload.timeStart) : 0;
    const endTime = timePayload.timeEnd ? Date.parse(timePayload.timeEnd) : 0;
    if (startTime || endTime) {
      rows = rows.filter((row) => {
        const rowTimeValue = getRowBySemanticField(fallback, row, [$("#timeFieldSelect")?.value, fallback?.timeField, "时间", "event_time", "created_at", "updated_at"], 3);
        const rowTime = Date.parse(String(rowTimeValue || "").replace(" ", "T"));
        if (Number.isNaN(rowTime)) return true;
        return (!startTime || rowTime >= startTime) && (!endTime || rowTime <= endTime);
      });
    }
    renderBusinessRows({ ...fallback, rows: appState.viewMode === "top" ? rows.slice(0, 3) : rows });
  }
}

function renderSignalItems(signals) {
  $("#signalList").innerHTML = signals
    .map(
      (signal) => `
        <div class="signal-item">
          <span class="icon" data-icon="${signal.icon}"></span>
          <div>
            <strong>${signal.title}</strong>
            <small>${signal.desc}</small>
          </div>
          <span class="status-pill ${signal.level === "ok" ? "ok" : "danger"}">${signal.level === "ok" ? "正常" : "需关注"}</span>
        </div>
      `
    )
    .join("");
}

function renderSignals() {
  const { signals, highRiskCount } = buildOverviewModel();
  const riskPill = $("#riskSummaryPill");
  if (riskPill) {
    riskPill.textContent = `${highRiskCount} 项需关注`;
    riskPill.classList.toggle("ok", highRiskCount === 0);
    riskPill.classList.toggle("danger", highRiskCount > 0);
  }
  renderSignalItems(signals);
}

function renderOverview() {
  renderOverviewFilters();
  renderMetrics();
  renderFlow();
  renderSignals();
  drawRiskRadar();
}

function renderKnowledge() {
  $("#knowledgeList").innerHTML = window.opsData.knowledge
    .map(
      (item) => `
        <div class="knowledge-item">
          <span class="icon" data-icon="${item.icon}"></span>
          <div>
            <strong>${item.name}</strong>
            <small>${item.desc}</small>
          </div>
        </div>
      `
    )
    .join("");
}

function renderSyncLog(logs = []) {
  const items = logs.length
    ? logs
    : [
        {
          status: "ready",
          sourceName: "等待同步任务",
          message: "点击执行同步后会显示采集、清洗和写入结果",
          cleanedRows: 0,
          failedRows: 0
        }
      ];
  $("#syncLog").innerHTML = items
    .slice(0, 4)
    .map(
      (log) => `
        <div class="log-row">
          <span class="status-pill ${log.status === "success" ? "ok" : ""}">${escapeHtml(log.status)}</span>
          <strong>${escapeHtml(log.sourceName)}</strong>
          <small>${escapeHtml(log.message)} · 成功 ${escapeHtml(log.cleanedRows)} / 失败 ${escapeHtml(log.failedRows)}</small>
        </div>
      `
    )
    .join("");
}

function renderAnalysis() {
  $("#analysisOutput").innerHTML = `
    <div class="insight-stack">
      <div class="insight-card">
        <h3>结论</h3>
        <p>支付链路在最近 24 小时出现集中波动，核心信号来自 5xx 错误率、MQ 堆积和发布回滚，建议优先排查网关到订单服务的调用路径。</p>
      </div>
      <div class="insight-card">
        <h3>风险</h3>
        <p>P0 告警共 3 次，最长影响 46 分钟。若订单 MQ 消费速率继续低于写入速率，可能触发下游库存与支付状态不一致。</p>
      </div>
      <div class="insight-card">
        <h3>改进措施</h3>
        <p>立即拉齐支付、订单、网关负责人进行联合排查；补充 MQ 消费延迟告警；将发布回滚记录纳入变更风险画像。</p>
      </div>
    </div>
  `;
}

function renderAnalysisResult(result) {
  const sections = result?.sections || [];
  $("#analysisOutput").innerHTML = `
    <div class="insight-stack">
      <div class="insight-card">
        <h3>分析范围</h3>
        <p>${escapeHtml(result?.businessName || "-")} · 模型 ${escapeHtml(result?.model || "-")} · 字段 ${escapeHtml((result?.fields || []).join("、") || "-")}</p>
      </div>
      ${sections
        .map(
          (section) => `
            <div class="insight-card">
              <h3>${escapeHtml(section.title)}</h3>
              <p>${escapeHtml(section.content)}</p>
            </div>
          `
        )
        .join("")}
      ${
        result?.evidence?.length
          ? `<div class="insight-card"><h3>证据</h3><p>${result.evidence
              .map((item) => `${escapeHtml(item.business || "")} ${escapeHtml(item.severity)} ${escapeHtml(item.service)} ${escapeHtml(item.event)} ${escapeHtml(item.time)}`)
              .join("；")}</p></div>`
          : ""
      }
    </div>
  `;
}

function renderAnswer(fallbackQuestion) {
  const question = $("#questionInput").value.trim() || "最近告警集中在哪些服务？";
  $("#answerCard").innerHTML = `
    <h3>回答</h3>
    <p>根据问题“${fallbackQuestion || question}”，系统命中告警业务数据、历史工单知识和运维 SOP。当前告警主要集中在支付服务与订单服务，优先级最高的是支付网关 5xx 升高，其次是订单 MQ 堆积。</p>
    <ul>
      <li>优先处理支付网关到订单服务的接口错误，确认发布、限流、依赖超时是否异常。</li>
      <li>同步检查 MQ 消费组积压，必要时临时扩容消费者并冻结非必要发布。</li>
      <li>引用来源：告警中心 API、历史工单知识、运维 SOP 文档库。</li>
    </ul>
  `;
}

function renderSearchResult(result) {
  $("#answerCard").innerHTML = `
    <h3>回答</h3>
    <p>${result.answer}</p>
    <ul>
      ${result.actions.map((action) => `<li>${action}</li>`).join("")}
      <li>引用来源：${result.sources.join("、")}。</li>
    </ul>
  `;
}

async function refreshSyncLogs() {
  try {
    const logs = await apiRequest("/api/sync-logs");
    renderSyncLog(logs);
  } catch {
    renderSyncLog();
  }
}

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor((rect.width * 0.44) * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: rect.width, height: rect.width * 0.44 };
}

function countBy(values) {
  return values.reduce((acc, value) => {
    const key = String(value || "未分类");
    acc.set(key, (acc.get(key) || 0) + 1);
    return acc;
  }, new Map());
}

function getDisplayChartData(business) {
  const rows = business?.rows || [];
  const severityCounts = [...countBy(rows.map((row) => getRowBySemanticField(business, row, ["等级", "level", "severity", "risk"], 1))).entries()];
  const objectCounts = [...countBy(rows.map((row) => getRowBySemanticField(business, row, ["归属对象", "owner", "service", "object"], 2))).entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);
  const timeCounts = [...countBy(rows.map((row) => String(getRowBySemanticField(business, row, [$("#timeFieldSelect")?.value, business?.timeField, "时间", "event_time", "created_at", "updated_at", "occurTime"], 3) || "").slice(5, 16))).entries()].slice(-8);
  return {
    severityCounts: severityCounts.length ? severityCounts : [["无数据", 1]],
    objectCounts: objectCounts.length ? objectCounts : [["无数据", 0]],
    timeCounts: timeCounts.length ? timeCounts : [["无数据", 0]]
  };
}

function drawChartFrame(ctx, width, height, title) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,.03)";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(156,238,226,.16)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = 42 + i * ((height - 84) / 4);
    ctx.beginPath();
    ctx.moveTo(34, y);
    ctx.lineTo(width - 26, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#8fb1b2";
  ctx.font = "12px Microsoft YaHei, sans-serif";
  ctx.fillText(title, 24, 24);
}

function drawLineBusinessChart(ctx, width, height, business) {
  const data = getDisplayChartData(business).timeCounts;
  drawChartFrame(ctx, width, height, `${business?.name || "业务"} 时间趋势`);
  const max = Math.max(1, ...data.map((item) => item[1]));
  const step = data.length > 1 ? (width - 92) / (data.length - 1) : 0;
  const points = data.map((item, index) => ({
    label: item[0],
    value: item[1],
    x: 46 + index * step,
    y: height - 42 - (item[1] / max) * (height - 98)
  }));
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#30e8c7");
  gradient.addColorStop(0.55, "#4d8dff");
  gradient.addColorStop(1, "#8df25f");
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  points.forEach((point) => {
    ctx.fillStyle = "#eafff8";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#9fbfc2";
    ctx.fillText(String(point.value), point.x - 4, point.y - 10);
  });
}

function drawBarBusinessChart(ctx, width, height, business) {
  const data = getDisplayChartData(business).objectCounts;
  drawChartFrame(ctx, width, height, `${business?.name || "业务"} 对象分布`);
  const max = Math.max(1, ...data.map((item) => item[1]));
  const barWidth = Math.max(22, (width - 86) / Math.max(1, data.length) - 12);
  data.forEach(([label, value], index) => {
    const x = 46 + index * (barWidth + 12);
    const barHeight = (value / max) * (height - 100);
    const y = height - 42 - barHeight;
    const gradient = ctx.createLinearGradient(0, y, 0, height - 42);
    gradient.addColorStop(0, "#30e8c7");
    gradient.addColorStop(1, "rgba(77,141,255,.42)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = "#cce9e6";
    ctx.fillText(String(value), x + 4, y - 8);
    ctx.fillStyle = "#8fb1b2";
    ctx.fillText(String(label).slice(0, 6), x, height - 22);
  });
}

function drawPieBusinessChart(ctx, width, height, business) {
  const data = getDisplayChartData(business).severityCounts;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,.03)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#8fb1b2";
  ctx.font = "12px Microsoft YaHei, sans-serif";
  ctx.fillText(`${business?.name || "业务"} 风险等级占比`, 24, 24);
  const total = Math.max(1, data.reduce((sum, item) => sum + item[1], 0));
  const colors = ["#30e8c7", "#4d8dff", "#ffc35c", "#ff6b86", "#8df25f", "#a78bfa"];
  const cx = width * 0.38;
  const cy = height * 0.56;
  const radius = Math.min(width, height) * 0.26;
  let start = -Math.PI / 2;
  data.forEach(([label, value], index) => {
    const angle = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    const legendY = 70 + index * 26;
    ctx.fillRect(width * 0.68, legendY - 10, 12, 12);
    ctx.fillStyle = "#cce9e6";
    ctx.fillText(`${label} ${value}`, width * 0.68 + 20, legendY);
    start += angle;
  });
}

function drawDisplayChart(business = appState.lastDisplayResult || getCurrentBusiness()) {
  const canvas = $("#trendChart");
  if (!canvas) return;
  const { ctx, width, height } = fitCanvas(canvas);
  const title = $("#displayChartTitle");
  if (title) title.textContent = appState.chartType === "bar" ? "柱状图" : appState.chartType === "pie" ? "饼图" : "折线图";
  if (appState.chartType === "bar") drawBarBusinessChart(ctx, width, height, business);
  else if (appState.chartType === "pie") drawPieBusinessChart(ctx, width, height, business);
  else drawLineBusinessChart(ctx, width, height, business);
}

function renderDisplayAnalysis(business = appState.lastDisplayResult) {
  const container = $("#displayAnalysisResult");
  if (!container) return;
  const rows = business?.rows || [];
  const total = rows.length;
  const highRiskRows = rows.filter((row) => ["P0", "P1", "高", "严重"].includes(String(getRowBySemanticField(business, row, ["等级", "level", "severity", "risk"], 1) || "").toUpperCase()));
  const severityTop = [...countBy(rows.map((row) => getRowBySemanticField(business, row, ["等级", "level", "severity", "risk"], 1))).entries()].sort((a, b) => b[1] - a[1])[0] || ["-", 0];
  const objectTop = [...countBy(rows.map((row) => getRowBySemanticField(business, row, ["归属对象", "owner", "service", "object"], 2))).entries()].sort((a, b) => b[1] - a[1])[0] || ["-", 0];
  const latest = rows.map((row) => getRowBySemanticField(business, row, [$("#timeFieldSelect")?.value, business?.timeField, "时间", "event_time", "created_at", "updated_at"], 3)).filter(Boolean).sort().at(-1) || "-";
  container.innerHTML = `
    <div class="display-insight-grid">
      <div><strong>${escapeHtml(String(total))}</strong><small>筛选后记录</small></div>
      <div><strong>${escapeHtml(String(highRiskRows.length))}</strong><small>高风险记录</small></div>
      <div><strong>${escapeHtml(String(severityTop[0]))}</strong><small>最高频等级 ${escapeHtml(String(severityTop[1]))}</small></div>
      <div><strong>${escapeHtml(String(objectTop[0]))}</strong><small>集中对象 ${escapeHtml(String(objectTop[1]))}</small></div>
    </div>
    <div class="insight-card display-insight-card">
      <h3>结论</h3>
      <p>${escapeHtml(business?.name || "业务")} 当前筛选结果共 ${escapeHtml(String(total))} 条，${highRiskRows.length ? `其中 ${escapeHtml(String(highRiskRows.length))} 条属于高风险，应优先查看 ${escapeHtml(String(objectTop[0]))}。` : "暂无明显高风险集中项，可继续观察趋势变化。"}</p>
    </div>
    <div class="insight-card display-insight-card">
      <h3>建议</h3>
      <p>最近记录时间 ${escapeHtml(String(latest))}。建议结合图表切换查看时间趋势、对象分布和等级占比，再进入智能分析生成更完整的根因和改进措施。</p>
    </div>
  `;
}

function drawTrendChart(label) {
  const canvas = $("#trendChart");
  const { ctx, width, height } = fitCanvas(canvas);
  const data = label === "工单业务" ? [18, 26, 31, 24, 35, 29, 42] : [12, 18, 16, 38, 32, 46, 40];
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,.03)";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(156,238,226,.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = 34 + i * ((height - 68) / 4);
    ctx.beginPath();
    ctx.moveTo(34, y);
    ctx.lineTo(width - 26, y);
    ctx.stroke();
  }
  const max = Math.max(...data);
  const step = (width - 80) / (data.length - 1);
  const points = data.map((value, index) => ({
    x: 42 + index * step,
    y: height - 36 - (value / max) * (height - 84)
  }));
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#30e8c7");
  gradient.addColorStop(0.55, "#4d8dff");
  gradient.addColorStop(1, "#8df25f");
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  points.forEach((point) => {
    ctx.fillStyle = "#eafff8";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#8fb1b2";
  ctx.font = "12px Microsoft YaHei, sans-serif";
  ctx.fillText(`${label} 最近 7 个周期趋势`, 24, 24);
}

function drawRiskRadar() {
  const canvas = $("#riskRadar");
  const { ctx, width, height } = fitCanvas(canvas);
  const cx = width / 2;
  const cy = height / 2 + 10;
  const radius = Math.min(width, height) * 0.32;
  const values = buildOverviewModel().radarValues;
  const labels = ["风险", "来源", "分支", "规则", "映射", "健康"];
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(156,238,226,.2)";
  for (let ring = 1; ring <= 4; ring += 1) {
    ctx.beginPath();
    for (let i = 0; i < values.length; i += 1) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / values.length;
      const r = (radius * ring) / 4;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(48,232,199,.18)";
  ctx.strokeStyle = "#30e8c7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((value, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / values.length;
    const x = cx + Math.cos(angle) * radius * value;
    const y = cy + Math.sin(angle) * radius * value;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#bfe7e3";
  ctx.font = "12px Microsoft YaHei, sans-serif";
  labels.forEach((text, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / labels.length;
    const x = cx + Math.cos(angle) * (radius + 24);
    const y = cy + Math.sin(angle) * (radius + 24);
    ctx.fillText(text, x - 12, y + 4);
  });
}

function animateBackground() {
  const canvas = $("#signalCanvas");
  const ctx = canvas.getContext("2d");
  const points = Array.from({ length: 70 }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0008,
    vy: (Math.random() - 0.5) * 0.0008
  }));

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function frame() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    ctx.clearRect(0, 0, width, height);
    points.forEach((point) => {
      point.x = (point.x + point.vx + 1) % 1;
      point.y = (point.y + point.vy + 1) % 1;
    });
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const ax = points[i].x * width;
        const ay = points[i].y * height;
        const bx = points[j].x * width;
        const by = points[j].y * height;
        const distance = Math.hypot(ax - bx, ay - by);
        if (distance < 120) {
          ctx.strokeStyle = `rgba(48, 232, 199, ${0.11 * (1 - distance / 120)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
    }
    points.forEach((point) => {
      ctx.fillStyle = "rgba(141, 242, 95, .42)";
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 1.4, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  frame();
}

function bindEvents() {
  $$(".nav-item").forEach((item) => item.addEventListener("click", () => setPanel(item.dataset.panel)));
  $$("[data-panel-link]").forEach((item) => item.addEventListener("click", () => setPanel(item.dataset.panelLink)));
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-multi-select-trigger]");
    if (trigger) {
      openMultiSelectDialog(trigger.dataset.multiSelectTrigger);
    }
  });
  $("#multiSelectSearchInput")?.addEventListener("input", filterMultiSelectOptions);
  $("#overviewFilterBar")?.addEventListener("input", (event) => {
    const control = event.target.closest("[data-overview-filter]");
    if (control) {
      appState.overviewFilters[control.dataset.overviewFilter] = control.value;
      renderOverview();
      return;
    }
    if (event.target.id === "overviewTimeStartInput") {
      appState.overviewTimeStart = event.target.value;
      renderOverview();
    }
    if (event.target.id === "overviewTimeEndInput") {
      appState.overviewTimeEnd = event.target.value;
      renderOverview();
    }
  });
  $("#overviewFilterBar")?.addEventListener("change", (event) => {
    const control = event.target.closest("[data-overview-filter]");
    if (control) {
      appState.overviewFilters[control.dataset.overviewFilter] = control.multiple ? getSelectedValues(control) : control.value;
      renderOverview();
      return;
    }
    if (event.target.id === "overviewTimeStartInput") appState.overviewTimeStart = event.target.value;
    if (event.target.id === "overviewTimeEndInput") appState.overviewTimeEnd = event.target.value;
    renderOverview();
  });
  $("#overviewFilterBar")?.addEventListener("click", (event) => {
    if (event.target.id !== "resetOverviewFiltersBtn") return;
    appState.overviewFilters = {};
    appState.overviewTimeStart = "";
    appState.overviewTimeEnd = "";
    renderOverview();
  });
  $("#configureSituationFiltersBtn")?.addEventListener("click", () => {
    resetSituationFilterForm();
    renderSituationFilterList();
    openDialog("#situationFilterModal");
  });
  $("#resetSituationFilterBtn")?.addEventListener("click", resetSituationFilterForm);
  $("#situationFilterSourceSelect")?.addEventListener("change", updateSituationFilterSourceVisibility);
  $("#closeSituationFilterBtn")?.addEventListener("click", () => closeDialog("#situationFilterModal"));
  $("#cancelSituationFilterBtn")?.addEventListener("click", () => closeDialog("#situationFilterModal"));
  $("#saveSituationFilterBtn")?.addEventListener("click", async (event) => {
    event.preventDefault();
    await saveSituationFilter();
  });
  $("#situationFilterList")?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-situation-filter-action]");
    if (!button) return;
    const filterId = button.dataset.situationFilterId;
    const action = button.dataset.situationFilterAction;
    const filter = (window.opsData.situationFilters || []).find((item) => item.id === filterId);
    if (!filter) return;
    if (action === "edit") {
      populateSituationFilterForm(filter);
      renderSituationFilterList();
      return;
    }
    if (action === "delete") {
      try {
        await apiRequest(`/api/situation-filters/${encodeURIComponent(filterId)}`, { method: "DELETE" });
      } catch {
        // Local fallback.
      }
      window.opsData.situationFilters = (window.opsData.situationFilters || []).filter((item) => item.id !== filterId);
      delete appState.overviewFilters[filterId];
      if (appState.editingSituationFilterId === filterId) resetSituationFilterForm();
      renderSituationFilterList();
      renderOverview();
    }
  });
  $("#confirmMultiSelectBtn")?.addEventListener("click", applyMultiSelectDialog);
  $("#cancelMultiSelectBtn")?.addEventListener("click", () => closeDialog("#multiSelectModal"));
  if ($("#cleaningMode")) {
    $("#cleaningMode").addEventListener("click", (event) => {
      if (event.target.tagName !== "BUTTON") return;
      setCleaningTab(event.target.dataset.cleaningTab);
    });
  }
  $("#flowNodeTypeSelect").addEventListener("change", () => {
    renderFlowNodeRefSelect("#flowNodeRefSelect", $("#flowNodeTypeSelect").value);
  });
  $("#flowNodeTypeEditSelect").addEventListener("change", () => {
    renderFlowNodeRefSelect("#flowNodeRefEditSelect", $("#flowNodeTypeEditSelect").value);
    updateFlowInspectorMode();
  });
  $("#flowNodeBranchModeSelect").addEventListener("change", updateFlowInspectorMode);
  $("#flowNodePaginationModeSelect").addEventListener("change", updateFlowInspectorMode);
  $("#flowNodeInputIterationSelect").addEventListener("change", updateFlowInspectorMode);
  $("#flowBusinessTableInput").addEventListener("input", () => {
    if ($("#flowNodeTypeSelect").value === "output") {
      renderFlowNodeRefSelect("#flowNodeRefSelect", "output");
    }
    if ($("#flowNodeTypeEditSelect").value === "output") {
      renderFlowNodeRefSelect("#flowNodeRefEditSelect", "output", $("#flowNodeRefEditSelect").value);
    }
  });
  $("#addFlowNodeBtn").addEventListener("click", () => {
    if (isBusinessPreviewMode()) return;
    const node = makeFlowNode($("#flowNodeTypeSelect").value, $("#flowNodeRefSelect").value);
    appState.flowNodes.push(node);
    appState.selectedFlowNodeId = node.id;
    renderFlowDesigner();
  });
  $("#addBranchNodeBtn").addEventListener("click", () => {
    if (isBusinessPreviewMode()) return;
    const selectedNode = appState.flowNodes.find((node) => node.id === appState.selectedFlowNodeId);
    const parentNodeId = selectedNode?.branchFromId || selectedNode?.id || appState.flowNodes[0]?.id || "";
    const parentNode = appState.flowNodes.find((node) => node.id === parentNodeId);
    const branchCount = appState.flowNodes.filter((node) => node.branchFromId === parentNodeId).length + 1;
    const selectedType = $("#flowNodeTypeSelect").value || "source";
    const branchType = selectedType === "context" ? "source" : selectedType;
    const node = makeFlowNode(branchType, branchType === selectedType ? $("#flowNodeRefSelect").value : "", {
      executionMode: "serial",
      branchFromId: parentNodeId,
      branchName: `分支 ${branchCount}`,
      branchCondition: branchCount === 1 ? "满足条件时进入" : "其他条件"
    });
    if (parentNode) {
      const parentIndex = appState.flowNodes.findIndex((item) => item.id === parentNode.id);
      appState.flowNodes.splice(parentIndex + branchCount, 0, node);
    } else {
      appState.flowNodes.push(node);
    }
    appState.selectedFlowNodeId = node.id;
    renderFlowDesigner();
  });
  $("#flowDesigner").addEventListener("click", (event) => {
    const nodeCard = event.target.closest("[data-flow-node-id]");
    if (!nodeCard) return;
    const action = event.target.dataset.flowNodeAction;
    const nodeId = nodeCard.dataset.flowNodeId;
    if (action === "delete") {
      if (isBusinessPreviewMode()) return;
      appState.flowNodes = appState.flowNodes
        .filter((node) => node.id !== nodeId)
        .map((node) => (node.branchFromId === nodeId ? { ...node, branchFromId: "", branchName: "", branchCondition: "" } : node));
      appState.flowEdges = appState.flowEdges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId);
      appState.selectedFlowNodeId = appState.flowNodes[0]?.id || "";
      renderFlowDesigner();
      return;
    }
    appState.selectedFlowNodeId = nodeId;
    renderFlowDesigner();
  });
  $("#flowDesigner").addEventListener("scroll", () => {
    requestAnimationFrame(renderFlowEdgeLines);
  });
  $("#flowEdgeList").addEventListener("click", (event) => {
    const edgeButton = event.target.closest("[data-flow-edge-id]");
    if (!edgeButton) return;
    appState.selectedFlowEdgeId = edgeButton.dataset.flowEdgeId;
    renderFlowEdgeEditor();
  });
  $("#saveFlowEdgeBtn").addEventListener("click", () => {
    if (isBusinessPreviewMode()) return;
    saveFlowEdgeFromEditor();
  });
  $("#deleteFlowEdgeBtn").addEventListener("click", () => {
    if (isBusinessPreviewMode()) return;
    deleteFlowEdgeFromEditor();
  });
  $("#saveFlowNodeBtn").addEventListener("click", () => {
    if (isBusinessPreviewMode()) return;
    const node = appState.flowNodes.find((item) => item.id === appState.selectedFlowNodeId);
    if (!node) return;
    node.type = $("#flowNodeTypeEditSelect").value;
    node.refId = $("#flowNodeRefEditSelect").value;
    node.name = $("#flowNodeNameInput").value.trim() || getFlowRefLabel(node.type, node.refId);
    node.executionMode = $("#flowNodeExecutionSelect").value;
    if ($("#flowNodeBranchModeSelect").value === "branch") {
      node.branchFromId = $("#flowNodeBranchFromSelect").value || appState.flowNodes.find((item) => item.id !== node.id)?.id || "";
      node.branchName = $("#flowNodeBranchNameInput").value.trim() || "默认分支";
      node.branchCondition = $("#flowNodeBranchConditionInput").value.trim();
    } else {
      node.branchFromId = "";
      node.branchName = "";
      node.branchCondition = "";
    }
    node.param = $("#flowNodeParamInput").value.trim();
    node.executionConfig = node.type === "source" ? collectSourceExecutionConfig() : undefined;
    renderFlowDesigner();
  });
  $("#deleteFlowNodeBtn").addEventListener("click", () => {
    if (isBusinessPreviewMode()) return;
    if (!appState.selectedFlowNodeId) return;
    const deletedNodeId = appState.selectedFlowNodeId;
    appState.flowNodes = appState.flowNodes
      .filter((node) => node.id !== deletedNodeId)
      .map((node) => (node.branchFromId === deletedNodeId ? { ...node, branchFromId: "", branchName: "", branchCondition: "" } : node));
    appState.flowEdges = appState.flowEdges.filter((edge) => edge.from !== deletedNodeId && edge.to !== deletedNodeId);
    appState.selectedFlowNodeId = appState.flowNodes[0]?.id || "";
    renderFlowDesigner();
  });
  $("#flowTable").addEventListener("click", async (event) => {
    const row = event.target.closest("[data-flow-id]");
    if (!row) return;
    const flowId = row.dataset.flowId;
    const flow = (window.opsData.businessFlows || []).find((item) => item.id === flowId);
    if (!flow) return;
    const action = event.target.dataset.flowAction || "edit";
    if (action === "delete") {
      await deleteBusinessFlow(flowId);
      return;
    }
    appState.selectedFlowId = flowId;
    populateFlowForm(flow);
    renderFlowDesigner();
    renderFlowTable();
    setBusinessDetailMode(action === "edit" ? "edit" : "preview");
    if (action === "run") {
      await runSelectedBusinessFlow();
    }
  });
  $("#sourceStack").addEventListener("click", (event) => {
    const card = event.target.closest("[data-source-id]");
    if (!card) return;
    const sourceId = event.target.dataset.sourceId || card.dataset.sourceId;
    const source = (window.opsData.sources || []).find((item) => item.id === sourceId);
    const action = event.target.dataset.sourceAction;
    if (!source) return;
    appState.selectedSourceId = sourceId;
    if (action === "preview") {
      openSourceModal("preview", source);
      renderSources();
      renderMappings();
      renderIcons();
      return;
    }
    if (action === "edit") {
      openSourceModal("edit", source);
      renderSources();
      renderMappings();
      renderIcons();
      return;
    }
    if (action === "delete") {
      deleteSelectedSource(source);
      return;
    }
    populateSourceForm();
    renderSources();
    renderMappings();
    renderIcons();
  });
  $("#mappingSourceSelect").addEventListener("change", () => {
    appState.selectedSourceId = $("#mappingSourceSelect").value;
    populateSourceForm();
    renderSources();
    renderMappings();
    renderIcons();
  });
  $("#mappingResponsePathInput").addEventListener("change", () => {
    $("#responsePathInput").value = $("#mappingResponsePathInput").value;
  });
  $("#responseKeepModeSelect").addEventListener("change", updateSourceModalVisibility);
  $("#responseFieldKeepModeSelect").addEventListener("change", updateResponseKeepFieldsState);
  $("#responsePersistModeSelect").addEventListener("change", updateResponsePersistState);
  $("#configureValueFiltersBtn").addEventListener("click", openValueFilterDialog);
  $("#saveValueFilterBtn").addEventListener("click", saveValueFilterDialog);
  $("#cancelValueFilterBtn").addEventListener("click", () => closeDialog("#valueFilterModal"));
  $("#closeValueFilterBtn").addEventListener("click", () => closeDialog("#valueFilterModal"));
  $("#valueFilterList").addEventListener("change", (event) => {
    const row = event.target.closest(".value-filter-row");
    if (row && event.target.matches("[data-value-filter-dictionary]")) {
      updateValueFilterDictionaryColumns(row);
    }
    if (
      row &&
      event.target.matches(
        "[data-value-filter-dictionary], [data-value-filter-extract-mode], [data-value-filter-scope-column], [data-value-filter-aggregate]"
      )
    ) {
      syncValueFilterRowVisibility(row);
    }
  });
  $("#sourceKindSelect").addEventListener("change", () => {
    updateRequestParamVisibility();
    renderParamFieldSelect();
    updateSourceModalVisibility();
  });
  $("#apiMethodSelect").addEventListener("change", () => {
    updateRequestParamVisibility();
    renderParamFieldSelect(getSelectedValues($("#paramFieldSelect")));
    updateSourceModalVisibility();
  });
  $("#responseFieldSelect").addEventListener("change", () => {
    if ($("#responseFieldSelect").value) {
      $("#mapSourceInput").value = $("#responseFieldSelect").value;
    }
  });
  $("#paramSourceTypeSelect").addEventListener("change", updateParamSourceTypeHelp);
  $("#paramSourceSelect").addEventListener("change", () => renderParamFieldSelect());
  $("#autoParamMappingBtn").addEventListener("click", () => {
    autoGenerateParamMapping();
    renderIcons();
  });
  ["#ruleTypeSelect", "#ruleActionSelect", "#ruleParamInput"].forEach((selector) => {
    $(selector)?.addEventListener("input", syncRuleExpressionPreview);
    $(selector)?.addEventListener("change", syncRuleExpressionPreview);
  });
  $("#sourceTestResult").addEventListener("click", (event) => {
    const field = event.target.dataset.responseField;
    if (!field) return;
    $("#mapSourceInput").value = field;
    $("#responseFieldSelect").value = field;
  });
  $("#sourceAuthConfigSelect").addEventListener("change", () => {
    const auth = getSourceAuthConfig();
    if (!auth) return;
    updateSourceModalVisibility();
  });
  $("#authConfigList").addEventListener("click", (event) => {
    const item = event.target.closest("[data-auth-id]");
    if (!item) return;
    const action = event.target.dataset.authAction;
    const authId = item.dataset.authId;
    const auth = (window.opsData.authConfigs || []).find((entry) => entry.id === authId);
    if (!auth) return;
    appState.selectedAuthId = authId;
    if (action === "edit") {
      populateAuthForm(auth);
      $("#authModalTitle").textContent = "编辑认证";
      openDialog("#authModal");
      return;
    }
    if (action === "delete") {
      deleteAuthConfig(auth);
      return;
    }
    renderAuthConfigs();
  });
  $("#authCategoryInput").addEventListener("change", syncAuthFormByCategory);
  $("#ruleDictionarySelect").addEventListener("change", () => {
    renderDictionaryColumnOptions("#ruleDictionaryColumnSelect", $("#ruleDictionarySelect").value);
    syncRuleExpressionPreview();
  });
  $("#ruleDictionaryColumnSelect").addEventListener("change", syncRuleExpressionPreview);
  $("#addDictionaryBtn").addEventListener("click", () => {
    resetDictionaryForm();
    openDialog("#dictionaryModal");
  });
  $("#dictionaryRowsInput").addEventListener("input", syncDictionaryColumnsFromRows);
  $("#saveDictionaryBtn").addEventListener("click", async (event) => {
    event.preventDefault();
    const payload = collectDictionaryForm();
    const editingId = appState.editingDictionaryId;
    try {
      const saved = await apiRequest(editingId ? `/api/dictionary-sets/${encodeURIComponent(editingId)}` : "/api/dictionary-sets", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      if (editingId) {
        window.opsData.dictionarySets = (window.opsData.dictionarySets || []).map((item) => (item.id === saved.id ? saved : item));
      } else {
        window.opsData.dictionarySets.unshift(saved);
      }
    } catch {
      const localDictionary = { id: editingId || `local_dict_${Date.now()}`, ...payload };
      if (editingId) {
        window.opsData.dictionarySets = (window.opsData.dictionarySets || []).map((item) => (item.id === editingId ? { ...item, ...localDictionary } : item));
      } else {
        window.opsData.dictionarySets.unshift(localDictionary);
      }
    }
    renderDictionarySets();
    closeDialog("#dictionaryModal");
  });
  $("#deleteDictionaryBtn").addEventListener("click", async () => {
    const dictionary = getDictionarySetById(appState.editingDictionaryId);
    if (!dictionary) return;
    try {
      await apiRequest(`/api/dictionary-sets/${encodeURIComponent(dictionary.id)}`, { method: "DELETE" });
    } catch {
      // Local fallback.
    }
    window.opsData.dictionarySets = (window.opsData.dictionarySets || []).filter((item) => item.id !== dictionary.id);
    renderDictionarySets();
    closeDialog("#dictionaryModal");
  });
  $("#dictionarySetList").addEventListener("click", (event) => {
    const dictionaryId = event.target.dataset.dictionaryId;
    const action = event.target.dataset.dictionaryAction;
    if (!dictionaryId || !action) return;
    const dictionary = getDictionarySetById(dictionaryId);
    if (!dictionary) return;
    if (action === "edit") {
      populateDictionaryForm(dictionary);
      openDialog("#dictionaryModal");
      return;
    }
    if (action === "delete") {
      appState.editingDictionaryId = dictionary.id;
      $("#deleteDictionaryBtn").click();
    }
  });
  $("#addStorageConfigBtn").addEventListener("click", () => {
    resetStorageConfigForm();
    openDialog("#storageConfigModal");
  });
  $("#storageDatabaseSelect").addEventListener("change", () => {
    $("#storagePortInput").value = "";
    syncStorageDefaultPort();
  });
  $("#storageMigrationPolicySelect").addEventListener("change", () => {
    $("#storageMigrationPolicyDesc").value = getStorageMigrationPolicyDesc($("#storageMigrationPolicySelect").value);
  });
  $("#confirmStorageSwitchBtn").addEventListener("click", async (event) => {
    event.preventDefault();
    const targetStorageId = $("#storageSwitchModal").dataset.targetStorageId;
    const migrationPolicy = $("#storageMigrationPolicySelect").value;
    try {
      const result = await apiRequest("/api/storage-configs/switch", {
        method: "POST",
        body: JSON.stringify({ targetStorageId, migrationPolicy })
      });
      applyStorageSwitchResult(result);
    } catch {
      const target = getStorageConfigById(targetStorageId);
      const current = getStorageConfigById(window.opsData.currentStorageId);
      const migration = {
        id: `local_storage_migration_${Date.now()}`,
        fromStorageId: current?.id || "",
        fromStorageName: current?.name || "",
        toStorageId: target?.id || targetStorageId,
        toStorageName: target?.name || "",
        migrationPolicy,
        status: migrationPolicy === "switch-only" ? "switched-without-copy" : "local-plan-recorded",
        message: getStorageMigrationPolicyDesc(migrationPolicy),
        createdAt: new Date().toISOString()
      };
      applyStorageSwitchResult({ currentStorageId: targetStorageId, migration });
    }
    closeDialog("#storageSwitchModal");
  });
  $("#saveStorageConfigBtn").addEventListener("click", async (event) => {
    event.preventDefault();
    const payload = collectStorageConfigForm();
    const editingId = appState.editingStorageConfigId;
    try {
      const saved = await apiRequest(editingId ? `/api/storage-configs/${encodeURIComponent(editingId)}` : "/api/storage-configs", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      window.opsData.storageConfigs = window.opsData.storageConfigs || [];
      if (editingId) {
        window.opsData.storageConfigs = window.opsData.storageConfigs.map((item) => (item.id === saved.id ? saved : item));
      } else {
        window.opsData.storageConfigs.push(saved);
      }
    } catch {
      const localStorageConfig = {
        id: editingId || `local_storage_${Date.now()}`,
        ...payload,
        password: "",
        passwordMasked: payload.password ? "******" : "",
        status: payload.host ? "本地已配置" : "待配置",
        readonly: false
      };
      window.opsData.storageConfigs = window.opsData.storageConfigs || [];
      if (editingId) {
        window.opsData.storageConfigs = window.opsData.storageConfigs.map((item) => (item.id === editingId ? { ...item, ...localStorageConfig } : item));
      } else if (!window.opsData.storageConfigs.some((item) => item.type === "database")) {
        window.opsData.storageConfigs.push(localStorageConfig);
      }
    }
    renderStorageConfigs();
    closeDialog("#storageConfigModal");
  });
  $("#deleteStorageConfigBtn").addEventListener("click", async () => {
    const config = getStorageConfigById(appState.editingStorageConfigId);
    if (!config || config.readonly) return;
    try {
      await apiRequest(`/api/storage-configs/${encodeURIComponent(config.id)}`, { method: "DELETE" });
    } catch {
      // Local fallback.
    }
    window.opsData.storageConfigs = (window.opsData.storageConfigs || []).filter((item) => item.id !== config.id);
    renderStorageConfigs();
    closeDialog("#storageConfigModal");
  });
  $("#storageConfigList").addEventListener("click", (event) => {
    const storageId = event.target.dataset.storageId;
    const action = event.target.dataset.storageAction;
    if (!storageId || !action) return;
    const config = getStorageConfigById(storageId);
    if (!config) return;
    if (action === "switch") {
      openStorageSwitchModal(config);
      return;
    }
    if (config.readonly) return;
    if (action === "edit") {
      populateStorageConfigForm(config);
      openDialog("#storageConfigModal");
      return;
    }
    if (action === "delete") {
      appState.editingStorageConfigId = config.id;
      $("#deleteStorageConfigBtn").click();
    }
  });
  $("#addAuthBtn").addEventListener("click", async () => {
    resetAuthForm();
    openDialog("#authModal");
  });
  $("#saveAuthBtn").addEventListener("click", async (event) => {
    event.preventDefault();
    const payload = collectAuthForm();
    const editingId = appState.editingAuthId;
    try {
      const saved = await apiRequest(editingId ? `/api/auth-configs/${encodeURIComponent(editingId)}` : "/api/auth-configs", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      if (editingId) {
        window.opsData.authConfigs = window.opsData.authConfigs.map((item) => (item.id === saved.id ? saved : item));
      } else {
        window.opsData.authConfigs.unshift(saved);
      }
      appState.selectedAuthId = saved.id;
      $("#sourceAuthConfigSelect").value = saved.id;
    } catch {
      if (editingId) {
        window.opsData.authConfigs = window.opsData.authConfigs.map((item) => (item.id === editingId ? { ...item, ...payload } : item));
        appState.selectedAuthId = editingId;
      } else {
        const created = { id: `local_auth_${Date.now()}`, ...payload, status: "本地新增" };
        window.opsData.authConfigs.unshift(created);
        appState.selectedAuthId = created.id;
      }
    }
    renderAuthConfigs();
    closeDialog("#authModal");
  });
  async function deleteAuthConfig(auth) {
    if (!auth || auth.id === "auth_none") return;
    try {
      await apiRequest(`/api/auth-configs/${encodeURIComponent(auth.id)}`, { method: "DELETE" });
    } catch {
      // Keep local editing usable when API is offline.
    }
    window.opsData.authConfigs = window.opsData.authConfigs.filter((item) => item.id !== auth.id);
    appState.selectedAuthId = window.opsData.authConfigs[0]?.id || "auth_none";
    renderAuthConfigs();
  }
  if ($("#analysisMode")) {
    $("#analysisMode").addEventListener("click", (event) => {
      const button = event.target.closest("[data-analysis-tab]");
      if (!button) return;
      setAnalysisTab(button.dataset.analysisTab);
    });
  }
  $("#businessSelect").addEventListener("change", () => {
    renderTimeFieldOptions();
    queryAndRenderBusiness();
  });
  $("#tableSearchInput").addEventListener("input", queryAndRenderBusiness);
  $("#sortSelect").addEventListener("change", queryAndRenderBusiness);
  $("#timeFieldSelect").addEventListener("change", queryAndRenderBusiness);
  $("#timePresetSelect").addEventListener("change", () => {
    applyTimePreset($("#timePresetSelect").value);
    appState.displayTimeStart = $("#timeStartInput").value;
    appState.displayTimeEnd = $("#timeEndInput").value;
    queryAndRenderBusiness();
  });
  $("#timeStartInput").addEventListener("change", () => {
    setSelectValue("#timePresetSelect", "custom");
    appState.displayTimeStart = $("#timeStartInput").value;
    queryAndRenderBusiness();
  });
  $("#timeEndInput").addEventListener("change", () => {
    setSelectValue("#timePresetSelect", "custom");
    appState.displayTimeEnd = $("#timeEndInput").value;
    queryAndRenderBusiness();
  });
  $("#analysisBusinessSelect").addEventListener("change", renderAnalysisFieldSelect);
  $("#analysisModelSelect").addEventListener("change", renderModelConfigList);
  $("#modelPresetSelect")?.addEventListener("change", () => applyModelPreset());
  $("#applyModelPresetBtn")?.addEventListener("click", () => applyModelPreset());
  $("#modelConfigList").addEventListener("click", async (event) => {
    const item = event.target.closest("[data-model-id]");
    if (!item) return;
    const modelId = item.dataset.modelId;
    const action = event.target.dataset.modelAction || "use";
    const config = getModelConfigById(modelId);
    if (!config) return;
    if (action === "use") {
      setSelectValue("#analysisModelSelect", modelId);
      setAnalysisTab("config");
      renderModelConfigList();
      return;
    }
    if (action === "edit") {
      populateModelConfigForm(config);
      openDialog("#modelConfigModal");
      return;
    }
    if (action === "delete") {
      try {
        await apiRequest(`/api/model-configs/${encodeURIComponent(modelId)}`, { method: "DELETE" });
      } catch {
        // Local fallback keeps model config editing usable offline.
      }
      window.opsData.modelConfigs = (window.opsData.modelConfigs || []).filter((model) => model.id !== modelId);
      renderModelConfigSelect();
      renderModelConfigList();
    }
  });
  $("#addModelConfigBtn").addEventListener("click", () => {
    resetModelConfigForm();
    openDialog("#modelConfigModal");
  });
  $("#saveModelConfigBtn").addEventListener("click", async (event) => {
    event.preventDefault();
    const payload = collectModelConfigForm();
    const editingId = appState.editingModelConfigId;
    try {
      const saved = await apiRequest(editingId ? `/api/model-configs/${encodeURIComponent(editingId)}` : "/api/model-configs", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      if (editingId) {
        window.opsData.modelConfigs = (window.opsData.modelConfigs || []).map((item) => (item.id === saved.id ? saved : item));
      } else {
        window.opsData.modelConfigs.unshift(saved);
      }
      appState.editingModelConfigId = saved.id;
    } catch {
      const localModel = {
        id: editingId || `local_model_${Date.now()}`,
        ...payload,
        apiKey: "",
        apiKeyMasked: payload.apiKey ? "已配置" : "未配置",
        status: payload.apiKey ? "本地可用" : "本地待配置 Key"
      };
      if (editingId) {
        window.opsData.modelConfigs = (window.opsData.modelConfigs || []).map((item) => (item.id === editingId ? { ...item, ...localModel } : item));
      } else {
        window.opsData.modelConfigs.unshift(localModel);
      }
      appState.editingModelConfigId = localModel.id;
    }
    renderModelConfigSelect();
    setSelectValue("#analysisModelSelect", appState.editingModelConfigId);
    renderModelConfigList();
    closeDialog("#modelConfigModal");
  });
  $("#generateAnalysisBtn").addEventListener("click", async () => {
    $("#generateAnalysisBtn").innerHTML = `<span class="icon" data-icon="refresh"></span> 分析中`;
    renderIcons();
    try {
      const result = await apiRequest("/api/analysis/run", {
        method: "POST",
        body: JSON.stringify({
          businessNames: getSelectedAnalysisBusinessNames(),
          modelConfigId: $("#analysisModelSelect").value,
          fields: getSelectedValues($("#analysisFieldSelect")),
          comboFields: $("#analysisFieldComboInput").value,
          scope: $("#analysisScopeSelect").value,
          format: $("#analysisFormatSelect").value,
          filterContext: {
            filters: window.opsData.situationFilters || [],
            selectedValues: appState.displayFilters,
            timeStart: appState.displayTimeStart,
            timeEnd: appState.displayTimeEnd,
            timeFields: window.opsData.situationTimeFilter?.fields || []
          },
          prompt: $("#promptTemplateInput").value
        })
      });
      renderAnalysisResult(result);
    } catch (error) {
      renderAnalysis();
    } finally {
      $("#generateAnalysisBtn").innerHTML = `<span class="icon" data-icon="spark"></span> 生成分析`;
      renderIcons();
    }
  });
  $("#askBtn").addEventListener("click", async () => {
    const question = $("#questionInput").value.trim();
    try {
      const result = await apiRequest("/api/search/query", {
        method: "POST",
        body: JSON.stringify({ question })
      });
      renderSearchResult(result);
    } catch (error) {
      renderAnswer(question);
    }
  });
  $("#runSyncBtn").addEventListener("click", async () => {
    $("#runSyncBtn").innerHTML = `<span class="icon" data-icon="refresh"></span> 同步中`;
    renderIcons();
    try {
      const result = await apiRequest("/api/sync-jobs/run", {
        method: "POST",
        body: JSON.stringify({ sourceId: appState.selectedSourceId, ...collectSourceForm() })
      });
      $("#runSyncBtn").innerHTML = `<span class="icon" data-icon="refresh"></span> ${result.cleanedRows} 行完成`;
      await refreshSyncLogs();
      await loadBootstrapData();
      renderOverview();
      renderSources();
    } catch (error) {
      $("#runSyncBtn").innerHTML = `<span class="icon" data-icon="refresh"></span> 同步失败，重试`;
    }
    renderIcons();
  });
  $("#addSourceBtn").addEventListener("click", () => openSourceModal("create"));
  $("#saveSourceBtn").addEventListener("click", saveSourceFromModal);
  $("#testSourceBtn").addEventListener("click", async () => {
    $("#sourceTestResult").innerHTML = '<div class="module-status">正在测试数据源联通性...</div>';
    const payload = { sourceId: appState.selectedSourceId, ...collectSourceForm() };
    try {
      const result = await apiRequest("/api/data-sources/test", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      appState.lastSourceTest = result;
      renderSourceTestResult(result);
    } catch (error) {
      $("#sourceTestResult").innerHTML = `<div class="module-status">测试失败：${escapeHtml(error.message)}</div>`;
      renderResponseFieldOptions([]);
    }
  });
  $("#deleteSourceBtn").addEventListener("click", () => deleteSelectedSource(getSelectedSource()));
  $("#mappingTable").addEventListener("click", async (event) => {
    const action = event.target.dataset.mappingAction;
    const mappingId = event.target.dataset.mappingId;
    if (!action || !mappingId) return;
    const mapping = getMappingById(mappingId);
    if (!mapping) return;
    if (action === "edit") {
      populateMappingForm(mapping);
      $("#mapSourceInput").focus();
      return;
    }
    if (action === "delete") {
      try {
        await apiRequest(`/api/field-mappings/${encodeURIComponent(mappingId)}`, { method: "DELETE" });
      } catch {
        // Local fallback keeps the UI responsive while the backend is unavailable.
      }
      window.opsData.fieldMappings = (window.opsData.fieldMappings || []).filter((item) => item.id !== mappingId);
      window.opsData.mappings = (window.opsData.mappings || []).filter((row) => row[0] !== mapping.sourceField || row[1] !== mapping.targetField);
      if (appState.editingMappingId === mappingId) {
        resetMappingForm();
      }
      renderMappings();
      renderOverview();
    }
  });
  $("#addMappingBtn").addEventListener("click", async () => {
    const selectedRule = getRuleById($("#mapRuleSelect").value);
    const mapping = {
      sourceField: $("#mapSourceInput").value,
      sourceId: appState.selectedSourceId,
      targetField: $("#mapTargetInput").value,
      type: $("#mapTypeSelect").value,
      defaultValue: $("#mapDefaultInput").value,
      ruleId: $("#mapRuleSelect").value,
      ruleParam: "",
      rule: selectedRule?.expression || "未配置规则",
      recordMode: $("#mapRecordModeSelect").value,
      recordFilter: $("#mapRecordFilterInput").value,
      aggregateMode: $("#mapAggregateModeSelect").value,
      aggregateSeparator: $("#mapAggregateSeparatorInput").value || ",",
      output: "内部业务库"
    };
    const editingId = appState.editingMappingId;
    try {
      const saved = await apiRequest(editingId ? `/api/field-mappings/${encodeURIComponent(editingId)}` : "/api/field-mappings", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(mapping)
      });
      window.opsData.fieldMappings = window.opsData.fieldMappings || [];
      if (editingId) {
        window.opsData.fieldMappings = window.opsData.fieldMappings.map((item) => (item.id === saved.id ? saved : item));
      } else {
        window.opsData.fieldMappings.push(saved);
        window.opsData.mappings.push([saved.sourceField, saved.targetField, saved.type, saved.defaultValue || "", saved.rule, saved.output]);
      }
    } catch {
      window.opsData.fieldMappings = window.opsData.fieldMappings || [];
      if (editingId) {
        window.opsData.fieldMappings = window.opsData.fieldMappings.map((item) => (item.id === editingId ? { ...item, ...mapping } : item));
      } else {
        window.opsData.fieldMappings.push({ id: `local_map_${Date.now()}`, ...mapping });
        window.opsData.mappings.push([mapping.sourceField, mapping.targetField, mapping.type, mapping.defaultValue || "", mapping.rule, mapping.output]);
      }
    }
    resetMappingForm();
    renderMappings();
    renderMappingSourceSelect();
    renderOverview();
  });
  $("#mapRecordModeSelect").addEventListener("change", updateMappingModeVisibility);
  $("#addRuleBtn").addEventListener("click", () => {
    resetRuleForm();
    openDialog("#ruleModal");
  });
  $("#saveRuleBtn").addEventListener("click", async (event) => {
    event.preventDefault();
    const payload = collectRuleForm();
    const editingId = appState.editingRuleId;
    try {
      const saved = await apiRequest(editingId ? `/api/cleaning-rules/${encodeURIComponent(editingId)}` : "/api/cleaning-rules", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      if (editingId) {
        window.opsData.cleaningRules = window.opsData.cleaningRules.map((rule) => (rule.id === saved.id ? saved : rule));
      } else {
        window.opsData.cleaningRules.unshift(saved);
      }
    } catch {
      if (editingId) {
        window.opsData.cleaningRules = window.opsData.cleaningRules.map((rule) => (rule.id === editingId ? { ...rule, ...payload } : rule));
      } else {
        window.opsData.cleaningRules.unshift({ id: `local_rule_${Date.now()}`, ...payload });
      }
    }
    renderRuleTable();
    renderFlowControls();
    renderMappingRuleSelect();
    renderMappings();
    renderOverview();
    closeDialog("#ruleModal");
  });
  $("#ruleTable").addEventListener("click", async (event) => {
    const action = event.target.dataset.ruleAction;
    const ruleId = event.target.dataset.ruleId;
    if (!action || !ruleId) return;
    const rule = getRuleById(ruleId);
    if (!rule) return;
    if (action === "edit") {
      populateRuleForm(rule);
      openDialog("#ruleModal");
      return;
    }
    if (action === "delete") {
      try {
        await apiRequest(`/api/cleaning-rules/${encodeURIComponent(ruleId)}`, { method: "DELETE" });
      } catch {
        // Local fallback.
      }
      window.opsData.cleaningRules = window.opsData.cleaningRules.filter((item) => item.id !== ruleId);
      window.opsData.fieldMappings = (window.opsData.fieldMappings || []).map((mapping) =>
        mapping.ruleId === ruleId ? { ...mapping, ruleId: "", rule: "规则已删除" } : mapping
      );
      window.opsData.businessFlows = window.opsData.businessFlows.map((flow) => ({
        ...flow,
        ruleIds: flow.ruleIds.filter((id) => id !== ruleId)
      }));
      renderRuleTable();
      renderFlowControls();
      renderMappingRuleSelect();
      renderMappings();
      renderFlowTable();
      renderOverview();
    }
  });
  $("#newFlowBtn").addEventListener("click", () => {
    resetFlowForm();
    renderFlowTable();
    setBusinessDetailMode("create");
  });
  $("#previewEditFlowBtn").addEventListener("click", () => {
    setBusinessDetailMode("edit");
  });
  $("#closeFlowDetailBtn").addEventListener("click", () => {
    setBusinessDetailMode("list");
    renderFlowTable();
  });
  $("#createFlowBtn").addEventListener("click", async () => {
    await saveBusinessFlow();
  });
  $("#deleteFlowBtn").addEventListener("click", async () => {
    await deleteBusinessFlow();
  });
  $("#runFlowBtn").addEventListener("click", runSelectedBusinessFlow);
  $("#flowDedupeStrategySelect").addEventListener("change", updateFlowDedupeVisibility);
  $("#addKnowledgeBtn").addEventListener("click", async () => {
    const payload = {
      name: $("#knowledgeNameInput").value,
      path: $("#knowledgePathInput").value
    };
    try {
      const source = await apiRequest("/api/knowledge-sources", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      window.opsData.knowledge.unshift(source);
    } catch {
      window.opsData.knowledge.unshift({
        name: payload.name,
        desc: `本地路径 ${payload.path}，待索引`,
        icon: payload.path.startsWith("http") ? "cloud" : "file"
      });
    }
    renderKnowledge();
    renderIcons();
  });
  $("#focusKnowledgeBtn").addEventListener("click", () => {
    $("#knowledgeNameInput").focus();
  });
  $("#viewMode").addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    appState.viewMode = button.dataset.view;
    $$("#viewMode button").forEach((item) => item.classList.toggle("active", item === button));
    $(".data-table").style.display = appState.viewMode === "chart" ? "none" : "block";
    $(".chart-panel").style.display = appState.viewMode === "table" ? "block" : "block";
    queryAndRenderBusiness();
  });
  $("#chartTypeMode")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-chart-type]");
    if (!button) return;
    appState.chartType = button.dataset.chartType;
    $$("#chartTypeMode button").forEach((item) => item.classList.toggle("active", item === button));
    drawDisplayChart();
    renderDisplayAnalysis(appState.lastDisplayResult);
  });
  $("#displayConfiguredFilterBar")?.addEventListener("input", (event) => {
    const control = event.target.closest("[data-display-configured-filter]");
    if (control) {
      appState.displayFilters[control.dataset.displayConfiguredFilter] = control.value;
      queryAndRenderBusiness();
      return;
    }
    if (event.target.id === "displayConfiguredTimeStartInput") {
      appState.displayTimeStart = event.target.value;
      queryAndRenderBusiness();
    }
    if (event.target.id === "displayConfiguredTimeEndInput") {
      appState.displayTimeEnd = event.target.value;
      queryAndRenderBusiness();
    }
  });
  $("#displayConfiguredFilterBar")?.addEventListener("change", (event) => {
    const control = event.target.closest("[data-display-configured-filter]");
    if (control) {
      appState.displayFilters[control.dataset.displayConfiguredFilter] = control.multiple ? getSelectedValues(control) : control.value;
      queryAndRenderBusiness();
      return;
    }
    if (event.target.id === "displayConfiguredTimeStartInput") appState.displayTimeStart = event.target.value;
    if (event.target.id === "displayConfiguredTimeEndInput") appState.displayTimeEnd = event.target.value;
    queryAndRenderBusiness();
  });
  $("#displayConfiguredFilterBar")?.addEventListener("click", (event) => {
    if (!event.target.closest("[data-display-filter-reset]")) return;
    appState.displayFilters = {};
    appState.displayTimeStart = "";
    appState.displayTimeEnd = "";
    queryAndRenderBusiness();
  });
  ["fieldFilterSelect"].forEach((id) => {
    $(`#${id}`)?.addEventListener("change", queryAndRenderBusiness);
  });
  $("#fieldValueFilterInput")?.addEventListener("input", queryAndRenderBusiness);
  $("#resetDisplayFiltersBtn")?.addEventListener("click", () => {
    appState.displayFilters = {};
    appState.displayTimeStart = "";
    appState.displayTimeEnd = "";
    setSelectValue("#fieldFilterSelect", "");
    $("#fieldValueFilterInput").value = "";
    queryAndRenderBusiness();
  });
  $("#refreshDisplayAnalysisBtn")?.addEventListener("click", () => {
    renderDisplayAnalysis(appState.lastDisplayResult || getCurrentBusiness());
  });
  $("#globalSearch").addEventListener("input", () => {
    const keyword = $("#globalSearch").value.trim().toLowerCase();
    if (!keyword) {
      renderSources();
      renderOverview();
      renderKnowledge();
      renderIcons();
      return;
    }
    const sourceMatch = window.opsData.sources.filter((item) => `${item.name} ${item.type} ${item.status}`.toLowerCase().includes(keyword));
    const signalMatch = buildOverviewModel().signals.filter((item) => `${item.title} ${item.desc}`.toLowerCase().includes(keyword));
    const knowledgeMatch = window.opsData.knowledge.filter((item) => `${item.name} ${item.desc}`.toLowerCase().includes(keyword));
    $("#sourceStack").innerHTML = "";
    $("#signalList").innerHTML = "";
    $("#knowledgeList").innerHTML = "";
    if (sourceMatch.length) {
      const original = window.opsData.sources;
      window.opsData.sources = sourceMatch;
      renderSources();
      window.opsData.sources = original;
      setPanel("cleaning");
    } else if (signalMatch.length) {
      renderSignalItems(signalMatch);
      setPanel("overview");
    } else if (knowledgeMatch.length) {
      const original = window.opsData.knowledge;
      window.opsData.knowledge = knowledgeMatch;
      renderKnowledge();
      window.opsData.knowledge = original;
      setPanel("search");
    }
    renderIcons();
  });
  $("#themePulse").addEventListener("click", () => {
    drawRiskRadar();
    queryAndRenderBusiness();
  });
  window.addEventListener("resize", () => {
    drawRiskRadar();
    renderBusinessTable();
  });
}

async function boot() {
  await loadBootstrapData();
  renderOverview();
  renderAuthConfigs();
  if (!window.opsData.sources.some((source) => source.id === appState.selectedSourceId)) {
    appState.selectedSourceId = window.opsData.sources[0]?.id || "";
  }
  populateSourceForm();
  populateAuthForm();
  renderSources();
  renderMappingSourceSelect();
  renderSourceTestResult();
  renderMappings();
  renderRuleTable();
  renderDictionarySets();
  renderStorageConfigs();
  setupBusinessWorkbenchLayout();
  setupSourceWorkbenchLayout();
  renderFlowControls();
  renderFlowTable();
  renderFlowOutput();
  setBusinessDetailMode("list");
  setCleaningTab(appState.cleaningTab);
  setupModelPresetControls();
  setupDisplayWorkbenchLayout();
  renderBusinessSelector();
  applyTimePreset($("#timePresetSelect")?.value || "24h");
  appState.displayTimeStart = $("#timeStartInput")?.value || "";
  appState.displayTimeEnd = $("#timeEndInput")?.value || "";
  renderAnalysisControls();
  setAnalysisTab(appState.analysisTab);
  renderBusinessTable();
  setupMultiSelectControls();
  refreshMultiSelectControls();
  renderKnowledge();
  renderSyncLog();
  renderAnalysis();
  renderAnswer();
  renderIcons();
  bindEvents();
  animateBackground();
}

document.addEventListener("DOMContentLoaded", boot);
