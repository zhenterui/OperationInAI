# OperationInAI 目标架构与整体优化设计

> 生成时间：2026-07-01
> 文档性质：**前瞻目标架构设计**（target architecture）。回答「OperationInAI 要成为可对齐老系统 HCS-Data-AIOps 全能力、且通用可投产的智能运维数据平台，应该长成什么样」。
> 关联文档：
> - `DESIGN.md`：当前设计现状
> - `OPTIMIZATION.md`：代码质量与工程化问题（前端/安全/测试）
> - `CAPABILITY-PARITY.md`：老系统能力对齐矩阵 + `diff.md` 代码评审 + 剩余差距
> 本文不再重复差距清单，而是给出**目标分层架构、核心抽象、各层设计方案与优化专题**。

---

## 一、设计目标与原则

### 1.1 目标
1. **能力对齐**：覆盖老系统 8 大能力域（声明式采集、依赖编排、分页并发、多源融合、业务口径、字段级展示、容错认证、弹性调度）。
2. **通用化**：用「字典集 + 节点编排 + 通用 action」表达一切业务口径，**不引入 products/dept/局点**等任何 HCS 专属概念。
3. **可投产**：数据真实可信、可持久化可查询、可自调度自刷新、可观测可审计。

### 1.2 七条设计原则
| 原则 | 含义 | 反例（避免） |
|------|------|-------------|
| **声明式** | 能力靠配置表达，零代码新增数据源 | 写死某个产品的采集逻辑 |
| **通用化** | 业务口径统一收敛到字典集与规则 | 在引擎里出现 `product_name` 字段名 |
| **分层** | 配置/编排/执行/存储/展示/调度各司其职 | 业务数据与配置混在一个 JSON |
| **执行与配置分离** | 运行态（日志/状态）不污染配置态 | 把 lastRunAt 写回 flow 配置 |
| **真实优先** | 生产链路失败必须显式失败，不静默兜底 | 真实 API 失败回退 mock 还报成功 |
| **可观测** | 每一步有进度、日志、审计 | 长任务黑盒运行 |
| **安全默认** | SSRF 白名单、密钥加密、最小权限 | fetch 任意内网地址、API Key 明文 |

---

## 二、目标分层架构

```text
┌──────────────────────────────────────────────────────────────┐
│  展示层 (Presentation)                                        │
│  fieldSchema 驱动：显隐/别名/时间筛选/HTML/跳转/态势总览      │
└───────────────▲──────────────────────────────────────────────┘
                │ 查询/筛选
┌───────────────┴──────────────────────────────────────────────┐
│  智能层 (Intelligence)                                        │
│  智能分析(LLM) · 智能搜索(RAG) · 模型配置                     │
└───────────────▲──────────────────────────────────────────────┘
                │ 读取业务表
┌───────────────┴──────────────────────────────────────────────┐
│  存储层 (Storage) —— 分离设计                                 │
│  ├─ 配置快照存储：dataSources/flows/rules/dicts/auth... (整存) │
│  └─ 业务数据存储：每域独立表 + 动态建表 + 临时表 swap 原子写   │
└───────────────▲──────────────────────────────────────────────┘
                │ 写入
┌───────────────┴──────────────────────────────────────────────┐
│  执行引擎 (Execution Engine)                                  │
│  DAG 调度 → 节点运行时(采集/清洗/聚合/输出)                    │
│  ├─ 采集：live/preview 模式 · 分页探测 · 并发 · 重试 · 缓存    │
│  ├─ 迭代：single/record-driven/domain-driven                  │
│  └─ 写入：overwrite/append/upsert/explode + updateFields      │
└───────────────▲──────────────────────────────────────────────┘
                │ 触发
┌───────────────┴──────────────────────────────────────────────┐
│  编排层 (Orchestration)                                       │
│  业务流 DAG：context/source/rule/join/output + 条件边/分支    │
└───────────────▲──────────────────────────────────────────────┘
                │ 调用
┌───────────────┴──────────────────────────────────────────────┐
│  调度与运行时层 (Scheduling & Runtime)                        │
│  调度器(interval/cron) · 认证自动刷新 · 运行时变量 · 热重载    │
└───────────────▲──────────────────────────────────────────────┘
                │
┌───────────────┴──────────────────────────────────────────────┐
│  配置层 (Configuration)                                       │
│  数据源 · 认证 · 字段映射 · 清洗规则 · 字典集 · 业务流 · 模型  │
└──────────────────────────────────────────────────────────────┘
```

