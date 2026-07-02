# OperationInAI 对齐老系统(HCS-Data-AIOps)能力剖析与增强建议

> 生成时间：2026-07-01
> 输入依据：
> - 老系统解析文档 `tmp/livedata.md`（HCS-Data-AIOps `livedata_config.json` 全字段解析，现网稳定运行）
> - OperationInAI 现网代码（`server/` 全量 + `src/scripts/app.js`）
> - 内网测试已落地的 15 项能力变更 `tmp/diff.md`（基线 `a1d4778` → `3ed0585`，15/15 场景通过）
> 定位：本文不是代码质量评估（那部分见 `OPTIMIZATION.md`），而是**能力对齐**——以老系统在产能力为标尺，盘点 OperationInAI 已覆盖/部分覆盖/仍缺失，并对 `diff.md` 的实现给出修改意见，最后给出通用化增强路线。
> 设计原则：所有增强必须**通用**（不绑定 HCS / 产品 / 部门等业务概念），用「字典集 + 节点编排 + 通用 action」表达业务口径。

---

## 一、两套系统的范式差异（先对齐认知）

| 维度 | 老系统 HCS-Data-AIOps | OperationInAI |
|------|----------------------|---------------|
| 驱动方式 | **声明式 JSON**（`tasks.list[].subtasks[]`），零代码新增数据源 | **业务流 DAG**（context/source/rule/join/output 节点 + edges）+ 数据源配置 |
| 编排单元 | subtask（api / processor 两类），`depends_on` 串成链 | flow node，`branchFromId`/edges 串成 DAG |
| 表达业务口径 | 硬编码概念：`products`/`product_name_mapping`/`dept` | 通用化：`dictionarySets`（字典集）+ `cleaningRules`（action 注册表） |
| 存储 | SQLite，**每域一表**，动态建表，临时表 swap 原子写 | 内存 store → JSON / 单行 SQLite（`operation_store`），业务数据混在配置快照里 |
| 调度 | `run_loop()` + `interval_seconds` + 每日 cookie 自动刷新 | **无调度**，仅手动 `POST /api/business-flows/run` |
| 展示元数据 | `response.fields[]`：alias/isdisplay/isjump/ishtml/iscreatetime 字段级 | `business.fields` 仅字符串数组，展示逻辑硬编码启发式 |

**结论**：OperationInAI 的 DAG 范式比老系统的 subtask 链更具表达力（分支/汇聚/条件边），方向正确。差距集中在 **采集执行的真实性**、**字段级展示元数据**、**调度与认证自动化**、**存储分层** 四块。

---

## 二、老系统能力剖析（按 8 大能力域归纳 `livedata.md` 的 25 项特性）

### 域 1：声明式采集与依赖编排
- `tasks.list[]` 任务 + `subtasks[]` 子任务，`enabled`/`max_concurrent`/`interval_seconds`
- `depends_on` + `input_source`（`upstream`/`database`/`none`）控制串行/并行与数据来源
- 子任务级 `enabled`、任务级跳过

### 域 2：请求构造与模板变量
- `method`/`params`/`body`/`body_type`(json/form)/`headers`
- 模板变量三态：`{{products}}`(字典展开)、`{{变量名}}`(运行时内存)、`{depends_on.字段}`(上游记录字段)
- `pre_action`：采集前先调 API，按 `data.children.children` 嵌套路径提取并 `save_to_memory`
- 年份自动展开：`start_year` → 起始年到当年的年份列表，逐年采集合并

### 域 3：分页与并发
- 5 种分页模式：`auto`(自动探测)/`total_count`/`total_pages`/`has_more`/`empty_result`
- `auto` 递归搜索响应里的 total/totalPages/hasMore 字段（大小写不敏感，字段名优先级表）
- 分页并发：`page_concurrent` + `page_batch_size` + `max_concurrent_pages`，按批并发
- 请求并发：`max_concurrent_requests` 遍历上游数据并发请求，结果按原序

### 域 4：数据保存与多源融合
- 4 种 `save_mode`：`overwrite`(清空重插)/`append`(追加)/`update`(upsert)/`replicate`(按子记录 1:N 展开)
- `update_key` 单/复合主键；`update_mapping`/`append_mapping`/`replicate_mapping` 三套字段映射
- `append_mapping` 支持 value→array（一个源字段写多列）；映射后原字段删除
- 原子更新：临时表 `_tmp_时间戳` → 全部子任务在临时表操作 → 成功 rename / 失败 drop

