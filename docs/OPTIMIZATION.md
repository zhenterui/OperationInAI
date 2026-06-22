# OperationInAI 优化建议

> 生成时间：2026-06-22
> 依据：全量代码审计（后端 `server/` 全部 8 个文件、前端 `src/scripts/app.js` 4836 行深度审计）+ 内网验证反馈 `../tmp/test.md`（`tools/full-validation.mjs`，48 PASS / 1 WARN / 0 FAIL）
> 定位：本文是对系统现状的整体评估与分阶段优化路线，供团队排期参考。

---

## 一、系统现状定性

OperationInAI 当前是一个**高保真演示型原型**，不是可投产系统：

- 所有配置与业务数据存放在内存单例对象（`server/data/store.mjs`），进程重启全部丢失。
- 后端无鉴权、无输入校验、无持久化。
- 智能分析与智能搜索返回的是硬编码模拟结果（`server/services/analysis-service.mjs`、`search-service.mjs`），模型配置只是占位。
- 代码质量本身不差：命名一致、`escapeHtml` 覆盖到位、原生 `<dialog>`、`cleaning-e2e.mjs` 端到端测试扎实。

`test.md` 报告的 **48 PASS / 1 WARN** 是**接口契约层**的通过，不等于**业务功能真实可用**。这是解读后续所有建议的前提。

---

## 二、最关键发现：测试通过 ≠ 清洗链路真的在跑

`test.md` 列出了 Processor 清洗规则的 12 条局限性（L1~L12），但**完全没提到一个更致命的问题**：业务流执行器根本没接通清洗引擎。

### 2.1 证据

`runBusinessFlow()`（`server/services/config-service.mjs:701-828`）中：

- `rules` 被加载了，但**只用于拼接展示字符串** `ruleText`（`:753`）和计数；
- 业务行 `row` 是硬编码的占位数组（`:791-797`），与实际配置无关；
- `business.rows.unshift(row)`（`:811`）每次只塞这一条假数据；
- **从未调用** `applyFieldMappings` / `applyCleaningRule` / `testDataSource` / `fetchRealSource`。

也就是说：前端精心配置的数据源、字段映射、清洗规则、分页/并发/锁策略，到了"执行业务流"这一步**全部被绕过**，输出永远是一行占位数据。`test.md` 4.2/4.3 节嗅到了症状（`fetchedRows` 写死、`rows` 只 1 行），但归因为"模拟数据没做对"，未点破根因——**执行引擎压根没接进来**。

### 2.2 两条执行路径的能力割裂

| 路径 | 取数 | 解析/过滤 | 字段映射 | 清洗规则 | 落库 |
|---|---|---|---|---|---|
| `testDataSource` / `runSync` | mock 或真实 fetch | ✅ 真实 | ✅ 真实 | ✅ 真实 | ❌ 无持久化 |
| `runBusinessFlow` | ❌ 不取 | ❌ | ❌ | ❌ 不执行 | ❌ 只 unshift 假行 |

参考位置：`runSync`（`server/services/sync-service.mjs:926-950`）会调用 `testDataSource`，后者在 `:878-888` 真实执行了 `extractResponseRecords` + `applyFieldMappings`。

### 2.3 结论

**在补 Processor 的 L1~L12 之前，必须先把 `runBusinessFlow` 接到真实的取数 + 清洗引擎上。** 否则给一个不跑的引擎加管道、加插件、加版本控制，是在给演示加特效，不是在补能力。这是对 `test.md` 第五节优先级表的**第一处修正**。

---

## 三、对 `test.md` Processor 方案的评估

`test.md` 第三节的设计稿整体方向正确、专业，落地前需做以下修正。

### 3.1 可直接采纳

- **管道链式处理（3.1）**：数据模型 `config.pipeline[]` 合理，向后兼容旧 `config.action` 的回退逻辑也对。但前端工作量被严重低估——13 个 action 当前是写死在 `index.html:1664-1677` 的 `<option>`，编辑面只有 1 个 `<select>` + 1 个 `<input>`（`index.html:1664-1682`），落地 Pipeline 需要新做一个可排序的步骤列表编辑器。
- **规则试运行预览（3.9）**：性价比最高。后端引擎已现成（`testDataSource` 本身就是个预览器），可低成本复用，并立即验证 2.3 节 P0 改造的正确性。

### 3.2 需要修正或警惕

- **插件化（3.2）**：架构没错，但当前 `applyCleaningRule`（`server/services/sync-service.mjs:589-633`）只有约 45 行、12 个 action，立刻拆成 13 个文件 + 注册中心属于过度设计。建议先用"action 注册表（Map）+ 元数据"重构 if/else 分支，等自定义需求真的出现再上插件目录。
- **条件表达式引擎（3.3）**：`evaluateCondition` 这个能力**项目里已经有一版**——`server/services/sync-service.mjs:208-253` 的 `matchesFilter` / `evaluateSingleFilter` 已支持 `==/!=/>=/in/exists/contains`、字典 `in dict(...)`、`&&`/`||`。`test.md` 当成全新能力设计，会重复造轮子。**应复用现有实现，而非引入第二套表达式语法。**
- **http_enrich 真实外部调用（3.6）**：用 `fetch` 请求用户配置的 URL 存在 **SSRF** 风险（可让服务器请求任意内网地址）。原型可保留，文档需标红，上线前必须加域名白名单。
- **规则版本控制（3.8）**：对内存原型过重，依赖持久化，建议推后到 P2。

