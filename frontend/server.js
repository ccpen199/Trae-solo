import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function loadRootEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return {};

  return fs.readFileSync(envPath, 'utf8').split(/\r?\n/).reduce((env, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return env;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) return env;
    env[trimmed.slice(0, equalsIndex).trim()] = trimmed.slice(equalsIndex + 1).trim();
    return env;
  }, {});
}

const rootEnv = loadRootEnv();
const port = Number(process.env.FRONTEND_PORT || rootEnv.FRONTEND_PORT || 43477);
const backendPort = Number(process.env.BACKEND_PORT || rootEnv.BACKEND_PORT || 53477);
const host = process.env.HOST || '127.0.0.1';
const backendHost = '127.0.0.1';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function proxyToBackend(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`);
  const backendUrl = `http://${backendHost}:${backendPort}${url.pathname}${url.search}`;

  const proxyHeaders = { ...req.headers };
  delete proxyHeaders.host;
  proxyHeaders.host = `${backendHost}:${backendPort}`;

  const options = {
    hostname: backendHost,
    port: backendPort,
    path: url.pathname + url.search,
    method: req.method,
    headers: proxyHeaders
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    send(res, 502, JSON.stringify({ error: `Backend unreachable: ${err.message}` }), 'application/json; charset=utf-8');
  });

  req.pipe(proxyReq, { end: true });
}

function resolveStaticPath(urlPath) {
  const requestedPath = urlPath === '/' ? '/index.html' : urlPath;
  const safePath = path.normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(__dirname, safePath);
  if (!filePath.startsWith(__dirname)) return null;
  return filePath;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`);

  if (url.pathname.startsWith('/api/')) {
    proxyToBackend(req, res);
    return;
  }

  if (url.pathname === '/config.js') {
    send(res, 200, `window.__API_BASE__ = "";`, 'application/javascript; charset=utf-8');
    return;
  }

  const filePath = resolveStaticPath(url.pathname);
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, 'Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  send(res, 200, fs.readFileSync(filePath), mimeTypes[ext] || 'application/octet-stream');
});

server.listen(port, host, () => {
  console.log(`usability-frontend listening on http://${host}:${port} (proxy /api -> http://${backendHost}:${backendPort})`);
});
