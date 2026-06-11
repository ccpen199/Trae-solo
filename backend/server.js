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
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59120);
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
  ['social_insurance_ready', { module: '社保查询', activeMonths: 186 }],
  ['transfer_ready', { module: '关系转移', activeApplications: 2 }],
  ['dashboard_ready', { module: '社保服务一体化工作台', services: 8 }],
]);

const user = {
  id: 'U001',
  name: '张明',
  role: 'insured',
  region: '北京市',
  authLevel: 2,
};

const insurance = [
  { type: 'pension', status: 'active', months: 186, baseAmount: 12000, personalAmount: 960, companyAmount: 1920 },
  { type: 'medical', status: 'active', months: 186, baseAmount: 12000, personalAmount: 240, companyAmount: 1200 },
  { type: 'unemployment', status: 'active', months: 186, baseAmount: 12000, personalAmount: 60, companyAmount: 120 },
  { type: 'workInjury', status: 'active', months: 186, baseAmount: 12000, personalAmount: 0, companyAmount: 72 },
  { type: 'maternity', status: 'active', months: 186, baseAmount: 12000, personalAmount: 0, companyAmount: 96 },
];

const transfers = [
  { id: 'TF20250001', fromProvince: '北京市', toProvince: '上海市', transferType: 'pension', status: 'transferring' },
  { id: 'TF20250002', fromProvince: '广东省', toProvince: '浙江省', transferType: 'medical', status: 'completed' },
];

const tasks = [
  { id: 'T001', title: '完成待遇资格认证', deadline: '2026-07-01', priority: 'high', status: 'pending' },
  { id: 'T002', title: '确认社保关系转移信息', deadline: '2026-06-15', priority: 'high', status: 'processing' },
  { id: 'T003', title: '补充失业登记材料', deadline: '2026-06-20', priority: 'medium', status: 'pending' },
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
      project: 'may-89120',
      service: '社保服务一体化后端',
      database: path.relative(projectRoot, dbPath),
      events: db.prepare('SELECT COUNT(*) AS count FROM service_events').get().count,
      time: new Date().toISOString(),
    }, origin);
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/api/auth/me' || url.pathname === '/api/user/profile')) {
    json(res, 200, { success: true, data: user }, origin);
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/api/admin/stats' || url.pathname === '/api/admin/dashboard')) {
    json(res, 200, {
      success: true,
      data: {
        platform: '社保服务一体化工作台',
        insuredUsers: 128600,
        activeServices: 14,
        completionRate: 96.8,
        todo: tasks.length,
      },
    }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/social-insurance') {
    json(res, 200, { success: true, data: insurance }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/transfers') {
    json(res, 200, { success: true, data: transfers }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/tasks') {
    json(res, 200, { success: true, data: tasks }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/search') {
    const keyword = url.searchParams.get('q') || url.searchParams.get('keyword') || '';
    const data = [
      { title: '社保查询', category: '社保服务' },
      { title: '关系转移', category: '社保服务' },
      { title: '失业登记/申领', category: '民生服务' },
      { title: '待遇资格认证', category: '民生服务' },
      { title: '养老金测算', category: '社保服务' },
    ].filter((item) => !keyword || item.title.includes(keyword) || item.category.includes(keyword));
    json(res, 200, { success: true, keyword, data }, origin);
    return;
  }

  if (req.method === 'POST' && (url.pathname === '/api/transfers' || url.pathname === '/api/unemployment' || url.pathname === '/api/events')) {
    const body = await readJson(req);
    db.prepare('INSERT INTO service_events (event_name, payload) VALUES (?, ?)').run(url.pathname.slice(5), JSON.stringify(body));
    json(res, 201, { success: true, message: 'submitted', data: body }, origin);
    return;
  }

  json(res, 404, { success: false, error: 'API not found', path: url.pathname }, origin);
});

server.listen(port, host, () => {
  console.log(`may-89120 backend listening on http://${host}:${port}`);
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
