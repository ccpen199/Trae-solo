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
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59117);
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
  ['services_ready', { module: '办事大厅', count: 6 }],
  ['certificates_ready', { module: '电子证照', count: 3 }],
  ['police_admin_ready', { module: '民警工作台', pending: 12 }],
]);

const serviceGuides = [
  { id: 'sg1', name: '户籍证明', category: '户政', processingTime: '3个工作日', fees: '免费' },
  { id: 'sg2', name: '无犯罪记录证明', category: '治安', processingTime: '5个工作日', fees: '免费' },
  { id: 'sg3', name: '居住证申领', category: '户政', processingTime: '7个工作日', fees: '免费' },
  { id: 'sg4', name: '护照办理', category: '出入境', processingTime: '10个工作日', fees: '120元' },
  { id: 'sg5', name: '港澳通行证', category: '出入境', processingTime: '7个工作日', fees: '60元' },
  { id: 'sg6', name: '养犬登记', category: '治安', processingTime: '5个工作日', fees: '免费' },
];

const certificates = [
  { id: 'cert001', typeName: '居民身份证', holderName: '张三', status: 'valid' },
  { id: 'cert002', typeName: '机动车驾驶证', holderName: '张三', status: 'valid' },
  { id: 'cert003', typeName: '中华人民共和国护照', holderName: '张三', status: 'valid' },
];

const applications = [
  { id: 'app001', typeName: '无犯罪记录证明', status: 'processing', currentStep: 2, totalSteps: 4 },
  { id: 'app002', typeName: '户籍证明', status: 'completed', currentStep: 4, totalSteps: 4 },
  { id: 'app003', typeName: '护照办理', status: 'pending', currentStep: 1, totalSteps: 4 },
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
      project: 'may-89117',
      service: '贵州公安政务服务后端',
      database: path.relative(projectRoot, dbPath),
      events: db.prepare('SELECT COUNT(*) AS count FROM service_events').get().count,
      time: new Date().toISOString(),
    }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/services') {
    json(res, 200, { success: true, data: serviceGuides }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/certificates') {
    json(res, 200, { success: true, data: certificates }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/applications') {
    json(res, 200, { success: true, data: applications }, origin);
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/api/admin/stats' || url.pathname === '/api/admin/dashboard')) {
    json(res, 200, {
      success: true,
      data: {
        platform: '贵州公安民警工作台',
        applications: applications.length,
        certificates: certificates.length,
        suggestions: 8,
        onlineConsults: 24,
      },
    }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/search') {
    const keyword = url.searchParams.get('q') || url.searchParams.get('keyword') || '';
    const data = serviceGuides.filter((item) => !keyword || item.name.includes(keyword) || item.category.includes(keyword));
    json(res, 200, { success: true, keyword, data }, origin);
    return;
  }

  if (req.method === 'POST' && (url.pathname === '/api/suggestions' || url.pathname === '/api/consults')) {
    const body = await readJson(req);
    const eventName = url.pathname === '/api/suggestions' ? 'suggestion_submitted' : 'consult_submitted';
    db.prepare('INSERT INTO service_events (event_name, payload) VALUES (?, ?)').run(eventName, JSON.stringify(body));
    json(res, 201, { success: true, message: 'submitted', data: body }, origin);
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/api/auth/me' || url.pathname === '/api/user/profile')) {
    json(res, 200, { success: true, data: { id: 'gz-demo-user', name: '张三', role: 'citizen' } }, origin);
    return;
  }

  json(res, 404, { success: false, error: 'API not found', path: url.pathname }, origin);
});

server.listen(port, host, () => {
  console.log(`may-89117 backend listening on http://${host}:${port}`);
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
