const fs = require('fs');
const http = require('http');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'frontend');
const envPath = path.join(rootDir, '.env');

function readEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    return env;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const index = trimmed.indexOf('=');
    if (index === -1) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }
  return env;
}

const env = { ...readEnv(envPath), ...process.env };
const host = '127.0.0.1';
const frontendPort = Number.parseInt(env.FRONTEND_PORT || '43457', 10);
const backendPort = Number.parseInt(env.BACKEND_PORT || '53457', 10);
const backendUrl = `http://${host}:${backendPort}`;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function safeResolve(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = decoded === '/' ? '/index.html' : decoded;
  const resolved = path.resolve(publicDir, `.${normalized}`);
  if (!resolved.startsWith(publicDir)) {
    return null;
  }
  return resolved;
}

const server = http.createServer((req, res) => {
  const requestUrl = req.url || '/';

  if (requestUrl === '/health' || requestUrl === '/healthz') {
    send(res, 200, JSON.stringify({ ok: true, service: 'frontend' }), 'application/json; charset=utf-8');
    return;
  }

  if (requestUrl.split('?')[0] === '/config.js') {
    const config = {
      backendUrl,
      frontendPort,
      backendPort
    };
    send(res, 200, `window.APP_CONFIG = ${JSON.stringify(config)};\n`, 'application/javascript; charset=utf-8');
    return;
  }

  const filePath = safeResolve(requestUrl);
  if (!filePath) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(publicDir, 'index.html'), (indexErr, indexData) => {
          if (indexErr) {
            send(res, 404, 'Not found');
            return;
          }
          send(res, 200, indexData, contentTypes['.html']);
        });
        return;
      }
      send(res, 500, 'Internal server error');
      return;
    }

    const contentType = contentTypes[path.extname(filePath)] || 'application/octet-stream';
    send(res, 200, data, contentType);
  });
});

server.listen(frontendPort, host, () => {
  console.log(`Frontend started: http://${host}:${frontendPort}`);
  console.log(`Backend configured: ${backendUrl}`);
});

server.on('error', (err) => {
  console.error('Frontend server error:', err);
  process.exit(1);
});
