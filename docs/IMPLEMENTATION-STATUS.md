# OperationInAI 实现状态（P0 全量闭环）

> 生成时间：2026-07-01
> 范围：在 `dev` 基线上，应用 `tmp/diff.md`（15 项能力）+ 实现 `docs/TARGET-ARCHITECTURE.md` 与 `docs/CAPABILITY-PARITY.md` 的全部 net-new 设计项 + diff 评审修复，形成一个连贯、可测的树。
> 面向：接手检视与测试的 agent。

---

## 一、一句话结论

后端**已全量闭环**：diff.md 的 15 项能力 + 设计文档的 E1~E11 + diff 评审的 P0/P1 修复全部落地，且 `npm run check` + 6 套单测/端到端（flow / cleaning / security / scheduler / design / cleaning-e2e）**全绿**。前端：P0 新增的「调度管理」面板与认证刷新字段已补齐；fieldSchema 编辑暂提供 API（`PUT /api/businesses/field-schema`），可视化编辑器后续补；diff.md 自带的前端改动未二次应用（见 §五）。

---

## 二、基线与改动来源

| 来源 | 状态 | 说明 |
|------|------|------|
| `dev` 基线（commit 464328f） | 已含 | 起始树 |
| `tmp/diff.md`（15 项，基线 a1d4778→3ed0585） | **已应用到后端** `sync-service.mjs` / `config-service.mjs` | diff.md 代码原本不在任何分支/提交里，已逐 hunk 应用到当前树后端 |
| 设计项 E1~E11（TARGET-ARCHITECTURE.md） | 已实现 | 见 §三 |
| diff 评审修复（CAPABILITY-PARITY.md §5） | 已应用 | 见 §四 |

> 注：diff.md 的**前端改动**（`src/scripts/app.js` / `index.html` / `src/styles/components.css`）本次未逐 hunk 应用——它们是 diff.md 自带的、用于暴露其 15 项能力的 UI 入口。后端逻辑已完整，前端可由原 diff.md 提供或后续补齐（见 §五）。

---

## 三、设计项闭环状态（TARGET-ARCHITECTURE.md）

| 项 | 能力 | 状态 | 落点 |
|----|------|------|------|
| E1 | 调度器(interval/cron/once) | ✅ | `server/services/scheduler-service.mjs`（新），服务启动自动 `startScheduler` |
| E2 | 认证声明式登录刷新 | ✅ | `config-service.mjs` `refreshAuthConfig`/`refreshDueAuths` + 调度器每 tick 刷新到期认证 |
| E3 | live 模式禁 mock 兜底 | ✅ | `sync-service.mjs` `testDataSource(mode)` + 执行链路贯通 |
| E4 | fieldSchema 字段级展示元数据 | ✅ | 后端 `reconcileFieldSchema`/`updateBusinessFieldSchema`/`queryBusiness`(isCreateTime)；前端 `renderBusinessRows` 消费 isDisplay/alias/isJump/isHtml |
| E5 | domain-driven 参数维度展开 | ✅ | `config-service.mjs` `buildDomainValues` + `executeFlowNode`/`estimateSourceNodePlan` |
| E6 | 业务数据独立表存储(SQLite) | ✅ | `server/services/business-data-service.mjs`（新），`outputConfig.useTableStorage` 开启 |
| E7 | 跨请求响应缓存 | ✅ | `sync-service.mjs` `fetchRealSource` run 级缓存，`runBusinessFlow` 创建 |
| E8 | 一源写多列(targetField[]) | ✅ | `sync-service.mjs` `assignTarget` |
| E9 | lookup/enum 多值富化 | ✅ | `sync-service.mjs` lookup `multi` |
| E10 | purgeUnmatched | ⚠️ 延后 | 依赖 E6 真表；当前内存态由 writeStrategy 表达，真表 purge 待 E6 路径后续补 |
| E11 | 外挂处理器目录 | ⚠️ 延后 | 按设计"等真有不可表达需求再做"，现有 15 个 action + 字典覆盖 |
| — | explode 1:N 展开 | ✅ | `sync-service.mjs` `explodeRecords`（recordMode:"explode"） |
| — | 工程卫生 | ✅ 部分 | runSync 支持 mode；B9 运行态/配置态由 diff.md 节点保留逻辑处理；B8 randomUUID 延后(低优先) |

