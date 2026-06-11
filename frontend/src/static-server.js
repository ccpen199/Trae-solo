import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const projectDir = path.resolve(root, "..");
const envPath = path.join(projectDir, ".env");

if (existsSync(envPath)) {
  const envText = readFileSync(envPath, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=");
  }
}

const host = process.env.BIND_HOST || "127.0.0.1";
const port = Number(process.env.FRONTEND_PORT || 49101);
const apiBase = process.env.API_BASE_URL || `http://127.0.0.1:${Number(process.env.BACKEND_PORT || 59101)}/api`;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(res, status, body, type) {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${host}:${port}`);
  const fileName = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
  const filePath = path.join(root, fileName);
  const safe = filePath.startsWith(root);
  if (!safe || !existsSync(filePath)) {
    const index = readFileSync(path.join(root, "index.html"), "utf8").replace("__API_BASE__", apiBase);
    return send(res, 200, index, types[".html"]);
  }
  const ext = path.extname(filePath);
  let content = readFileSync(filePath);
  if (ext === ".html") content = String(content).replace("__API_BASE__", apiBase);
  send(res, 200, content, types[ext] || "application/octet-stream");
}).listen(port, host, () => {
  console.log(`may-89101 frontend listening on http://${host}:${port}`);
  console.log(`api base: ${apiBase}`);
});