### 域 5：业务口径处理（产品/部门）
- `product_name_mapping`：正向展开（标准名→所有变体，用于查询覆盖）+ 反向统一（变体→标准名，用于存储归一）
- `products`：部门→产品列表；产品→部门反向映射；一条记录多产品可属多部门
- `product_filter_enabled`：仅保留关注产品，不匹配的按主键从库中删除
- `aggregate_mode`：列表→逐条调详情 API→`response_path`/`source_field` 提取→`tools` 工具链→回填 `target_field`；带响应缓存
- 工具链：`filter_empty`/`unique`/`sort`/`join`/`limit`

### 域 6：字段级展示与跳转
- `response.fields[]`：`name`/`alias`/`isdisplay`/`isjump`/`jumpurl`/`ishtml`/`iscreatetime`
- `isjump`+`jumpurl`：`[字段名]` 占位符动态生成跳转 URL，生成 `_jumpurl_字段` 附加列
- `iscreatetime`：标记时间列，驱动日期范围筛选；fallback 到 created_at/updated_at/_fetched_at
- `field_mapping`：响应阶段字段重命名（如 name→product_name）

### 域 7：容错、认证与运行时
- `retry`+`retry_delay_seconds` 循环重试
- `auth.cookie` + 页面级运行时 Cookie 覆盖 + `cookie_updater` 每日 Playwright 模拟登录刷新
- HTML 清理 `strip_html_tags`
- 原子写、热重载 `--reload`、临时表残留清理

### 域 8：弹性调度
- 单次 / `run_loop()` 循环（`interval_seconds`）/ 定时
- 多任务串行调度、并发线程池控制

---

## 三、OperationInAI 现状能力盘点（含 `diff.md` 已落地）

> 标注：✅ 已覆盖　⚠️ 部分覆盖/语义有偏差　❌ 缺失

