import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

export function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload, null, 2));
}

export function sendError(response, status, message, detail) {
  sendJson(response, status, {
    error: {
      message,
      detail
    }
  });
}

export async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf8").trim();
  if (!body) {
    return {};
  }
  return JSON.parse(body);
}

export function serveStatic(request, response, rootDir) {
  const parsed = new URL(request.url || "/", "http://127.0.0.1");
  const pathname = decodeURIComponent(parsed.pathname);
  const root = resolve(rootDir);
  const filePath = normalize(join(root, pathname === "/" ? "index.html" : pathname));

  if (!filePath.startsWith(root) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    return false;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
  return true;
}