### 3.3 `test.md` 漏掉的 Processor 问题

- `number` action 仅支持 `seconds_to_minutes` 一种转换（`sync-service.mjs:621-625`），`test.md` L12 已提及；但更基础的痛点未提：`enum` 未命中时**直接返回原值**（`:619` `enumMap[text] ?? value`），缺少"未命中兜底"选项。
- 3 处 `new RegExp(用户输入)`（`sync-service.mjs:277 / 364 / 607`）存在 **ReDoS** 风险，加自定义脚本前应先加超时或复杂度保护。

---

## 四、后端架构与正确性问题

| # | 问题 | 位置 | 严重度 |
|---|---|---|---|
| B1 | `runBusinessFlow` 不执行清洗引擎（见第二节） | `config-service.mjs:701-828` | 🔴 致命 |
| B2 | `runSync` 本质是再跑一次 `testDataSource`，不分页、不循环、不落库、不去重 | `sync-service.mjs:926-950` | 🔴 高 |
| B3 | `fetchRealSource` 只发**一次**请求，完全忽略分页/页段；`estimateSourceNodePlan` 算出的 page shards 从不执行 | `sync-service.mjs:679-718` | 🔴 高 |
| B4 | 真实取数失败时**静默回退 mock**，且 mock 数据写死成 pay-gateway/order（`sync-service.mjs:759-876`，约 120 行），与数据源真实配置无关 → 用户会误以为"取到了真实数据" | `sync-service.mjs:759` | 🟠 中 |
| B5 | `switchStorageConfig` 只记一条 migration log，**不做任何数据复制**（"migration-plan-recorded"） | `config-service.mjs:468-509` | 🟠 中 |
| B6 | 无持久化：`store` 是内存对象，重启即丢 | `store.mjs` 全文 | 🟠 中 |
| B7 | 内存增长无上限：`syncLogs` / `analysisResults` / `businesses[].rows` 只 `unshift` 不淘汰 | 多处 | 🟡 低 |
| B8 | ID 用 `Date.now()`，同毫秒并发创建会碰撞 | 全部 `createXxx` | 🟡 低 |
| B9 | `runBusinessFlow` 把运行时分支覆盖**写回**了存储的 flow（`:720-726`），运行态污染配置态 | `config-service.mjs:720` | 🟠 中 |
| B10 | 路由层每个资源的 PUT/DELETE 都是手写一段几乎一样的 regex match + try/catch（router.mjs 有 9 段重复，`:94-246`） | `core/router.mjs` | 🟡 低 |

---

## 五、前端架构问题（`src/scripts/app.js` 4836 行）

| # | 问题 | 位置 | 严重度 |
|---|---|---|---|
| F1 | `bindEvents()` 是 957 行巨函数，含 113 个 `addEventListener`，占全文件 20%，不可测、不可维护 | `app.js:3838-4795` | 🔴 致命 |
| F2 | 218 个顶层全局函数 + 2 个全局 state（`appState` + `window.opsData`），无模块、无 IIFE、无命名空间 | `app.js` 全文 | 🔴 高 |
| F3 | 9 套复制粘贴的 `populate/reset/collect` 表单三件套（数据源/认证/映射/规则/字典/模型/存储/业务流/筛选），加一个字段要改三处 | 见下表 | 🟠 高 |
| F4 | 离线兜底逻辑 `try{api}catch{改本地}` 重复约 6 次，应收敛进 `apiRequest` 或 repository 层 | `bindEvents` 内多处 | 🟠 中 |
| F5 | 渲染全靠 `innerHTML` 全量重绘（63 处 `innerHTML=` vs 7 处 `createElement`），无 diff、无 key，列表增大会卡 | 全文 | 🟠 中 |
| F6 | 清洗规则编辑器只支持单 action + 单 param 字符串，与 `test.md` 3.1 管道需求直接冲突——落地 Pipeline 的最大前端工作量 | `index.html:1664-1682`、`app.js:1872-1942` | 🟠 中 |
| F7 | 两份种子数据：`src/scripts/data.js` 与 `normalizeOpsData`（`app.js:119-250`）各存一份默认数据，双真相源 | `app.js:119-250` | 🟡 低 |
| F8 | API 包装器 `apiRequest` 无超时/重试/取消/加载态，错误只保留状态码、丢弃响应体 | `app.js:90-98` | 🟡 低 |
| F9 | 全站硬编码中文，零 i18n 抽象（原型阶段可接受） | 全文 | 🟡 低 |

F3 各实体表单三件套位置（行号近似）：

