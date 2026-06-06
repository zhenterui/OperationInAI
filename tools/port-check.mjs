const port = process.env.PORT || "4173";
const baseUrl = `http://127.0.0.1:${port}`;

async function check(path, options = {}) {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
    return {
      ok: response.ok,
      path,
      status: response.status
    };
  } catch (error) {
    return {
      ok: false,
      path,
      status: "ERR",
      detail: error.message
    };
  }
}

const checks = await Promise.all([
  check("/api/health"),
  check("/api/bootstrap"),
  check("/api/auth-configs"),
  check("/api/business-flows"),
  check("/api/data-sources/test", {
    method: "POST",
    body: JSON.stringify({
      name: "联通性检查源",
      kind: "api",
      type: "GET /api/mock/alarms",
      authConfigId: "auth-none",
      config: {
        method: "GET",
        responsePath: "data.items"
      }
    })
  })
]);

console.log(JSON.stringify(checks, null, 2));

const failed = checks.filter((item) => !item.ok);
if (failed.length) {
  process.exitCode = 1;
}
