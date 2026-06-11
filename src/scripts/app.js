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
  selectedFlowId: "",
  selectedFlowNodeId: "",
  businessDetailMode: "list",
  sourceDetailMode: "list",
  flowNodes: [],
  lastSourceTest: null,
  viewMode: "table",
  chartType: "line",
  lastDisplayResult: null,
  responseValueFilters: [],
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
  flow: "业务流上下文：使用时间窗口、租户、批次号等共享变量。"
};

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

function renderTimeFieldOptions() {
  const business = getCurrentBusiness();
  const selected = $("#timeFieldSelect")?.value || business?.timeField || "event_time";
  const options = [...new Set([business?.timeField, "event_time", "created_at", "updated_at", "occurTime"].filter(Boolean))];
  $("#timeFieldSelect").innerHTML = options.map((field) => `<option value="${escapeHtml(field)}">${escapeHtml(field)}</option>`).join("");
  setSelectValue("#timeFieldSelect", selected);
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
  const businesses = window.opsData.businesses || [];
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
    (sum, business) => sum + (business.rows || []).filter((row) => ["P0", "P1", "高", "严重"].includes(String(row[1] || "").toUpperCase())).length,
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
        const riskRows = rows.filter((row) => ["P0", "P1", "高", "严重"].includes(String(row[1] || "").toUpperCase()));
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
  ].map((value) => Math.max(0.18, value));
  return { metrics, flowCards, signals, radarValues, highRiskCount: attentionCount };
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

function renderParamSourceSelect(selectedId = "") {
  $("#paramSourceSelect").innerHTML = [
    '<option value="">不依赖外部来源</option>',
    ...(window.opsData.sources || [])
      .filter((source) => source.id !== appState.selectedSourceId)
      .map((source) => `<option value="${escapeHtml(source.id)}">${escapeHtml(source.name)} · ${escapeHtml(source.kind)}</option>`)
  ].join("");
  setSelectValue("#paramSourceSelect", selectedId);
}

