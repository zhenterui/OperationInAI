import { persistStore, store } from "../data/store.mjs";
import { refreshDueAuths, runBusinessFlow } from "./config-service.mjs";

// OperationInAI 业务流调度器
// 对齐老系统 run_loop / interval_seconds / 定时能力：
//   - mode=once:    单次触发(到达 nextRunAt 后执行一次, 之后停摆)
//   - mode=interval: 每 intervalSeconds 触发一次 runBusinessFlow(live)
//   - mode=cron:     5 段 cron(本地时区) 触发
// 设计要点:
//   - 单一 tick 循环(默认 10s 粒度), 避免每 schedule 一个 timer 的复杂度
//   - 每 schedule 运行态守护(runningIds), 防止重叠触发
//   - 进程重启后从持久化 schedules 恢复 nextRunAt; 错过的 once 单次补跑

const TICK_INTERVAL_MS = 10_000;
const CRON_LOOKUP_LIMIT_DAYS = 366;

let tickTimer = null;
let started = false;
const runningIds = new Set();

function uniqueId(prefix = "sched") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function positiveNumber(value, fallback = 1) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeMode(value) {
  return ["once", "interval", "cron"].includes(value) ? value : "interval";
}

// ---------- cron 解析(5 段, 本地时区, AND 语义) ----------
function parseCronField(expr, min, max) {
  const result = new Set();
  for (const part of String(expr || "").split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed === "*") {
      for (let v = min; v <= max; v += 1) result.add(v);
      continue;
    }
    const stepStar = trimmed.match(/^\*\/(\d+)$/);
    if (stepStar) {
      const step = Number(stepStar[1]);
      if (step <= 0) throw new Error(`invalid cron step: ${trimmed}`);
      for (let v = min; v <= max; v += step) result.add(v);
      continue;
    }
    const rangeStep = trimmed.match(/^(\d+)-(\d+)\/(\d+)$/);
    if (rangeStep) {
      const [, a, b, s] = rangeStep.map(Number);
      for (let v = a; v <= b; v += s) result.add(v);
      continue;
    }
    const range = trimmed.match(/^(\d+)-(\d+)$/);
    if (range) {
      const [, a, b] = range.map(Number);
      for (let v = a; v <= b; v += 1) result.add(v);
      continue;
    }
    const num = Number(trimmed);
    if (Number.isInteger(num) && num >= min && num <= max) {
      result.add(num);
      continue;
    }
    throw new Error(`invalid cron field value: ${trimmed}`);
  }
  if (!result.size) throw new Error(`empty cron field: ${expr}`);
  return result;
}

export function parseCron(cronExpr = "") {
  const fields = String(cronExpr).trim().split(/\s+/);
  if (fields.length !== 5) {
    const error = new Error("cron 表达式必须为 5 段: 分 时 日 月 周");
    error.status = 400;
    throw error;
  }
  return {
    minute: parseCronField(fields[0], 0, 59),
    hour: parseCronField(fields[1], 0, 23),
    dom: parseCronField(fields[2], 1, 31),
    month: parseCronField(fields[3], 1, 12),
    dow: parseCronField(fields[4], 0, 6)
  };
}

// 返回 afterDate 之后(不含)第一个满足 cron 的本地时间 Date; 无解返回 null
export function nextFire(afterDate, cronExpr) {
  const cron = parseCron(cronExpr);
  const dt = new Date(afterDate.getTime());
  dt.setSeconds(0, 0);
  dt.setMinutes(dt.getMinutes() + 1);
  const limit = new Date(afterDate.getTime() + CRON_LOOKUP_LIMIT_DAYS * 24 * 60 * 60 * 1000);
  while (dt <= limit) {
    if (
      cron.month.has(dt.getMonth() + 1) &&
      cron.dom.has(dt.getDate()) &&
      cron.dow.has(dt.getDay()) &&
      cron.hour.has(dt.getHours()) &&
      cron.minute.has(dt.getMinutes())
    ) {
      return dt;
    }
    dt.setMinutes(dt.getMinutes() + 1);
  }
  return null;
}

// ---------- nextRunAt 计算 ----------
function computeNextRunAt(schedule, reference = new Date()) {
  if (schedule.mode === "once") {
    return schedule.nextRunAt || null;
  }
  if (schedule.mode === "interval") {
    const intervalSeconds = positiveNumber(schedule.intervalSeconds, 300);
    const base = schedule.lastRunAt ? new Date(schedule.lastRunAt) : reference;
    let next = new Date(base.getTime() + intervalSeconds * 1000);
    if (next <= reference) next = new Date(reference.getTime() + 1000);
    return next.toISOString();
  }
  if (schedule.mode === "cron") {
    try {
      const fire = nextFire(reference, schedule.cronExpr);
      return fire ? fire.toISOString() : null;
    } catch {
      return null;
    }
  }
  return null;
}

