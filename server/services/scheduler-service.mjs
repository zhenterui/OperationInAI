import { persistStore, store } from "../data/store.mjs";
import { refreshDueAuths, runBusinessFlow } from "./config-service.mjs";

const TICK_INTERVAL_MS = 10_000;
const CRON_LOOKUP_LIMIT_DAYS = 366;

let tickTimer = null;
let started = false;
const runningIds = new Set();

function uniqueId(prefix = "sched") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function positiveNumber(value, fallback = 1) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeMode(value) {
  return ["once", "interval", "cron"].includes(value) ? value : "interval";
}

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

function computeNextRunAt(schedule, reference = new Date()) {
  if (schedule.mode === "once") return schedule.nextRunAt || new Date(reference.getTime() + 1000).toISOString();
  if (schedule.mode === "interval") {
    const intervalSeconds = positiveNumber(schedule.intervalSeconds, 300);
    const base = schedule.lastRunAt ? new Date(schedule.lastRunAt) : reference;
    let next = new Date(base.getTime() + intervalSeconds * 1000);
    if (next <= reference) next = new Date(reference.getTime() + 1000);
    return next.toISOString();
  }
  if (schedule.mode === "cron") {
    const fire = nextFire(reference, schedule.cronExpr || "*/5 * * * *");
    return fire ? fire.toISOString() : null;
  }
  return null;
}

function hasScheduleTimingChanged(existing = {}, input = {}) {
  return ["mode", "intervalSeconds", "cronExpr", "flowId", "enabled"].some((key) =>
    Object.prototype.hasOwnProperty.call(input, key) && input[key] !== existing[key]
  );
}

function toSchedule(input = {}, existing = {}) {
  const mode = normalizeMode(input.mode ?? existing.mode);
  const flowId = input.flowId || existing.flowId || "";
  const flow = store.businessFlows.find((item) => item.id === flowId);
  if (!flowId || !flow) {
    const error = new Error("调度必须绑定一个已存在的业务流");
    error.status = 400;
    throw error;
  }
  const schedule = {
    id: existing.id || input.id || uniqueId(),
    name: input.name || existing.name || `调度-${flow.businessName || flow.name}`,
    flowId,
    flowName: flow.businessName || flow.name || flowId,
    mode,
    intervalSeconds: mode === "interval" ? positiveNumber(input.intervalSeconds ?? existing.intervalSeconds, 300) : 0,
    cronExpr: mode === "cron" ? (input.cronExpr || existing.cronExpr || "*/5 * * * *") : "",
    enabled: input.enabled !== undefined ? input.enabled !== false : existing.enabled !== false,
    nextRunAt: input.nextRunAt ?? existing.nextRunAt ?? null,
    lastRunAt: existing.lastRunAt || "",
    lastRunStatus: existing.lastRunStatus || "",
    lastError: existing.lastError || "",
    updatedAt: new Date().toISOString()
  };
  if (!schedule.enabled) schedule.nextRunAt = null;
  return schedule;
}

export function createSchedule(input = {}) {
  const schedule = toSchedule(input);
  schedule.nextRunAt = schedule.enabled ? computeNextRunAt(schedule, new Date()) : null;
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
  const updated = toSchedule({ ...input, id }, existing);
  if (hasScheduleTimingChanged(existing, input)) {
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

async function fireSchedule(schedule) {
  if (runningIds.has(schedule.id)) return schedule;
  runningIds.add(schedule.id);
  const startedAt = new Date().toISOString();
  try {
    const result = await runBusinessFlow({
      flowId: schedule.flowId,
      mode: "live",
      context: { triggeredBy: "scheduler", scheduleId: schedule.id }
    });
    schedule.lastRunAt = startedAt;
    schedule.lastRunStatus = result.flow?.status || "success";
    schedule.lastError = "";
  } catch (error) {
    schedule.lastRunAt = startedAt;
    schedule.lastRunStatus = "failed";
    schedule.lastError = error?.message || "调度执行失败";
  } finally {
    runningIds.delete(schedule.id);
    schedule.nextRunAt = schedule.mode === "once" ? null : computeNextRunAt(schedule, new Date());
    schedule.updatedAt = new Date().toISOString();
    try { persistStore(); } catch {}
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
  return fireSchedule(schedule);
}

async function tick() {
  try { await refreshDueAuths(); } catch {}
  const now = Date.now();
  for (const schedule of store.schedules || []) {
    if (!schedule.enabled || runningIds.has(schedule.id)) continue;
    if (!schedule.nextRunAt) {
      schedule.nextRunAt = computeNextRunAt(schedule, new Date());
      continue;
    }
    const due = Date.parse(schedule.nextRunAt);
    if (!Number.isNaN(due) && due <= now) {
      fireSchedule(schedule).catch(() => {});
    }
  }
}

export function startScheduler() {
  if (started) return false;
  started = true;
  for (const schedule of store.schedules || []) {
    if (schedule.enabled && !schedule.nextRunAt) schedule.nextRunAt = computeNextRunAt(schedule, new Date());
  }
  tickTimer = setInterval(() => tick().catch(() => {}), TICK_INTERVAL_MS);
  if (typeof tickTimer.unref === "function") tickTimer.unref();
  return true;
}

export function stopScheduler() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = null;
  started = false;
}

export function getSchedulerStatus() {
  return {
    started,
    tickIntervalMs: TICK_INTERVAL_MS,
    running: [...runningIds],
    total: (store.schedules || []).length,
    enabled: (store.schedules || []).filter((item) => item.enabled).length
  };
}