function getSourceFieldCandidates(sourceId) {
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

function getParamFieldCandidates() {
  const sourceType = $("#paramSourceTypeSelect")?.value || "static";
  if (sourceType === "flow") {
    return ["context.start_time", "context.end_time", "context.businessName", "context.batchId", "context.tenant", "context.env"];
  }
  if (sourceType === "static") {
    return ["start_time", "end_time", "severity", "owner", "env"];
  }
  return getSourceFieldCandidates($("#paramSourceSelect")?.value);
}

function renderParamFieldSelect(selectedFields = []) {
  const fields = getParamFieldCandidates();
  const selected = new Set(selectedFields.filter((field) => fields.includes(field)));
  $("#paramFieldSelect").innerHTML = fields
    .map((field, index) => {
      const checked = selected.size ? selected.has(field) : index < Math.min(fields.length, 3);
      return `<option value="${escapeHtml(field)}" ${checked ? "selected" : ""}>${escapeHtml(field)}</option>`;
    })
    .join("");
  refreshMultiSelectControl($("#paramFieldSelect"));
}

function updateRequestParamVisibility() {
  const method = ($("#apiMethodSelect")?.value || "GET").toUpperCase();
  const supportsBody = !["GET", "DELETE", "HEAD"].includes(method);
  $$("[data-request-param]").forEach((item) => {
    const param = item.dataset.requestParam;
    item.classList.toggle("hidden", param === "body" && !supportsBody);
  });
}

function updateParamSourceTypeHelp() {
  const value = $("#paramSourceTypeSelect")?.value || "static";
  if ($("#paramSourceTypeHelp")) {
    $("#paramSourceTypeHelp").textContent = paramSourceTypeTips[value] || paramSourceTypeTips.static;
  }
  const queryLabel = $("#paramQueryInput")?.closest("label")?.querySelector("span");
  const sourceLabel = $("#paramSourceSelect")?.closest("label")?.querySelector("span");
  const filter = $("#paramFilterInput");
  if (sourceLabel) {
    sourceLabel.textContent = value === "database" ? "来源数据库" : value === "source" ? "上游数据源" : "来源";
  }
  if (queryLabel) {
    queryLabel.textContent = value === "database" ? "来源 SQL" : value === "flow" ? "上下文过滤条件" : value === "source" ? "上游过滤条件" : "固定条件";
  }
  if (filter) {
    filter.placeholder =
      value === "database"
        ? "如 env == prod，SQL 可自动建议 where 条件"
        : value === "flow"
          ? "如 context.env == prod"
          : value === "source"
            ? "如 level == P0 或 service.owner != ''"
            : "固定入参通常无需过滤";
  }
  $("#paramSourceSelect").disabled = value === "static" || value === "flow";
  renderParamFieldSelect(getSelectedValues($("#paramFieldSelect")));
}

function autoGenerateParamMapping() {
  const fields = getSelectedValues($("#paramFieldSelect"));
  const effectiveFields = fields.length ? fields : getParamFieldCandidates().slice(0, 3);
  const method = ($("#apiMethodSelect")?.value || "GET").toUpperCase();
  const targetScope = ["GET", "DELETE", "HEAD"].includes(method) ? "query" : "body";
  const mappings = effectiveFields.map((field) => ({
    from: field,
    to: `${targetScope}.${field.replace(/^context\./, "").replace(/[^a-zA-Z0-9_]/g, "_")}`
  }));
  $("#paramMappingInput").value = JSON.stringify(mappings, null, 2);
  const sourceType = $("#paramSourceTypeSelect").value;
  const filter = $("#paramFilterInput").value.trim();
  if (sourceType === "database") {
    const selected = effectiveFields.length ? effectiveFields.join(", ") : "service_id, owner, env";
    $("#paramQueryInput").value = `select ${selected} from upstream_table${filter ? ` where ${filter}` : " where env = 'prod'"}`;
  } else if (sourceType === "source") {
    $("#paramQueryInput").value = filter || (effectiveFields.includes("level") ? "level == 'P0' || level == 'P1'" : "保留上游输出记录");
  } else if (sourceType === "flow") {
    $("#paramQueryInput").value = filter || "context.start_time && context.end_time";
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
}

function renderSourceTestResult(result) {
  if (!result) {
    $("#sourceTestResult").innerHTML = '<div class="module-status">配置入参后点击“测试联通”，这里会显示返回状态、响应字段和响应体。</div>';
    renderResponseFieldOptions([]);
    return;
  }
  const displayFields = result.recordFields?.length ? result.recordFields : result.fields;
  const uniqueFields = [...new Set((displayFields || []).filter(Boolean))];
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
      ${uniqueFields.map((field) => `<button class="field-chip" data-response-field="${escapeHtml(field)}">${escapeHtml(field)}</button>`).join("")}
    </div>
    ${result.selectedRecords?.length ? `<div class="module-status">过滤/字段保留后的样本</div><pre class="response-preview">${escapeHtml(JSON.stringify(result.selectedRecords, null, 2))}</pre>` : ""}
    <div class="module-status">原始响应体</div>
    <pre class="response-preview">${escapeHtml(JSON.stringify(result.responseBody, null, 2))}</pre>
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
  renderParamSourceSelect(parameterConfig.sourceId || "");
  setSelectValue("#paramSourceTypeSelect", parameterConfig.sourceType || "static");
  updateParamSourceTypeHelp();
  renderParamFieldSelect(parameterConfig.selectedFields || []);
  $("#paramFilterInput").value = parameterConfig.filterCondition || "";
  $("#paramQueryInput").value = parameterConfig.query || "";
  $("#paramMappingInput").value = JSON.stringify(parameterConfig.mappings || [], null, 2);
  setSelectValue("#paramIterationModeSelect", parameterConfig.iterationMode || "single");
  $("#paramStrategyInput").value = parameterConfig.strategy || "concurrency=5; retries=2; continueOnError=true";
  if ($("#mappingSourceSelect").options.length) {
    renderMappingSourceSelect();
  }
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
  setSelectValue("#paramIterationModeSelect", "single");
  $("#paramStrategyInput").value = "concurrency=5; retries=2; continueOnError=true";
  appState.lastSourceTest = null;
  renderSourceTestResult();
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
      sourceId: $("#paramSourceSelect").value,
      selectedFields: getSelectedValues($("#paramFieldSelect")),
      filterCondition: $("#paramFilterInput").value.trim(),
      query: $("#paramQueryInput").value.trim(),
      mappings: parseJsonInput("#paramMappingInput", []),
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

function getMappingById(id) {
  return (window.opsData.fieldMappings || []).find((mapping) => mapping.id === id);
}

function renderDictionarySets() {
  renderGroupedConfigList("#dictionarySetList", window.opsData.dictionarySets || [], {
    bodyClass: "support-group-body",
    getCategory: (dictionary) => dictionary.category || "字典集",
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

function parseDictionaryColumns() {
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

function resetDictionaryForm() {
  appState.editingDictionaryId = "";
  $("#dictionaryModalTitle").textContent = "新增字典集";
  $("#dictionaryNameInput").value = "产品列表";
  $("#dictionaryCategoryInput").value = "业务字典";
  $("#dictionaryColumnsInput").value = "产品部,产品名,别名列表,版本号";
  $("#dictionaryRowsInput").value = JSON.stringify([{ "产品部": "交易产品部", "产品名": "支付网关", "别名列表": "pay-gateway,payment-api", "版本号": "v3" }], null, 2);
  $("#dictionaryDescInput").value = "可被过滤条件、字段值过滤和清洗规则引用。";
  $("#deleteDictionaryBtn").classList.add("hidden");
}

function populateDictionaryForm(dictionary) {
  if (!dictionary) return;
  appState.editingDictionaryId = dictionary.id;
  $("#dictionaryModalTitle").textContent = "编辑字典集";
  $("#dictionaryNameInput").value = dictionary.name || "";
  $("#dictionaryCategoryInput").value = dictionary.category || "通用字典";
  $("#dictionaryColumnsInput").value = (dictionary.columns || []).join(",");
  $("#dictionaryRowsInput").value = JSON.stringify(dictionary.rows || [], null, 2);
  $("#dictionaryDescInput").value = dictionary.description || "";
  $("#deleteDictionaryBtn").classList.remove("hidden");
}

function collectDictionaryForm() {
  const columns = parseDictionaryColumns();
  return {
    name: $("#dictionaryNameInput").value.trim() || "自定义字典集",
    category: $("#dictionaryCategoryInput").value.trim() || "通用字典",
    description: $("#dictionaryDescInput").value.trim(),
    columns,
    rows: parseDictionaryRows()
  };
}

function buildRuleExpression() {
  const sourceField = $("#ruleSourceFieldInput")?.value.trim() || "field";
  const targetField = $("#ruleTargetFieldInput")?.value.trim();
  const action = $("#ruleActionSelect")?.value || "trim";
  const param = $("#ruleParamInput")?.value.trim();
  const dictionary = getDictionarySetById($("#ruleDictionarySelect")?.value);
  const dictionaryColumn = $("#ruleDictionaryColumnSelect")?.value;
  const output = targetField && targetField !== sourceField ? ` -> ${targetField}` : "";
  const dictionaryRef = dictionary ? ` @${dictionary.name}${dictionaryColumn ? `.${dictionaryColumn}` : ""}` : "";
  return `${sourceField}${output} | ${action}${param ? `(${param})` : ""}${dictionaryRef}`;
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
  $("#ruleSourceFieldInput").value = rule.config?.sourceField || "";
  $("#ruleTargetFieldInput").value = rule.config?.targetField || "";
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
  $("#ruleSourceFieldInput").value = "service_name";
  $("#ruleTargetFieldInput").value = "service_name";
  $("#ruleParamInput").value = "trim + lower";
  renderDictionarySelectOptions("#ruleDictionarySelect");
  renderDictionaryColumnOptions("#ruleDictionaryColumnSelect", "");
  syncRuleExpressionPreview();
  $("#ruleDescInput").value = "统一服务名格式并去除空值";
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
      sourceField: $("#ruleSourceFieldInput").value.trim(),
      targetField: $("#ruleTargetFieldInput").value.trim(),
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
  if (values.length <= 2) return values.join("、");
  return `${values.slice(0, 2).join("、")} 等 ${values.length} 项`;
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
          <div class="multi-check-list" id="multiSelectList"></div>
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
  const selected = new Set(getSelectedValues(select));
  $("#multiSelectList").innerHTML = [...select.options]
    .map(
      (option) => `
        <label class="multi-check-item">
          <input type="checkbox" value="${escapeHtml(option.value)}" ${selected.has(option.value) ? "checked" : ""} />
          <span>${escapeHtml(option.textContent || option.value)}</span>
        </label>
      `
    )
    .join("");
  dialog.dataset.targetSelect = selectId;
  openDialog("#multiSelectModal");
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
    dictionaryId: existing.get(field)?.dictionaryId || "",
    dictionaryColumn: existing.get(field)?.dictionaryColumn || "",
    dictionaryScopeColumn: existing.get(field)?.dictionaryScopeColumn || "",
    dictionaryScopeValue: existing.get(field)?.dictionaryScopeValue || "",
    enabled: existing.get(field)?.enabled !== false
  }));
}

function renderValueFilterList() {
  const fields = getSelectedKeepFieldsForValueFilters();
  const filters = normalizeValueFiltersForFields(fields);
  const dictionaries = window.opsData.dictionarySets || [];
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
  });
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

function openValueFilterDialog() {
  renderValueFilterList();
  openDialog("#valueFilterModal");
}

function saveValueFilterDialog() {
  appState.responseValueFilters = $$(".value-filter-row", $("#valueFilterList")).map((row) => ({
    field: row.dataset.valueFilterField,
    matchMode: $("[data-value-filter-mode]", row).value,
    value: $("[data-value-filter-value]", row).value.trim(),
    dictionaryId: $("[data-value-filter-dictionary]", row).value,
    dictionaryColumn: $("[data-value-filter-dictionary-column]", row).value,
    dictionaryScopeColumn: $("[data-value-filter-scope-column]", row).value,
    dictionaryScopeValue: $("[data-value-filter-scope-value]", row).value.trim(),
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
    ...overrides
  };
}

function defaultFlowNodesFromFlow(flow = {}) {
  if (Array.isArray(flow.nodes) && flow.nodes.length) {
    return flow.nodes.map((node, index) => ({
      id: node.id || `node_${index}_${Date.now()}`,
      type: node.type || "source",
      refId: node.refId || "",
      name: node.name || getFlowRefLabel(node.type || "source", node.refId),
      executionMode: node.executionMode || "serial",
      param: node.param || "",
      branchFromId: node.branchFromId || "",
      branchName: node.branchName || "",
      branchCondition: node.branchCondition || ""
    }));
  }
  return [
    { id: "node_context", type: "context", refId: "time-window", name: "业务时间窗口", executionMode: "serial", param: "context.start_time / context.end_time" },
    ...(flow.dataSourceIds || []).map((id) => ({ id: `node_source_${id}`, type: "source", refId: id, name: getFlowRefLabel("source", id), executionMode: "parallel", param: "" })),
    ...(flow.ruleIds || []).map((id) => ({ id: `node_rule_${id}`, type: "rule", refId: id, name: getFlowRefLabel("rule", id), executionMode: "join", param: "" })),
    { id: "node_output", type: "output", refId: "business-table", name: flow.outputConfig?.businessTable || "业务表输出", executionMode: "serial", param: flow.outputConfig?.writeStrategy || "upsert" }
  ];
}

function selectFlowNode(nodeId) {
  appState.selectedFlowNodeId = nodeId || appState.flowNodes[0]?.id || "";
  const node = appState.flowNodes.find((item) => item.id === appState.selectedFlowNodeId);
  if (!node) {
    $("#flowNodeNameInput").value = "";
    renderFlowNodeRefSelect("#flowNodeRefEditSelect", "source");
    renderFlowBranchFromSelect();
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
  updateFlowInspectorMode();
}

function updateFlowInspectorMode() {
  $("#flowNodeInspector")?.classList.toggle("branch-mode", $("#flowNodeBranchModeSelect")?.value === "branch");
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
  if (!appState.selectedFlowNodeId || !appState.flowNodes.some((node) => node.id === appState.selectedFlowNodeId)) {
    appState.selectedFlowNodeId = appState.flowNodes[0]?.id || "";
  }
  let nodeIndex = 0;
  $("#flowDesigner").innerHTML = buildFlowStages(appState.flowNodes)
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
            <div class="flow-branch-label">从 ${escapeHtml(stage.parent.name || getFlowRefLabel(stage.parent.type, stage.parent.refId))} 分支</div>
            <div class="flow-conditional-branches">${branchLanes}</div>
          </div>
        `;
      }
      const node = stage.nodes[0];
      return `<div class="flow-stage ${escapeHtml(node.executionMode || "serial")}-stage">${renderFlowNodeCard(node, nodeIndex++)}</div>`;
    })
    .join("");
  selectFlowNode(appState.selectedFlowNodeId);
  renderIcons();
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
  $("#flowTimeFieldInput").value = flow.timeField;
  setSelectValue("#flowOutputModeSelect", flow.outputMode);
  const outputConfig = flow.outputConfig || {};
  setSelectValue("#flowWriteStrategySelect", outputConfig.writeStrategy || "upsert");
  $("#flowPrimaryKeyInput").value = outputConfig.primaryKey || "event_id";
  $("#flowRawTableInput").value = outputConfig.rawTable || `raw_${flow.businessName || "business"}`;
  $("#flowCleanTableInput").value = outputConfig.cleanTable || `clean_${flow.businessName || "business"}`;
  $("#flowBusinessTableInput").value = outputConfig.businessTable || `biz_${flow.businessName || "business"}`;
  setSelectValue("#flowDedupeStrategySelect", outputConfig.dedupeStrategy || "primary-key");
  appState.flowNodes = defaultFlowNodesFromFlow(flow);
  appState.selectedFlowNodeId = appState.flowNodes[0]?.id || "";
}

function resetFlowForm() {
  appState.selectedFlowId = "";
  $("#flowNameInput").value = "新业务聚合流";
  $("#flowBusinessInput").value = "新业务模块";
  $("#flowTimeFieldInput").value = "event_time";
  setSelectValue("#flowOutputModeSelect", "upsert-business");
  setSelectValue("#flowWriteStrategySelect", "upsert");
  $("#flowPrimaryKeyInput").value = "event_id";
  $("#flowRawTableInput").value = "raw_new_business";
  $("#flowCleanTableInput").value = "clean_new_business";
  $("#flowBusinessTableInput").value = "biz_new_business";
  setSelectValue("#flowDedupeStrategySelect", "primary-key");
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
      const selected = flow.id === appState.selectedFlowId ? "selected" : "";
      const outputTable = flow.outputConfig?.businessTable || `biz_${flow.businessName || "business"}`;
      const topology = branchCount ? `${branchCount} 分支` : parallel ? `${parallel} 并行` : "串行";
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

function collectFlowForm() {
  const dataSourceIds = appState.flowNodes.filter((node) => node.type === "source" && node.refId).map((node) => node.refId);
  const ruleIds = appState.flowNodes.filter((node) => node.type === "rule" && node.refId).map((node) => node.refId);
  return {
    name: $("#flowNameInput").value.trim() || "自定义业务流",
    businessName: $("#flowBusinessInput").value.trim() || "新业务模块",
    timeField: $("#flowTimeFieldInput").value.trim() || "event_time",
    outputMode: $("#flowOutputModeSelect").value,
    dataSourceIds,
    ruleIds,
    nodes: appState.flowNodes,
    outputConfig: {
      writeStrategy: $("#flowWriteStrategySelect").value,
      primaryKey: $("#flowPrimaryKeyInput").value.trim(),
      rawTable: $("#flowRawTableInput").value.trim(),
      cleanTable: $("#flowCleanTableInput").value.trim(),
      businessTable: $("#flowBusinessTableInput").value.trim(),
      dedupeStrategy: $("#flowDedupeStrategySelect").value
    }
  };
}

function renderFlowOutput(result) {
  if (!result) {
    $("#flowOutput").innerHTML = "<h3>业务执行结果</h3><p>保存并执行业务后，会在这里显示这个业务的唯一业务流、组合数据源、清洗规则和最终业务数据。</p>";
    return;
  }
  $("#flowOutput").innerHTML = `
    <h3>业务执行结果</h3>
    <p>${escapeHtml(result.business.name)} 已执行唯一业务流 ${escapeHtml(result.flow.name)}，组合 ${result.sources.length} 个数据源和 ${result.rules.length} 条规则。</p>
    <ul>
      <li>新增业务数据：${result.row.map((cell) => escapeHtml(cell)).join(" / ")}</li>
      <li>数据源：${result.sources.map((source) => escapeHtml(source.name)).join("、") || "未选择"}</li>
      <li>规则：${result.rules.map((rule) => escapeHtml(rule.name)).join("、") || "未选择"}</li>
      <li>落库：原始表 ${escapeHtml(result.outputConfig?.rawTable || "-")}，清洗表 ${escapeHtml(result.outputConfig?.cleanTable || "-")}，业务表 ${escapeHtml(result.outputConfig?.businessTable || "-")}</li>
      <li>写入策略：${escapeHtml(result.outputConfig?.writeStrategy || "-")} / 主键 ${escapeHtml(result.outputConfig?.primaryKey || "-")} / 去重 ${escapeHtml(result.outputConfig?.dedupeStrategy || "-")}</li>
      <li>执行计划：串行 ${escapeHtml(String(result.executionPlan?.serial || 0))} 个，并行 ${escapeHtml(String(result.executionPlan?.parallel || 0))} 个，分支 ${escapeHtml(String(result.executionPlan?.branches || 0))} 条，汇聚 ${escapeHtml(String(result.executionPlan?.join || 0))} 个</li>
      <li>入参循环：${escapeHtml(String(result.parameterPlan?.loopCalls || 0))} 次调用，${escapeHtml(result.parameterPlan?.summary || "固定入参")}</li>
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
  [
    ["flowRawTableInput", "可选。留空时后端按业务名生成 raw_业务名，用于保存采集原文。"],
    ["flowCleanTableInput", "可选。留空时生成 clean_业务名，用于保存映射和清洗后的中间结果。"],
    ["flowBusinessTableInput", "建议配置。最终展示、分析和总览优先读取这张业务结果表。"]
  ].forEach(([id, text]) => {
    const label = $(`#${id}`)?.closest("label");
    if (label && !$(".field-help", label)) {
      label.insertAdjacentHTML("beforeend", `<small class="field-help">${escapeHtml(text)}</small>`);
    }
  });
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
    output: row.length > 5 ? row[5] : row[4]
  }));
  const header = ["源字段", "目标字段", "类型", "默认值", "清洗规则", "输出目标", "操作"];
  const items = mappings.length ? mappings : fallbackRows;
  $("#mappingTable").innerHTML = [
    `<div class="mapping-row header">${header.map((cell) => `<span>${escapeHtml(cell)}</span>`).join("")}</div>`,
    ...items.map((item) => {
      const rule = getRuleById(item.ruleId);
      const ruleText = item.ruleParam
        ? `${rule?.name || item.rule || "自定义规则"} / ${item.ruleParam}`
        : rule?.name || item.rule || "-";
      return `
        <div class="mapping-row" data-mapping-id="${escapeHtml(item.id || "")}">
          <span>${escapeHtml(item.sourceField)}</span>
          <span>${escapeHtml(item.targetField)}</span>
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

function resetMappingForm() {
  appState.editingMappingId = "";
  $("#mapSourceInput").value = "raw.status";
  $("#mapTargetInput").value = "status";
  setSelectValue("#mapTypeSelect", "字符串");
  $("#mapDefaultInput").value = "";
  renderMappingRuleSelect();
  $("#mapRuleInput").value = "";
  $("#addMappingBtn").innerHTML = '<span class="icon" data-icon="plus"></span> 添加映射';
  renderIcons();
}

function populateMappingForm(mapping) {
  if (!mapping) return;
  appState.editingMappingId = mapping.id;
  $("#mapSourceInput").value = mapping.sourceField || "";
  $("#mapTargetInput").value = mapping.targetField || "";
  setSelectValue("#mapTypeSelect", mapping.type || "字符串");
  $("#mapDefaultInput").value = mapping.defaultValue || "";
  renderMappingRuleSelect(mapping.ruleId || "");
  $("#mapRuleInput").value = mapping.ruleParam || mapping.rule || "";
  $("#addMappingBtn").innerHTML = '<span class="icon" data-icon="plus"></span> 保存映射';
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
    <label><span>风险等级</span><select id="severityFilterSelect"><option value="">全部等级</option></select></label>
    <label><span>对象/服务</span><select id="ownerFilterSelect"><option value="">全部对象</option></select></label>
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
  if (!$("#severityFilterSelect")) return;
  const rows = business?.rows || [];
  const fields = getBusinessFields(business);
  updateSelectOptions("#severityFilterSelect", rows.map((row) => row[1]), "全部等级");
  updateSelectOptions("#ownerFilterSelect", rows.map((row) => row[2]), "全部对象");
  const selectedField = $("#fieldFilterSelect")?.value || "";
  $("#fieldFilterSelect").innerHTML = [
    '<option value="">全部字段</option>',
    ...fields.map((field, index) => `<option value="${index}">${escapeHtml(field)}</option>`)
  ].join("");
  if (selectedField && Number(selectedField) < fields.length) setSelectValue("#fieldFilterSelect", selectedField);
}

function applyDisplayFilters(business) {
  if (!business) return { fields: [], rows: [] };
  updateDisplayFilterOptions(business);
  const severity = $("#severityFilterSelect")?.value || "";
  const owner = $("#ownerFilterSelect")?.value || "";
  const fieldIndex = $("#fieldFilterSelect")?.value || "";
  const fieldValue = ($("#fieldValueFilterInput")?.value || "").trim().toLowerCase();
  let rows = [...(business.rows || [])];
  if (severity) rows = rows.filter((row) => String(row[1] || "") === severity);
  if (owner) rows = rows.filter((row) => String(row[2] || "") === owner);
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
        const rowTime = Date.parse(String(row[3] || "").replace(" ", "T"));
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
  const severityCounts = [...countBy(rows.map((row) => row[1])).entries()];
  const objectCounts = [...countBy(rows.map((row) => row[2])).entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);
  const timeCounts = [...countBy(rows.map((row) => String(row[3] || "").slice(5, 16))).entries()].slice(-8);
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
  const highRiskRows = rows.filter((row) => ["P0", "P1", "高", "严重"].includes(String(row[1] || "").toUpperCase()));
  const severityTop = [...countBy(rows.map((row) => row[1])).entries()].sort((a, b) => b[1] - a[1])[0] || ["-", 0];
  const objectTop = [...countBy(rows.map((row) => row[2])).entries()].sort((a, b) => b[1] - a[1])[0] || ["-", 0];
  const latest = rows.map((row) => row[3]).filter(Boolean).sort().at(-1) || "-";
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
  });
  $("#flowNodeBranchModeSelect").addEventListener("change", updateFlowInspectorMode);
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
      appState.selectedFlowNodeId = appState.flowNodes[0]?.id || "";
      renderFlowDesigner();
      return;
    }
    appState.selectedFlowNodeId = nodeId;
    renderFlowDesigner();
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
    renderFlowDesigner();
  });
  $("#deleteFlowNodeBtn").addEventListener("click", () => {
    if (isBusinessPreviewMode()) return;
    if (!appState.selectedFlowNodeId) return;
    const deletedNodeId = appState.selectedFlowNodeId;
    appState.flowNodes = appState.flowNodes
      .filter((node) => node.id !== deletedNodeId)
      .map((node) => (node.branchFromId === deletedNodeId ? { ...node, branchFromId: "", branchName: "", branchCondition: "" } : node));
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
  });
  $("#sourceKindSelect").addEventListener("change", () => {
    updateRequestParamVisibility();
    renderParamFieldSelect();
  });
  $("#apiMethodSelect").addEventListener("change", () => {
    updateRequestParamVisibility();
    renderParamFieldSelect(getSelectedValues($("#paramFieldSelect")));
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
  ["#ruleTypeSelect", "#ruleActionSelect", "#ruleSourceFieldInput", "#ruleTargetFieldInput", "#ruleParamInput"].forEach((selector) => {
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
    queryAndRenderBusiness();
  });
  $("#timeStartInput").addEventListener("change", () => {
    setSelectValue("#timePresetSelect", "custom");
    queryAndRenderBusiness();
  });
  $("#timeEndInput").addEventListener("change", () => {
    setSelectValue("#timePresetSelect", "custom");
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
        body: JSON.stringify({ sourceId: appState.selectedSourceId })
      });
      $("#runSyncBtn").innerHTML = `<span class="icon" data-icon="refresh"></span> ${result.cleanedRows} 行完成`;
      await refreshSyncLogs();
      await loadBootstrapData();
      renderOverview();
      renderSources();
    } catch (error) {
      $("#runSyncBtn").innerHTML = `<span class="icon" data-icon="refresh"></span> 同步完成`;
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
      ruleParam: $("#mapRuleInput").value,
      rule: selectedRule?.expression || $("#mapRuleInput").value || "未配置规则",
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
  ["severityFilterSelect", "ownerFilterSelect", "fieldFilterSelect"].forEach((id) => {
    $(`#${id}`)?.addEventListener("change", queryAndRenderBusiness);
  });
  $("#fieldValueFilterInput")?.addEventListener("input", queryAndRenderBusiness);
  $("#resetDisplayFiltersBtn")?.addEventListener("click", () => {
    setSelectValue("#severityFilterSelect", "");
    setSelectValue("#ownerFilterSelect", "");
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