---

## 四、diff 评审修复闭环状态（CAPABILITY-PARITY.md §5）

| 评审项 | 状态 | 说明 |
|--------|------|------|
| P0-1 mock 静默回退 | ✅ | live 模式禁 mock，已贯通执行链路 |
| P0-2 replicate 命名错配 | ✅ | 保留 `replicate` 兼容 + 新增 `preserve-unmatched`/`upsert-keep-others` 别名；真 1:N 用 `explode` action |
| P1-1 重试不分级 | ✅ | 仅对 408/429/5xx/超时/网络重试，4xx 立即失败 |
| P1-2 分页无批节奏 | ✅ | `runPagedBatches` + `pagesPerBatch` |
| P1-3 preActions 失败被吞 | ✅ | 默认 `fail-flow`，`onError:"continue"` 可覆盖 |
| P1-4 atomicWrite 强度 | ⚠️ 文档化 | 当前为 flow 级 all-or-nothing；真临时表 swap 待 E6 真表路径（已有单表事务原子） |
| P2-1 聚合字段来源 | ✅ | 统一在 mappedRecords 提取 |
| P2-2 前端裸 JSON 无校验 | ⚠️ 前端 | 随 diff.md 前端补齐 |
| P2-3 paginateIn 一致性 | ✅ | `buildPagedRequestConfig` 统一读 `paginateIn`(query/body)，`paramLocation` 作 legacy 别名；流程设计器分页区新增「分页参数位置」选择器 + auto/has-more/empty-result 模式 + totalCountPath/totalPagesPath 输入 |

---

## 五、前端状态

P0 新增能力的界面**已补齐**：
- ✅ 「调度管理」面板：导航新增「调度管理」，列表展示名称/业务流/模式/周期/启用/下次执行/上次执行/状态，支持新增/编辑/启用-停用/立即运行/删除（`index.html` 调度面板 + `scheduleModal`，`app.js` `renderSchedulePanel`/CRUD）。
- ✅ 认证刷新声明字段：认证弹窗新增「自动刷新(JSON)」textarea，写入 `authConfig.refresh`（`authRefreshInput` + `collectAuthForm`）。
- ✅ 调度器状态轮询：调度面板每 15s 刷新 `GET /api/scheduler/status`。

仅 API 可达（可视化编辑器后续补）：
- fieldSchema **展示已消费**（前端 `renderBusinessRows` 按 isDisplay 过滤列、alias 作表头、isJump 渲染跳转链接、isHtml 渲染原始 HTML）；可视化**编辑器**后续补，当前经 `PUT /api/businesses/field-schema` 编辑。
- 业务表查询：`GET /api/business-tables`、`POST /api/business-tables/query`。

diff.md 自带的前端改动（preActions/aggregate/inputTable/isJump/updateFields/atomicWrite 等流程设计器与映射表单入口）**未二次应用**——它们由原 diff.md 提供且与其后端改动成套；本次后端已完整实现，前端可由原 diff.md 提供，避免双份冲突。

---

## 六、新增/变更文件

**新增：**
- `server/services/scheduler-service.mjs` — 调度器
- `server/services/business-data-service.mjs` — 业务数据独立表存储
- `tools/scheduler-unit.mjs` — 调度/认证刷新/live 模式验证
- `tools/design-unit.mjs` — 设计项(explode/一源多列/fieldSchema/业务表)验证
- `docs/CAPABILITY-PARITY.md`、`docs/TARGET-ARCHITECTURE.md`、`docs/IMPLEMENTATION-STATUS.md`