| 实体 | populate | reset | collect |
|---|---|---|---|
| 态势筛选 | 731 | 716 | 754 |
| 认证配置 | 1296 | 1310 | 1322 |
| 数据源 | 1365 | 1403 | 1472 |
| 存储配置 | 1712 | 1699 | 1726 |
| 字典集 | 1848 | 1836 | 1861 |
| 清洗规则 | 1896 | 1911 | 1925 |
| 模型配置 | 2030 | 2017 | 2044 |
| 业务流 | 2781 | 2805 | 2857 |
| 字段映射 | 3184 | 3168 | （内联） |

前端值得肯定的部分：`escapeHtml` 覆盖到位（168 处）、原生 `<dialog>`、`renderGroupedConfigList`（`app.js:306`）是一个像样的复用 helper。

---

## 六、工程化、安全与测试

| # | 问题 | 位置 | 严重度 |
|---|---|---|---|
| S1 | 无鉴权：所有 `/api/*` 裸奔，任何人可读写全部配置（含 API Key） | `core/router.mjs` | 🔴 高（上线前必填） |
| S2 | 密钥明文存内存：`modelConfigs[].apiKey`、`authConfigs[].password/cookieValue` 创建时存明文，GET 时才 mask | `config-service.mjs:309 / 242` | 🟠 中 |
| S3 | 无服务端输入校验：`readJson` 直接 `JSON.parse`（`core/http.mjs:31-41`），畸形输入靠各 service 兜底，不一致 | `core/http.mjs` | 🟠 中 |
| S4 | CORS `*` | `core/http.mjs:16` | 🟡 低 |
| S5 | `tools/full-validation.mjs`（`test.md` 使用的 49 项验证脚本）**不在仓库**——只有 api-smoke/cleaning-e2e/port-check/dev-server。测试脚本未纳入版本控制，存在流失风险 | `tools/` | 🟡 低 |
| S6 | 前端零测试；后端仅 `cleaning-e2e`（质量不错）与 `api-smoke` | — | 🟡 低 |

---

## 七、优化路线图

调整 `test.md` 第五节优先级——**把执行引擎补齐提到 P0 之前**，否则后续 Processor 增强都是空中楼阁。原则：先做对、再做全、再做炫。

### P0 — 让清洗链路"真的跑通"（约 1~2 周）

1. **重写 `runBusinessFlow`**：复用 `testDataSource` / `fetchRealSource` 真实取数 → `extractResponseRecords` → `applyFieldMappings`（含规则）→ 按节点执行 → 产出真实业务行。修掉 B1 / B2 / B9 及 `test.md` 4.2 / 4.3。
2. **`fetchRealSource` 实现分页循环**（B3），并让真实取数失败时**显式报错**而非静默回退 mock（B4）。
3. **落地 `test.md` 3.9 试运行预览**：引擎已现成，性价比最高，且能立即验证 P0-1 的正确性。

### P1 — 让规则"好用"（约 1~2 周）

4. **管道链式（`test.md` 3.1）**：先用"action 注册表（Map）+ 元数据"重构 `applyCleaningRule` 的 if/else，再支持 `config.pipeline[]`；**同步做前端步骤编辑器**（这步工作量在后端之上）。
5. 修 `enum` 未命中兜底、扩展 `number` 转换（`test.md` L12）。
6. **前端引入 `bindEntityModal` 通用抽象**，消掉 9 套表单三件套（F3）和 6 处离线兜底重复（F4）。

### P2 — 让系统"可信"（约 2~3 周）

7. **持久化**：至少把 `store` 落到 JSON 文件或 SQLite（B6），`switchStorageConfig` 做真实复制（B5）。
8. **规则版本控制（`test.md` 3.8）**：依赖持久化。
9. 服务端输入校验（zod）+ 鉴权中间件 + 密钥加密存储（S1 / S2 / S3）。
10. 把 `full-validation.mjs` 纳入仓库并接入 CI / `npm run check`（S5）。

### P3 — 让规则"强大"（按需）

11. 条件表达式（复用现有 `evaluateSingleFilter`，勿重造）、跨字段校验、聚合函数。
12. 插件化目录（等自定义需求真的出现再做）、http_enrich（务必加 SSRF 白名单）。

---

## 八、一句话总结

> `test.md` 把镜头对准了"清洗规则能做什么"（Processor 的 12 条局限），但**更致命的是"清洗规则做的东西有没有真的被执行"**——目前 `runBusinessFlow` 整个绕过了清洗引擎。建议把"接通执行引擎 + 试运行预览"作为 P0，把 `test.md` 的管道/插件等增强放到 P1/P2；同时前端 957 行的 `bindEvents`（F1）与 9 套重复表单（F3）是制约后续所有功能迭代速度的最大瓶颈，应尽早抽象。

---

## 附：问题清单索引

- 致命/高优先级：B1、B2、B3、F1、F2、S1
- 中优先级：B4、B5、B6、B9、F3、F4、F5、F6、S2、S3
- 低优先级：B7、B8、B10、F7、F8、F9、S4、S5、S6
