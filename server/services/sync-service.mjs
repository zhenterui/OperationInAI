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
      valueFilters: Array.isArray(input.responseConfig?.valueFilters) ? input.responseConfig.valueFilters : [],
      persistMode: input.responseConfig?.persistMode || "none",
      targetTable: input.responseConfig?.targetTable || ""
    },
    parameterConfig: {
      sourceType: input.parameterConfig?.sourceType || "static",
      sourceId: input.parameterConfig?.sourceId || "",
      sourceIds: Array.isArray(input.parameterConfig?.sourceIds) ? input.parameterConfig.sourceIds : [],
      selectedFields: Array.isArray(input.parameterConfig?.selectedFields) ? input.parameterConfig.selectedFields : [],
      filterCondition: input.parameterConfig?.filterCondition || "",
      query: input.parameterConfig?.query || "",
      mappings: Array.isArray(input.parameterConfig?.mappings) ? input.parameterConfig.mappings : [],
      placeholders: Array.isArray(input.parameterConfig?.placeholders) ? input.parameterConfig.placeholders : [],
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
  const dictInMatch = text.match(/^(.+?)\s+in\s+dict\((.+)\)$/i);
  if (dictInMatch) {
    const values = getValuesByPath(record, stripResponsePrefix(dictInMatch[1], responsePath));
    const dictionaryValues = getDictionaryValuesFromRef(dictInMatch[2]);
    return values.some((value) => matchesDictionaryValue(value, { dictionaryValues, dictionaryMatchMode: "field-in-dictionary" }));
  }
  const dictContainsMatch = text.match(/^(.+?)\s+contains\s+dict\((.+)\)$/i);
  if (dictContainsMatch) {
    const values = getValuesByPath(record, stripResponsePrefix(dictContainsMatch[1], responsePath));
    const dictionaryValues = getDictionaryValuesFromRef(dictContainsMatch[2]);
    return values.some((value) => matchesDictionaryValue(value, { dictionaryValues, dictionaryMatchMode: "dictionary-in-field" }));
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

function matchValueFilterValue(actual, filter) {
  const left = String(actual ?? "");
  const right = String(filter.value ?? "");
  if (!right) return true;
  if (filter.matchMode === "contains") return left.includes(right);
  if (filter.matchMode === "startsWith") return left.startsWith(right);
  if (filter.matchMode === "endsWith") return left.endsWith(right);
  if (filter.matchMode === "regex") {
    try {
      return new RegExp(right).test(left);
    } catch {
      return false;
    }
  }
  return left === right;
}

function splitDictionaryCell(value) {
  return String(value ?? "")
    .split(/[,，;；|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getDictionaryByIdOrName(idOrName = "") {
  const key = String(idOrName || "").trim();
  return store.dictionarySets.find((item) => item.id === key || item.name === key);
}

function getDictionaryValuesFromRef(ref = "") {
  const [target, scope] = String(ref).split(/\s+where\s+|\s*\|\s*/i);
  const [dictionaryName, column] = target.split(".");
  const dictionary = getDictionaryByIdOrName(dictionaryName);
  if (!dictionary || !column) return [];
  const [scopeColumn, scopeValue] = scope ? scope.split("=").map((item) => item?.trim()) : [];
  return (dictionary.rows || [])
    .filter((row) => {
      if (!scopeColumn || !scopeValue) return true;
      return String(row[scopeColumn] ?? "") === unquoteValue(scopeValue);
    })
    .flatMap((row) => splitDictionaryCell(row[column]));
}

function getDictionaryFilterValues(filter = {}) {
  if (Array.isArray(filter.dictionaryValues)) return filter.dictionaryValues;
  if (!filter.dictionaryId || !filter.dictionaryColumn) return [];
  const dictionary = store.dictionarySets.find((item) => item.id === filter.dictionaryId);
  if (!dictionary) return [];
  return (dictionary.rows || [])
    .filter((row) => {
      if (!filter.dictionaryScopeColumn || !filter.dictionaryScopeValue) return true;
      return String(row[filter.dictionaryScopeColumn] ?? "") === String(filter.dictionaryScopeValue);
    })
    .flatMap((row) =>
      splitDictionaryCell(row[filter.dictionaryColumn])
    );
}

function matchesDictionaryValue(actual, filter = {}) {
  const values = getDictionaryFilterValues(filter);
  if (!values.length) return false;
  if (filter.dictionaryMatchMode === "dictionary-in-field") {
    const text = String(actual ?? "");
    return values.some((value) => value && text.includes(String(value)));
  }
  return values.some((value) => matchValueFilterValue(actual, { ...filter, value }));
}

function hasValueFilterCriterion(filter = {}) {
  return Boolean(
    String(filter.value || "").trim() ||
    (filter.dictionaryId && filter.dictionaryColumn) ||
    Array.isArray(filter.dictionaryValues)
  );
}

function applyFilterValueRule(value, filter = {}, record = {}, responsePath = "") {
  if (!filter.preRuleId) return [value];
  const output = applyCleaningRule([value], { ruleId: filter.preRuleId, defaultValue: "" }, record, responsePath);
  return Array.isArray(output) ? output : [output];
}

function transformFilterCandidate(value, filter = {}, record = {}, responsePath = "") {
  const mode = filter.extractMode || filter.transformMode || "none";
  const values = applyFilterValueRule(value, filter, record, responsePath);
  return values.flatMap((item) => {
    const text = String(item ?? "");
    if (mode === "split") {
      const delimiter = filter.splitDelimiter || "|";
      const parts = text.split(delimiter).map((part) => part.trim());
      const index = Number(filter.splitIndex || filter.extractIndex || 0);
      if (Number.isFinite(index) && index > 0) return [parts[index - 1] ?? ""];
      return parts;
    }
    if (mode === "regex") {
      try {
        const match = text.match(new RegExp(filter.extractRegex || filter.regex || ""));
        return match ? [match[1] || match[0]] : [];
      } catch {
        return [];
      }
    }
    return [item];
  }).filter((item) => item !== undefined && item !== null && item !== "");
}

function getDictionaryMatchDetails(original, candidates = [], filter = {}) {
  const dictionaryValues = getDictionaryFilterValues(filter);
  if (!dictionaryValues.length) return [];
  return candidates.flatMap((candidate) => {
    const candidateText = String(candidate ?? "");
    if (filter.dictionaryMatchMode === "dictionary-in-field") {
      return dictionaryValues
        .filter((value) => value && candidateText.includes(String(value)))
        .map((value) => ({ original, candidate, matched: value }));
    }
    return dictionaryValues
      .filter((value) => matchValueFilterValue(candidate, { ...filter, value }))
      .map(() => ({ original, candidate, matched: candidate }));
  });
}

function getValueFilterMatchDetails(record, filter = {}, responsePath = "") {
  const values = getValuesByPath(record, stripResponsePrefix(filter.field, responsePath));
  return values.flatMap((original) => {
    const candidates = transformFilterCandidate(original, filter, record, responsePath);
    if (filter.dictionaryId || Array.isArray(filter.dictionaryValues)) {
      return getDictionaryMatchDetails(original, candidates, filter);
    }
    return candidates
      .filter((candidate) => matchValueFilterValue(candidate, filter))
      .map((candidate) => ({ original, candidate, matched: candidate }));
  });
}

function matchesValueFilters(record, valueFilters = [], responsePath = "") {
  const enabledFilters = valueFilters.filter((filter) =>
    filter?.enabled !== false &&
    filter?.field &&
    hasValueFilterCriterion(filter)
  );
  if (!enabledFilters.length) return true;
  return enabledFilters.every((filter) => getValueFilterMatchDetails(record, filter, responsePath).length > 0);
}

function getValueFilterOutputValues(record, filter = {}, responsePath = "") {
  const details = getValueFilterMatchDetails(record, filter, responsePath);
  const outputMode = filter.outputMode || "original";
  if (outputMode === "matched-fragment") return details.map((item) => item.matched);
  if (outputMode === "filter-value") return details.map((item) => item.candidate);
  return details.map((item) => item.original);
}

function composeFilterOutputValues(values = [], filter = {}) {
  const items = filter.uniqueOutput === false
    ? values.map((value) => String(value ?? "")).filter(Boolean)
    : uniqueValues(values);
  if (filter.aggregateOutput) return items.join(filter.aggregateSeparator ?? ",");
  return items.length > 1 ? items : items[0] ?? "";
}

function selectValueFilteredFields(records = [], keepFields = [], valueFilters = [], responsePath = "") {
  const activeFilters = valueFilters.filter((filter) =>
    filter?.enabled !== false &&
    filter?.field &&
    hasValueFilterCriterion(filter)
  );
  const filterByField = new Map(activeFilters.map((filter) => [normalizePathPrefix(filter.field), filter]));
  if (activeFilters.some((filter) => filter.aggregateOutput)) {
    const fields = keepFields.length ? keepFields : activeFilters.map((filter) => filter.field);
    return [
      fields.reduce((output, field) => {
        const filter = filterByField.get(normalizePathPrefix(field));
        if (filter) {
          const values = records.flatMap((record) => getValueFilterOutputValues(record, filter, responsePath));
          output[field] = composeFilterOutputValues(values, filter);
          return output;
        }
        const values = records.flatMap((record) => getValuesByPath(record, stripResponsePrefix(field, responsePath)));
        output[field] = values.length > 1 ? uniqueValues(values) : values[0] ?? "";
        return output;
      }, {})
    ];
  }
  return records.map((record) => {
    const output = keepFields.length ? selectKeepFields([record], keepFields, responsePath)[0] : { ...record };
    activeFilters.forEach((filter) => {
      if (keepFields.length && !keepFields.includes(filter.field)) return;
      output[filter.field] = composeFilterOutputValues(getValueFilterOutputValues(record, filter, responsePath), filter);
    });
    return output;
  });
}

function extractResponseRecords(responseBody, config = {}) {
  const responsePath = config.responsePath || "";
  const recordValue = getByPath(responseBody, responsePath);
  const records = Array.isArray(recordValue) ? recordValue : recordValue === undefined ? [] : [recordValue];
  const conditionFilteredRecords = config.keepMode === "filter"
    ? records.filter((record) => matchesFilter(record, config.filterCondition, responsePath))
    : records;
  const filteredRecords = config.fieldKeepMode === "value-filter"
    ? conditionFilteredRecords.filter((record) => matchesValueFilters(record, config.valueFilters, responsePath))
    : conditionFilteredRecords;
  const selectedRecords = config.fieldKeepMode === "value-filter"
    ? selectValueFilteredFields(filteredRecords, config.keepFields, config.valueFilters, responsePath)
    : config.fieldKeepMode === "selected"
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

function uniqueValues(values = []) {
  return [...new Set(values.map((value) => String(value ?? "")).filter(Boolean))];
}

function composeDictionaryPlaceholder(values = [], config = {}) {
  const items = config.unique === false ? values.map((value) => String(value ?? "")).filter(Boolean) : uniqueValues(values);
  const mode = config.mode || "join";
  if (mode === "array") return items;
  if (mode === "first") return items[0] || "";
  if (mode === "newline") return items.join("\n");
  if (mode === "template") {
    const template = config.template || "{{value}}";
    const rendered = items.map((value, index) =>
      template
        .replace(/\{\{\s*value\s*\}\}/g, value)
        .replace(/\{\{\s*index\s*\}\}/g, String(index))
        .replace(/\{\{\s*index1\s*\}\}/g, String(index + 1))
    );
    return config.asArray ? rendered : rendered.join(config.separator ?? ",");
  }
  return items.join(config.separator ?? ",");
}

function buildPlaceholderValues(parameterConfig = {}) {
  return (parameterConfig.placeholders || []).reduce((output, item) => {
    if (!item?.name) return output;
    if (item.source === "custom") {
      output[item.name] = item.value ?? "";
    } else if (item.source === "dictionary") {
      output[item.name] = composeDictionaryPlaceholder(getDictionaryValuesFromRef(item.from || item.ref || ""), item);
    } else {
      output[item.name] = `{{${item.from || item.name}}}`;
    }
    return output;
  }, {});
}

function applyPlaceholders(value, placeholderValues = {}) {
  if (typeof value === "string") {
    const exactMatch = value.match(/^\{\{\s*([\w.-]+)\s*\}\}$/);
    if (exactMatch && Object.prototype.hasOwnProperty.call(placeholderValues, exactMatch[1])) {
      return placeholderValues[exactMatch[1]];
    }
    return value.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(placeholderValues, key) ? String(placeholderValues[key]) : match
    );
  }
  if (Array.isArray(value)) return value.map((item) => applyPlaceholders(item, placeholderValues));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, applyPlaceholders(child, placeholderValues)]));
  }
  return value;
}

function renderTemplate(template = "", record = {}, responsePath = "") {
  return String(template || "").replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, field) => {
    const values = getValuesByPath(record, stripResponsePrefix(field.trim(), responsePath));
    return values.length > 1 ? [...new Set(values.map((item) => String(item)))].join(",") : values[0] ?? "";
  });
}