// ---------- schedules CRUD ----------
function toSchedule(input = {}, existing = {}) {
  const mode = normalizeMode(input.mode || existing.mode);
  const flowId = input.flowId || existing.flowId || "";
  const flow = store.businessFlows.find((item) => item.id === flowId);
  if (!flowId || !flow) {
    const error = new Error("调度必须绑定一个已存在的业务流");
    error.status = 400;
    throw error;
  }
  const schedule = {
    id: existing.id || input.id || uniqueId(),
    name: input.name || existing.name || `调度-${flow.businessName}`,
    flowId,
    flowName: flow.businessName,
    mode,
    intervalSeconds: mode === "interval" ? positiveNumber(input.intervalSeconds ?? existing.intervalSeconds, 300) : 0,
    cronExpr: mode === "cron" ? (input.cronExpr || existing.cronExpr || "*/5 * * * *") : "",
    enabled: input.enabled !== undefined ? input.enabled !== false : existing.enabled !== false,
    nextRunAt: existing.nextRunAt || null,
    lastRunAt: existing.lastRunAt || "",
    lastRunStatus: existing.lastRunStatus || "",
    lastError: existing.lastError || "",
    updatedAt: nowIso()
  };
  // 首次创建或重新启用时计算 nextRunAt
  if (!schedule.nextRunAt || (existing.mode && existing.mode !== mode)) {
    schedule.nextRunAt = computeNextRunAt(schedule, new Date());
  }
  if (!schedule.enabled) {
    schedule.nextRunAt = null;
  }
  return schedule;
}

export function createSchedule(input = {}) {
  const schedule = toSchedule(input);
  store.schedules.unshift(schedule);
  return schedule;
}

export function updateSchedule(id, input = {}) {
  const index = store.schedules.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Schedule not found");
    error.status = 404;
    throw error;
  }
  const existing = store.schedules[index];
  const wasEnabled = existing.enabled !== false;
  const updated = toSchedule({ ...existing, ...input, id }, existing);
  // 重新启用或参数变化后重算 nextRunAt
  const reEnabled = !wasEnabled && updated.enabled;
  if (reEnabled || !updated.enabled) {
    updated.nextRunAt = updated.enabled ? computeNextRunAt(updated, new Date()) : null;
  }
  store.schedules[index] = updated;
  return updated;
}

export function deleteSchedule(id) {
  const index = store.schedules.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Schedule not found");
    error.status = 404;
    throw error;
  }
  const [removed] = store.schedules.splice(index, 1);
  return removed;
}

export function listSchedules() {
  return store.schedules;
}

// ---------- 触发执行 ----------
async function fireSchedule(schedule) {
  if (runningIds.has(schedule.id)) return null;
  runningIds.add(schedule.id);
  const startedAt = nowIso();
  try {
    const result = await runBusinessFlow({
      flowId: schedule.flowId,
      mode: "live",
      context: { triggeredBy: "scheduler", scheduleId: schedule.id }
    });
    schedule.lastRunAt = startedAt;
    schedule.lastError = "";
    schedule.lastRunStatus = result.flow?.status || (result.sourceResults?.some((item) => !item.ok) ? "warning" : "success");
  } catch (error) {
    schedule.lastRunAt = startedAt;
    schedule.lastRunStatus = "failed";
    schedule.lastError = error?.message || "调度执行失败";
  } finally {
    runningIds.delete(schedule.id);
    schedule.nextRunAt = schedule.mode === "once" ? null : computeNextRunAt(schedule, new Date());
    schedule.updatedAt = nowIso();
    try {
      persistStore();
    } catch {
      // 持久化失败不阻断调度循环
    }
  }
  return schedule;
}

export async function runScheduleNow(id) {
  const schedule = store.schedules.find((item) => item.id === id);
  if (!schedule) {
    const error = new Error("Schedule not found");
    error.status = 404;
    throw error;
  }
  await fireSchedule(schedule);
  return schedule;
}

// ---------- 调度循环 ----------
async function tick() {
  // 先刷新到期的认证配置(对齐老系统 cookie 自动刷新)
  try {
    await refreshDueAuths();
  } catch {
    // 认证刷新失败不阻断调度
  }
  const now = Date.now();
  for (const schedule of store.schedules) {
    if (!schedule.enabled) continue;
    if (runningIds.has(schedule.id)) continue;
    if (!schedule.nextRunAt) {
      schedule.nextRunAt = computeNextRunAt(schedule, new Date());
      continue;
    }
    const due = Date.parse(schedule.nextRunAt);
    if (Number.isNaN(due) || due > now) continue;
    // 到点触发(异步, 不阻塞 tick)
    fireSchedule(schedule).catch(() => {});
  }
}

export function startScheduler() {
  if (started) return false;
  started = true;
  // 启动恢复: 为缺失 nextRunAt 的 schedule 重算; 错过的 once 单次补跑
  for (const schedule of store.schedules) {
    if (!schedule.enabled) continue;
    if (schedule.mode === "once" && !schedule.lastRunAt && schedule.nextRunAt) {
      const due = Date.parse(schedule.nextRunAt);
      if (!Number.isNaN(due) && due <= Date.now()) {
        // 错过的 one-shot: 立即补跑一次
        fireSchedule(schedule).catch(() => {});
        continue;
      }
    }
    if (!schedule.nextRunAt) {
      schedule.nextRunAt = computeNextRunAt(schedule, new Date());
    }
  }
  tickTimer = setInterval(() => {
    tick().catch(() => {});
  }, TICK_INTERVAL_MS);
  if (typeof tickTimer.unref === "function") tickTimer.unref();
  return true;
}

export function stopScheduler() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  started = false;
}

export function getSchedulerStatus() {
  return {
    started,
    tickIntervalMs: TICK_INTERVAL_MS,
    running: [...runningIds],
    total: store.schedules.length,
    enabled: store.schedules.filter((item) => item.enabled).length
  };
}