每层只依赖下一层的稳定接口；业务口径（产品/部门/区域等）**只存在于配置层的字典集**，引擎各层对业务语义无感知。

---

## 三、核心抽象：业务口径的通用化收敛

老系统用 `products`/`product_name_mapping`/`dept` 等显式业务概念；目标架构**全部收敛到一个通用实体：字典集（dictionarySets）+ 通用 action**。

### 3.1 字典集作为唯一业务口径载体

```jsonc
{
  "id": "dict_product",
  "name": "产品字典",
  "columns": ["标准名", "别名", "部门", "版本"],
  "rows": [
    { "标准名": "ROMAConnect", "别名": "ROMA Connect,ROMA", "部门": "智能体平台", "版本": "v2" }
  ]
}
```

老系统 5 类业务口径 → 字典集表达方式：

| 老系统概念 | 目标架构通用表达 |
|-----------|-----------------|
| `products`（部门→产品列表） | 字典集 + `where 部门=X` 取列 |
| `product_name_mapping`（标准↔变体） | 字典集「标准名/别名」两列 + lookup/enum action |
| 产品→部门归属 | lookup action（产品名→部门列），多值用 `multi:true` |
| `{{products}}` 展开查询 | placeholder `source:dictionary`（已具备） |
| 产品过滤 | valueFilter `字段 in dict(产品字典.标准名)` |

**收益**：引擎代码零业务概念，新增一个业务域（如「区域」「环境」）只需加字典集，不改代码。

### 3.2 通用 action 注册表（替代专属 processor）

`cleaningRules` 的 `config.action` 维护为注册表 Map（已具备雏形），目标 action 清单：

| 类别 | action | 说明 |
|------|--------|------|
| 文本 | trim/lower/upper/default/replace_all | 基础文本 |
| 提取 | extract(regex)/split_dedupe_join | 正则与切分 |
| 归一 | enum/lookup | 字典正反向归一（lookup 支持 `multi`） |
| 展开 | **explode**(新增) | 父记录 × 子数组 1:N 展开 |
| 清洗 | strip_html/number/date | HTML/数值/日期 |
| 合成 | combine(template)/merge/dedupe | 模板合成与去重 |

> `explode` 是对 `diff.md` 错配的 `replicate` 的**正确替代**：把 1:N 展开做成通用 action，而非 writeStrategy。

---

## 四、执行引擎设计（采集核心）

### 4.1 节点运行时统一模型

所有 source 节点走同一执行生命周期，消除当前多分支散落：

```text
resolveInput → buildRequest → fetch(live/preview) → extract → clean/map → aggregate? → write
```

- **resolveInput**：按 `inputSource`（`upstream`/`database`/`none`/`context`）取输入记录；
- **buildRequest**：占位符解析（`{{变量}}` / `record.字段` / `upstream.字段` / 字典展开）；
- **fetch**：分页探测 + 并发 + 重试（见 4.3）；
- **extract**：responsePath 取记录 + 过滤/值过滤/字段保留；
- **clean/map**：applyFieldMappings（含规则与 isJump）；
- **aggregate**：可选，提取→工具链→回填 targetField；
- **write**：按 writeStrategy + updateFields + atomicWrite 落库。

### 4.2 live / preview 双模式（解决 mock 静默回退）

> 这是 `CAPABILITY-PARITY.md` P0-1 的设计方案。

