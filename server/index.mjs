import { createServer } from "node:http";
import { resolve } from "node:path";
import { handleApi } from "./core/router.mjs";
import { sendError, serveStatic } from "./core/http.mjs";

const rootDir = resolve(process.cwd());
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);

const server = createServer(async (request, response) => {
  if (await handleApi(request, response)) {
    return;
  }

  if (serveStatic(request, response, rootDir)) {
    return;
  }

  sendError(response, 404, "Resource not found", request.url);
});

server.listen(port, host, () => {
  console.log(`OperationInAI backend: http://${host}:${port}`);
  console.log(`Health check: http://${host}:${port}/api/health`);
});