| # | 老系统能力 | OperationInAI 现状 | 落地位置 / diff 提交 |
|---|-----------|-------------------|---------------------|
| 1 | 声明式任务/子任务 + enabled | ✅ businessFlow 节点 DAG（更强） | `config-service.mjs` executeFlowDag |
| 2 | depends_on 串行/并行 | ✅ edges + branchFromId + 条件边 | `config-service.mjs` buildFlowEdges |
| 3 | input_source: upstream/database/none | ⚠️ record-driven 读 upstream、inputTable 读其他业务流；缺显式 `none` | diff `d029ffc`/`a743e0a` |
| 4 | method/params/body/headers | ✅ requestConfig | `sync-service.mjs` |
| 5 | body_type: form | ✅ URLSearchParams | diff `1a0fbd1` |
| 6 | `{{变量}}` 运行时变量 | ✅ preActions + flowContext + 占位符 | diff `8bc1344` |
| 7 | `{depends_on.字段}` 上游字段 | ⚠️ 通过 `record.`/`upstream.` 前缀，非 `{depends_on.x}` 语法 | diff buildPlaceholderValues |
| 8 | `{{products}}` 字典展开 | ✅ 通用化：placeholder source=dictionary（composeDictionaryPlaceholder） | `sync-service.mjs` |
| 9 | pre_action 嵌套提取+save_to_memory | ✅ preActions + valuePath（getByPath 支持 `[]`） | diff `8bc1344` |
| 10 | 年份/参数序列展开 | ❌ 无（缺通用「参数维度展开」） | — |
| 11 | 分页 auto/total/has_more/empty | ✅ auto/has-more/empty-result/next-token 探测 | diff `19a6650` |
| 12 | 分页并发 | ⚠️ 有 concurrency，但 auto 探测后剩余页是「整批一次性并发」，无 page_batch_size 分批节奏 | diff `19a6650` |
| 13 | 请求并发(遍历上游) | ✅ record-driven + concurrency | diff `d029ffc` |
| 14 | retry + delay | ✅ retry/retryDelaySeconds/requestTimeoutMs | diff `1a0fbd1` |
| 15 | save overwrite | ✅ writeStrategy=overwrite | diff `82c6e1d` |
| 16 | save append | ✅ writeStrategy=append | 已有 |
| 17 | save update(upsert) | ✅ writeStrategy=upsert + updateFields 白名单 | diff `82c6e1d` |
| 18 | save replicate(1:N 展开) | ❌ **命名冲突**：diff 的 "replicate" 实为「保留未匹配旧行」，非老系统的「父子 1:N 展开」 | diff `82c6e1d`（见 §5.2） |
| 19 | update_key 单/复合主键 | ✅ primaryKey / dedupeFields | `config-service.mjs` |
| 20 | append_mapping value→array(一源写多列) | ❌ 映射仅 1:1 | `sync-service.mjs` applyFieldMappings |
| 21 | 原子写(临时表 swap) | ⚠️ atomicWrite = 失败不写（flow 级 all-or-nothing），非真临时表 swap | diff `a743e0a`（见 §5.5） |
| 22 | 产品名正向展开(查询覆盖变体) | ⚠️ 仅靠字典 placeholder，无「标准名→全部变体逗号串」专用展开 | — |
| 23 | 产品名反向归一(变体→标准) | ✅ 通用化：enum/lookup + 字典 `dict:集.键列=值列 where` | diff `6ab3403`/`dc7d9e3` |
| 24 | 部门归属(多值富化) | ⚠️ lookup 单值；缺「一记录多值→多归属逗号串」 | — |
| 25 | product_filter_enabled(不匹配从库删) | ⚠️ 可用 valueFilters + `in dict()` 过滤；缺「同步后按主键删除存量不匹配行」语义 | — |
| 26 | aggregate_mode + 工具链 | ✅ record-driven + aggregate(extractField/extractPath + tools) | diff `f5876be` |
| 27 | 工具链 filter_empty/unique/sort/join/limit | ✅ applyAggregateTools | diff `f5876be` |
| 28 | aggregate 响应缓存(同 URL 不重复请求) | ❌ 无 | — |
| 29 | 字段级 isdisplay/alias | ❌ business.fields 仅字符串数组 | — |
| 30 | 字段级 iscreatetime(驱动时间筛选) | ⚠️ 靠 situationTimeFilter.fields 启发式 + 字段名猜测 | `analysis-service.mjs` |
| 31 | 字段级 ishtml | ❌ 无 | — |
| 32 | isjump + jumpurl + [字段] 占位 | ✅ mapping.isJump/jumpUrl + resolveJumpUrlTemplate | diff `ec5a7eb` |
| 33 | HTML 清理 strip_html | ✅ strip_html action | `sync-service.mjs` |
| 34 | 自定义 processor(importlib) | ⚠️ 用 lookup + 14 个内置 action 替代；无外挂插件目录 | — |
| 35 | 认证 cookie 存储 | ✅ authConfigs(cookieValue 加密落盘) | `config-service.mjs`/`store.mjs` |
| 36 | 认证自动刷新(cookie_updater) | ❌ loginUrl/refreshCycle 仅存储不执行 | — |
| 37 | 页面级运行时 cookie 覆盖 | ❌ 无 | — |
| 38 | 热重载 --reload | ❌ 无（配置已持久化，但运行中不重载） | — |
| 39 | 弹性调度(单次/循环/定时) | ❌ **无调度器**，仅手动触发 | — |
| 40 | 每域独立表存储 + SQL 可查 | ❌ 全部业务数据塞进单个 JSON/单行 SQLite | `storage-adapter.mjs` |
| 41 | 临时表残留启动清理 | ❌ 无（无临时表机制） | — |

**小结**：`diff.md` 已闭合老系统**采集执行侧**的大部分核心能力（分页/并发/重试/聚合/多写策略/preActions）。**剩余缺口集中在 4 个面**：
1. **展示元数据**（#29/#30/#31）——字段级 alias/isdisplay/iscreatetime/ishtml 缺失，影响「数据展示」是否像老系统一样可配。
2. **调度与认证自动化**（#36/#39）——系统不能「自己定时跑 + 自己刷 cookie」，这是老系统「正常运行」的前提。
3. **存储分层**（#40）——业务数据无独立表，量大后不可查不可扩展。
4. **若干语义偏差**（#18 replicate 命名、#21 原子写强度、#28 缓存、#10 参数展开）。

---

## 四、`diff.md` 代码评审与修改意见

> 15 项变更整体方向正确、复用了现有引擎（testDataSource/fetchRealSource/getByPath/runWithConcurrency），值得肯定。以下按风险等级给修改意见。

