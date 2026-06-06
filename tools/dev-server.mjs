import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function resolveRequest(url) {
  const parsed = new URL(url, `http://${host}:${port}`);
  const pathname = decodeURIComponent(parsed.pathname);
  const candidate = normalize(join(root, pathname === "/" ? "index.html" : pathname));
  if (!candidate.startsWith(root)) {
    return null;
  }
  return candidate;
}

const server = createServer((request, response) => {
  const filePath = resolveRequest(request.url || "/");
  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const type = mimeTypes[extname(filePath)] || "application/octet-stream";
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": type
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`OperationInAI preview: http://${host}:${port}`);
});
