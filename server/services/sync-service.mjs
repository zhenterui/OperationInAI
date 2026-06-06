import { store } from "../data/store.mjs";

export function createDataSource(input = {}) {
  const patch = toSourcePatch(input);
  const created = {
    id: `src_${Date.now()}`,
    ...patch,
    health: "pending",
    updatedAt: new Date().toISOString()
  };
  store.dataSources.unshift(created);
  return created;
}

function toSourcePatch(input = {}) {
  return {
    name: input.name || "未命名数据源",
    kind: input.kind || "api",
    type: input.type || "GET /api/custom/list",
    authType: input.authType || "cookie-refresh",
    authConfigId: input.authConfigId || "",
    status: input.status || "待配置认证策略",
    icon: input.icon || (input.kind === "database" ? "database" : input.kind === "file" ? "file" : "cloud"),
    responsePath: input.responsePath || "data.items",
    cookieName: "",
    cookieValue: "",
    requestConfig: {
      method: input.method || input.requestConfig?.method || "GET",
      queryParams: input.queryParams || input.requestConfig?.queryParams || {},
      headers: input.headers || input.requestConfig?.headers || {},
      body: input.body || input.requestConfig?.body || {},
      pagination: input.pagination || input.requestConfig?.pagination || ""
    },
    responseConfig: {
      keepMode: input.responseConfig?.keepMode || input.responseKeepMode || "all",
      filterCondition: input.responseConfig?.filterCondition || input.responseFilter || ""
    },
    loginUrl: input.loginUrl || "",
    refreshCycle: input.refreshCycle || "",
    authConfig: {
      loginUrl: input.loginUrl || "",
      refreshCycle: input.refreshCycle || "",
      authType: input.authType || "cookie-refresh",
      authConfigId: input.authConfigId || "",
      cookieName: "",
      cookieValue: ""
    },
    updatedAt: new Date().toISOString()
  };
}

export function updateDataSource(id, input = {}) {
  const index = store.dataSources.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Data source not found");
    error.status = 404;
    throw error;
  }
  const existing = store.dataSources[index];
  const updated = {
    ...existing,
    ...toSourcePatch(input),
    id,
    health: input.health || existing.health || "pending"
  };
  store.dataSources[index] = updated;
  return updated;
}

export function deleteDataSource(id) {
  const index = store.dataSources.findIndex((item) => item.id === id);
  if (index < 0) {
    const error = new Error("Data source not found");
    error.status = 404;
    throw error;
  }
  const [removed] = store.dataSources.splice(index, 1);
  store.syncLogs = store.syncLogs.filter((log) => log.sourceId !== id);
  return removed;
}

function uniqueFields(fields = []) {
  return [...new Set(fields.filter(Boolean))];
}

function flattenFields(value, prefix = "") {
  if (Array.isArray(value)) {
    const arrayPath = prefix ? `${prefix}[]` : "items[]";
    const fields = value.flatMap((item) => {
      if (item && typeof item === "object") {
        return flattenFields(item, arrayPath);
      }
      return [arrayPath];
    });
    return uniqueFields(fields);
  }
  if (!value || typeof value !== "object") {
    return prefix ? [prefix] : [];
  }
  return uniqueFields(
    Object.entries(value).flatMap(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (child && typeof child === "object") {
        return flattenFields(child, path);
      }
      return [path];
    })
  );
}

function normalizePathPrefix(path = "") {
  return String(path).replace(/\[\d+\]/g, "[]").replace(/\.$/, "");
}