```text
testDataSource(input) 根据 input.mode:
  mode="preview" (默认, 前端试运行): 真实失败 → 回退 mock, 便于无凭据演示
  mode="live"    (业务流执行/调度/record-driven): 真实失败 → ok=false, 不回退
```

`executeFlowNode` 的 source / record-driven / preActions 调用统一传 `mode:"live"`。由此重试、原子写、聚合在真实失败时正确生效。

### 4.3 分页 / 并发 / 重试统一模型

```text
PaginationConfig (单一真相源 = node.executionConfig.pagination):
  mode: off | page-number | auto | has-more | empty-result | next-token
  pageParam / pageSizeParam / paginateIn(query|body) / startPage / pageSize
  totalCountPath / totalPagesPath / hasNextPath / nextTokenPath
  pagesPerBatch        ← 新增: 批节奏, 替代一次性全量并发
  maxConcurrentPages   ← 新增: 批内并发上限

执行算法:
  1. 取首页(注入分页参数)
  2. auto 模式: 按 path 探测 total/totalPages/hasMore, 选定策略
  3. 剩余页按 pagesPerBatch 切片 → 每批 maxConcurrentPages 并发 → 批间串行
  4. 每批完成输出进度(写 syncLogs 或 SSE 推送)
  5. has-more/empty-result/next-token: 边取边判定终止
```

**重试分级**：仅 `5xx / 408 / 429 / 超时 / 网络错误` 重试；`4xx`（除 408/429）立即失败。
**响应缓存**：run 内 `Map(URL+method+bodyHash → responseBody)`，同参不重复请求；run 结束清空。

### 4.4 迭代模式四态统一（含新增 domain-driven）

| mode | 输入域 | 典型场景 | 对应老系统 |
|------|-------|---------|-----------|
| `single` | 无 | 单次调用 | 默认 |
| `record-driven` | 上游记录 | 逐条详情回填 | aggregate_mode |
| `domain-driven`（新增） | 计算域 | 年份/环境/区域遍历 | start_year 年份展开 |
| `batch` | 上游分批 | 批量提交 | max_concurrent_requests |

domain-driven 配置（通用参数维度展开）：
```jsonc
"iteration": {
  "mode": "domain-driven",
  "domain": {
    "source": "range",                 // range | dictionary | list
    "range": { "from": 2024, "to": 2026, "format": "{value}年" },
    // "dictionaryRef": "环境字典.环境名",   // source=dictionary 时
    // "values": ["cn-east","cn-north"],     // source=list 时
    "paramField": "data_year",          // 注入到哪个请求参数
    "concurrency": 5
  }
}
```
执行复用 record-driven 的并发骨架，对 domain 每个值注入 `paramField`，结果 concat 合并。

---

## 五、数据保存与原子性设计

### 5.1 writeStrategy 统一语义表（修正命名错配）

| writeStrategy | 语义 | 对应老系统 save_mode |
|--------------|------|---------------------|
| `overwrite` | 清空目标表重插 | overwrite |
| `append` | 追加 | append |
| `upsert` | 主键存在更新/不存在插入 | update |
| `upsert-keep-others`（原 diff 的 `replicate` 重命名） | upsert + 保留未匹配旧行 | —（diff 新增，保留） |
| `preview` | 仅预览不落库 | — |

> 老系统的 `replicate`（父子 1:N 展开）**不是 writeStrategy**，改为 `explode` action 在清洗阶段完成（见 §3.2）。

### 5.2 updateFields 部分字段更新
`outputConfig.updateFields: ["status","resolve_day"]` → upsert 时仅更新白名单字段，其余保留。已具备（diff），保留。

### 5.3 原子写：从「flow 级不写」升级为「表级临时表 swap」

```text
目标(接真 DB 后):
  1. beginSnapshot(): 为本流涉及的每张业务表建影子表 _tmp_{table}_{runId}
  2. 所有 source/output 节点写入影子表
  3. 全部节点成功 → commitSnapshot(): RENAME 影子表 → 正式表(原子)
  4. 任一失败/异常 → rollbackSnapshot(): DROP 影子表, 正式表不动
  5. 进程启动 → 清理上次崩溃残留的 _tmp_* 影子表

当前内存态: 保留 diff 的 atomicWrite(flow 级 all-or-nothing) 作为未接 DB 前的等价物。
```

