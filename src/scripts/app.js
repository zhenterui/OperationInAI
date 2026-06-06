const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const icons = {
  radar: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 3a9 9 0 1 1-9 9"/><path d="M12 7a5 5 0 1 1-5 5"/><path d="M12 11a1 1 0 1 1-1 1"/><path d="M12 3v4M21 12h-4M5.6 18.4l2.8-2.8"/></svg>',
  pipeline: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 6h6v6H4zM14 12h6v6h-6z"/><path d="M10 9h2a4 4 0 0 1 4 4v1M7 12v2a4 4 0 0 0 4 4h3"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5M12 16V8M16 16v-8"/></svg>',
  brain: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M8 6a4 4 0 0 0-4 4 4 4 0 0 0 1 7.7A4 4 0 0 0 12 20V5a4 4 0 0 0-4-4"/><path d="M16 6a4 4 0 0 1 4 4 4 4 0 0 1-1 7.7A4 4 0 0 1 12 20"/><path d="M8 10h1M15 10h1M8 15h2M14 15h2"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20 11a8 8 0 0 0-14.8-4"/><path d="M4 5v5h5"/><path d="M4 13a8 8 0 0 0 14.8 4"/><path d="M20 19v-5h-5"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M13 2 4 14h7l-1 8 10-13h-7z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M8 5v14l11-7z"/></svg>',
  database: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M17.5 18H8a5 5 0 1 1 1-9.9A6 6 0 0 1 20 11a3.5 3.5 0 0 1-2.5 7z"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/></svg>'
};

function renderIcons() {
  $$("[data-icon]").forEach((node) => {
    node.innerHTML = icons[node.dataset.icon] || icons.spark;
  });
}

function setPanel(panelId) {
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.panel === panelId));
  $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === panelId));
  const active = $(`.nav-item[data-panel="${panelId}"] span:last-child`);
  $("#panelTitle").textContent = active ? active.textContent : "态势总览";
}

function renderMetrics() {
  $("#metricGrid").innerHTML = window.opsData.metrics
    .map(
      (metric) => `
        <article class="metric-card">
          <div class="metric-top">
            <span>${metric.label}</span>
            <span class="icon" data-icon="${metric.icon}"></span>
          </div>
          <div class="value">${metric.value}</div>
          <div class="delta">${metric.delta}</div>
        </article>
      `
    )
    .join("");
}

function renderFlow() {
  $("#flowBoard").innerHTML = window.opsData.flowNodes
    .map(
      (node) => `
        <div class="flow-node">
          <span class="icon" data-icon="${node.icon}"></span>
          <strong>${node.title}</strong>
          <small>${node.desc}</small>
        </div>
      `
    )
    .join("");
}

function renderSources() {
  $("#sourceStack").innerHTML = window.opsData.sources
    .map(
      (source) => `
        <div class="source-card">
          <span class="icon" data-icon="${source.icon}"></span>
          <div>
            <strong>${source.name}</strong>
            <small>${source.type} · ${source.status}</small>
          </div>
          <span class="status-pill ok">运行中</span>
        </div>
      `
    )
    .join("");
}

function renderMappings() {
  const rows = [["源字段", "目标字段", "类型", "清洗规则", "输出目标"], ...window.opsData.mappings];
  $("#mappingTable").innerHTML = rows
    .map(
      (row, index) => `
        <div class="mapping-row ${index === 0 ? "header" : ""}">
          ${row.map((cell) => `<span>${cell}</span>`).join("")}
        </div>
      `
    )
    .join("");
}

function renderBusinessSelector() {
  $("#businessSelect").innerHTML = window.opsData.businesses
    .map((item) => `<option>${item.name}</option>`)
    .join("");
}

