import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

import { log } from "./logging.js";

export interface RunningServer {
  url: string;
  port: number;
  close: () => Promise<void>;
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

/**
 * Serves a static directory over localhost HTTP. The SPA uses client-side hash
 * routing, so any unmatched path falls back to `index.html`.
 */
export async function serveDirectory(
  rootDir: string,
  options: { port?: number; host?: string } = {},
): Promise<RunningServer> {
  const host = options.host ?? "127.0.0.1";
  const root = path.resolve(rootDir);

  const server = http.createServer((req, res) => {
    handleRequest(root, req, res).catch((err) => {
      log.warn(`request error: ${(err as Error).message}`);
      if (!res.headersSent) res.writeHead(500);
      res.end("Internal Server Error");
    });
  });

  const port = await listen(server, options.port ?? 0, host);
  const url = `http://${host}:${port}/`;
  return {
    url,
    port,
    close: () =>
      new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

function listen(
  server: http.Server,
  port: number,
  host: string,
): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") resolve(addr.port);
      else reject(new Error("failed to determine server port"));
    });
  });
}

async function handleRequest(
  root: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/") pathname = "/index.html";

  const resolved = safeResolve(root, pathname);
  if (!resolved) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  let target = resolved;
  let info = await statOrNull(target);
  if (!info || !info.isFile()) {
    // SPA fallback: unknown routes serve index.html.
    target = path.join(root, "index.html");
    info = await statOrNull(target);
    if (!info) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
  }

  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] ?? "application/octet-stream",
    "Content-Length": info.size,
    "Cache-Control": "no-cache",
  });
  createReadStream(target).pipe(res);
}

/** Resolves a request path within root, rejecting traversal escapes. */
function safeResolve(root: string, pathname: string): string | null {
  const resolved = path.resolve(root, "." + pathname);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

async function statOrNull(target: string) {
  try {
    return await stat(target);
  } catch {
    return null;
  }
}
