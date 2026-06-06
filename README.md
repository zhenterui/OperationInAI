# OperationInAI 智能运维系统原型

这是一个无外部依赖的智能运维系统原型，当前已经包含前端控制台和 Node.js 后端 API。

## 已实现能力

- 数据清洗：数据源配置、认证类型、字段映射、手动同步任务。
- 数据展示：业务模型、业务数据表格、时间字段、筛选排序和趋势图。
- 智能分析：模型配置、提示词区域、后端模拟分析接口、结构化分析结果。
- 智能搜索：知识源列表、问题输入、后端模拟搜索问答、引用来源。
- 后端服务：健康检查、启动数据、数据源、字段映射、同步日志、分析、搜索接口。

## 目录结构

```text
.
├── index.html
├── package.json
├── README.md
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
npm.cmd run static
```

`npm.cmd run dev` 会启动带后端 API 的完整服务。  
`npm.cmd run static` 只启动静态页面服务，主要用于前端纯页面预览。

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
