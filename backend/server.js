import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

loadEnv(path.join(projectRoot, '.env'));

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59132);
const dbPath = path.resolve(projectRoot, process.env.DB_PATH || 'data/app.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS service_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

seedEvents([
  ['backend_ready', { module: '昆山政务通后端', services: 8 }],
  ['auth_ready', { module: '统一认证', users: 1 }],
  ['admin_ready', { module: '管理后台', departments: 2 }],
]);

const domains = [
  { id: 'life', name: '民生服务', serviceCount: 86 },
  { id: 'work', name: '办事服务', serviceCount: 112 },
  { id: 'health', name: '医疗健康', serviceCount: 67 },
  { id: 'traffic', name: '交通出行', serviceCount: 54 },
];

const services = [
  { id: 's001', domainId: 'life', name: '水电燃气缴费', department: '市发改委', onlineEnabled: true, applicationCount: 67800 },
  { id: 's002', domainId: 'traffic', name: '公交卡充值', department: '市交通局', onlineEnabled: true, applicationCount: 56700 },
  { id: 's003', domainId: 'health', name: '预约挂号', department: '市卫健委', onlineEnabled: true, applicationCount: 45600 },
  { id: 's004', domainId: 'traffic', name: '停车缴费', department: '城管局', onlineEnabled: true, applicationCount: 43200 },
  { id: 's005', domainId: 'work', name: '营业执照办理', department: '市市场监管局', onlineEnabled: true, applicationCount: 21900 },
];

const applications = [
  { id: 'app001', serviceId: 's005', serviceName: '营业执照办理', status: 'approved', currentStep: 3, updatedAt: '2026-06-10' },
  { id: 'app002', serviceId: 's003', serviceName: '预约挂号', status: 'submitted', currentStep: 1, updatedAt: '2026-06-09' },
];

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '*';
  if (req.method === 'OPTIONS') {
    writeCors(res, 204, origin);
    return;
  }

  const url = new URL(req.url || '/', `http://${host}:${port}`);

  if (req.method === 'GET' && url.pathname === '/api/health') {
    json(res, 200, {
      ok: true,
      success: true,
      project: 'may-89132',
      service: '昆山政务通后端',
      database: path.relative(projectRoot, dbPath),
      events: db.prepare('SELECT COUNT(*) AS count FROM service_events').get().count,
      time: new Date().toISOString(),
    }, origin);
    return;
  }

  if (req.method === 'POST' && (url.pathname === '/api/auth/login' || url.pathname === '/api/auth/register')) {
    const body = await readJson(req);
    json(res, url.pathname.endsWith('/register') ? 201 : 200, {
      success: true,
      token: 'kunshan-demo-token',
      user: {
        id: 'u001',
        name: body.name || body.phone || '张三',
        phone: body.phone || '13800138000',
        role: 'citizen',
        verified: true,
      },
    }, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    json(res, 200, { success: true, message: 'logged out' }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/auth/me') {
    json(res, 200, {
      success: true,
      user: {
        id: 'u001',
        name: '张三',
        phone: '13800138000',
        role: 'citizen',
        verified: true,
      },
    }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/users/profile') {
    json(res, 200, {
      success: true,
      data: {
        user: { id: 'u001', name: '张三', phone: '13800138000', verified: true },
        applications,
        certificates: 12,
        notifications: 5,
      },
    }, origin);
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/api/admin/stats' || url.pathname === '/api/admin/dashboard')) {
    json(res, 200, {
      success: true,
      data: {
        totalApplications: 12860,
        activeUsers: 93420,
        serviceAvailability: 99.95,
        averageProcessTime: 2.4,
        domains,
        recentApplications: applications,
      },
    }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/services') {
    const domainId = url.searchParams.get('domain') || '';
    const q = url.searchParams.get('q') || '';
    const data = services.filter((item) => {
      if (domainId && item.domainId !== domainId) return false;
      if (q && !item.name.includes(q) && !item.department.includes(q)) return false;
      return true;
    });
    json(res, 200, { success: true, data, total: data.length }, origin);
    return;
  }

  const serviceMatch = url.pathname.match(/^\/api\/services\/([^/]+)$/);
  if (req.method === 'GET' && serviceMatch) {
    const data = services.find((item) => item.id === serviceMatch[1]);
    json(res, data ? 200 : 404, data ? { success: true, data } : { success: false, error: 'service not found' }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/domains') {
    json(res, 200, { success: true, data: domains }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/applications') {
    json(res, 200, { success: true, data: applications, total: applications.length }, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/applications') {
    const body = await readJson(req);
    const item = {
      id: `app${Date.now()}`,
      serviceId: body.serviceId || 's001',
      serviceName: body.serviceName || '在线申办',
      status: 'submitted',
      currentStep: 1,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    json(res, 201, { success: true, data: item }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/search') {
    const q = url.searchParams.get('q') || '';
    const data = services.filter((item) => !q || item.name.includes(q) || item.department.includes(q));
    json(res, 200, { success: true, query: q, data }, origin);
    return;
  }

  json(res, 404, { success: false, error: 'API not found', path: url.pathname }, origin);
});

server.listen(port, host, () => {
  console.log(`may-89132 backend listening on http://${host}:${port}`);
});

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

function seedEvents(events) {
  const count = db.prepare('SELECT COUNT(*) AS count FROM service_events').get().count;
  if (count > 0) return;
  const insert = db.prepare('INSERT INTO service_events (event_name, payload) VALUES (?, ?)');
  for (const [name, payload] of events) insert.run(name, JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function writeCors(res, status, origin) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  });
  res.end();
}

function json(res, status, body, origin) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  });
  res.end(JSON.stringify(body));
}
