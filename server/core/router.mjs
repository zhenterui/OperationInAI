import { getBootstrapData, persistStore, store } from "../data/store.mjs";
import { runAnalysis, listAnalysisResults } from "../services/analysis-service.mjs";
import { listAuditLogs, recordAuditLog } from "../services/audit-service.mjs";
import {
  createAuthConfig,
  refreshAuthConfig,
  createBusinessFlow,
  createCleaningRule,
  createDictionarySet,
  createFieldMapping,
  createKnowledgeSource,
  createModelConfig,
  createStorageConfig,
  createSituationFilter,
  deleteAuthConfig,
  deleteBusinessFlow,
  deleteCleaningRule,
  deleteDictionarySet,
  deleteFieldMapping,
  deleteModelConfig,
  deleteStorageConfig,
  deleteSituationFilter,
  queryBusiness,
  updateBusinessFieldSchema,
  runBusinessFlow,
  switchStorageConfig,
  updateAuthConfig,
  updateBusinessFlow,
  updateCleaningRule,
  updateDictionarySet,
  updateFieldMapping,
  updateModelConfig,
  updateStorageConfig,
  updateSituationFilter,
  updateSituationTimeFilter
} from "../services/config-service.mjs";
import { answerQuestion } from "../services/search-service.mjs";
import {
  createSchedule,
  deleteSchedule,
  getSchedulerStatus,
  listSchedules,
  runScheduleNow,
  startScheduler,
  updateSchedule
} from "../services/scheduler-service.mjs";
import { dropBusinessTable, listBusinessTables, queryBusinessTable } from "../services/business-data-service.mjs";
import { createDataSource, deleteDataSource, listSyncLogs, runSync, testDataSource, updateDataSource } from "../services/sync-service.mjs";
import { readJson, sendError, sendJson } from "./http.mjs";
import { assertAuthorized, requiredRoleForRequest } from "./security.mjs";

const routes = new Map();

function route(method, path, handler) {
  routes.set(`${method} ${path}`, handler);
}

function persistAfterMutation(request) {
  if (["POST", "PUT", "DELETE"].includes(request.method || "")) {
    persistStore();
  }
}

function errorDetail(error) {
  return error.status && error.status < 500 ? error.message : "Internal server error";
}

function sendData(response, request, data) {
  if (["POST", "PUT", "DELETE"].includes(request.method || "")) {
    recordAuditLog({
      user: request.identity?.user,
      role: request.identity?.role,
      method: request.method,
      path: request.auditPath || "",
      status: "success"
    });
  }
  persistAfterMutation(request);
  sendJson(response, 200, { data });
}

function sendRouteError(response, request, error, title = "API request failed") {
  if (["POST", "PUT", "DELETE"].includes(request.method || "")) {
    recordAuditLog({
      user: request.identity?.user,
      role: request.identity?.role,
      method: request.method,
      path: request.auditPath || "",
      status: "failed",
      detail: errorDetail(error)
    });
    persistStore();
  }
  sendError(response, error.status || 500, title, errorDetail(error));
}

function redactAuthConfig(item = {}) {
  return {
    ...item,
    password: item.password ? "******" : "",
    cookieValue: "",
    tokenHeader: item.tokenHeader ? "******" : ""
  };
}

route("GET", "/api/health", () => ({
  status: "ok",
  service: "OperationInAI backend",
  time: new Date().toISOString()
}));

