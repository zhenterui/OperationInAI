# OperationInAI 智能运维系统原型

这是一个无外部依赖的智能运维系统原型，当前已经包含前端控制台和 Node.js 后端 API。

## 已实现能力

- 态势总览：按已配置业务、业务流、数据源、规则和业务数据自动生成指标、风险雷达和运维信号。
- 数据清洗：数据源配置、认证配置、字段映射、清洗规则、业务流编排、手动同步任务。
- 数据展示：业务模型、业务数据表格、时间组件筛选、字段搜索、排序、TOP 和趋势图。
- 智能分析：业务多选、字段多选、组合字段、模型配置页签、提示词区域、结构化分析结果。
- 智能搜索：知识源列表、问题输入、后端模拟搜索问答、引用来源。
- 后端服务：健康检查、启动数据、数据源、认证、规则、业务流、模型配置、同步日志、分析、搜索接口。

## 目录结构

```text
.
├── index.html
├── package.json
├── README.md
├── docs
│   ├── DESIGN.md
│   └── USAGE.md
├── server
│   ├── core
│   ├── data
│   ├── services
│   └── index.mjs
├── src
│   ├── assets
│   ├── scripts
│   └── styles
└── tools
    ├── api-smoke.mjs
    └── dev-server.mjs
```

## 启动完整服务

```powershell
cd E:\AI\CodexWorkSpace\OperationInAI
npm.cmd run dev
```

访问：

```text
http://127.0.0.1:4173
```

健康检查：

```text
http://127.0.0.1:4173/api/health
```

## 常用命令

```powershell
npm.cmd run check
npm.cmd run api:smoke
npm.cmd run cleaning:e2e
npm.cmd run port:check
npm.cmd run static
```

`npm.cmd run dev` 会启动带后端 API 的完整服务。  
`npm.cmd run static` 只启动静态页面服务，主要用于前端纯页面预览。

## 运行配置

- `OPERATION_API_TOKEN`：可选。配置后所有 `/api/*` 请求都需要带 `X-Operation-Token`，不配置则保持本地开发免鉴权。
- `OPERATION_MAX_JSON_BYTES`：可选。限制单个 JSON 请求体大小，默认 `1048576`。
- `OPERATION_FLOW_MAX_CALLS`：可选。限制单次业务流最多实际调用数据源次数，默认 `500`，用于防止分页或批次误配置。
- `OPERATION_BLOCK_PRIVATE_FETCH=1`：可选。启用后阻止服务端请求常见私网地址，降低 SSRF 风险。
- 运行时配置会保存到 `server/data/runtime-store.json`，该文件已加入 `.gitignore`；写盘时会清空 Cookie、密码和 API Key 等敏感值。

## 当前接口

- `GET /api/health`
- `GET /api/bootstrap`
- `GET /api/data-sources`
- `POST /api/data-sources`
- `PUT /api/data-sources/:id`
- `DELETE /api/data-sources/:id`
- `GET /api/auth-configs`
- `POST /api/auth-configs`
- `PUT /api/auth-configs/:id`
- `DELETE /api/auth-configs/:id`
- `GET /api/field-mappings`
- `POST /api/field-mappings`
- `GET /api/cleaning-rules`
- `POST /api/cleaning-rules`
- `PUT /api/cleaning-rules/:id`
- `DELETE /api/cleaning-rules/:id`
- `GET /api/model-configs`
- `POST /api/model-configs`
- `PUT /api/model-configs/:id`
- `DELETE /api/model-configs/:id`
- `GET /api/businesses`
- `POST /api/businesses/query`
- `GET /api/business-flows`
- `POST /api/business-flows`
- `POST /api/business-flows/run`
- `POST /api/sync-jobs/run`
- `GET /api/sync-logs`
- `POST /api/analysis/run`
- `GET /api/analysis/results`
- `GET /api/knowledge-sources`
- `POST /api/search/query`

## 文档

- [设计文档](docs/DESIGN.md)
- [使用文档](docs/USAGE.md)
- [优化建议](docs/OPTIMIZATION.md)