function parseEnumMap(param = "") {
  return String(param || "")
    .split(/[,，;]/)
    .map((item) => item.split("="))
    .filter(([key]) => key !== undefined && key !== "")
    .reduce((output, [key, value]) => {
      output[unquoteValue(key)] = unquoteValue(value ?? "");
      return output;
    }, {});
}

function normalizeMappedValues(values = []) {
  const normalizedValues = values.flat().filter((value) => value !== undefined && value !== null && value !== "");
  return normalizedValues;
}

function finalizeRuleOutput(values = [], defaultValue = "") {
  if (!values.length) return defaultValue ?? "";
  return values.length > 1 ? values : values[0];
}

function applyCleaningRule(values = [], mapping = {}, record = {}, responsePath = "") {
  const normalizedValues = normalizeMappedValues(values);
  const rule = store.cleaningRules.find((item) => item.id === mapping.ruleId);
  const action = rule?.config?.action || "";
  const param = rule?.config?.param || mapping.ruleParam || "";
  if (!rule || !action) return finalizeRuleOutput(normalizedValues, mapping.defaultValue);
  if (action === "combine") {
    return renderTemplate(param || mapping.sourceField || "", record, responsePath) || mapping.defaultValue || "";
  }
  if (!normalizedValues.length) return action === "default" ? param || mapping.defaultValue || "" : mapping.defaultValue ?? "";
  if (action === "dedupe") {
    return [...new Set(normalizedValues.map((value) => String(value)))].join(param || ",");
  }
  if (action === "merge") {
    return normalizedValues.map((value) => String(value)).join(param || ",");
  }
  if (action === "extract") {
    try {
      const match = String(normalizedValues[0]).match(new RegExp(param));
      return match ? match[1] || match[0] : mapping.defaultValue ?? "";
    } catch {
      return mapping.defaultValue ?? "";
    }
  }
  const enumMap = action === "enum" ? parseEnumMap(param) : {};
  const cleaned = normalizedValues.map((value) => {
    const text = String(value ?? "");
    if (action === "trim") return text.trim();
    if (action === "lower") return text.toLowerCase();
    if (action === "upper") return text.toUpperCase();
    if (action === "enum") return enumMap[text] ?? value;
    if (action === "default") return text ? value : param || mapping.defaultValue || "";
    if (action === "number") {
      const numeric = Number(value);
      if (Number.isNaN(numeric)) return mapping.defaultValue ?? "";
      return param === "seconds_to_minutes" ? Math.round(numeric / 60) : numeric;
    }
    if (action === "date") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toISOString();
    }
    return value;
  });
  return finalizeRuleOutput(cleaned, mapping.defaultValue);
}

