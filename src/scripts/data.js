window.opsData = {
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
  sources: [
    { name: "告警中心 API", type: "POST /api/alarm/list", status: "Cookie 登录刷新，5 分钟采集", icon: "cloud" },
    { name: "CMDB PostgreSQL", type: "asset_service_relation", status: "数据库连接池，30 分钟增量", icon: "database" },
    { name: "巡检结果 Excel", type: "inspection_daily.xlsx", status: "本地文件解析，手动同步", icon: "file" }
  ],
  mappings: [
    ["alarmName", "event_name", "字符串", "空值过滤 + trim", "内部业务库"],
    ["level", "severity", "枚举", "P0/P1/P2 -> 高/中/低", "内部业务库"],
    ["occurTime", "event_time", "时间", "UTC+8 标准化", "内部业务库"],
    ["service.owner", "owner", "字符串", "CMDB 关联补齐", "内部业务库"],
    ["duration", "impact_minutes", "数字", "秒转分钟", "内部业务库"]
  ],
  businesses: [
    {
      name: "告警业务",
      rows: [
        ["支付网关 5xx 升高", "P0", "支付服务", "2026-06-06 09:42", "17 分钟"],
        ["订单 MQ 堆积", "P1", "订单服务", "2026-06-06 08:16", "46 分钟"],
        ["CMDB 同步延迟", "P2", "资产平台", "2026-06-06 07:55", "11 分钟"],
        ["发布回滚触发", "P1", "营销服务", "2026-06-05 23:30", "24 分钟"]
      ]
    },
    {
      name: "工单业务",
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
    { name: "运维 SOP 文档库", desc: "本地路径 D:/ops/sop，324 个文档", icon: "file" },
    { name: "监控平台帮助中心", desc: "URL 抓取，7,820 个内容切片", icon: "cloud" },
    { name: "历史工单知识", desc: "PostgreSQL 同步，最近 18 个月", icon: "database" }
  ]
};