function pathToSegments(path = "") {
  return String(path)
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getByPath(value, path = "") {
  if (!path) return value;
  return pathToSegments(path).reduce((current, part) => {
    if (current === undefined || current === null) return undefined;
    return current[part];
  }, value);
}

export function testDataSource(input = {}) {
  const source = input.sourceId
    ? store.dataSources.find((item) => item.id === input.sourceId)
    : null;
  const config = {
    ...(source || {}),
    ...input
  };
  const kind = config.kind || "api";
  const now = new Date().toISOString();
  const responsePath = config.responsePath || "data.items";
  const keepMode = config.responseConfig?.keepMode || config.responseKeepMode || "all";
  const filterCondition = config.responseConfig?.filterCondition || config.responseFilter || "";
  const responseBody =
    kind === "database"
      ? {
          rows: [
            {
              service_id: "svc-pay",
              service_name: "支付服务",
              owner: "平台团队",
              env: "prod",
              labels: {
                tier: "core",
                region: "cn-east"
              },
              updated_at: now
            },
            {
              service_id: "svc-order",
              service_name: "订单服务",
              owner: "",
              env: "prod",
              labels: {
                tier: "core",
                zone: "az-2"
              },
              updated_at: now
            }
          ],
          total: 2
        }
      : kind === "file"
        ? {
            sheets: [
              {
                name: "Sheet1",
                rows: [
                  {
                    check_item: "磁盘水位",
                    service: "支付服务",
                    result: "warning",
                    duration: 920,
                    detail: {
                      mount: "/data",
                      threshold: 85
                    },
                    checked_at: now
                  },
                  {
                    check_item: "证书有效期",
                    service: "网关服务",
                    result: "ok",
                    duration: 120,
                    extra: {
                      issuer: "internal-ca"
                    },
                    checked_at: now
                  }
                ]
              }
            ]
          }
        : {
            code: 0,
            message: "ok",
            data: {
              items: [
                {
                  alarmName: "支付网关 5xx 升高",
                  level: "P0",
                  occurTime: now,
                  duration: 1020,
                  service: {
                    id: "svc-pay",
                    name: "支付服务",
                    owner: "平台团队",
                    metadata: {
                      region: "cn-east",
                      tags: ["payment", "gateway"]
                    }
                  },
                  pageInfo: {
                    pageNo: 1,
                    pageSize: 100
                  }
                },
                {
                  alarmName: "订单 MQ 堆积",
                  level: "P1",
                  occurTime: now,
                  duration: 460,
                  service: {
                    id: "svc-order",
                    name: "订单服务",
                    metadata: {
                      region: "cn-north",
                      tags: ["order", "mq"]
                    }
                  },
                  extra: {
                    queue: {
                      name: "order.created",
                      lag: 18420
                    }
                  },
                  pageInfo: {
                    pageNo: 2,
                    pageSize: 100
                  }
                }
              ],
              total: 2,
              page: 1,
              pageInfo: {
                hasNext: true,
                nextPageToken: "mock-next-page"
              }
            }
          };
  const recordValue = getByPath(responseBody, responsePath);
  const recordFields = flattenFields(recordValue, normalizePathPrefix(responsePath));
  const recordCount = Array.isArray(recordValue) ? recordValue.length : recordValue && typeof recordValue === "object" ? 1 : 0;

  return {
    ok: true,
    status: 200,
    durationMs: 186,
    testedAt: now,
    request: {
      kind,
      type: config.type || "",
      method: config.method || config.requestConfig?.method || "GET",
      responsePath,
      keepMode,
      filterCondition,
      queryParams: config.queryParams || config.requestConfig?.queryParams || {},
      headers: config.headers || config.requestConfig?.headers || {},
      body: config.body || config.requestConfig?.body || {},
      pagination: config.pagination || config.requestConfig?.pagination || ""
    },
    responseBody,
    fields: flattenFields(responseBody),
    recordFields,
    recordCount
  };
}

export function runSync(payload = {}) {
  const sourceId = payload.sourceId || store.dataSources[0]?.id;
  const source = store.dataSources.find((item) => item.id === sourceId) || store.dataSources[0];
  const matchedRows = store.businesses.reduce((sum, business) => sum + business.rows.length, 0);
  const cleanedRows = Math.max(0, matchedRows - 1);
  const log = {
    id: `sync_${Date.now()}`,
    sourceId: source?.id,
    sourceName: source?.name || "未知数据源",
    status: "success",
    fetchedRows: matchedRows + 3,
    cleanedRows,
    failedRows: 1,
    durationMs: 842,
    startedAt: new Date().toISOString(),
    message: "已完成采集、字段映射、时间标准化和业务库写入"
  };
  store.syncLogs.unshift(log);
  store.metrics[1] = { ...store.metrics[1], value: "99.4%", delta: "刚刚完成同步" };
  return log;
}

export function listSyncLogs() {
  return store.syncLogs;
}