function renderBusinessTable() {
  const current = window.opsData.businesses.find((item) => item.name === $("#businessSelect").value) || window.opsData.businesses[0];
  const rows = [["事件名称", "等级", "归属对象", "时间", "状态/影响"], ...current.rows];
  $("#businessTable").innerHTML = rows
    .map(
      (row, index) => `
        <div class="table-row ${index === 0 ? "header" : ""}">
          ${row.map((cell) => `<span>${cell}</span>`).join("")}
        </div>
      `
    )
    .join("");
  drawTrendChart(current.name);
}

function renderSignals() {
  $("#signalList").innerHTML = window.opsData.signals
    .map(
      (signal) => `
        <div class="signal-item">
          <span class="icon" data-icon="${signal.icon}"></span>
          <div>
            <strong>${signal.title}</strong>
            <small>${signal.desc}</small>
          </div>
          <span class="status-pill danger">需关注</span>
        </div>
      `
    )
    .join("");
}

function renderKnowledge() {
  $("#knowledgeList").innerHTML = window.opsData.knowledge
    .map(
      (item) => `
        <div class="knowledge-item">
          <span class="icon" data-icon="${item.icon}"></span>
          <div>
            <strong>${item.name}</strong>
            <small>${item.desc}</small>
          </div>
        </div>
      `
    )
    .join("");
}

function renderAnalysis() {
  $("#analysisOutput").innerHTML = `
    <div class="insight-stack">
      <div class="insight-card">
        <h3>结论</h3>
        <p>支付链路在最近 24 小时出现集中波动，核心信号来自 5xx 错误率、MQ 堆积和发布回滚，建议优先排查网关到订单服务的调用路径。</p>
      </div>
      <div class="insight-card">
        <h3>风险</h3>
        <p>P0 告警共 3 次，最长影响 46 分钟。若订单 MQ 消费速率继续低于写入速率，可能触发下游库存与支付状态不一致。</p>
      </div>
      <div class="insight-card">
        <h3>改进措施</h3>
        <p>立即拉齐支付、订单、网关负责人进行联合排查；补充 MQ 消费延迟告警；将发布回滚记录纳入变更风险画像。</p>
      </div>
    </div>
  `;
}

function renderAnswer() {
  const question = $("#questionInput").value.trim() || "最近告警集中在哪些服务？";
  $("#answerCard").innerHTML = `
    <h3>回答</h3>
    <p>根据问题“${question}”，系统命中告警业务数据、历史工单知识和运维 SOP。当前告警主要集中在支付服务与订单服务，优先级最高的是支付网关 5xx 升高，其次是订单 MQ 堆积。</p>
    <ul>
      <li>优先处理支付网关到订单服务的接口错误，确认发布、限流、依赖超时是否异常。</li>
      <li>同步检查 MQ 消费组积压，必要时临时扩容消费者并冻结非必要发布。</li>
      <li>引用来源：告警中心 API、历史工单知识、运维 SOP 文档库。</li>
    </ul>
  `;
}

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor((rect.width * 0.44) * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: rect.width, height: rect.width * 0.44 };
}

