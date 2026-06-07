import { store } from "../data/store.mjs";

export function createFieldMapping(input = {}) {
  const mapping = {
    id: `map_${Date.now()}`,
    sourceId: input.sourceId || store.dataSources[0]?.id || "",
    sourceField: input.sourceField || "raw.status",
    targetField: input.targetField || "status",
    type: input.type || "字符串",
    defaultValue: input.defaultValue || "",
    ruleId: input.ruleId || "",
    ruleParam: input.ruleParam || "",
    rule: input.rule || "trim",
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

export function createCleaningRule(input = {}) {
  const rule = {
    id: `rule_${Date.now()}`,
    name: input.name || "自定义清洗规则",
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
  const flow = {
    id: `flow_${Date.now()}`,
    name: input.name || "自定义业务流",
    businessName: input.businessName || "新业务模块",
    dataSourceIds: Array.isArray(input.dataSourceIds) ? input.dataSourceIds : [],
    ruleIds: Array.isArray(input.ruleIds) ? input.ruleIds : [],
    nodes: Array.isArray(input.nodes) ? input.nodes : [],
    timeField: input.timeField || "event_time",
    outputMode: input.outputMode || "upsert-business",
    outputConfig: {
      writeStrategy: input.outputConfig?.writeStrategy || "upsert",
      primaryKey: input.outputConfig?.primaryKey || "event_id",
      rawTable: input.outputConfig?.rawTable || `raw_${input.businessName || "business"}`,
      cleanTable: input.outputConfig?.cleanTable || `clean_${input.businessName || "business"}`,
      businessTable: input.outputConfig?.businessTable || `biz_${input.businessName || "business"}`,
      dedupeStrategy: input.outputConfig?.dedupeStrategy || "primary-key"
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
    nodes: Array.isArray(input.nodes) ? input.nodes : existing.nodes || [],
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

export function runBusinessFlow(input = {}) {
  const flow = store.businessFlows.find((item) => item.id === input.flowId) || store.businessFlows[0];
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
  const rules = nodeRuleIds
    .map((id) => store.cleaningRules.find((rule) => rule.id === id))
    .filter(Boolean);
  flow.outputConfig = flow.outputConfig || {
    writeStrategy: "upsert",
    primaryKey: "event_id",
    rawTable: `raw_${flow.businessName}`,
    cleanTable: `clean_${flow.businessName}`,
    businessTable: `biz_${flow.businessName}`,
    dedupeStrategy: "primary-key"
  };
  const nowText = new Date().toISOString().slice(0, 16).replace("T", " ");
  const sourceText = sources.map((source) => source.name).join(" + ") || "未选择数据源";
  const ruleText = rules.map((rule) => rule.name).join(" + ") || "未选择规则";
  const executionPlan = {
    serial: (flow.nodes || []).filter((node) => (node.executionMode || "serial") === "serial").length,
    parallel: (flow.nodes || []).filter((node) => node.executionMode === "parallel").length,
    join: (flow.nodes || []).filter((node) => node.executionMode === "join").length,
    summary: (flow.nodes || [])
      .map((node, index) => `${index + 1}.${node.name || node.type}(${node.executionMode || "serial"})`)
      .join(" -> ")
  };
  const loopCalls = sources.reduce((sum, source) => {
    const parameterConfig = source.parameterConfig || {};
    if (parameterConfig.sourceType === "database" && parameterConfig.iterationMode === "per-record") {
      return sum + 2;
    }
    if (parameterConfig.iterationMode === "batch") {
      return sum + 1;
    }
    return sum + 1;
  }, 0);
  const parameterPlan = {
    loopCalls,
    summary: sources
      .map((source) => {
        const config = source.parameterConfig || {};
        if (config.sourceType === "database") {
          return `${source.name} 从数据库来源 ${config.sourceId || "未选择"} 查询后${config.iterationMode === "per-record" ? "逐条" : "批量"}调用`;
        }
        if (config.sourceType === "source") {
          return `${source.name} 使用上游数据源字段作为入参`;
        }
        if (config.sourceType === "flow") {
          return `${source.name} 使用业务流上下文入参`;
        }
        return `${source.name} 使用固定入参`;
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

  let business = store.businesses.find((item) => item.name === flow.businessName);
  if (!business) {
    business = {
      id: `biz_${Date.now()}`,
      name: flow.businessName,
      timeField: flow.timeField,
      fields: ["事件名称", "等级", "归属对象", "时间", "状态/影响"],
      rows: []
    };
    store.businesses.unshift(business);
  }
  business.rows.unshift(row);
  flow.status = "success";
  flow.lastRunAt = new Date().toISOString();
  flow.updatedAt = flow.lastRunAt;
  store.syncLogs.unshift({
    id: `flow_run_${Date.now()}`,
    sourceId: flow.id,
    sourceName: flow.name,
    status: "success",
    fetchedRows: Math.max(1, loopCalls * 4),
    cleanedRows: 1,
    failedRows: 0,
    durationMs: 1260,
    startedAt: flow.lastRunAt,
    message: `已编排 ${sources.length} 个数据源，执行 ${rules.length} 条规则，输出到 ${flow.outputConfig.businessTable}。规则：${ruleText}`
  });
  return { flow, business, row, sources, rules, outputConfig: flow.outputConfig, parameterPlan, executionPlan };
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

export function queryBusiness(input = {}) {
  const business = store.businesses.find((item) => item.name === input.businessName) || store.businesses[0];
  let rows = [...business.rows];
  const keyword = String(input.keyword || "").trim().toLowerCase();

  if (keyword) {
    rows = rows.filter((row) => row.some((cell) => String(cell).toLowerCase().includes(keyword)));
  }

  if (input.sort === "time") {
    rows.sort((a, b) => String(b[3]).localeCompare(String(a[3])));
  } else if (input.sort === "impact") {
    rows.sort((a, b) => impactValue(b[4]) - impactValue(a[4]));
  } else {
    rows.sort((a, b) => (severityWeight[b[1]] || 0) - (severityWeight[a[1]] || 0));
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
      timeRange: input.timeRange || "最近 24 小时"
    }
  };
}