function applyFieldMappings(records = [], mappings = [], responsePath = "") {
  if (!mappings.length) return [];
  return records.map((record) =>
    mappings.reduce((output, mapping) => {
      const localField = stripResponsePrefix(mapping.sourceField, responsePath);
      const values = getValuesByPath(record, localField);
      output[mapping.targetField] = applyCleaningRule(values, mapping, record, responsePath);
      return output;
    }, {})
  );
}

async function fetchRealSource(config = {}) {
  const sourceUrl = normalizeSourceUrl(config.type);
  if (!sourceUrl || (config.kind || "api") !== "api") return null;
  const method = String(config.method || config.requestConfig?.method || "GET").toUpperCase();
  const placeholderValues = buildPlaceholderValues(config.parameterConfig || {});
  const queryParams = applyPlaceholders(config.queryParams || config.requestConfig?.queryParams || {}, placeholderValues);
  const headers = { ...applyPlaceholders(config.headers || config.requestConfig?.headers || {}, placeholderValues) };
  const body = applyPlaceholders(config.body || config.requestConfig?.body || {}, placeholderValues);
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
  const valueFilters = Array.isArray(config.responseConfig?.valueFilters) ? config.responseConfig.valueFilters : [];
  const persistMode = config.responseConfig?.persistMode || "none";
  const targetTable = config.responseConfig?.targetTable || "";
  const placeholderValues = buildPlaceholderValues(config.parameterConfig || {});
  const resolvedQueryParams = applyPlaceholders(config.queryParams || config.requestConfig?.queryParams || {}, placeholderValues);
  const resolvedHeaders = applyPlaceholders(config.headers || config.requestConfig?.headers || {}, placeholderValues);
  const resolvedBody = applyPlaceholders(config.body || config.requestConfig?.body || {}, placeholderValues);
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
    keepFields,
    valueFilters
  });
  const recordFields = extraction.recordValue === undefined ? [] : flattenFields(extraction.filteredRecords, normalizeRecordPrefix(responsePath));
  const sourceMappings = (store.fieldMappings || []).filter((mapping) => mapping.sourceId === (config.id || config.sourceId));
  const mappedRecords = applyFieldMappings(extraction.filteredRecords, sourceMappings, responsePath);

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
      valueFilters,
      persistMode,
      targetTable,
      parameterConfig: config.parameterConfig || {},
      placeholderValues,
      queryParams: resolvedQueryParams,
      headers: resolvedHeaders,
      body: resolvedBody,
      pagination: config.pagination || config.requestConfig?.pagination || ""
    },
    responseBody,
    fields: flattenFields(responseBody),
    recordFields,
    recordCount: extraction.recordCount,
    filteredRecordCount: extraction.filteredRecordCount,
    selectedRecords: extraction.selectedRecords.slice(0, 10),
    mappedRecords: mappedRecords.slice(0, 10)
  };
}

