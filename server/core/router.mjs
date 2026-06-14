import { getBootstrapData, store } from "../data/store.mjs";
import { runAnalysis, listAnalysisResults } from "../services/analysis-service.mjs";
import {
  createAuthConfig,
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
import { createDataSource, deleteDataSource, listSyncLogs, runSync, testDataSource, updateDataSource } from "../services/sync-service.mjs";
import { readJson, sendError, sendJson } from "./http.mjs";

const routes = new Map();

function route(method, path, handler) {
  routes.set(`${method} ${path}`, handler);
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
route("GET", "/api/auth-configs", () => store.authConfigs);
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

export async function handleApi(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return true;
  }

  const parsed = new URL(request.url || "/", "http://127.0.0.1");
  if (!parsed.pathname.startsWith("/api/")) {
    return false;
  }

  const dataSourceMatch = parsed.pathname.match(/^\/api\/data-sources\/([^/]+)$/);
  if (dataSourceMatch && request.method === "PUT") {
    try {
      sendJson(response, 200, { data: updateDataSource(dataSourceMatch[1], await readJson(request)) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  if (dataSourceMatch && request.method === "DELETE") {
    try {
      sendJson(response, 200, { data: deleteDataSource(dataSourceMatch[1]) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  const authConfigMatch = parsed.pathname.match(/^\/api\/auth-configs\/([^/]+)$/);
  if (authConfigMatch && request.method === "PUT") {
    try {
      sendJson(response, 200, { data: updateAuthConfig(authConfigMatch[1], await readJson(request)) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  if (authConfigMatch && request.method === "DELETE") {
    try {
      sendJson(response, 200, { data: deleteAuthConfig(authConfigMatch[1]) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  const cleaningRuleMatch = parsed.pathname.match(/^\/api\/cleaning-rules\/([^/]+)$/);
  if (cleaningRuleMatch && request.method === "PUT") {
    try {
      sendJson(response, 200, { data: updateCleaningRule(cleaningRuleMatch[1], await readJson(request)) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  if (cleaningRuleMatch && request.method === "DELETE") {
    try {
      sendJson(response, 200, { data: deleteCleaningRule(cleaningRuleMatch[1]) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  const fieldMappingMatch = parsed.pathname.match(/^\/api\/field-mappings\/([^/]+)$/);
  if (fieldMappingMatch && request.method === "PUT") {
    try {
      sendJson(response, 200, { data: updateFieldMapping(fieldMappingMatch[1], await readJson(request)) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  if (fieldMappingMatch && request.method === "DELETE") {
    try {
      sendJson(response, 200, { data: deleteFieldMapping(fieldMappingMatch[1]) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  const dictionarySetMatch = parsed.pathname.match(/^\/api\/dictionary-sets\/([^/]+)$/);
  if (dictionarySetMatch && request.method === "PUT") {
    try {
      sendJson(response, 200, { data: updateDictionarySet(dictionarySetMatch[1], await readJson(request)) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  if (dictionarySetMatch && request.method === "DELETE") {
    try {
      sendJson(response, 200, { data: deleteDictionarySet(dictionarySetMatch[1]) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  const modelConfigMatch = parsed.pathname.match(/^\/api\/model-configs\/([^/]+)$/);
  if (modelConfigMatch && request.method === "PUT") {
    try {
      sendJson(response, 200, { data: updateModelConfig(modelConfigMatch[1], await readJson(request)) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  if (modelConfigMatch && request.method === "DELETE") {
    try {
      sendJson(response, 200, { data: deleteModelConfig(modelConfigMatch[1]) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  const storageConfigMatch = parsed.pathname.match(/^\/api\/storage-configs\/([^/]+)$/);
  if (storageConfigMatch && request.method === "PUT") {
    try {
      sendJson(response, 200, { data: updateStorageConfig(storageConfigMatch[1], await readJson(request)) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  if (storageConfigMatch && request.method === "DELETE") {
    try {
      sendJson(response, 200, { data: deleteStorageConfig(storageConfigMatch[1]) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  const situationFilterMatch = parsed.pathname.match(/^\/api\/situation-filters\/([^/]+)$/);
  if (situationFilterMatch && request.method === "PUT") {
    try {
      sendJson(response, 200, { data: updateSituationFilter(situationFilterMatch[1], await readJson(request)) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  if (situationFilterMatch && request.method === "DELETE") {
    try {
      sendJson(response, 200, { data: deleteSituationFilter(situationFilterMatch[1]) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  const businessFlowMatch = parsed.pathname.match(/^\/api\/business-flows\/([^/]+)$/);
  if (businessFlowMatch && request.method === "PUT") {
    try {
      sendJson(response, 200, { data: updateBusinessFlow(businessFlowMatch[1], await readJson(request)) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
    }
    return true;
  }
  if (businessFlowMatch && request.method === "DELETE") {
    try {
      sendJson(response, 200, { data: deleteBusinessFlow(businessFlowMatch[1]) });
    } catch (error) {
      sendError(response, error.status || 500, "API request failed", error.message);
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
      sendJson(response, 200, { data: payload });
    }
  } catch (error) {
    sendError(response, 500, "API request failed", error.message);
  }
  return true;
}