function drawTrendChart(label) {
  const canvas = $("#trendChart");
  const { ctx, width, height } = fitCanvas(canvas);
  const data = label === "工单业务" ? [18, 26, 31, 24, 35, 29, 42] : [12, 18, 16, 38, 32, 46, 40];
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,.03)";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(156,238,226,.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = 34 + i * ((height - 68) / 4);
    ctx.beginPath();
    ctx.moveTo(34, y);
    ctx.lineTo(width - 26, y);
    ctx.stroke();
  }
  const max = Math.max(...data);
  const step = (width - 80) / (data.length - 1);
  const points = data.map((value, index) => ({
    x: 42 + index * step,
    y: height - 36 - (value / max) * (height - 84)
  }));
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#30e8c7");
  gradient.addColorStop(0.55, "#4d8dff");
  gradient.addColorStop(1, "#8df25f");
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  points.forEach((point) => {
    ctx.fillStyle = "#eafff8";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#8fb1b2";
  ctx.font = "12px Microsoft YaHei, sans-serif";
  ctx.fillText(`${label} 最近 7 个周期趋势`, 24, 24);
}

function drawRiskRadar() {
  const canvas = $("#riskRadar");
  const { ctx, width, height } = fitCanvas(canvas);
  const cx = width / 2;
  const cy = height / 2 + 10;
  const radius = Math.min(width, height) * 0.32;
  const values = [0.78, 0.62, 0.84, 0.46, 0.7, 0.55];
  const labels = ["告警", "容量", "变更", "链路", "安全", "知识"];
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(156,238,226,.2)";
  for (let ring = 1; ring <= 4; ring += 1) {
    ctx.beginPath();
    for (let i = 0; i < values.length; i += 1) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / values.length;
      const r = (radius * ring) / 4;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(48,232,199,.18)";
  ctx.strokeStyle = "#30e8c7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((value, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / values.length;
    const x = cx + Math.cos(angle) * radius * value;
    const y = cy + Math.sin(angle) * radius * value;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#bfe7e3";
  ctx.font = "12px Microsoft YaHei, sans-serif";
  labels.forEach((text, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / labels.length;
    const x = cx + Math.cos(angle) * (radius + 24);
    const y = cy + Math.sin(angle) * (radius + 24);
    ctx.fillText(text, x - 12, y + 4);
  });
}

function animateBackground() {
  const canvas = $("#signalCanvas");
  const ctx = canvas.getContext("2d");
  const points = Array.from({ length: 70 }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0008,
    vy: (Math.random() - 0.5) * 0.0008
  }));

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function frame() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    ctx.clearRect(0, 0, width, height);
    points.forEach((point) => {
      point.x = (point.x + point.vx + 1) % 1;
      point.y = (point.y + point.vy + 1) % 1;
    });
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const ax = points[i].x * width;
        const ay = points[i].y * height;
        const bx = points[j].x * width;
        const by = points[j].y * height;
        const distance = Math.hypot(ax - bx, ay - by);
        if (distance < 120) {
          ctx.strokeStyle = `rgba(48, 232, 199, ${0.11 * (1 - distance / 120)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
    }
    points.forEach((point) => {
      ctx.fillStyle = "rgba(141, 242, 95, .42)";
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 1.4, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  frame();
}

function bindEvents() {
  $$(".nav-item").forEach((item) => item.addEventListener("click", () => setPanel(item.dataset.panel)));
  $$("[data-panel-link]").forEach((item) => item.addEventListener("click", () => setPanel(item.dataset.panelLink)));
  $("#businessSelect").addEventListener("change", renderBusinessTable);
  $("#generateAnalysisBtn").addEventListener("click", renderAnalysis);
  $("#askBtn").addEventListener("click", renderAnswer);
  $("#runSyncBtn").addEventListener("click", () => {
    $("#runSyncBtn").innerHTML = `<span class="icon" data-icon="refresh"></span> 同步完成`;
    renderIcons();
  });
  $("#addSourceBtn").addEventListener("click", () => {
    window.opsData.sources.unshift({
      name: "新增 API 数据源",
      type: "GET /api/custom/list",
      status: "待配置认证策略",
      icon: "cloud"
    });
    renderSources();
    renderIcons();
  });
  $("#viewMode").addEventListener("click", (event) => {
    if (event.target.tagName !== "BUTTON") return;
    $$("#viewMode button").forEach((button) => button.classList.toggle("active", button === event.target));
  });
  $("#themePulse").addEventListener("click", () => {
    drawRiskRadar();
    renderBusinessTable();
  });
  window.addEventListener("resize", () => {
    drawRiskRadar();
    renderBusinessTable();
  });
}

function boot() {
  renderMetrics();
  renderFlow();
  renderSources();
  renderMappings();
  renderBusinessSelector();
  renderBusinessTable();
  renderSignals();
  renderKnowledge();
  renderAnalysis();
  renderAnswer();
  renderIcons();
  bindEvents();
  drawRiskRadar();
  animateBackground();
}

document.addEventListener("DOMContentLoaded", boot);