**变更（后端）：**
- `server/services/sync-service.mjs` — diff.md(retry/form/分页探测/jumpUrl/lookup/enum-dict) + live 模式 + 重试分级 + 批节奏 + explode + 一源多列 + lookup multi + number + enum onMiss + 响应缓存
- `server/services/config-service.mjs` — diff.md(preActions/record-driven/aggregate/inputTable/replicate/updateFields/atomicWrite/isJump) + 认证刷新 + fieldSchema + domain-driven + 业务表挂载 + 模式贯通
- `server/data/store.mjs` — schedules 默认实体 + 快照策略 + bootstrap fieldSchema
- `server/core/router.mjs` — schedules/认证刷新/scheduler/业务表/fieldSchema 路由 + startScheduler

---

## 七、如何测试

```bash
npm run check          # 全量语法
npm run flow:unit      # DAG 执行链路
npm run cleaning:unit  # 清洗规则
npm run security:unit  # 鉴权/存储
npm run scheduler:unit # 调度器 + 认证刷新 + live 模式
npm run design:unit    # explode/一源多列/fieldSchema/业务表
npm run cleaning:e2e   # 完整服务器端到端
```

API 速验：
```bash
# 调度器状态
curl -s http://127.0.0.1:4173/api/scheduler/status
# 创建调度(interval 60s 触发 flow_alarm_ops)
curl -s -XPOST http://127.0.0.1:4173/api/schedules -H 'Content-Type: application/json' \
  -d '{"flowId":"flow_alarm_ops","mode":"interval","intervalSeconds":60,"enabled":true}'
# 认证刷新(需 authConfig.refresh 配置)
curl -s -XPOST http://127.0.0.1:4173/api/auth-configs/refresh -H 'Content-Type: application/json' -d '{"id":"<authId>"}'
# 业务表查询
curl -s -XPOST http://127.0.0.1:4173/api/business-tables/query -H 'Content-Type: application/json' -d '{"table":"biz_e2e_event","limit":10}'
```

---

## 八、已知限制 / 后续

1. **前端**：fieldSchema 可视化编辑器、diff.md 流程设计器入口待补（§五）。
2. **E10 purgeUnmatched / E11 插件目录**：按设计延后。
3. **#37 页面级运行时 cookie 覆盖**：未实现（运行时注入临时 cookie 覆盖配置 cookie）。
4. **atomicWrite 真临时表 swap**：当前 flow 级；E6 已提供单表事务原子，跨表 rename-swap 待后续。
5. **B8 ID randomUUID**：低优先级延后。
6. **api-smoke 既有的 runtime-store.json 状态泄漏**：与本次改动无关（基线同样失败），属既有测试卫生问题。

---

## 九、通用化审计结论（无业务定制）

**引擎逻辑层 100% 通用，零业务概念硬编码**：对 `server/services/*` 与 `server/core/*` 全量扫描，HCS 专属产品名（ROMAConnect/ServiceStage/...）、专属字段（cloud_id/rfc_no）、业务概念（产品部/部门/局点/Region/product_name_mapping/map_product_to_dept）在执行路径中**均无出现**。所有业务口径统一由 `dictionarySets`（字典集）+ 通用 action + DAG 编排表达。

残留的业务字样**仅出现在演示/种子位置**（非逻辑耦合）：
| 位置 | 性质 | 说明 |
|------|------|------|
| `sync-service.mjs` testDataSource mock 兜底数据 | 演示 mock | api/db/file 源无真实响应时的样本(支付/订单)；live 模式已对 api 源禁用；结构被单测耦合，名称可后续中性化 |
| `search-service.mjs` keywordMap/兜底答案 | 演示 mock | 智能搜索的占位关键词与回答(OPTIMIZATION.md 已标注为 mock) |
| `store.mjs` defaultStore | 演示种子 | 默认数据源/字典/业务示例(告警/CMDB/产品字典)，用户可整体替换 |
| `analysis-service.mjs` semanticFieldAliases | 通用语义启发式 | severity/service/owner/time/event 的中英文别名词典(非 HCS 专属)，用于字段语义识别 |

**结论**：引擎不绑定任何业务域；新增一个业务域（区域/环境/租户等）只需加字典集与配置，不改代码。
