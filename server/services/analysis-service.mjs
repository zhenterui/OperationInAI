import { store } from "../data/store.mjs";

export function runAnalysis(payload = {}) {
  const businessName = payload.businessName || "告警业务";
  const business = store.businesses.find((item) => item.name === businessName) || store.businesses[0];
  const highRiskRows = business.rows.filter((row) => row[1] === "P0" || row[1] === "P1");
  const affectedServices = [...new Set(highRiskRows.map((row) => row[2]))];
  const result = {
    id: `analysis_${Date.now()}`,
    businessName: business.name,
    model: payload.model || "OpenAI Compatible",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "结论",
        content: `${business.name} 最近周期内存在 ${highRiskRows.length} 条高优先级信号，集中在 ${affectedServices.join("、")}。建议优先检查入口流量、依赖超时和变更记录。`
      },
      {
        title: "风险",
        content: "P0/P1 事件会影响核心业务链路，若 MQ 堆积或接口 5xx 继续扩大，可能引发订单状态延迟、支付回调失败和告警风暴。"
      },
      {
        title: "改进措施",
        content: "建立服务负责人自动补齐、发布风险联动、慢查询治理和 MQ 消费延迟告警；分析报告需保留原始字段证据以便复盘。"
      }
    ],
    evidence: highRiskRows.map((row) => ({
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
