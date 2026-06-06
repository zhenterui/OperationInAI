# OperationInAI 智能运维系统原型

这是一个无外部依赖的静态前端原型，聚焦智能运维平台的核心工作台：

- 数据清洗：多数据源、认证刷新、字段映射、同步动作。
- 数据展示：业务视图、字段筛选、时间筛选、TOP 与图表模式。
- 智能分析：模型配置、分析字段、提示词模板、结构化分析结果。
- 智能搜索：URL、本地路径、知识库来源和问答结果。

## 目录结构

```text
.
├── index.html
├── README.md
└── src
    ├── assets
    │   └── logo.svg
    ├── scripts
    │   ├── app.js
    │   └── data.js
    └── styles
        ├── base.css
        ├── components.css
        └── layout.css
```

## 运行方式

直接双击 `index.html` 即可打开。

也可以在当前目录启动静态服务：

```powershell
node .\tools\dev-server.mjs
```

或者：

```powershell
npm run dev
```

如果 PowerShell 阻止 `npm.ps1`，使用：

```powershell
npm.cmd run dev
```

然后访问：

```text
http://127.0.0.1:4173
```

## 后续开发建议

第一步建议保留当前前端结构，新增后端目录：

```text
server
├── api
├── core
├── models
├── services
└── workers
```

后端可以优先实现业务模型、数据源配置、字段映射和手动同步接口，再逐步接入智能分析与智能搜索。