export async function runSync(payload = {}) {
  const sourceId = payload.sourceId || store.dataSources[0]?.id;
  const source = store.dataSources.find((item) => item.id === sourceId) || store.dataSources[0];
  const startedAt = new Date().toISOString();
  const result = await testDataSource({ sourceId, ...payload });
  const fetchedRows = Number(result.recordCount ?? result.filteredRecordCount ?? 0);
  const cleanedRows = Number(result.filteredRecordCount ?? fetchedRows);
  const failedRows = result.ok ? 0 : Math.max(1, fetchedRows - cleanedRows);
  const sourceModeText = result.sourceMode === "real" ? "实际请求" : "模拟响应";
  const log = {
    id: `sync_${Date.now()}`,
    sourceId: source?.id,
    sourceName: source?.name || "未知数据源",
    status: result.ok ? "success" : "warning",
    fetchedRows,
    cleanedRows,
    failedRows,
    durationMs: result.durationMs,
    startedAt,
    message: `已按当前数据源完成${sourceModeText}、响应解析、字段保留/过滤和映射预处理`
  };
  store.syncLogs.unshift(log);
  store.metrics[1] = { ...store.metrics[1], value: result.ok ? "99.4%" : "需关注", delta: `${source?.name || "数据源"} 刚刚同步` };
  return log;
}

export function listSyncLogs() {
  return store.syncLogs;
}
