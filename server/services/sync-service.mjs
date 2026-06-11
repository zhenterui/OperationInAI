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
    category: input.category || "默认数据源",
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
      filterCondition: input.responseConfig?.filterCondition || input.responseFilter || "",
      fieldKeepMode: input.responseConfig?.fieldKeepMode || "all",
      keepFields: Array.isArray(input.responseConfig?.keepFields) ? input.responseConfig.keepFields : [],
      persistMode: input.responseConfig?.persistMode || "none",
      targetTable: input.responseConfig?.targetTable || ""
    },
    parameterConfig: {
      sourceType: input.parameterConfig?.sourceType || "static",
      sourceId: input.parameterConfig?.sourceId || "",
      selectedFields: Array.isArray(input.parameterConfig?.selectedFields) ? input.parameterConfig.selectedFields : [],
      filterCondition: input.parameterConfig?.filterCondition || "",
      query: input.parameterConfig?.query || "",
      mappings: Array.isArray(input.parameterConfig?.mappings) ? input.parameterConfig.mappings : [],
      iterationMode: input.parameterConfig?.iterationMode || "single",
      strategy: input.parameterConfig?.strategy || ""
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

function normalizeRecordPrefix(path = "") {
  return normalizePathPrefix(path).replace(/\[\]$/, "");
}

function pathToSegments(path = "") {
  return String(path)
    .replace(/\[\]/g, ".*")
    .replace(/\[\*\]/g, ".*")
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getValuesByPath(value, path = "") {
  if (!path) return value;
  const segments = pathToSegments(path);
  const visit = (current, index) => {
    if (current === undefined || current === null) return [];
    if (index >= segments.length) return [current];
    const part = segments[index];
    if (part === "*") {
      const list = Array.isArray(current) ? current : [current];
      return list.flatMap((item) => visit(item, index + 1));
    }
    if (Array.isArray(current)) {
      return current.flatMap((item) => visit(item?.[part], index + 1));
    }
    return visit(current[part], index + 1);
  };
  return visit(value, 0);
}

function getByPath(value, path = "") {
  const values = getValuesByPath(value, path);
  if (!path) return values;
  return path.includes("[]") || path.includes("[*]") ? values : values[0];
}

function stripResponsePrefix(field = "", responsePath = "") {
  const normalizedField = normalizePathPrefix(field);
  const normalizedPath = normalizePathPrefix(responsePath);
  if (!normalizedPath || normalizedField === normalizedPath) return normalizedField;
  const dottedPrefix = `${normalizedPath}.`;
  return normalizedField.startsWith(dottedPrefix) ? normalizedField.slice(dottedPrefix.length) : normalizedField;
}

function unquoteValue(value = "") {
  return String(value).trim().replace(/^['"]|['"]$/g, "");
}

function normalizeComparable(value) {
  if (typeof value === "number" || typeof value === "boolean") return value;
  const text = unquoteValue(value);
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  if (text === "true") return true;
  if (text === "false") return false;
  return text;
}

function compareValues(actual, operator, expected) {
  const left = normalizeComparable(actual);
  const right = normalizeComparable(expected);
  if (operator === "==") return left === right;
  if (operator === "!=") return left !== right;
  if (operator === ">") return Number(left) > Number(right);
  if (operator === ">=") return Number(left) >= Number(right);
  if (operator === "<") return Number(left) < Number(right);
  if (operator === "<=") return Number(left) <= Number(right);
  if (operator === "contains") return String(left).includes(String(right));
  return false;
}

function evaluateSingleFilter(record, condition = "", responsePath = "") {
  const text = String(condition || "").trim();
  if (!text) return true;
  const existsMatch = text.match(/^(.+?)\s+exists$/i);
  if (existsMatch) {
    return getValuesByPath(record, stripResponsePrefix(existsMatch[1], responsePath)).some((value) => value !== undefined && value !== null && value !== "");
  }
  const inMatch = text.match(/^(.+?)\s+in\s+\[(.*)\]$/i);
  if (inMatch) {
    const values = getValuesByPath(record, stripResponsePrefix(inMatch[1], responsePath));
    const expected = inMatch[2]
      .split(",")
      .map((item) => normalizeComparable(item))
      .filter((item) => item !== "");
    return values.some((value) => expected.includes(normalizeComparable(value)));
  }
  const match = text.match(/^(.+?)\s*(==|!=|>=|<=|>|<|contains)\s*(.+)$/i);
  if (!match) return true;
  const [, field, operator, expected] = match;
  const values = getValuesByPath(record, stripResponsePrefix(field, responsePath));
  return values.some((value) => compareValues(value, operator.toLowerCase(), expected));
}

function matchesFilter(record, filterCondition = "", responsePath = "") {
  const condition = String(filterCondition || "").trim();
  if (!condition) return true;
  return condition
    .split(/\s+&&\s+/)
    .every((andPart) =>
      andPart
        .split(/\s+\|\|\s+/)
        .some((orPart) => evaluateSingleFilter(record, orPart, responsePath))
    );
}

function selectKeepFields(records = [], keepFields = [], responsePath = "") {
  if (!keepFields.length) return records;
  return records.map((record) => {
    if (!record || typeof record !== "object") return record;
    return keepFields.reduce((output, field) => {
      const localField = stripResponsePrefix(field, responsePath);
      const values = getValuesByPath(record, localField);
      output[field] = values.length > 1 ? values : values[0] ?? "";
      return output;
    }, {});
  });
}

function extractResponseRecords(responseBody, config = {}) {
  const responsePath = config.responsePath || "";
  const recordValue = getByPath(responseBody, responsePath);
  const records = Array.isArray(recordValue) ? recordValue : recordValue === undefined ? [] : [recordValue];
  const filteredRecords = config.keepMode === "filter"
    ? records.filter((record) => matchesFilter(record, config.filterCondition, responsePath))
    : records;
  const selectedRecords = config.fieldKeepMode === "selected"
    ? selectKeepFields(filteredRecords, config.keepFields, responsePath)
    : filteredRecords;
  return {
    recordValue,
    records,
    filteredRecords,
    selectedRecords,
    recordCount: records.length,
    filteredRecordCount: filteredRecords.length
  };
}

function normalizeSourceUrl(type = "") {
  const value = String(type || "").trim();
  const withoutMethod = value.replace(/^(GET|POST|PUT|DELETE|PATCH)\s+/i, "").trim();
  if (!/^https?:\/\//i.test(withoutMethod)) return "";
  return withoutMethod;
}

function appendQueryParams(url, queryParams = {}) {
  const parsed = new URL(url);
  Object.entries(queryParams || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => parsed.searchParams.append(key, String(item)));
    } else {
      parsed.searchParams.set(key, String(value));
    }
  });
  return parsed.toString();
}

async function fetchRealSource(config = {}) {
  const sourceUrl = normalizeSourceUrl(config.type);
  if (!sourceUrl || (config.kind || "api") !== "api") return null;
  const method = String(config.method || config.requestConfig?.method || "GET").toUpperCase();
  const queryParams = config.queryParams || config.requestConfig?.queryParams || {};
  const headers = { ...(config.headers || config.requestConfig?.headers || {}) };
  const body = config.body || config.requestConfig?.body || {};
  const authConfig = store.authConfigs.find((item) => item.id === config.authConfigId);
  if (authConfig?.cookieName && authConfig?.cookieValue) {
    headers.Cookie = `${authConfig.cookieName}=${authConfig.cookieValue}`;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const startedAt = Date.now();
  try {
    const response = await fetch(appendQueryParams(sourceUrl, queryParams), {
      method,
      headers,
      body: ["GET", "DELETE", "HEAD"].includes(method) ? undefined : JSON.stringify(body || {}),
      signal: controller.signal
    });
    const text = await response.text();
    let responseBody;
    try {
      responseBody = text ? JSON.parse(text) : {};
    } catch {
      responseBody = { text };
    }
    return {
      responseBody,
      status: response.status,
      durationMs: Date.now() - startedAt,
      sourceMode: "real",
      error: response.ok ? "" : `HTTP ${response.status}`
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function testDataSource(input = {}) {
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
  const fieldKeepMode = config.responseConfig?.fieldKeepMode || "all";
  const keepFields = Array.isArray(config.responseConfig?.keepFields) ? config.responseConfig.keepFields : [];
  const persistMode = config.responseConfig?.persistMode || "none";
  const targetTable = config.responseConfig?.targetTable || "";
  let sourceMode = "mock";
  let status = 200;
  let durationMs = 186;
  let error = "";
  let responseBody = config.responseBody || config.mockResponseBody;
  try {
    const realResult = await fetchRealSource(config);
    if (realResult) {
      responseBody = realResult.responseBody;
      status = realResult.status;
      durationMs = realResult.durationMs;
      sourceMode = realResult.sourceMode;
      error = realResult.error;
    }
  } catch (fetchError) {
    error = fetchError.message || "实际请求失败，已回退模拟响应";
  }
  if (!responseBody) {
    responseBody =
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
  }
  const extraction = extractResponseRecords(responseBody, {
    responsePath,
    keepMode,
    filterCondition,
    fieldKeepMode,
    keepFields
  });
  const recordFields = extraction.recordValue === undefined ? [] : flattenFields(extraction.filteredRecords, normalizeRecordPrefix(responsePath));

  return {
    ok: status >= 200 && status < 400,
    status,
    durationMs,
    sourceMode,
    error,
    testedAt: now,
    request: {
      kind,
      type: config.type || "",
      method: config.method || config.requestConfig?.method || "GET",
      responsePath,
      keepMode,
      filterCondition,
      fieldKeepMode,
      keepFields,
      persistMode,
      targetTable,
      parameterConfig: config.parameterConfig || {},
      queryParams: config.queryParams || config.requestConfig?.queryParams || {},
      headers: config.headers || config.requestConfig?.headers || {},
      body: config.body || config.requestConfig?.body || {},
      pagination: config.pagination || config.requestConfig?.pagination || ""
    },
    responseBody,
    fields: flattenFields(responseBody),
    recordFields,
    recordCount: extraction.recordCount,
    filteredRecordCount: extraction.filteredRecordCount,
    selectedRecords: extraction.selectedRecords.slice(0, 10)
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