### 🔴 P0-1：真实采集失败时**静默回退 mock**，污染所有真实链路（最高优先）

**问题**：`executeDataSourcePlan`（record-driven / 分页探测 / 普通采集）最终都走 `testDataSource`，而 `testDataSource` 在 `fetchRealSource` 返回 null 或抛错时，**回退到硬编码 mock 数据（pay-gateway / order）**（`sync-service.mjs` mock 分支约 120 行）。后果：

- 真实 API 不通时，`firstResult.ok = true`（mock 永远 200），分页 auto 探测会**在 mock 数据上继续翻页**，产出看似成功实则全错的结果。
- `atomicWrite` 形同虚设：mock 永不失败 → `runFailedRows` 恒为 0 → 原子写永不触发。
- 内网测试「15/15 通过」可能部分是 mock 兜底造成的假绿。

**修改意见（通用设计）**：给 `testDataSource` / `executeDataSourcePlan` 增加 `mode` 参数：
- `preview`（默认，前端试运行）：保留 mock 兜底，方便无凭据时演示。
- `live`（业务流执行 / record-driven / 分页）：**禁止 mock 兜底**；真实 API 失败必须返回 `ok=false`，让重试/原子写/聚合正确生效。

```text
// 伪代码：fetchRealSource 失败时，live 模式直接返回失败，不再回退 mock
if (!realResult && mode === "live") {
  return { ok:false, status:599, error:"真实请求失败且已禁用 mock 兜底", sourceMode:"real", ... };
}
```
同步在 `executeFlowNode` 的 source 分支、record-driven 分支、preActions 调用处传 `mode:"live"`。

### 🔴 P0-2：`replicate` 命名与老系统语义错配（数据正确性 + 可读性）

**问题**：老系统 `save_mode=replicate` = **父子 1:N 展开**（一个局点 × N 个 Region → N 行）。`diff` 的 `mergeBusinessRows` 中 `strategy==="replicate"` 实际是「**新行覆盖主键匹配的旧行，未匹配旧行保留**」——这其实是 *upsert 的「保留历史」变体*，与 1:N 展开毫无关系。

**修改意见**：
1. **重命名**：把 diff 的 `replicate` writeStrategy 改名为 `upsert-keep-others` 或 `preserve-unmatched`，避免与老系统概念冲突，也避免后续接入真 1:N 展开时撞名。
2. 若确需老系统的 1:N 展开（父记录 × 子数组），用**通用「explode 展开动作」**实现，而非 writeStrategy：
   - 新增 cleaning action `explode`：参数 `arrayField`（子数组路径）+ `prefix`（子字段前缀），把一条记录按子数组长度展成 N 条，父子字段合并。
   - 这样「局点 × Region」= source 取父 → explode 展开子 → 正常 upsert 落库，完全通用。

### 🟠 P1-1：重试不区分可重试/不可重试状态码

**问题**：`fetchRealSource` 重试循环对任何 `!response.ok` 都重试，包括 400/401/403 这类重试无意义的客户端错误，浪费请求并拖慢失败诊断。

**修改意见**：仅对 `5xx`、`408`、`429`、超时(AbortError)、网络错误重试；`4xx`(除 408/429) 立即失败不重试。
```text
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
const retryable = !response.ok && (RETRYABLE.has(response.status) || response.status >= 500);
```

### 🟠 P1-2：分页并发缺批节奏（page_batch_size 等价物）

**问题**：`auto` 探测出 `detectedPages` 后，把所有剩余页**一次性**丢进 `runWithConcurrency(tasks, concurrency)`。当总页数很大时，tasks 数组先全量建好（内存），且无「每批完成才进下一批」的节奏（老系统 `page_batch_size` 的意义是限流 + 进度可观测）。

**修改意见**：引入 `pagesPerBatch`（默认 = concurrency × N），按批切片并发，每批完成后可输出进度日志（对接 syncLogs 或 SSE），避免一次性构造超大 task 数组。

### 🟠 P1-3：preActions 失败被吞，下游变量未定义

**问题**：`executeFlowNode` 的 context 分支里，preAction `!actionResult.ok` 时仅 `continue`，不写变量、不中止流。下游 `{{变量}}` 占位符无法解析，会原样留在请求里，请求大概率失败但根因隐蔽。叠加 P0-1 的 mock 兜底，preAction 失败可能完全无感。

