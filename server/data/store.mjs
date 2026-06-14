const now = () => new Date().toISOString();

export const store = {
  metrics: [
    { label: "接入数据源", value: "28", delta: "+4 本周新增", icon: "database" },
    { label: "清洗成功率", value: "99.2%", delta: "最近 24 小时", icon: "pipeline" },
    { label: "高优告警", value: "17", delta: "-23% 环比下降", icon: "radar" },
    { label: "知识命中率", value: "86%", delta: "+9% 语义召回", icon: "search" }
  ],
  flowNodes: [
    { title: "API / Cookie", desc: "监控、CMDB、工单接口，支持登录刷新", icon: "cloud" },
    { title: "数据库 / 表格", desc: "多源合并，字段抽取，增量采集", icon: "database" },
    { title: "映射与清洗", desc: "源字段到目标字段，类型转换与枚举归一", icon: "pipeline" },
    { title: "展示 / 分析 / 搜索", desc: "业务视图、AI 洞察、知识问答", icon: "spark" }
  ],
  situationFilters: [
    { id: "situation_filter_severity", label: "等级", field: "等级", type: "select", source: "auto", dictionaryRef: "", options: [], defaultVisible: true, defaultValue: "" },
    { id: "situation_filter_owner", label: "归属对象", field: "归属对象", type: "select", source: "auto", dictionaryRef: "", options: [], defaultVisible: true, defaultValue: "" },
    { id: "situation_filter_env", label: "环境", field: "env", type: "select", source: "auto", dictionaryRef: "", options: [], defaultVisible: true, defaultValue: "" }
  ],
  situationTimeFilter: {
    fields: ["event_time", "created_at", "updated_at", "time", "时间"],
    defaultRange: "24h"
  },
  dataSources: [
    {
      id: "src_alarm_api",
      name: "告警中心 API",
      kind: "api",
      type: "POST /api/alarm/list",
      authType: "cookie-refresh",
      authConfigId: "auth_cookie_ops",
      status: "Cookie 登录刷新，5 分钟采集",
      icon: "cloud",
      health: "running",
      responsePath: "data.items",
      requestConfig: {
        method: "POST",
        queryParams: { startTime: "{{start_time}}", endTime: "{{end_time}}" },
        headers: { "X-System": "OperationInAI" },
        body: { severity: ["P0", "P1"], includeRecovered: false },
        pagination: "page=1&pageSize=100"
      },
      responseConfig: {
        keepMode: "filter",
        filterCondition: "level in [P0,P1]"
      },
      parameterConfig: {
        sourceType: "database",
        sourceId: "src_cmdb_pg",
        query: "select service_id, owner, env from asset_service_relation where env = 'prod'",
        mappings: [
          { from: "service_id", to: "body.serviceId" },
          { from: "owner", to: "query.owner" }
        ],
        placeholders: [
          { name: "start_time", source: "mapping", from: "context.start_time" },
          { name: "end_time", source: "mapping", from: "context.end_time" }
        ],
        iterationMode: "per-record",
        strategy: "concurrency=5; retries=2; continueOnError=true"
      },
      updatedAt: now()
    },
    {
      id: "src_cmdb_pg",
      name: "CMDB PostgreSQL",
      kind: "database",
      type: "asset_service_relation",
      authType: "db-password",
      authConfigId: "auth_db_cmdb",
      status: "数据库连接池，30 分钟增量",
      icon: "database",
      health: "running",
      responsePath: "rows",
      requestConfig: {
        method: "SQL",
        queryParams: {},
        headers: {},
        body: { table: "asset_service_relation" },
        pagination: "limit 500"
      },
      responseConfig: {
        keepMode: "all",
        filterCondition: ""
      },
      parameterConfig: {
        sourceType: "static",
        sourceId: "",
        query: "",
        mappings: [],
        iterationMode: "single",
        strategy: ""
      },
      updatedAt: now()
    },
    {
      id: "src_inspection_xlsx",
      name: "巡检结果 Excel",
      kind: "file",
      type: "inspection_daily.xlsx",
      authType: "none",
      authConfigId: "auth_none",
      status: "本地文件解析，手动同步",
      icon: "file",
      health: "running",
      responsePath: "sheets[0].rows",
      requestConfig: {
        method: "FILE",
        queryParams: {},
        headers: {},
        body: { sheet: "Sheet1" },
        pagination: ""
      },
      responseConfig: {
        keepMode: "filter",
        filterCondition: "result != ok"
      },
      parameterConfig: {
        sourceType: "static",
        sourceId: "",
        query: "",
        mappings: [],
        iterationMode: "single",
        strategy: ""
      },
      updatedAt: now()
    }
  ],
  authConfigs: [
    {
      id: "auth_cookie_ops",
      name: "运维平台 Cookie 登录",
      category: "API 认证",
      type: "api-cookie",
      username: "ops_user",
      password: "******",
      cookieValue: "",
      loginUrl: "https://ops.example.com/api/login",
      cookieName: "OPS_SESSION",
      tokenHeader: "",
      refreshCycle: "45 分钟",
      status: "可用",
      updatedAt: now()
    },
    {
      id: "auth_db_cmdb",
      name: "CMDB 数据库账号",
      category: "数据库认证",
      type: "db-account-password",
      username: "cmdb_reader",
      password: "******",
      cookieValue: "",
      loginUrl: "",
      cookieName: "",
      tokenHeader: "",
      refreshCycle: "30 分钟",
      status: "可用",
      updatedAt: now()
    },
    {
      id: "auth_none",
      name: "无认证",
      category: "通用认证",
      type: "none",
      username: "",
      password: "",
      cookieValue: "",
      loginUrl: "",
      cookieName: "",
      tokenHeader: "",
      refreshCycle: "手动",
      status: "可用",
      updatedAt: now()
    }
  ],
  fieldMappings: [
    { id: "map_alarm_name", sourceId: "src_alarm_api", sourceField: "alarmName", targetField: "event_name", type: "字符串", defaultValue: "未命名事件", rule: "空值过滤 + trim", output: "内部业务库" },
    { id: "map_alarm_level", sourceId: "src_alarm_api", sourceField: "level", targetField: "severity", type: "枚举", defaultValue: "P2", rule: "P0/P1/P2 -> 高/中/低", output: "内部业务库" },
    { id: "map_alarm_time", sourceId: "src_alarm_api", sourceField: "occurTime", targetField: "event_time", type: "时间", defaultValue: "", rule: "UTC+8 标准化", output: "内部业务库" },
    { id: "map_cmdb_owner", sourceId: "src_cmdb_pg", sourceField: "service.owner", targetField: "owner", type: "字符串", defaultValue: "未分配", rule: "CMDB 关联补齐", output: "内部业务库" },
    { id: "map_inspection_duration", sourceId: "src_inspection_xlsx", sourceField: "duration", targetField: "impact_minutes", type: "数字", defaultValue: "0", rule: "秒转分钟", output: "内部业务库" }
  ],
  cleaningRules: [
    {
      id: "rule_alarm_normalize",
      name: "告警字段标准化",
      type: "mapping",
      expression: "level -> severity, occurTime -> event_time",
      description: "统一告警等级、时间字段和服务负责人",
      enabled: true,
      updatedAt: now()
    },
    {
      id: "rule_owner_enrich",
      name: "CMDB 负责人补齐",
      type: "enrich",
      expression: "service_id join cmdb.owner",
      description: "通过 CMDB 数据源补齐服务负责人和系统归属",
      enabled: true,
      updatedAt: now()
    }
  ],
  businessFlows: [
    {
      id: "flow_alarm_ops",
      name: "告警业务聚合流",
      businessName: "告警业务",
      dataSourceIds: ["src_alarm_api", "src_cmdb_pg"],
      ruleIds: ["rule_alarm_normalize", "rule_owner_enrich"],
      nodes: [
        { id: "node_context_default", type: "context", refId: "time-window", name: "业务时间窗口", executionMode: "serial", param: "context.start_time / context.end_time" },
        { id: "node_source_alarm", type: "source", refId: "src_alarm_api", name: "告警中心 API", executionMode: "serial", param: "按 CMDB 服务逐条调用", branchFromId: "node_context_default", branchName: "告警采集分支", branchCondition: "存在 P0/P1 告警窗口" },
        { id: "node_source_cmdb", type: "source", refId: "src_cmdb_pg", name: "CMDB PostgreSQL", executionMode: "serial", param: "服务负责人补齐", branchFromId: "node_context_default", branchName: "资产补齐分支", branchCondition: "需要服务归属补齐" },
        { id: "node_rule_alarm", type: "rule", refId: "rule_alarm_normalize", name: "告警字段标准化", executionMode: "join", param: "level/time/service" },
        { id: "node_rule_owner", type: "rule", refId: "rule_owner_enrich", name: "CMDB 负责人补齐", executionMode: "serial", param: "service_id join owner" },
        { id: "node_output_alarm", type: "output", refId: "business-table", name: "biz_alarm_event", executionMode: "serial", param: "upsert by event_id" }
      ],
      timeField: "event_time",
      outputMode: "upsert-business",
      outputConfig: {
        writeStrategy: "upsert",
        primaryKey: "event_id,source_id",
        rawTable: "raw_alarm_api",
        cleanTable: "clean_alarm_event",
        businessTable: "biz_alarm_event",
        dedupeStrategy: "primary-key",
        dedupeFields: ""
      },
      status: "ready",
      lastRunAt: "",
      updatedAt: now()
    }
  ],
  businesses: [
    {
      id: "biz_alarm",
      name: "告警业务",
      timeField: "event_time",
      fields: ["事件名称", "等级", "归属对象", "时间", "状态/影响"],
      rows: [
        ["支付网关 5xx 升高", "P0", "支付服务", "2026-06-06 09:42", "17 分钟"],
        ["订单 MQ 堆积", "P1", "订单服务", "2026-06-06 08:16", "46 分钟"],
        ["CMDB 同步延迟", "P2", "资产平台", "2026-06-06 07:55", "11 分钟"],
        ["发布回滚触发", "P1", "营销服务", "2026-06-05 23:30", "24 分钟"]
      ]
    },
    {
      id: "biz_ticket",
      name: "工单业务",
      timeField: "created_at",
      fields: ["事件名称", "等级", "归属对象", "时间", "状态/影响"],
      rows: [
        ["数据库慢查询治理", "P1", "DBA 团队", "2026-06-06 10:10", "处理中"],
        ["证书过期巡检", "P0", "平台团队", "2026-06-06 09:05", "待处理"],
        ["容量扩容申请", "P2", "资源团队", "2026-06-05 18:20", "已完成"],
        ["发布权限审核", "P2", "DevOps", "2026-06-05 16:44", "处理中"]
      ]
    }
  ],
  signals: [
    { title: "支付服务错误率在 09:30 后持续抬升", desc: "关联 3 个 P0 告警，影响核心交易链路", icon: "radar" },
    { title: "知识库新增 Nginx 502 处理 SOP", desc: "已完成切片与向量化，可用于智能搜索", icon: "file" },
    { title: "CMDB 资产标签补齐任务完成", desc: "本次补齐 1,248 条服务与负责人关系", icon: "database" }
  ],
  knowledge: [
    { id: "ks_sop", name: "运维 SOP 文档库", desc: "本地路径 D:/ops/sop，324 个文档", icon: "file", chunks: 3240 },
    { id: "ks_monitor_docs", name: "监控平台帮助中心", desc: "URL 抓取，7,820 个内容切片", icon: "cloud", chunks: 7820 },
    { id: "ks_ticket_history", name: "历史工单知识", desc: "PostgreSQL 同步，最近 18 个月", icon: "database", chunks: 18540 }
  ],
  modelConfigs: [
    {
      id: "model_openai_compatible",
      name: "OpenAI Compatible",
      category: "美国热门模型",
      vendor: "openai-compatible",
      model: "gpt-4.1-mini",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "",
      apiKeyMasked: "未配置",
      status: "可选",
      updatedAt: now()
    },
    {
      id: "model_deepseek",
      name: "DeepSeek 运维分析",
      category: "中国热门模型",
      vendor: "deepseek",
      model: "deepseek-chat",
      baseUrl: "https://api.deepseek.com/v1",
      apiKey: "",
      apiKeyMasked: "未配置",
      status: "可选",
      updatedAt: now()
    },
    {
      id: "preset_qwen_plus",
      name: "通义千问 Qwen Plus",
      category: "中国热门模型",
      vendor: "qwen",
      model: "qwen-plus",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      apiKey: "",
      apiKeyMasked: "未配置",
      status: "预置模板，待配置 API Key",
      updatedAt: now()
    },
    {
      id: "preset_kimi_k2",
      name: "Kimi K2",
      category: "中国热门模型",
      vendor: "moonshot",
      model: "kimi-k2-0711-preview",
      baseUrl: "https://api.moonshot.cn/v1",
      apiKey: "",
      apiKeyMasked: "未配置",
      status: "预置模板，待配置 API Key",
      updatedAt: now()
    },
    {
      id: "preset_hunyuan_turbo",
      name: "腾讯混元 Turbo",
      category: "中国热门模型",
      vendor: "hunyuan",
      model: "hunyuan-turbos-latest",
      baseUrl: "https://api.hunyuan.cloud.tencent.com/v1",
      apiKey: "",
      apiKeyMasked: "未配置",
      status: "预置模板，待配置 API Key",
      updatedAt: now()
    },
    {
      id: "preset_gpt_4o_mini",
      name: "OpenAI GPT-4o mini",
      category: "美国热门模型",
      vendor: "openai-compatible",
      model: "gpt-4o-mini",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "",
      apiKeyMasked: "未配置",
      status: "预置模板，待配置 API Key",
      updatedAt: now()
    },
    {
      id: "preset_claude_sonnet",
      name: "Claude Sonnet",
      category: "美国热门模型",
      vendor: "anthropic",
      model: "claude-3-5-sonnet-latest",
      baseUrl: "https://api.anthropic.com/v1",
      apiKey: "",
      apiKeyMasked: "未配置",
      status: "预置模板，待配置 API Key",
      updatedAt: now()
    },
    {
      id: "preset_gemini_flash",
      name: "Gemini Flash",
      category: "美国热门模型",
      vendor: "gemini",
      model: "gemini-1.5-flash",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: "",
      apiKeyMasked: "未配置",
      status: "预置模板，待配置 API Key",
      updatedAt: now()
    }
  ],
  dictionarySets: [
    {
      id: "dict_product_catalog",
      name: "产品列表",
      category: "业务字典",
      description: "用于按产品部、产品名、别名和版本号匹配数据源过滤和清洗规则。",
      columns: ["产品部", "产品名", "别名列表", "版本号"],
      rows: [
        { "产品部": "交易产品部", "产品名": "支付网关", "别名列表": "pay-gateway,payment-api", "版本号": "v3" },
        { "产品部": "订单产品部", "产品名": "订单中心", "别名列表": "order-center,order-api", "版本号": "v2" }
      ],
      updatedAt: now()
    }
  ],
  storageConfigs: [
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
      readonly: true,
      active: true,
      updatedAt: now()
    }
  ],
  currentStorageId: "storage_local_default",
  storageMigrationLogs: [],
  syncLogs: [],
  analysisResults: []
};

export function getBootstrapData() {
  return {
    metrics: store.metrics,
    flowNodes: store.flowNodes,
    sources: store.dataSources,
    authConfigs: store.authConfigs,
    fieldMappings: store.fieldMappings,
    mappings: store.fieldMappings.map((item) => [
      item.sourceField,
      item.targetField,
      item.type,
      item.defaultValue || "",
      item.rule,
      item.output
    ]),
    businesses: store.businesses.map((item) => ({
      id: item.id,
      name: item.name,
      timeField: item.timeField,
      fields: item.fields,
      rows: item.rows
    })),
    situationFilters: store.situationFilters,
    situationTimeFilter: store.situationTimeFilter,
    cleaningRules: store.cleaningRules,
    businessFlows: store.businessFlows,
    modelConfigs: store.modelConfigs,
    dictionarySets: store.dictionarySets,
    storageConfigs: store.storageConfigs.map((item) => ({ ...item, active: item.id === store.currentStorageId, password: "" })),
    currentStorageId: store.currentStorageId,
    storageMigrationLogs: store.storageMigrationLogs,
    signals: store.signals,
    knowledge: store.knowledge
  };
}
