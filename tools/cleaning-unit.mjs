import assert from "node:assert/strict";
import { createDataSource, deleteDataSource, testDataSource } from "../server/services/sync-service.mjs";
import {
  createCleaningRule,
  createDictionarySet,
  createFieldMapping,
  deleteCleaningRule,
  deleteDictionarySet,
  deleteFieldMapping
} from "../server/services/config-service.mjs";

const cleanup = [];

function track(kind, value) {
  cleanup.push({ kind, value });
  return value;
}

async function cleanupCreated() {
  for (const item of cleanup.reverse()) {
    try {
      if (item.kind === "mapping") deleteFieldMapping(item.value.id);
      if (item.kind === "rule") deleteCleaningRule(item.value.id);
      if (item.kind === "source") deleteDataSource(item.value.id);
      if (item.kind === "dictionary") deleteDictionarySet(item.value.id);
    } catch {
      // Best-effort cleanup keeps this script safe to re-run after assertion failures.
    }
  }
}

try {
  const htmlRule = track("rule", createCleaningRule({
    name: "Unit strip html",
    type: "normalize",
    config: {
      action: "strip_html",
      param: "remove_script=true; remove_style=true; decode_entities=true; collapse_whitespace=true"
    }
  }));
  const splitRule = track("rule", createCleaningRule({
    name: "Unit split dedupe join",
    type: "normalize",
    config: {
      action: "split_dedupe_join",
      param: "separator=,; joinSeparator=,; dedupe=true; sort=true"
    }
  }));
  const enumRule = track("rule", createCleaningRule({
    name: "Unit enum case insensitive",
    type: "normalize",
    config: {
      action: "enum",
      param: "caseInsensitive=true; roma=ROMAConnect"
    }
  }));
  const replaceRule = track("rule", createCleaningRule({
    name: "Unit replace all",
    type: "normalize",
    config: {
      action: "replace_all",
      param: "pattern=\\d; replacement=#; flags=g"
    }
  }));
  const source = track("source", createDataSource({
    name: "Unit generic cleanup source",
    kind: "api",
    responsePath: "data.items[]",
    responseBody: {
      data: {
        items: [
          {
            html: "<style>.red{}</style><p>ROMA<strong>耗尽</strong>&nbsp;告警</p><script>x()</script>",
            owners: "王五,张三,王五",
            product: "roma",
            code: "A1B2"
          }
        ]
      }
    }
  }));
  track("mapping", createFieldMapping({ sourceId: source.id, sourceField: "data.items[].html", targetField: "clean_html", type: "字符串", ruleId: htmlRule.id }));
  track("mapping", createFieldMapping({ sourceId: source.id, sourceField: "data.items[].owners", targetField: "clean_owners", type: "字符串", ruleId: splitRule.id }));
  track("mapping", createFieldMapping({ sourceId: source.id, sourceField: "data.items[].product", targetField: "clean_product", type: "字符串", ruleId: enumRule.id }));
  track("mapping", createFieldMapping({ sourceId: source.id, sourceField: "data.items[].code", targetField: "clean_code", type: "字符串", ruleId: replaceRule.id }));

  const cleanupResult = await testDataSource({ sourceId: source.id, ...source });
  assert.equal(cleanupResult.mappedRecords[0].clean_html, "ROMA耗尽 告警");
  assert.equal(cleanupResult.mappedRecords[0].clean_owners, "张三,王五");
  assert.equal(cleanupResult.mappedRecords[0].clean_product, "ROMAConnect");
  assert.equal(cleanupResult.mappedRecords[0].clean_code, "A#B#");

  const dictionary = track("dictionary", createDictionarySet({
    name: "Unit product dictionary",
    category: "unit",
    columns: ["Dept", "Alias"],
    rows: [{ Dept: "A", Alias: "pay-gateway,payment-api" }]
  }));
  const dictionaryResult = await testDataSource({
    name: "Unit dictionary value filter",
    kind: "api",
    responsePath: "data.items[]",
    responseBody: {
      data: {
        items: [{ name: "pay-gateway" }, { name: "unknown" }]
      }
    },
    responseConfig: {
      fieldKeepMode: "value-filter",
      keepFields: ["data.items[].name"],
      valueFilters: [
        {
          field: "data.items[].name",
          dictionaryRef: `${dictionary.name}.Alias where Dept=A`,
          dictionaryMatchMode: "field-in-dictionary",
          enabled: true
        }
      ]
    }
  });
  assert.equal(dictionaryResult.filteredRecordCount, 1);
  assert.equal(dictionaryResult.selectedRecords[0]["data.items[].name"], "pay-gateway");

  const contextPlaceholderResult = await testDataSource({
    name: "Unit context placeholder",
    kind: "api",
    type: "POST /unit/context",
    responsePath: "data.items[]",
    responseBody: { data: { items: [] } },
    requestConfig: {
      method: "POST",
      queryParams: { startTime: "{{start_time}}" },
      headers: {},
      body: { env: "{{env}}" }
    },
    parameterConfig: {
      context: { start_time: "2026-06-23T00:00:00.000Z", env: "prod" },
      placeholders: [
        { name: "start_time", source: "mapping", from: "context.start_time" },
        { name: "env", source: "mapping", from: "context.env" }
      ]
    }
  });
  assert.equal(contextPlaceholderResult.request.queryParams.startTime, "2026-06-23T00:00:00.000Z");
  assert.equal(contextPlaceholderResult.request.body.env, "prod");

  console.log(JSON.stringify({
    status: "ok",
    genericCleanup: cleanupResult.mappedRecords[0],
    dictionaryFilter: dictionaryResult.selectedRecords[0],
    contextPlaceholder: contextPlaceholderResult.request.body
  }, null, 2));
} finally {
  await cleanupCreated();
}