**修改意见**：
- preAction 失败时，按 `action.onError: "fail-flow" | "continue"` 决定；默认 `fail-flow`，把失败冒泡为节点 error。
- 变量提取后做存在性校验，`valuePath` 取不到值时记录警告。

### 🟠 P1-4：`atomicWrite` 是「flow 级不写」，非「表级原子 swap」

**问题**：当前 `atomicWrite` 逻辑：`if (atomicWrite && runFailedRows>0 && fetchedRows>0) → status=failed 且不写 business.rows`。这是「整轮失败则不动旧数据」，对单进程内存态够用，但：
- 不等同于老系统的临时表 swap（老系统是「每个目标表独立原子」，多表间也各自原子）。
- 一旦后续接真 DB 批量写，需要真正的「写暂存表 → rename」两阶段提交，否则中途崩溃会留半成品。

**修改意见**：
- 短期：文档明确当前 atomicWrite 语义为「flow 级 all-or-nothing（内存态）」。
- 中期（接真 DB 时）：在 storage 层实现 `beginSnapshot`/`commitSnapshot`/`rollbackSnapshot`，对应老系统临时表 swap；output 节点写入 snapshot，全部节点成功才 commit。

### 🟡 P2-1：聚合 `extractField` 字段来源脆弱

`extractAggregateValues` 优先读 `recordResult.fields`，但 `mergeDataSourceResults.fields` 是**响应原始字段**的并集，而 `recordRows` 取的是 **mappedRecords（target 命名）**。当 `extractField` 填的是映射后的目标字段名时，依赖 `recordRows[i][extractField]`（对象访问）尚可；但若 record-driven 上游记录是数组形态，会走 `fields.indexOf` 分支，此时 fields 对不上目标名 → 取空。

**修改意见**：统一约定「聚合始终在 mappedRecords（对象）上提取」；移除/弱化数组形态分支，或在数组形态时用 `sourceFieldsFromPlan` 显式回退到目标字段集并给出告警。

### 🟡 P2-2：前端 preActions 用裸 JSON textarea，无校验反馈

`parsePreActionsInput` 解析失败静默返回 `[]`，用户写错 JSON 完全无提示（`OPTIMIZATION.md` F6 问题在新字段上重演）。aggregate tools 用 `limit:N,join:sep` 逗号串解析，分隔符里不能含逗号。

**修改意见**：
- preActions 改为结构化子表（数据源选择 + 变量名 + valuePath 行），与现有「表单三件套」一致；至少加 JSON 校验红字提示。
- aggregate tools 改为可排序步骤列表（复用清洗规则管道编辑器的长远方案）。

### 🟡 P2-3：分页 `paginateIn` 在探测路径未贯通

`getSourceExecutionConfig` 增加了 `paginateIn`，但 `executeDataSourcePlan` 内部构建的 `paginationConfig` 没带它，`buildPagedRequestConfig` 读的是 `node.executionConfig.pagination` 原值。两条配置源不一致，后续维护易踩坑。

**修改意见**：统一以 `node.executionConfig.pagination` 为单一真相源，`executeDataSourcePlan` 只读不重建分页参数，避免双份配置漂移。

### 🟢 P3：小问题清单
- `retry` 默认 0（老系统默认 3）：建议生产默认给 2，由数据源覆盖。
- ID 仍 `Date.now()+random`，同毫秒并发创建理论可碰（`OPTIMIZATION.md` B8 未修）：建议改 `crypto.randomUUID()`。
- `runSync`（`/api/sync-jobs/run`）仍是单次 testDataSource、不分页不落库（B2 未修）：要么废弃，要么明确标注「单源试运行」并复用 live 模式。
- `runBusinessFlow` 仍把运行态 `status/lastRunAt` 写回存储的 flow（B9 未修）：建议运行态与配置态分离，运行态进 `syncLogs` 即可。

---

## 五、剩余功能增强建议（通用设计，分优先级）

### P0 — 让系统「能像老系统一样自己稳定跑」

