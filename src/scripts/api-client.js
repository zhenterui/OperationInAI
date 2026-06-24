window.opsApi = (() => {
  const defaultTimeoutMs = 20000;

  function getSecurityHeaders() {
    const token = window.localStorage?.getItem("operation_api_token") || "";
    const role = window.localStorage?.getItem("operation_api_role") || "";
    const user = window.localStorage?.getItem("operation_api_user") || "";
    return {
      ...(token ? { "X-Operation-Token": token } : {}),
      ...(role ? { "X-Operation-Role": role } : {}),
      ...(user ? { "X-Operation-User": user } : {})
    };
  }

  async function readError(response, path) {
    let detail = "";
    try {
      const payload = await response.json();
      detail = payload?.detail || payload?.error || payload?.message || "";
    } catch {
      detail = await response.text().catch(() => "");
    }
    const error = new Error(detail || `API ${path} returned ${response.status}`);
    error.status = response.status;
    error.detail = detail;
    return error;
  }

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeoutMs = Number(options.timeoutMs || defaultTimeoutMs);
    const canMergeSignals = typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function";
    const requestSignal = options.signal && canMergeSignals
      ? AbortSignal.any([options.signal, controller.signal])
      : options.signal || controller.signal;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...getSecurityHeaders(),
          ...(options.headers || {})
        },
        signal: requestSignal
      });
      if (!response.ok) throw await readError(response, path);
      const payload = await response.json();
      return payload.data;
    } catch (error) {
      if (error.name === "AbortError") {
        const timeoutError = new Error(`API ${path} timed out after ${timeoutMs}ms`);
        timeoutError.status = 408;
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  return { request };
})();