route("GET", "/api/bootstrap", () => getBootstrapData());
route("GET", "/api/data-sources", () => store.dataSources);
route("POST", "/api/data-sources", async ({ request }) => createDataSource(await readJson(request)));
route("POST", "/api/data-sources/test", async ({ request }) => testDataSource(await readJson(request)));
route("GET", "/api/auth-configs", () => store.authConfigs.map(redactAuthConfig));
route("POST", "/api/auth-configs", async ({ request }) => createAuthConfig(await readJson(request)));
route("GET", "/api/field-mappings", () => store.fieldMappings);
route("POST", "/api/field-mappings", async ({ request }) => createFieldMapping(await readJson(request)));
route("GET", "/api/cleaning-rules", () => store.cleaningRules);
route("POST", "/api/cleaning-rules", async ({ request }) => createCleaningRule(await readJson(request)));
route("GET", "/api/dictionary-sets", () => store.dictionarySets);
route("POST", "/api/dictionary-sets", async ({ request }) => createDictionarySet(await readJson(request)));
route("GET", "/api/model-configs", () => store.modelConfigs.map((item) => ({ ...item, apiKey: "" })));
route("POST", "/api/model-configs", async ({ request }) => createModelConfig(await readJson(request)));
route("GET", "/api/storage-configs", () => store.storageConfigs.map((item) => ({ ...item, password: "" })));
route("POST", "/api/storage-configs", async ({ request }) => createStorageConfig(await readJson(request)));
route("POST", "/api/storage-configs/switch", async ({ request }) => switchStorageConfig(await readJson(request)));
route("GET", "/api/situation-filters", () => store.situationFilters);
route("POST", "/api/situation-filters", async ({ request }) => createSituationFilter(await readJson(request)));
route("PUT", "/api/situation-time-filter", async ({ request }) => updateSituationTimeFilter(await readJson(request)));
route("GET", "/api/businesses", () => store.businesses);
route("POST", "/api/businesses/query", async ({ request }) => queryBusiness(await readJson(request)));
route("PUT", "/api/businesses/field-schema", async ({ request }) => {
  const body = await readJson(request);
  return updateBusinessFieldSchema(body.id || body.businessId, body.fieldSchema);
});
route("GET", "/api/business-flows", () => store.businessFlows);
route("POST", "/api/business-flows", async ({ request }) => createBusinessFlow(await readJson(request)));
route("POST", "/api/business-flows/run", async ({ request }) => runBusinessFlow(await readJson(request)));
route("GET", "/api/knowledge-sources", () => store.knowledge);
route("POST", "/api/knowledge-sources", async ({ request }) => createKnowledgeSource(await readJson(request)));
route("GET", "/api/sync-logs", () => listSyncLogs());
route("POST", "/api/sync-jobs/run", async ({ request }) => runSync(await readJson(request)));
route("GET", "/api/analysis/results", () => listAnalysisResults());
route("POST", "/api/analysis/run", async ({ request }) => runAnalysis(await readJson(request)));
route("POST", "/api/search/query", async ({ request }) => answerQuestion(await readJson(request)));
route("GET", "/api/audit-logs", () => listAuditLogs());
route("GET", "/api/schedules", () => listSchedules());
route("POST", "/api/schedules", async ({ request }) => createSchedule(await readJson(request)));
route("POST", "/api/schedules/run", async ({ request }) => runScheduleNow((await readJson(request)).id));
route("POST", "/api/auth-configs/refresh", async ({ request }) => refreshAuthConfig((await readJson(request)).id));
route("GET", "/api/scheduler/status", () => getSchedulerStatus());
route("GET", "/api/business-tables", () => listBusinessTables());
route("POST", "/api/business-tables/query", async ({ request }) => queryBusinessTable(await readJson(request)));
route("DELETE", "/api/business-tables", async ({ request }) => {
  const body = await readJson(request);
  return dropBusinessTable(body.table || body.name);
});

// 服务启动即恢复调度循环(对齐老系统 run_loop 常驻)
startScheduler();