#### E1. 调度器（对应老系统 run_loop / interval_seconds / 定时）—— ❌→✅
**通用设计**：新增 `scheduler-service.mjs` + `schedules[]` 配置实体。
- `schedule`：`{ id, name, flowId, mode: "once"|"interval"|"cron", intervalSeconds?, cronExpr?, enabled, lastRunAt, nextRunAt }`
- `mode=interval`：每 `intervalSeconds` 触发一次 `runBusinessFlow({flowId})`。
- `mode=cron`：5 段 cron（复用现有定时任务工具或轻量自实现）。
- 单进程 `setInterval` 驱动；记录每次触发到 syncLogs；进程重启从持久化 `schedules` 恢复并补跑错过的 one-shot。
- 前端「业务流」页加「定时」入口（mode/interval/cron/启用）。
- **这是老系统「正常运行」的根**——没有调度，所有采集能力都只能手动按。

#### E2. 认证自动刷新（对应 cookie_updater）—— ❌→✅
**通用设计**：扩展 `authConfigs`，把 `loginUrl`/`refreshCycle` 从「展示字段」变成「可执行刷新动作」。
- authConfig 增 `refresh`：`{ enabled, loginSpec: {method, url, body, usernameField, passwordField}, extract: {cookieName, cookiePath}, cycleSeconds, lastRefreshAt }`
- `refreshAuth(authId)`：按 loginSpec 发请求 → 从响应头 `Set-Cookie` 或响应体 `cookiePath` 提取新 cookie → 加密写回 authConfig。
- 接入 E1 调度器：每 `cycleSeconds` 触发刷新；采集执行前检查 `lastRefreshAt`，过期则先刷新。
- **安全**：登录请求同样走 `assertSafeSourceUrl` 白名单；凭据已加密落盘。
- 注：老系统用 Playwright 模拟登录；通用设计下「声明式登录请求」能覆盖大多数表单登录场景，复杂 SSO 可后续按需扩展。

#### E3. 真实模式禁止 mock 兜底（见 §5 P0-1）—— 配合 E1/E2 上线必做

### P1 — 让展示层「可配置」而非「硬编码」

#### E4. 字段级展示元数据 `fieldSchema[]`（对应 response.fields[]）—— ❌→✅
**通用设计**：给 business 增加可配字段元数据，替代当前 `buildBusinessFields` 的硬编码偏好列表。
```jsonc
business.fieldSchema = [
  { "name":"event_id",   "alias":"事件ID", "isDisplay":false },
  { "name":"event_name", "alias":"事件名称", "isDisplay":true },
  { "name":"severity",   "alias":"等级",   "isDisplay":true },
  { "name":"event_time", "alias":"时间",   "isDisplay":true, "isCreateTime":true },
  { "name":"detail",     "alias":"详情",   "isDisplay":true, "isHtml":true },
  { "name":"cloud_id",   "alias":"",       "isDisplay":false, "isJump":true, "jumpUrl":"http://.../#/detail/[cloud_id]" }
]
```
- `isDisplay`：驱动列表显隐（替代当前全展示）。
- `alias`：驱动表头与导出列名（替代字段名直显）。
- `isCreateTime`：驱动时间范围筛选字段选择（替代 situationTimeFilter 启发式猜测）。
- `isHtml`：前端按 HTML 渲染（复用现有 escapeHtml 白名单）。
- `isJump`/`jumpUrl`：与 diff 已实现的 mapping.isJump 对齐；可由 mapping 生成、也可在 fieldSchema 手配。
- 数据来源：业务流首次产出时，由 output 节点根据 mapping 自动生成 fieldSchema 草稿，用户在「数据展示」页微调。
- **通用价值**：彻底解耦「采集到的字段」与「展示出来的字段」，老系统 `response.fields[]` 的全部能力由此对齐。

#### E5. 通用「参数维度展开」（对应年份展开 start_year）—— ❌→✅
**通用设计**：把「按某个值的集合逐次请求再合并」抽象为 source 节点的 iteration 维度，与 record-driven 并列。
- 新增 iteration mode `domain-driven`：`{ domain: { source: "range"|"dictionary"|"list", range:{from,to,step,format?}, dictionaryRef, values:[...] }, paramField, merge:"concat" }`
- `source:range, range:{from:2024,to:2026,format:"{value}年"}` 即等价老系统年份展开。
- `source:dictionary` 即按字典某列取值集合逐次请求（等价按环境/区域遍历）。
- 执行：对 domain 每个值注入 `paramField`，并发请求，结果 concat 合并——复用 record-driven 的并发骨架。
- **比老系统更通用**：年份只是 `range` 的一个实例。

