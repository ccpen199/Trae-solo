import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

function loadEnv(filePath) {
  const env = {};

  if (!fs.existsSync(filePath)) {
    return env;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const index = line.indexOf('=');

    if (index === -1) {
      continue;
    }

    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();

    env[key] = value;
  }

  return env;
}

const fileEnv = loadEnv(envPath);
const host = process.env.HOST || fileEnv.HOST || '127.0.0.1';
const frontendPort = Number(process.env.FRONTEND_PORT || fileEnv.FRONTEND_PORT || fileEnv.APP_PORT || '49313');
const backendPort = Number(process.env.BACKEND_PORT || process.env.PORT || fileEnv.BACKEND_PORT || fileEnv.PORT || '59313');
const frontendUrl = process.env.FRONTEND_URL || fileEnv.FRONTEND_URL || `http://${host}:${frontendPort}`;
const backendUrl = process.env.BACKEND_URL || fileEnv.BACKEND_URL || `http://${host}:${backendPort}`;

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': frontendUrl,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || `${host}:${backendPort}`}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': frontendUrl,
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, {
      ok: false,
      message: 'Only GET is supported by this local mock backend.',
    });
    return;
  }

  if (url.pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'may-89313-backend',
      mode: 'mock-api',
      project: '镇雄本地通',
      message: 'Pure frontend project; local backend provides health and runtime metadata.',
      frontendUrl,
      backendUrl,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (url.pathname === '/api/meta') {
    sendJson(res, 200, {
      ok: true,
      appName: '镇雄本地通',
      description: 'County-level local life information portal backed by frontend mock data.',
      frontendUrl,
      backendUrl,
      host,
      ports: {
        frontend: frontendPort,
        backend: backendPort,
      },
    });
    return;
  }

  sendJson(res, 404, {
    ok: false,
    message: 'Not found. Try /api/health or /api/meta.',
    path: url.pathname,
  });
});

server.listen(backendPort, host, () => {
  console.log(`mock backend listening on ${backendUrl}`);
});

function shutdown(signal) {
  console.log(`received ${signal}, shutting down backend`);
  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
