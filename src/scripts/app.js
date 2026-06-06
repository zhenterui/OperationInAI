const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const appState = {
  selectedSourceId: "src_alarm_api",
  selectedAuthId: "auth_cookie_ops",
  editingAuthId: "",
  editingRuleId: "",
  lastSourceTest: null,
  viewMode: "table",
  cleaningTab: "business"
};

const icons = {
  radar: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 3a9 9 0 1 1-9 9"/><path d="M12 7a5 5 0 1 1-5 5"/><path d="M12 11a1 1 0 1 1-1 1"/><path d="M12 3v4M21 12h-4M5.6 18.4l2.8-2.8"/></svg>',
  pipeline: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 6h6v6H4zM14 12h6v6h-6z"/><path d="M10 9h2a4 4 0 0 1 4 4v1M7 12v2a4 4 0 0 0 4 4h3"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5M12 16V8M16 16v-8"/></svg>',
  brain: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M8 6a4 4 0 0 0-4 4 4 4 0 0 0 1 7.7A4 4 0 0 0 12 20V5a4 4 0 0 0-4-4"/><path d="M16 6a4 4 0 0 1 4 4 4 4 0 0 1-1 7.7A4 4 0 0 1 12 20"/><path d="M8 10h1M15 10h1M8 15h2M14 15h2"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20 11a8 8 0 0 0-14.8-4"/><path d="M4 5v5h5"/><path d="M4 13a8 8 0 0 0 14.8 4"/><path d="M20 19v-5h-5"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M13 2 4 14h7l-1 8 10-13h-7z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M8 5v14l11-7z"/></svg>',
  database: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M17.5 18H8a5 5 0 1 1 1-9.9A6 6 0 0 1 20 11a3.5 3.5 0 0 1-2.5 7z"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/></svg>'
};

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
  window.opsData.businessFlows = window.opsData.businessFlows || [];
  window.opsData.signals = window.opsData.signals || [];
  window.opsData.knowledge = window.opsData.knowledge || [];
}

const authTypeLabels = {
  "api-cookie": "API / Cookie",
  "db-account-password": "数据库 / 账号密码",
  cookie: "API / Cookie",
  "account-password": "数据库 / 账号密码",
  none: "通用 / 无认证"
};

function normalizeAuthType(type) {
  if (type === "cookie") return "api-cookie";
  if (type === "account-password") return "db-account-password";
  return type || "none";
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
}

function setCleaningTab(tab) {
  if (!$("#cleaningMode")) return;
  appState.cleaningTab = tab;
  $$("#cleaningMode button").forEach((button) => button.classList.toggle("active", button.dataset.cleaningTab === tab));
  $$("[data-cleaning-section]").forEach((section) => {
    section.classList.toggle("hidden", section.dataset.cleaningSection !== tab);
  });
}

function renderMetrics() {
  $("#metricGrid").innerHTML = window.opsData.metrics
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
  $("#flowBoard").innerHTML = window.opsData.flowNodes
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
  $("#sourceStack").innerHTML = window.opsData.sources
    .map(
      (source) => `
        <div class="source-card ${source.id === appState.selectedSourceId ? "selected" : ""}" data-source-id="${escapeHtml(source.id || "")}" role="button" tabindex="0">
          <span class="icon" data-icon="${source.icon}"></span>
          <div>
            <strong>${escapeHtml(source.name)}</strong>
            <small>${escapeHtml(source.type)} · ${escapeHtml(source.status)}</small>
          </div>
          <span class="status-pill ${source.health === "pending" ? "" : "ok"}">${source.health === "pending" ? "待配置" : "运行中"}</span>
        </div>
      `
    )
    .join("");
}