### 5.4 配套能力
- **一源写多列**：fieldMapping 的 `targetField` 支持 `string[]`（一个源值写多列）。
- **同步后清理**：output 节点 `purgeUnmatched: { key, filter }`，upsert 后删除不再匹配的存量行（对应 product_filter_enabled 删行语义）。

---

## 六、存储分层设计

> 解决 `CAPABILITY-PARITY.md` #40：业务数据混在配置快照里不可查。

### 6.1 双存储通道

| 通道 | 内容 | 形态 | 适配器 |
|------|------|------|--------|
| **配置快照** | dataSources/auth/flows/rules/dicts/models/schedules | 整存整取 JSON / 单行 SQLite | 现有 storage-adapter |
| **业务数据** | 各 businessTable 的行数据 | 每表独立、动态建表、SQL 可查 | 新增 BusinessDataAdapter |

### 6.2 BusinessDataAdapter 接口

```text
ensureTable(tableName, fields)        // 首条记录字段驱动建表, 附 _fetched_at 列
insert(tableName, rows)
upsert(tableName, rows, primaryKeys, updateFields?)
overwrite(tableName, rows)            // truncate + insert
deleteUnmatched(tableName, key, filter)
query(tableName, { filter, sort, timeRange, pagination })
beginSnapshot(tableName) / commitSnapshot / rollbackSnapshot
```

- SQLite 实现：动态 `CREATE TABLE`，`INSERT ... ON CONFLICT DO UPDATE`，`RENAME` 做原子 swap。
- 配置快照仍走 `operation_store`，迁移/切换逻辑不变。

### 6.3 收益
- 业务数据可 SQL 查询（分析、导出、外部 BI 直连）；
- 量大后不拖垮配置加载；
- 真正的表级原子写成为可能。

---

## 七、字段级展示元数据设计（fieldSchema）

> 解决 `CAPABILITY-PARITY.md` #29/#30/#31：展示全靠硬编码启发式。

### 7.1 数据结构

```jsonc
business.fieldSchema = [
  { "name": "event_id",   "alias": "事件ID", "isDisplay": false },
  { "name": "event_name", "alias": "事件名称", "isDisplay": true },
  { "name": "severity",   "alias": "等级", "isDisplay": true },
  { "name": "event_time", "alias": "时间", "isDisplay": true, "isCreateTime": true },
  { "name": "owner",      "alias": "归属对象", "isDisplay": true },
  { "name": "detail",     "alias": "详情", "isDisplay": true, "isHtml": true },
  { "name": "cloud_id",   "alias": "", "isDisplay": false,
    "isJump": true, "jumpUrl": "http://hcs.../#/cloud/detail/[cloud_id]" }
]
```

### 7.2 各标记的消费者

| 标记 | 消费层 | 替代现状 |
|------|-------|---------|
| `isDisplay` | 列表显隐 | 当前全展示 |
| `alias` | 表头/导出列名 | 字段名直显 |
| `isCreateTime` | 时间范围筛选字段选择 | situationTimeFilter 启发式猜测 |
| `isHtml` | 前端 HTML 渲染 | 无 |
| `isJump`/`jumpUrl` | 跳转列 | mapping.isJump（对齐统一） |

### 7.3 生成与维护
- output 节点首次产出时，由 mapping 自动生成 fieldSchema 草稿（含 isJump）。
- 「数据展示」页提供可视编辑（显隐勾选 / 别名 / 标记）。
- fieldSchema 持久化在 business 实体上。

---

## 八、调度与认证自动化设计

> 解决 `CAPABILITY-PARITY.md` #36/#39：系统不能自己跑、cookie 不会自动刷新。

### 8.1 调度器 scheduler-service

