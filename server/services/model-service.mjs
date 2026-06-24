function normalizeBaseUrl(baseUrl = "", suffix = "/chat/completions") {
  const trimmed = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.endsWith("/chat/completions") || trimmed.endsWith("/messages")) return trimmed;
  return `${trimmed}${suffix}`;
}

function isUsableSecret(value = "") {
  const text = String(value || "").trim();
  return Boolean(text && !text.includes("*") && !["未配置", "已配置"].includes(text));
}

function isLiveModelEnabled(modelConfig = {}, options = {}) {
  return options.enableLiveModel === true || modelConfig.enableLiveModel === true || process.env.OPERATION_ENABLE_LIVE_MODEL === "true";
}

function getTimeoutMs(options = {}) {
  const value = Number(options.timeoutMs || process.env.OPERATION_LLM_TIMEOUT_MS || 12000);
  return Number.isFinite(value) && value > 0 ? value : 12000;
}

async function postJson(url, headers, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const text = await response.text();
    let json = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { text };
    }
    if (!response.ok) {
      const message = json?.error?.message || json?.message || text || `HTTP ${response.status}`;
      throw new Error(message);
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

function splitSystemMessage(messages = []) {
  const system = messages.find((item) => item.role === "system")?.content || "";
  const userMessages = messages.filter((item) => item.role !== "system");
  return { system, userMessages };
}

async function callAnthropic(modelConfig, messages, options) {
  const { system, userMessages } = splitSystemMessage(messages);
  const json = await postJson(
    normalizeBaseUrl(modelConfig.baseUrl, "/messages"),
    {
      "x-api-key": modelConfig.apiKey,
      "anthropic-version": process.env.OPERATION_ANTHROPIC_VERSION || "2023-06-01"
    },
    {
      model: modelConfig.model,
      max_tokens: options.maxTokens || 1200,
      temperature: options.temperature ?? 0.2,
      system,
      messages: userMessages.map((item) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: String(item.content || "")
      }))
    },
    getTimeoutMs(options)
  );
  return (json.content || []).map((item) => item.text || "").join("\n").trim();
}

async function callOpenAiCompatible(modelConfig, messages, options) {
  const json = await postJson(
    normalizeBaseUrl(modelConfig.baseUrl, "/chat/completions"),
    {
      authorization: `Bearer ${modelConfig.apiKey}`
    },
    {
      model: modelConfig.model,
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens || 1200
    },
    getTimeoutMs(options)
  );
  return String(json.choices?.[0]?.message?.content || json.output_text || "").trim();
}

export async function callConfiguredModel(modelConfig = {}, messages = [], options = {}) {
  if (!isLiveModelEnabled(modelConfig, options)) {
    return { used: false, reason: "live model disabled" };
  }
  if (!modelConfig?.baseUrl || !modelConfig?.model || !isUsableSecret(modelConfig.apiKey)) {
    return { used: false, reason: "model url, name or api key missing" };
  }
  try {
    const vendor = String(modelConfig.vendor || "").toLowerCase();
    const content = vendor === "anthropic"
      ? await callAnthropic(modelConfig, messages, options)
      : await callOpenAiCompatible(modelConfig, messages, options);
    return {
      used: Boolean(content),
      content,
      provider: vendor || "openai-compatible"
    };
  } catch (error) {
    return {
      used: false,
      reason: error.message || "model request failed"
    };
  }
}
