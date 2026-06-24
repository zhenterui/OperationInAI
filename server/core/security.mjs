const roleRank = {
  reader: 1,
  operator: 2,
  admin: 3
};

function methodRequiredRole(method = "GET") {
  if (method === "GET") return "reader";
  if (method === "POST") return "operator";
  return "admin";
}

function normalizeRole(role = "reader") {
  const normalized = String(role || "reader").toLowerCase();
  return roleRank[normalized] ? normalized : "reader";
}

function parseTokenRegistry() {
  const registryText = process.env.OPERATION_API_TOKENS || "";
  if (registryText.trim()) {
    try {
      const parsed = JSON.parse(registryText);
      return Object.entries(parsed).map(([token, value]) => {
        if (typeof value === "string") return { token, role: normalizeRole(value), user: "api-user" };
        return { token, role: normalizeRole(value?.role), user: value?.user || "api-user" };
      });
    } catch {
      return registryText
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
          const [token, role = "reader", user = "api-user"] = entry.split(":");
          return { token, role: normalizeRole(role), user };
        });
    }
  }
  const singleToken = process.env.OPERATION_API_TOKEN || "";
  if (!singleToken) return [];
  return [{
    token: singleToken,
    role: normalizeRole(process.env.OPERATION_API_ROLE || process.env.OPERATION_DEFAULT_ROLE || "admin"),
    user: process.env.OPERATION_API_USER || "api-user"
  }];
}

export function getRequestIdentity(request = {}) {
  const registry = parseTokenRegistry();
  const providedToken = request.headers?.["x-operation-token"] || "";
  const matched = registry.find((item) => item.token === providedToken);
  const tokenEnabled = registry.length > 0;
  const localRole = normalizeRole(request.headers?.["x-operation-role"] || process.env.OPERATION_DEFAULT_ROLE || "admin");
  return {
    tokenEnabled,
    tokenValid: !tokenEnabled || Boolean(matched),
    role: tokenEnabled ? matched?.role || "reader" : localRole,
    user: tokenEnabled ? matched?.user || "api-user" : String(request.headers?.["x-operation-user"] || "local-user")
  };
}

export function assertAuthorized(request = {}, requiredRole = methodRequiredRole(request.method)) {
  const identity = getRequestIdentity(request);
  if (!identity.tokenValid) {
    const error = new Error("Missing or invalid X-Operation-Token");
    error.status = 401;
    throw error;
  }
  if (roleRank[identity.role] < roleRank[requiredRole]) {
    const error = new Error(`Role ${identity.role} cannot access ${requiredRole} operation`);
    error.status = 403;
    throw error;
  }
  return identity;
}

export function requiredRoleForRequest(request = {}, pathname = "") {
  if (pathname === "/api/health" || request.method === "GET") return "reader";
  if (pathname.includes("/storage-configs") || request.method === "DELETE" || request.method === "PUT") return "admin";
  return "operator";
}
