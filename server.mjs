import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, 'utf8')
    .split('\n')
    .reduce((acc, rawLine) => {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        return acc;
      }

      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

const fileEnv = parseEnvFile(path.join(projectRoot, '.env'));
const env = { ...fileEnv, ...process.env };
const host = env.HOST || '127.0.0.1';
const frontendPort = env.FRONTEND_PORT || env.APP_PORT || '49272';
const backendPort = Number(env.BACKEND_PORT || '59272');
const frontendUrl = env.FRONTEND_URL || `http://${host}:${frontendPort}`;

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': frontendUrl,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

const routes = [
  'GET /api/health',
  'GET /api/meta'
];

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendJson(res, 400, { status: 'error', message: 'Missing request URL.' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': frontendUrl,
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${host}:${backendPort}`);

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'video-job-platform-backend',
      host,
      port: backendPort,
      frontendUrl,
      timestamp: new Date().toISOString(),
      dataMode: 'frontend-local-mock'
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/meta') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'video-job-platform-backend',
      routes,
      note: 'This project currently uses local mock data in the frontend and exposes health metadata for automation checks.'
    });
    return;
  }

  sendJson(res, 404, {
    status: 'not_found',
    message: 'Route not found.',
    routes
  });
});

server.listen(backendPort, host, () => {
  console.log(
    `[backend] listening on ${host}:${backendPort} with frontend origin ${frontendUrl}`
  );
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => {
      process.exit(0);
    });
  });
}