export async function handleApi(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return true;
  }

  const parsed = new URL(request.url || "/", "http://127.0.0.1");
  if (!parsed.pathname.startsWith("/api/")) {
    return false;
  }
  try {
    request.identity = assertAuthorized(request, requiredRoleForRequest(request, parsed.pathname));
    request.auditPath = parsed.pathname;
  } catch (error) {
    recordAuditLog({
      user: "anonymous",
      role: "none",
      method: request.method,
      path: parsed.pathname,
      status: error.status === 403 ? "forbidden" : "unauthorized",
      detail: error.message
    });
    persistStore();
    sendError(response, error.status || 401, error.status === 403 ? "Forbidden" : "Unauthorized", error.message);
    return true;
  }

  const dataSourceMatch = parsed.pathname.match(/^\/api\/data-sources\/([^/]+)$/);
  if (dataSourceMatch && request.method === "PUT") {
    try {
      sendData(response, request, updateDataSource(dataSourceMatch[1], await readJson(request)));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  if (dataSourceMatch && request.method === "DELETE") {
    try {
      sendData(response, request, deleteDataSource(dataSourceMatch[1]));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  const authConfigMatch = parsed.pathname.match(/^\/api\/auth-configs\/([^/]+)$/);
  if (authConfigMatch && request.method === "PUT") {
    try {
      sendData(response, request, updateAuthConfig(authConfigMatch[1], await readJson(request)));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  if (authConfigMatch && request.method === "DELETE") {
    try {
      sendData(response, request, deleteAuthConfig(authConfigMatch[1]));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  const cleaningRuleMatch = parsed.pathname.match(/^\/api\/cleaning-rules\/([^/]+)$/);
  if (cleaningRuleMatch && request.method === "PUT") {
    try {
      sendData(response, request, updateCleaningRule(cleaningRuleMatch[1], await readJson(request)));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  if (cleaningRuleMatch && request.method === "DELETE") {
    try {
      sendData(response, request, deleteCleaningRule(cleaningRuleMatch[1]));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  const fieldMappingMatch = parsed.pathname.match(/^\/api\/field-mappings\/([^/]+)$/);
  if (fieldMappingMatch && request.method === "PUT") {
    try {
      sendData(response, request, updateFieldMapping(fieldMappingMatch[1], await readJson(request)));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  if (fieldMappingMatch && request.method === "DELETE") {
    try {
      sendData(response, request, deleteFieldMapping(fieldMappingMatch[1]));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  const dictionarySetMatch = parsed.pathname.match(/^\/api\/dictionary-sets\/([^/]+)$/);
  if (dictionarySetMatch && request.method === "PUT") {
    try {
      sendData(response, request, updateDictionarySet(dictionarySetMatch[1], await readJson(request)));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  if (dictionarySetMatch && request.method === "DELETE") {
    try {
      sendData(response, request, deleteDictionarySet(dictionarySetMatch[1]));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  const modelConfigMatch = parsed.pathname.match(/^\/api\/model-configs\/([^/]+)$/);
  if (modelConfigMatch && request.method === "PUT") {
    try {
      sendData(response, request, updateModelConfig(modelConfigMatch[1], await readJson(request)));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  if (modelConfigMatch && request.method === "DELETE") {
    try {
      sendData(response, request, deleteModelConfig(modelConfigMatch[1]));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  const storageConfigMatch = parsed.pathname.match(/^\/api\/storage-configs\/([^/]+)$/);
  if (storageConfigMatch && request.method === "PUT") {
    try {
      sendData(response, request, updateStorageConfig(storageConfigMatch[1], await readJson(request)));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  if (storageConfigMatch && request.method === "DELETE") {
    try {
      sendData(response, request, deleteStorageConfig(storageConfigMatch[1]));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  const situationFilterMatch = parsed.pathname.match(/^\/api\/situation-filters\/([^/]+)$/);
  if (situationFilterMatch && request.method === "PUT") {
    try {
      sendData(response, request, updateSituationFilter(situationFilterMatch[1], await readJson(request)));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  if (situationFilterMatch && request.method === "DELETE") {
    try {
      sendData(response, request, deleteSituationFilter(situationFilterMatch[1]));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  const businessFlowMatch = parsed.pathname.match(/^\/api\/business-flows\/([^/]+)$/);
  if (businessFlowMatch && request.method === "PUT") {
    try {
      sendData(response, request, updateBusinessFlow(businessFlowMatch[1], await readJson(request)));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  if (businessFlowMatch && request.method === "DELETE") {
    try {
      sendData(response, request, deleteBusinessFlow(businessFlowMatch[1]));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }

  const scheduleMatch = parsed.pathname.match(/^\/api\/schedules\/([^/]+)$/);
  if (scheduleMatch && request.method === "PUT") {
    try {
      sendData(response, request, updateSchedule(scheduleMatch[1], await readJson(request)));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }
  if (scheduleMatch && request.method === "DELETE") {
    try {
      sendData(response, request, deleteSchedule(scheduleMatch[1]));
    } catch (error) {
      sendRouteError(response, request, error);
    }
    return true;
  }

  const handler = routes.get(`${request.method} ${parsed.pathname}`);
  if (!handler) {
    sendError(response, 404, "API route not found", `${request.method} ${parsed.pathname}`);
    return true;
  }

  try {
    const payload = await handler({ request, response, url: parsed });
    if (!response.writableEnded) {
      sendData(response, request, payload);
    }
  } catch (error) {
    sendRouteError(response, request, error);
  }
  return true;
}

