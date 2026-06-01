import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(__dirname, "dist");
const host = "127.0.0.1";

function readEnv() {
  const envPath = path.join(projectRoot, ".env");
  const values = {};
  if (!fs.existsSync(envPath)) {
    return values;
  }
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator !== -1) {
      values[trimmed.slice(0, separator)] = trimmed.slice(separator + 1);
    }
  }
  return values;
}

const env = readEnv();
const port = Number(env.FRONTEND_PORT || process.env.FRONTEND_PORT || 43448);
const backendPort = Number(env.BACKEND_PORT || process.env.BACKEND_PORT || 53448);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function proxyApi(req, res, url) {
  const proxyReq = http.request({
    host,
    port: backendPort,
    method: req.method,
    path: `${url.pathname}${url.search}`,
    headers: {
      ...req.headers,
      host: `${host}:${backendPort}`,
    },
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (error) => {
    send(res, 502, JSON.stringify({ error: error.message }), "application/json; charset=utf-8");
  });

  req.pipe(proxyReq);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      return send(res, 404, "Not found");
    }
    const type = contentTypes[path.extname(filePath)] || "application/octet-stream";
    send(res, 200, data, type);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`);

  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    proxyApi(req, res, url);
    return;
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(publicRoot, requestedPath));

  if (!filePath.startsWith(publicRoot)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.stat(filePath, (error, stat) => {
    if (!error && stat.isFile()) {
      serveFile(res, filePath);
      return;
    }
    if (!path.extname(filePath)) {
      serveFile(res, path.join(publicRoot, "index.html"));
      return;
    }
    send(res, 404, "Not found");
  });
});

server.listen(port, host, () => {
  console.log(`taxi-regulatory-frontend listening on http://${host}:${port}`);
});

server.on("error", (error) => {
  console.error(`frontend failed to listen on ${host}:${port}`, error);
  process.exit(1);
});
