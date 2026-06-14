import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

loadEnv(join(rootDir, '.env'));

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || 59144);

const health = {
  success: true,
  message: 'ok',
  service: 'may-89144-api',
  dataSource: 'project mock data',
};

const overview = {
  community: '阳光花园',
  residentCount: 2860,
  activeTickets: 5,
  serviceProviders: 6,
  unreadNotifications: 3,
};

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${port}`);

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, health);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/overview') {
    sendJson(res, 200, {
      success: true,
      message: 'ok',
      data: overview,
    });
    return;
  }

  sendJson(res, 404, {
    success: false,
    error: 'API not found',
  });
});

server.listen(port, host, () => {
  console.log(`Backend ready at http://${host}:${port}`);
});

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function loadEnv(path) {
  if (!existsSync(path)) {
    return;
  }

  const source = readFileSync(path, 'utf8');
  for (const line of source.split(/\r?\n/)) {
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
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