```jsonc
// schedules[] 配置实体
{
  "id": "sched_alarm",
  "name": "告警流每 5 分钟",
  "flowId": "flow_alarm_ops",
  "mode": "interval",            // once | interval | cron
  "intervalSeconds": 300,        // mode=interval
  "cronExpr": "*/5 * * * *",     // mode=cron
  "enabled": true,
  "lastRunAt": "",
  "nextRunAt": ""
}
```

- 进程内 `setInterval` 驱动；触发即 `runBusinessFlow({flowId, mode:"live"})`。
- 结果写 syncLogs（含每源进度）。
- 进程重启从持久化 schedules 恢复；one-shot 错过则补跑。
- 前端「业务流」页增「定时」入口。

### 8.2 认证自动刷新（声明式登录）

把 authConfig 的 `loginUrl/refreshCycle` 从展示字段升级为可执行刷新：

```jsonc
authConfig.refresh = {
  "enabled": true,
  "cycleSeconds": 3600,
  "login": {
    "method": "POST", "url": "https://ops.example.com/api/login",
    "bodyType": "form",
    "body": { "username": "{{username}}", "password": "{{password}}" }
  },
  "extract": { "cookieName": "OPS_SESSION", "from": "header" }  // header(Set-Cookie) | body(path)
}
```

- `refreshAuth(authId)`：发登录请求 → 从 Set-Cookie 头或响应体提取 cookie → 加密写回。
- 调度器按 `cycleSeconds` 触发；采集执行前检查 `lastRefreshAt`，过期先刷新。
- 登录请求同样走 SSRF 白名单（`assertSafeSourceUrl`）。
- 复杂 SSO/验证码场景预留扩展点，默认覆盖表单登录。

### 8.3 运行时 cookie 覆盖
支持「页面级 cookie」：运行时可注入临时 cookie 覆盖配置 cookie（Admin API 即时更新），优先级高于配置。对应老系统 `set_page_cookie`。

---

## 九、数据模型总览（配置 schema）

```text
配置层实体:
  dataSources[]        连接 + 认证引用 + 请求 + 分页模板 + 响应映射
  authConfigs[]        认证(含 refresh 声明) + 运行时 cookie 覆盖
  fieldMappings[]      源字段→目标字段 + rule + recordMode + isJump
  cleaningRules[]      action 注册表(config.action + config.pipeline)
  dictionarySets[]     业务口径唯一载体(产品/部门/区域/环境...)
  businessFlows[]      DAG(nodes + edges) + outputConfig + fieldSchema 产出
  schedules[]          调度(interval/cron)
  modelConfigs[]       LLM 厂商/模型/Key
  storageConfigs[]     存储通道(配置快照 + 业务数据)

运行态(不入配置态, 仅日志):
  syncLogs[]           每次运行(含每源进度/失败/耗时)
  auditLogs[]          配置变更审计
  analysisResults[]    分析结果
```

---

## 十、优化专题

### 10.1 性能
- **分页批节奏**：pagesPerBatch 替代一次性全量并发，降低内存峰值。
- **响应缓存**：run 内同参去重（aggregate 场景收益最大）。
- **业务数据独立表**：查询走 SQL 索引，替代当前全量数组过滤。
- **并发上限**：`OPERATION_FLOW_MAX_CALLS` 已有，补 `maxConcurrentPages`。

### 10.2 正确性
- **live 模式禁 mock**（P0，见 §4.2）。
- **重试分级**（见 §4.3）。
- **preActions 失败冒泡**：默认 `onError:fail-flow`，变量提取校验。
- **运行态/配置态分离**：lastRunAt/status 进 syncLogs，不写回 flow 配置（修 `OPTIMIZATION.md` B9）。
- **ID 用 `crypto.randomUUID()`**（修 B8）。

### 10.3 可观测
- **进度推送**：分页/record-driven 每批完成写 syncLogs 或 SSE。
- **每源结果明细**：runBusinessFlow 返回已具备 sourceResults，补 attempts/重试原因。
- **认证刷新日志**：refreshAuth 记 lastRefreshAt + 成败。
- **调度心跳**：schedules.lastRunAt/nextRunAt 可视化。

