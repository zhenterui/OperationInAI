import { store } from "../data/store.mjs";

function normalizeList(value, fallback = []) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,+]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
}

export function runAnalysis(payload = {}) {
  // Accept both the old single-business payload and the newer multi-business analysis payload.
  const businessNames = normalizeList(payload.businessNames || payload.businessName, [store.businesses[0]?.name].filter(Boolean));
  const selectedBusinesses = businessNames
    .map((name) => store.businesses.find((item) => item.name === name))
    .filter(Boolean);
  const businesses = selectedBusinesses.length ? selectedBusinesses : [store.businesses[0]].filter(Boolean);
  const allRows = businesses.flatMap((business) => business.rows.map((row) => ({ business, row })));
  const highRiskRows = allRows.filter(({ row }) => row[1] === "P0" || row[1] === "P1");
  const affectedServices = [...new Set(highRiskRows.map(({ row }) => row[2]))];
  const fields = normalizeList(payload.fields, ["severity", "service", "owner", "event_time"]);
  const comboFields = normalizeList(payload.comboFields);
  const modelConfig = store.modelConfigs.find((item) => item.id === payload.modelConfigId) || store.modelConfigs[0];
  const scopeLabels = {
    single: "按业务分别分析",
    combined: "多业务合并分析",
    compare: "多业务对比分析"
  };
  const result = {
    id: `analysis_${Date.now()}`,
    businessName: businesses.map((item) => item.name).join(" + "),
    businessNames: businesses.map((item) => item.name),
    model: modelConfig?.name || payload.model || "OpenAI Compatible",
    modelConfigId: modelConfig?.id || "",
    fields,
    comboFields,
    scope: payload.scope || "single",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "结论",
        content: `${businesses.map((item) => item.name).join("、")} 当前按“${scopeLabels[payload.scope] || scopeLabels.single}”完成分析，覆盖 ${allRows.length} 条记录、${fields.length} 个字段，发现 ${highRiskRows.length} 条高优先级信号，集中在 ${affectedServices.join("、") || "暂无集中对象"}。`
      },
      {
        title: "风险",
        content: `重点组合字段为 ${comboFields.join("、") || fields.slice(0, 3).join("、")}。P0/P1 事件会影响核心业务链路，若 MQ 堆积、接口 5xx 或处理时长继续扩大，可能引发状态延迟和告警风暴。`
      },
      {
        title: "改进措施",
        content: `使用模型配置“${modelConfig?.name || "默认模型"}”。建议建立服务负责人自动补齐、发布风险联动、慢查询治理和 MQ 消费延迟告警；分析报告保留 ${fields.join("、")} 作为证据字段。`
      }
    ],
    evidence: highRiskRows.map(({ business, row }) => ({
      business: business.name,
      event: row[0],
      severity: row[1],
      service: row[2],
      time: row[3]
    }))
  };
  store.analysisResults.unshift(result);
  return result;
}

export function listAnalysisResults() {
  return store.analysisResults;
}
