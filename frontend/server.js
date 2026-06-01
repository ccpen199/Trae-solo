import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..');

function readEnv() {
  const env = {};
  const envPath = path.join(projectDir, '.env');
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^=#]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = readEnv();
const frontendPort = Number(env.FRONTEND_PORT || 43443);
const backendPort = Number(env.BACKEND_PORT || 53443);
const distDir = path.join(__dirname, 'dist');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function proxyApi(req, res) {
  const upstream = http.request({
    hostname: '127.0.0.1',
    port: backendPort,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${backendPort}` }
  }, (apiRes) => {
    res.writeHead(apiRes.statusCode || 502, apiRes.headers);
    apiRes.pipe(res);
  });

  upstream.on('error', (error) => {
    res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: error.message }));
  });
  req.pipe(upstream);
}

function serveStatic(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${frontendPort}`).pathname);
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(distDir, requested));
  const safePath = filePath.startsWith(distDir) ? filePath : path.join(distDir, 'index.html');
  const finalPath = fs.existsSync(safePath) && fs.statSync(safePath).isFile()
    ? safePath
    : path.join(distDir, 'index.html');

  res.writeHead(200, { 'content-type': types[path.extname(finalPath)] || 'application/octet-stream' });
  fs.createReadStream(finalPath).pipe(res);
}

http.createServer((req, res) => {
  if (req.url?.startsWith('/api')) {
    proxyApi(req, res);
    return;
  }
  serveStatic(req, res);
}).listen(frontendPort, '127.0.0.1', () => {
  console.log(`Frontend static server listening at http://127.0.0.1:${frontendPort}`);
});