function renderAuthConfigs() {
  const groups = [
    ["API", ["api-cookie"]],
    ["数据库", ["db-account-password"]],
    ["通用", ["none"]]
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
  $("#authConfigList").innerHTML = (window.opsData.authConfigs || [])
    .map(
      (auth) => `
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
    )
    .join("");
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
}

function renderResponseFieldOptions(fields = appState.lastSourceTest?.fields || []) {
  const uniqueFields = [...new Set(fields.filter(Boolean))];
  $("#responseFieldSelect").innerHTML = [
    '<option value="">选择测试响应字段</option>',
    ...uniqueFields.map((field) => `<option value="${escapeHtml(field)}">${escapeHtml(field)}</option>`)
  ].join("");
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
      <span class="status-pill ok">HTTP ${escapeHtml(result.status)}</span>
      <span>${escapeHtml(result.durationMs)} ms</span>
      <span>${escapeHtml(result.testedAt)}</span>
      <span>${escapeHtml(uniqueFields.length)} 个可选字段</span>
      <span>${escapeHtml(result.recordCount ?? 0)} 条样本记录</span>
      <span>${escapeHtml(result.request?.keepMode === "filter" ? "按条件过滤" : "全部保留")}</span>
    </div>
    <div class="field-chip-list">
      ${uniqueFields.map((field) => `<button class="field-chip" data-response-field="${escapeHtml(field)}">${escapeHtml(field)}</button>`).join("")}
    </div>
    <pre class="response-preview">${escapeHtml(JSON.stringify(result.responseBody, null, 2))}</pre>
  `;
  renderResponseFieldOptions(uniqueFields);
}

function getSelectedAuthConfig() {
  return (window.opsData.authConfigs || []).find((auth) => auth.id === appState.selectedAuthId) || window.opsData.authConfigs?.[0];
}

function populateAuthForm(auth = getSelectedAuthConfig()) {
  if (!auth) return;
  appState.selectedAuthId = auth.id;
  appState.editingAuthId = auth.id;
  $("#authNameInput").value = auth.name || "";
  setSelectValue("#authConfigTypeSelect", normalizeAuthType(auth.type));
  $("#authCookieNameInput").value = auth.cookieName || "";
  $("#authPasswordInput").value = auth.cookieValue || "";
  renderAuthConfigs();
}

function resetAuthForm() {
  appState.editingAuthId = "";
  $("#authModalTitle").textContent = "新增认证";
  $("#authNameInput").value = "自定义 Cookie 认证";
  setSelectValue("#authConfigTypeSelect", "api-cookie");
  $("#authCookieNameInput").value = "OPS_SESSION";
  $("#authPasswordInput").value = "";
}

function collectAuthForm() {
  return {
    name: $("#authNameInput").value.trim() || "自定义认证配置",
    type: $("#authConfigTypeSelect").value,
    username: "",
    password: $("#authPasswordInput").value,
    cookieValue: $("#authPasswordInput").value,
    loginUrl: "",
    cookieName: $("#authCookieNameInput").value.trim(),
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
  if ([...element.options].some((option) => option.value === value)) {
    element.value = value;
  }
}

function populateSourceForm(source = getSelectedSource()) {
  if (!source) return;
  appState.selectedSourceId = source.id;
  $("#sourceNameInput").value = source.name || "";
  $("#sourceTypeInput").value = source.type || "";
  setSelectValue("#sourceKindSelect", source.kind || "api");
  setSelectValue("#sourceAuthConfigSelect", source.authConfigId || "auth_none");
  $("#responsePathInput").value = source.responsePath || "data.items";
  setSelectValue("#apiMethodSelect", source.requestConfig?.method || "GET");
  $("#paginationInput").value = source.requestConfig?.pagination || "";
  $("#queryParamsInput").value = JSON.stringify(source.requestConfig?.queryParams || {}, null, 2);
  $("#headerParamsInput").value = JSON.stringify(source.requestConfig?.headers || {}, null, 2);
  $("#bodyParamsInput").value = JSON.stringify(source.requestConfig?.body || {}, null, 2);
  setSelectValue("#responseKeepModeSelect", source.responseConfig?.keepMode || source.responseKeepMode || "all");
  $("#responseFilterInput").value = source.responseConfig?.filterCondition || source.responseFilter || "";
  if ($("#mappingSourceSelect").options.length) {
    renderMappingSourceSelect();
  }
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
  return {
    name: $("#sourceNameInput").value.trim() || "未命名数据源",
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
      filterCondition: $("#responseFilterInput")?.value.trim() || ""
    },
    status: authType.includes("none") ? "无认证" : `${authTypeLabels[authType] || authType}：${authName}`
  };
}

function renderRuleTable() {
  const rows = [["规则名称", "类型", "表达式", "说明", "操作"], ...(window.opsData.cleaningRules || []).map((rule) => [
    rule.name,
    rule.type,
    rule.expression,
    rule.description,
    rule.id
  ])];
  $("#ruleTable").innerHTML = rows
    .map((row, index) => {
      if (index === 0) {
        return `
        <div class="mapping-row support-rule-row header">
          ${row.map((cell) => `<span>${escapeHtml(cell)}</span>`).join("")}
        </div>
      `;
      }
      return `
        <div class="mapping-row support-rule-row">
          <span>${escapeHtml(row[0])}</span>
          <span>${escapeHtml(row[1])}</span>
          <span>${escapeHtml(row[2])}</span>
          <span>${escapeHtml(row[3])}</span>
          <span class="row-actions">
            <button class="small-button" data-rule-action="edit" data-rule-id="${escapeHtml(row[4])}">编辑</button>
            <button class="small-button danger" data-rule-action="delete" data-rule-id="${escapeHtml(row[4])}">删除</button>
          </span>
        </div>
      `;
    })
    .join("");
}

function getRuleById(id) {
  return (window.opsData.cleaningRules || []).find((rule) => rule.id === id);
}

function populateRuleForm(rule) {
  if (!rule) return;
  appState.editingRuleId = rule.id;
  $("#ruleModalTitle").textContent = "编辑规则";
  $("#ruleNameInput").value = rule.name || "";
  setSelectValue("#ruleTypeSelect", rule.type || "mapping");
  $("#ruleExpressionInput").value = rule.expression || "";
  $("#ruleDescInput").value = rule.description || "";
}

function resetRuleForm() {
  appState.editingRuleId = "";
  $("#ruleModalTitle").textContent = "新增规则";
  $("#ruleNameInput").value = "服务名标准化";
  setSelectValue("#ruleTypeSelect", "normalize");
  $("#ruleExpressionInput").value = "service_name trim + lower";
  $("#ruleDescInput").value = "统一服务名格式并去除空值";
}

function collectRuleForm() {
  return {
    name: $("#ruleNameInput").value.trim() || "自定义清洗规则",
    type: $("#ruleTypeSelect").value,
    expression: $("#ruleExpressionInput").value.trim() || "trim + normalize",
    description: $("#ruleDescInput").value.trim() || "用户自定义清洗规则",
    enabled: true
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
  return [...select.selectedOptions].map((option) => option.value);
}

function renderFlowControls() {
  $("#flowSourceSelect").innerHTML = (window.opsData.sources || [])
    .map((source) => `<option value="${escapeHtml(source.id)}">${escapeHtml(source.name)}</option>`)
    .join("");
  $("#flowRuleSelect").innerHTML = (window.opsData.cleaningRules || [])
    .map((rule) => `<option value="${escapeHtml(rule.id)}">${escapeHtml(rule.name)} · ${escapeHtml(rule.type)}</option>`)
    .join("");
  const firstFlow = window.opsData.businessFlows?.[0];
  if (firstFlow) {
    $("#flowNameInput").value = firstFlow.name;
    $("#flowBusinessInput").value = firstFlow.businessName;
    $("#flowTimeFieldInput").value = firstFlow.timeField;
    setSelectValue("#flowOutputModeSelect", firstFlow.outputMode);
    [...$("#flowSourceSelect").options].forEach((option) => {
      option.selected = firstFlow.dataSourceIds.includes(option.value);
    });
    [...$("#flowRuleSelect").options].forEach((option) => {
      option.selected = firstFlow.ruleIds.includes(option.value);
    });
  }
}

function renderFlowTable() {
  const rows = [["业务流", "输出业务", "数据源", "清洗规则", "状态"], ...(window.opsData.businessFlows || []).map((flow) => [
    flow.name,
    flow.businessName,
    String(flow.dataSourceIds?.length || 0),
    String(flow.ruleIds?.length || 0),
    flow.status || "ready"
  ])];
  $("#flowTable").innerHTML = rows
    .map(
      (row, index) => `
        <div class="mapping-row ${index === 0 ? "header" : ""}">
          ${row.map((cell) => `<span>${escapeHtml(cell)}</span>`).join("")}
        </div>
      `
    )
    .join("");
}

function collectFlowForm() {
  return {
    name: $("#flowNameInput").value.trim() || "自定义业务流",
    businessName: $("#flowBusinessInput").value.trim() || "新业务模块",
    timeField: $("#flowTimeFieldInput").value.trim() || "event_time",
    outputMode: $("#flowOutputModeSelect").value,
    dataSourceIds: getSelectedValues($("#flowSourceSelect")),
    ruleIds: getSelectedValues($("#flowRuleSelect"))
  };
}

function renderFlowOutput(result) {
  if (!result) {
    $("#flowOutput").innerHTML = "<h3>业务流输出</h3><p>创建并执行业务流后，会在这里显示组合数据源、规则和最终业务数据。</p>";
    return;
  }
  $("#flowOutput").innerHTML = `
    <h3>业务流输出</h3>
    <p>${escapeHtml(result.flow.name)} 已执行，组合 ${result.sources.length} 个数据源和 ${result.rules.length} 条规则，输出到 ${escapeHtml(result.business.name)}。</p>
    <ul>
      <li>新增业务数据：${result.row.map((cell) => escapeHtml(cell)).join(" / ")}</li>
      <li>数据源：${result.sources.map((source) => escapeHtml(source.name)).join("、") || "未选择"}</li>
      <li>规则：${result.rules.map((rule) => escapeHtml(rule.name)).join("、") || "未选择"}</li>
    </ul>
  `;
}

function renderMappings() {
  renderMappingSourceSelect();
  const selectedSourceId = appState.selectedSourceId;
  const mappings = (window.opsData.fieldMappings || []).filter((item) => item.sourceId === selectedSourceId);
  const fallbackRows = (window.opsData.mappings || []).map((row) => ({
    sourceField: row[0],
    targetField: row[1],
    type: row[2],
    defaultValue: row.length > 5 ? row[3] : "",
    rule: row.length > 5 ? row[4] : row[3],
    output: row.length > 5 ? row[5] : row[4]
  }));
  const rows = [
    ["源字段", "目标字段", "类型", "默认值", "清洗规则", "输出目标"],
    ...(mappings.length ? mappings : fallbackRows).map((item) => [
      item.sourceField,
      item.targetField,
      item.type,
      item.defaultValue || "-",
      item.rule,
      item.output
    ])
  ];
  $("#mappingTable").innerHTML = rows
    .map(
      (row, index) => `
        <div class="mapping-row ${index === 0 ? "header" : ""}">
          ${row.map((cell) => `<span>${cell}</span>`).join("")}
        </div>
      `
    )
    .join("");
}

function renderBusinessSelector() {
  $("#businessSelect").innerHTML = window.opsData.businesses
    .map((item) => `<option>${item.name}</option>`)
    .join("");
}

function getCurrentBusiness() {
  const current = window.opsData.businesses.find((item) => item.name === $("#businessSelect").value) || window.opsData.businesses[0];
  return current;
}

function renderBusinessRows(current) {
  const rows = [["事件名称", "等级", "归属对象", "时间", "状态/影响"], ...current.rows];
  $("#businessTable").innerHTML = rows
    .map(
      (row, index) => `
        <div class="table-row ${index === 0 ? "header" : ""}">
          ${row.map((cell) => `<span>${cell}</span>`).join("")}
        </div>
      `
    )
    .join("");
  drawTrendChart(current.name);
}

function renderBusinessTable() {
  renderBusinessRows(getCurrentBusiness());
}

async function queryAndRenderBusiness() {
  const fallback = getCurrentBusiness();
  try {
    const result = await apiRequest("/api/businesses/query", {
      method: "POST",
      body: JSON.stringify({
        businessName: $("#businessSelect").value,
        keyword: $("#tableSearchInput").value,
        sort: $("#sortSelect").value,
        timeField: $("#timeFieldSelect").value,
        timeRange: $("#timeRangeInput").value,
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
    renderBusinessRows({ ...fallback, rows: appState.viewMode === "top" ? rows.slice(0, 3) : rows });
  }
}

function renderSignals() {
  $("#signalList").innerHTML = window.opsData.signals
    .map(
      (signal) => `
        <div class="signal-item">
          <span class="icon" data-icon="${signal.icon}"></span>
          <div>
            <strong>${signal.title}</strong>
            <small>${signal.desc}</small>
          </div>
          <span class="status-pill danger">需关注</span>
        </div>
      `
    )
    .join("");
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
      ${sections
        .map(
          (section) => `
            <div class="insight-card">
              <h3>${section.title}</h3>
              <p>${section.content}</p>
            </div>
          `
        )
        .join("")}
      ${
        result?.evidence?.length
          ? `<div class="insight-card"><h3>证据</h3><p>${result.evidence
              .map((item) => `${escapeHtml(item.severity)} ${escapeHtml(item.service)} ${escapeHtml(item.event)} ${escapeHtml(item.time)}`)
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
  const values = [0.78, 0.62, 0.84, 0.46, 0.7, 0.55];
  const labels = ["告警", "容量", "变更", "链路", "安全", "知识"];
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
  if ($("#cleaningMode")) {
    $("#cleaningMode").addEventListener("click", (event) => {
      if (event.target.tagName !== "BUTTON") return;
      setCleaningTab(event.target.dataset.cleaningTab);
    });
  }
  $("#sourceStack").addEventListener("click", (event) => {
    const card = event.target.closest("[data-source-id]");
    if (!card) return;
    appState.selectedSourceId = card.dataset.sourceId;
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
  $("#responseFieldSelect").addEventListener("change", () => {
    if ($("#responseFieldSelect").value) {
      $("#mapSourceInput").value = $("#responseFieldSelect").value;
    }
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
  $("#businessSelect").addEventListener("change", queryAndRenderBusiness);
  $("#tableSearchInput").addEventListener("input", queryAndRenderBusiness);
  $("#sortSelect").addEventListener("change", queryAndRenderBusiness);
  $("#timeFieldSelect").addEventListener("change", queryAndRenderBusiness);
  $("#timeRangeInput").addEventListener("change", queryAndRenderBusiness);
  $("#generateAnalysisBtn").addEventListener("click", async () => {
    $("#generateAnalysisBtn").innerHTML = `<span class="icon" data-icon="refresh"></span> 分析中`;
    renderIcons();
    try {
      const result = await apiRequest("/api/analysis/run", {
        method: "POST",
        body: JSON.stringify({
          businessName: $("#businessSelect").value,
          model: $("#modelProviderSelect").value,
          fields: $("#analysisFieldsInput").value,
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
      renderMetrics();
      renderSources();
    } catch (error) {
      $("#runSyncBtn").innerHTML = `<span class="icon" data-icon="refresh"></span> 同步完成`;
    }
    renderIcons();
  });
  $("#addSourceBtn").addEventListener("click", async () => {
    const payload = collectSourceForm();
    $("#sourceActionStatus").textContent = "正在新增数据源...";
    try {
      const source = await apiRequest("/api/data-sources", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      appState.selectedSourceId = source.id;
      window.opsData.sources.unshift(source);
      $("#sourceActionStatus").textContent = `已新增并选中：${source.name}`;
    } catch (error) {
      const localSource = {
        id: `local_${Date.now()}`,
        ...payload,
        status: "本地新增，待后端保存",
        icon: "cloud"
      };
      appState.selectedSourceId = localSource.id;
      window.opsData.sources.unshift(localSource);
      $("#sourceActionStatus").textContent = `后端不可用，已在本地新增：${localSource.name}`;
    }
    populateSourceForm();
    renderSources();
    renderMappingSourceSelect();
    renderMappings();
    renderIcons();
  });
  $("#saveSourceBtn").addEventListener("click", async () => {
    const source = getSelectedSource();
    if (!source?.id) return;
    const payload = collectSourceForm();
    try {
      const saved = await apiRequest(`/api/data-sources/${encodeURIComponent(source.id)}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      window.opsData.sources = window.opsData.sources.map((item) => (item.id === saved.id ? saved : item));
      $("#sourceActionStatus").textContent = `已保存：${saved.name}`;
    } catch {
      window.opsData.sources = window.opsData.sources.map((item) => (item.id === source.id ? { ...item, ...payload, updatedAt: new Date().toISOString() } : item));
      $("#sourceActionStatus").textContent = `后端不可用，已本地保存：${payload.name}`;
    }
    populateSourceForm();
    renderSources();
    renderMappingSourceSelect();
    renderMappings();
    renderIcons();
  });
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
  $("#deleteSourceBtn").addEventListener("click", async () => {
    const source = getSelectedSource();
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
    $("#sourceActionStatus").textContent = `已删除：${source.name}`;
    populateSourceForm();
    renderSources();
    renderMappingSourceSelect();
    renderMappings();
    renderIcons();
  });
  $("#addMappingBtn").addEventListener("click", async () => {
    const mapping = {
      sourceField: $("#mapSourceInput").value,
      sourceId: appState.selectedSourceId,
      targetField: $("#mapTargetInput").value,
      type: $("#mapTypeSelect").value,
      defaultValue: $("#mapDefaultInput").value,
      rule: $("#mapRuleInput").value,
      output: "内部业务库"
    };
    try {
      const saved = await apiRequest("/api/field-mappings", {
        method: "POST",
        body: JSON.stringify(mapping)
      });
      window.opsData.fieldMappings = window.opsData.fieldMappings || [];
      window.opsData.fieldMappings.push(saved);
      window.opsData.mappings.push([saved.sourceField, saved.targetField, saved.type, saved.defaultValue || "", saved.rule, saved.output]);
    } catch {
      window.opsData.fieldMappings = window.opsData.fieldMappings || [];
      window.opsData.fieldMappings.push({ id: `local_map_${Date.now()}`, ...mapping });
      window.opsData.mappings.push([mapping.sourceField, mapping.targetField, mapping.type, mapping.defaultValue || "", mapping.rule, mapping.output]);
    }
    renderMappings();
    renderMappingSourceSelect();
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
      window.opsData.businessFlows = window.opsData.businessFlows.map((flow) => ({
        ...flow,
        ruleIds: flow.ruleIds.filter((id) => id !== ruleId)
      }));
      renderRuleTable();
      renderFlowControls();
      renderFlowTable();
    }
  });
  $("#createFlowBtn").addEventListener("click", async () => {
    const payload = collectFlowForm();
    try {
      const flow = await apiRequest("/api/business-flows", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      window.opsData.businessFlows.unshift(flow);
    } catch {
      window.opsData.businessFlows.unshift({ id: `local_flow_${Date.now()}`, ...payload, status: "ready" });
    }
    renderFlowTable();
  });
  $("#runFlowBtn").addEventListener("click", async () => {
    let flow = window.opsData.businessFlows?.[0];
    if (!flow || flow.name !== $("#flowNameInput").value.trim()) {
      const payload = collectFlowForm();
      try {
        flow = await apiRequest("/api/business-flows", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        window.opsData.businessFlows.unshift(flow);
      } catch {
        flow = { id: `local_flow_${Date.now()}`, ...payload, status: "ready" };
        window.opsData.businessFlows.unshift(flow);
      }
    }
    try {
      const result = await apiRequest("/api/business-flows/run", {
        method: "POST",
        body: JSON.stringify({ flowId: flow.id })
      });
      renderFlowOutput(result);
      await loadBootstrapData();
      renderBusinessSelector();
      $("#businessSelect").value = result.business.name;
      renderBusinessRows({ name: result.business.name, rows: result.business.rows });
      renderFlowTable();
      await refreshSyncLogs();
    } catch {
      renderFlowOutput({
        flow,
        sources: window.opsData.sources.filter((source) => flow.dataSourceIds.includes(source.id)),
        rules: window.opsData.cleaningRules.filter((rule) => flow.ruleIds.includes(rule.id)),
        business: { name: flow.businessName },
        row: [`${flow.businessName} 聚合数据`, "P1", "本地模拟", new Date().toISOString().slice(0, 16).replace("T", " "), `${flow.ruleIds.length} 条规则`]
      });
    }
    renderIcons();
  });
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
    if (event.target.tagName !== "BUTTON") return;
    appState.viewMode = event.target.dataset.view;
    $$("#viewMode button").forEach((button) => button.classList.toggle("active", button === event.target));
    $(".data-table").style.display = appState.viewMode === "chart" ? "none" : "block";
    $(".chart-panel").style.display = appState.viewMode === "table" ? "block" : "block";
    queryAndRenderBusiness();
  });
  $("#globalSearch").addEventListener("input", () => {
    const keyword = $("#globalSearch").value.trim().toLowerCase();
    if (!keyword) {
      renderSources();
      renderSignals();
      renderKnowledge();
      renderIcons();
      return;
    }
    const sourceMatch = window.opsData.sources.filter((item) => `${item.name} ${item.type} ${item.status}`.toLowerCase().includes(keyword));
    const signalMatch = window.opsData.signals.filter((item) => `${item.title} ${item.desc}`.toLowerCase().includes(keyword));
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
      const original = window.opsData.signals;
      window.opsData.signals = signalMatch;
      renderSignals();
      window.opsData.signals = original;
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
  renderMetrics();
  renderFlow();
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
  renderFlowControls();
  renderFlowTable();
  renderFlowOutput();
  setCleaningTab(appState.cleaningTab);
  renderBusinessSelector();
  renderBusinessTable();
  renderSignals();
  renderKnowledge();
  renderSyncLog();
  renderAnalysis();
  renderAnswer();
  renderIcons();
  bindEvents();
  drawRiskRadar();
  animateBackground();
}

document.addEventListener("DOMContentLoaded", boot);
