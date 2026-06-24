import { store } from "../data/store.mjs";

function uniqueId(prefix = "audit") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function trimAuditLogs(limit = Number(process.env.OPERATION_AUDIT_LIMIT || 1000)) {
  if (!Array.isArray(store.auditLogs)) store.auditLogs = [];
  if (store.auditLogs.length > limit) {
    store.auditLogs.splice(limit);
  }
}

export function recordAuditLog(input = {}) {
  if (!Array.isArray(store.auditLogs)) store.auditLogs = [];
  const entry = {
    id: uniqueId(),
    user: input.user || "local-user",
    role: input.role || "admin",
    method: input.method || "",
    path: input.path || "",
    status: input.status || "success",
    detail: input.detail || "",
    createdAt: new Date().toISOString()
  };
  store.auditLogs.unshift(entry);
  trimAuditLogs();
  return entry;
}

export function listAuditLogs() {
  return store.auditLogs || [];
}