### 10.4 安全
- **SSRF**：所有出站请求（采集/preActions/认证刷新/LLM）统一走 `assertSafeSourceUrl` 白名单；默认拦截元数据 IP 与私网（生产开启 `OPERATION_BLOCK_PRIVATE_FETCH=1`）。
- **密钥**：apiKey/password/cookieValue 加密落盘（已具备 secrets.mjs），运行时解密。
- **鉴权**：`/api/*` 接入 token + 角色（security.mjs 已有雏形），生产强制开启。
- **ReDoS**：`createSafeRegExp` 长度 + 嵌套量词防护（已具备），自定义脚本前加超时。

### 10.5 前端工程化（承接 OPTIMIZATION.md）
- **bindEntityModal 通用抽象**：消 9 套表单三件套（F3），新增 schedules/fieldSchema 复用同一抽象。
- **管道/工具链可视化编辑器**：替代裸 JSON textarea（preActions）与逗号串（aggregate tools）。
- **bindEvents 拆分**：957 行巨函数（F1）按模块切分。

---

## 十一、与老系统最终对齐映射

| 老系统能力域 | 目标架构落点 | 状态 |
|-------------|-------------|------|
| 声明式采集/依赖编排 | 编排层 DAG + inputSource 四态 | ✅ |
| 请求构造/模板变量 | 执行引擎 buildRequest + 占位符 + preActions | ✅ |
| 年份/参数展开 | domain-driven iteration | 🆕 |
| 分页/并发 | 统一分页模型 + pagesPerBatch | ✅(+批节奏) |
| 多源融合(4 模式) | writeStrategy 五态 + explode action | ✅(语义修正) |
| 业务口径(产品/部门) | dictionarySets + lookup/enum(explode) | ✅(通用化) |
| 字段级展示/跳转 | fieldSchema + isJump | ✅ |
| 容错/认证/原子写 | 重试分级 + 认证刷新 + 临时表 swap | ✅ |
| 弹性调度 | scheduler-service(interval/cron) | 🆕 |
| 热重载 | 配置监听 + 运行态分离 | 🆕 |
| 每域独立表 | BusinessDataAdapter | 🆕 |

🆕 = 相对 `diff.md` 仍需新增；✅ = 已具备或方向已定。

---

## 十二、演进路线（整合三份文档）

| 阶段 | 主题 | 关键交付 | 依据 |
|------|------|---------|------|
| **P0** | 真实可信 + 能自己跑 | live 模式禁 mock · replicate 重命名 · scheduler-service · 认证刷新 | PARITY P0 + 本文 §4.2/§5.1/§8 |
| **P1** | 展示可配 + 参数可展开 | fieldSchema · domain-driven · 分页批节奏 · 重试分级 · preActions 冒泡 | PARITY P1 + 本文 §4.3/§4.4/§7 |
| **P2** | 存得下查得了 | BusinessDataAdapter · 业务数据独立表 · 真临时表 swap · 响应缓存 | PARITY P2 + 本文 §5.3/§6 |
| **P3** | 工程化与安全 | 前端通用抽象 · 鉴权强制 · full-validation 入 CI · 插件目录(按需) | OPTIMIZATION F1/F3/S1/S5 |

---

## 十三、一句话总结

> 目标架构把老系统的 HCS 专属概念**全部下沉为「字典集 + 通用 action + DAG 编排」三件通用原语**，用 **live 模式**保证数据真实、用 **scheduler + 认证刷新**让它自己跑、用 **fieldSchema** 让展示可配、用 **业务数据独立表 + 临时表 swap** 让数据可查且原子。`diff.md` 补齐了采集执行侧，本设计补齐「自己跑 / 展示可配 / 存得下」三块，组合后即对齐老系统全部在产能力，且不绑定任何业务概念。
