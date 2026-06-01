import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicRoot = __dirname;
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
    if (separator === -1) {
      continue;
    }
    values[trimmed.slice(0, separator)] = trimmed.slice(separator + 1);
  }
  return values;
}

const env = readEnv();
const port = Number(env.FRONTEND_PORT || process.env.FRONTEND_PORT || 43464);
const apiBaseUrl = env.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL || "http://127.0.0.1:53464/api";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`);

  if (url.pathname === "/env.js") {
    return send(
      res,
      200,
      `window.APP_CONFIG = ${JSON.stringify({ apiBaseUrl })};\n`,
      "application/javascript; charset=utf-8"
    );
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(publicRoot, requestedPath));

  if (!filePath.startsWith(publicRoot)) {
    return send(res, 403, "Forbidden");
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      return send(res, 404, "Not found");
    }
    const type = contentTypes[path.extname(filePath)] || "application/octet-stream";
    send(res, 200, data, type);
  });
});

server.listen(port, host, () => {
  console.log(`medical-cohort-frontend listening on http://${host}:${port}`);
});

server.on("error", (error) => {
  console.error(`frontend failed to listen on ${host}:${port}`, error);
  process.exit(1);
});
