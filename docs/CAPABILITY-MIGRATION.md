# 内网测试能力通用化迁移说明

本文记录 `origin/feat/capability-parity-and-design` 中的能力点如何迁移到当前 `dev` 分支。迁移原则是保留通用能力，不引入任何产品、部门、局点等定制业务概念。

## 已落地能力

1. 调度能力
   - 新增 `scheduler-service.mjs`，支持 once、interval、5 段 cron。
   - 调度绑定业务流，执行时使用 live 模式，避免真实采集失败后回退 mock。
   - 支持调度启停、修改后重算 `nextRunAt`、手动触发和运行状态查询。

2. 认证自动刷新
   - 认证配置支持声明式 `refresh.login` 和 `refresh.extract`。
   - 支持 JSON/form 登录请求、从 Set-Cookie 或响应体字段提取 cookie/token。
   - 刷新请求复用数据源 SSRF 防护。

3. 数据源真实执行增强
   - `testDataSource` 增加 preview/live 模式。
   - preview 保留 mock 兜底，便于用户配置和预览。
   - live 禁止 mock 兜底，业务流和调度失败会显式暴露。
   - API 请求支持 bodyType、timeout、retry、同批响应缓存。
   - 分页参数位置统一为 `paginateIn=query|body`，兼容旧的 `paramLocation`。

4. 字段展示元数据
   - 业务数据增加 `fieldSchema`，承载字段别名、是否展示、是否时间字段、是否跳转等展示语义。
   - 新增 `PUT /api/businesses/field-schema`，供后续可视化字段配置使用。
   - 与当前已有的字段别名和字段跳转能力兼容。

5. 业务数据独立表存储
   - 新增 `business-data-service.mjs`，业务数据可按业务表独立写入 SQLite。
   - 支持 overwrite、append、upsert。
   - 动态建表并支持后续新增列。
   - 新增业务表列表、查询、删除 API。

6. 输出写入语义增强
   - `outputConfig.useTableStorage` 控制是否写入独立业务表。
   - `outputConfig.atomicWrite` 在真实采集失败时阻止半批数据覆盖已有数据。语义：真实采集全部失败（未取到数据）时记为 `warning` 且不改动已有数据；部分源失败但已取到数据时记为 `failed` 并阻塞写入，避免半批数据覆盖。
   - `outputConfig.updateFields` 支持 upsert 时仅更新指定字段。
   - append 写独立表时只写本次新增结果，避免重复写全量业务数据。

7. 映射能力补齐
   - 支持一个源字段写入多个目标字段。
   - 保留现有 `aggregate-records`，用于把多个响应对象归并到同一个目标记录字段。

## 验证命令

```bash
npm run check
npm run scheduler:unit
npm run design:unit
npm run flow:unit
npm run cleaning:unit
npm run security:unit
```

`design:unit` 使用 Node.js `node:sqlite`，在当前 Node 版本下会出现 ExperimentalWarning，这是运行时提示，不影响测试结果。