### P2 — 让数据「存得下、查得了」

#### E6. 业务数据独立表存储（对应每域一表 + SQL 可查）—— ❌→✅
**通用设计**：storage 层增 `businessData` 适配，与配置快照分离。
- 配置（dataSources/flows/...）继续走 `operation_store` 单行 JSON/SQLite（量小、整存整取合理）。
- 业务数据（businesses.rows）按 `businessTable` 名建独立表：动态建表（首条记录字段驱动）+ `_fetched_at` 列，提供 SQL 查询能力。
- output 节点按 `writeStrategy` 直接对业务表执行 SQL（overwrite=truncate+insert / append=insert / upsert=ON CONFLICT / 真正的临时表 swap 原子写）。
- 由此 #20(一源写多列)、#25(同步后删不匹配)、#28(响应缓存)、#41(临时表清理) 都有了落地基座。

#### E7. 跨请求响应缓存（对应 aggregate 响应缓存）—— ❌→✅
**通用设计**：在 executeDataSourcePlan / record-driven 路径加 `responseCache`（Map：URL+method+body hash → responseBody），同一批 run 内同参不重复请求。批结束清空，避免跨 run 脏数据。

### P3 — 能力补齐（按需）

#### E8. 一源写多列（append_mapping value→array）
fieldMapping 的 `targetField` 支持 `string[]`，applyMappingToRecord 对每个目标写同值。低成本低收益，优先级随业务需要。

#### E9. 多值富化（对应多产品→多部门）
lookup action 增 `multi:true`：源字段是逗号串 → 拆分 → 逐个查字典 → 去重 → 逗号串回填。覆盖「一条记录多产品属多部门」。

#### E10. 同步后清理不匹配存量（对应 product_filter_enabled 删行）
output 节点增 `purgeUnmatched`：upsert 后，按 `purgeKey` + 过滤条件删除业务表中不再匹配的存量行。通用表达「只保留关注对象」。

#### E11. 外挂处理器目录（对应 processors_path）—— 可选
Node 侧可用 `import()` 动态加载 `server/processors/*.mjs`，函数签名 `(records, config) => records`，注册进 cleaningActions。等真有不可用内置 action 表达的需求再做（避免过度设计，见 `OPTIMIZATION.md` 3.2）。

---

## 六、落地路线图

| 阶段 | 目标 | 项 | 对齐老系统 |
|------|------|----|-----------|
| **P0（1~2 周）** | 能自己稳定跑 | E3 禁 mock 兜底 + §5 P0-2 重命名 replicate + E1 调度器 + E2 认证刷新 | #36 #39 + 数据真实性 |
| **P1（1~2 周）** | 展示可配、参数可展开 | E4 fieldSchema + E5 参数维度展开 + §5 P1-1/2/3/4 修复 | #10 #29 #30 #31 |
| **P2（2~3 周）** | 存得下查得了 | E6 业务数据独立表 + E7 响应缓存 + §5 P2 修复 | #20 #25 #28 #40 #41 |
| **P3（按需）** | 能力补齐 | E8/E9/E10/E11 | 边缘场景 |

**与 `OPTIMIZATION.md` 的关系**：`OPTIMIZATION.md` 的 P0「接通执行引擎」已被 `diff.md` 的 record-driven/preActions/aggregate 基本完成（B1 已闭合）；其 B3（分页）被 `19a6650` 闭合；B4（mock 静默回退）**仍未闭合且因新能力被放大**，是本文 P0-1。其余前端/安全项（F1/F3/S1…）继续按 `OPTIMIZATION.md` 推进，不在此重复。

---

## 七、一句话总结

> `diff.md` 把老系统**采集执行侧**的能力（分页/并发/重试/聚合/多写策略/preActions）补到了 15/15，方向与复用都到位；但「**真实失败被 mock 静默吞掉**」这个底层数据真实性隐患仍在，且新引入的 `replicate` 命名与老系统语义冲突。要真正达到「老系统正常运行」的水平，下一步重心应放在 **调度器 + 认证自动刷新**（让它自己跑）、**fieldSchema 展示元数据**（让展示可配）、**业务数据独立表存储**（让数据可查）三件事上——全部用通用化设计，不引入 HCS 业务概念。
