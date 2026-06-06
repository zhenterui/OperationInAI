import { store } from "../data/store.mjs";

const keywordMap = [
  ["支付", ["支付网关 5xx 升高", "支付回调失败 SOP", "核心交易链路巡检"]],
  ["订单", ["订单 MQ 堆积", "订单状态不一致排查", "消费者扩容 SOP"]],
  ["502", ["Nginx 502 处理 SOP", "网关 upstream 故障排查", "历史工单 #OPS-2048"]],
  ["告警", ["告警中心 API", "告警收敛策略", "P0/P1 升级规则"]]
];

export function answerQuestion(payload = {}) {
  const question = payload.question || "最近告警集中在哪些服务，应该优先处理什么？";
  const matched = keywordMap
    .filter(([keyword]) => question.includes(keyword))
    .flatMap(([, docs]) => docs);
  const sources = matched.length ? matched : ["告警中心 API", "历史工单知识", "运维 SOP 文档库"];
  return {
    question,
    answer:
      "当前重点信号集中在支付服务与订单服务。建议先处理支付网关 5xx 升高，再排查订单 MQ 堆积；同时冻结非必要发布，补齐负责人和变更证据，避免影响范围继续扩大。",
    actions: [
      "检查网关到订单服务的超时、限流、发布与依赖错误。",
      "查看 MQ 消费组积压和消费者实例健康度，必要时临时扩容。",
      "把本次处理记录沉淀到 SOP 和历史工单知识库。"
    ],
    sources: sources.slice(0, 5),
    knowledgeSources: store.knowledge.map((item) => ({
      id: item.id,
      name: item.name,
      chunks: item.chunks
    }))
  };
}
