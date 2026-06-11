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
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59119);
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
  ['dashboard_ready', { module: '运营仪表盘', stations: 5 }],
  ['device_map_ready', { module: '充电桩地图', devices: 30 }],
  ['billing_ready', { module: '订单与计费', realtime: true }],
]);

const stations = [
  { station_id: 'ST0001', name: '南山科技园站', region: '南山区', status: '运营中', total_piles: 6 },
  { station_id: 'ST0002', name: '福田CBD站', region: '福田区', status: '运营中', total_piles: 6 },
  { station_id: 'ST0003', name: '龙华民治站', region: '龙华区', status: '维护中', total_piles: 6 },
];

const devices = Array.from({ length: 12 }, (_, index) => ({
  pile_id: `P${String(index + 1).padStart(4, '0')}`,
  station_id: stations[index % stations.length].station_id,
  station_name: stations[index % stations.length].name,
  status: ['充电中', '空闲', '故障', '离线'][index % 4],
  health_score: 72 + (index % 6) * 4,
  model: ['EVCS-A200', 'EVCS-B300', 'EVCS-C400'][index % 3],
}));

const orders = Array.from({ length: 8 }, (_, index) => ({
  order_id: `ORD202606${String(index + 1).padStart(4, '0')}`,
  pile_id: devices[index % devices.length].pile_id,
  amount: Number((8 + index * 1.7).toFixed(2)),
  status: index % 3 === 0 ? '进行中' : '已完成',
}));

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
      project: 'may-89119',
      service: '充电桩运营监管后端',
      database: path.relative(projectRoot, dbPath),
      events: db.prepare('SELECT COUNT(*) AS count FROM service_events').get().count,
      time: new Date().toISOString(),
    }, origin);
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/api/admin/stats' || url.pathname === '/api/admin/dashboard')) {
    json(res, 200, {
      success: true,
      data: {
        stations: stations.length,
        devices: devices.length,
        charging: devices.filter((item) => item.status === '充电中').length,
        alerts: devices.filter((item) => item.status === '故障').length,
        revenue: orders.reduce((sum, item) => sum + item.amount, 0).toFixed(2),
      },
    }, origin);
    return;
  }

  if (req.method === 'POST' && (url.pathname === '/api/auth/login' || url.pathname === '/api/auth/register')) {
    const body = await readJson(req);
    json(res, url.pathname.endsWith('/register') ? 201 : 200, {
      success: true,
      token: 'charging-admin-demo-token',
      user: {
        id: 'admin',
        username: body.username || body.phone || '超级管理员',
        role: 'admin',
        permissions: ['devices.manage', 'orders.review', 'billing.configure'],
      },
    }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/auth/me') {
    json(res, 200, {
      success: true,
      user: {
        id: 'admin',
        username: '超级管理员',
        role: 'admin',
        online: true,
      },
    }, origin);
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/api/users/profile' || url.pathname === '/api/user/profile')) {
    json(res, 200, {
      success: true,
      data: {
        id: 'admin',
        name: '超级管理员',
        role: '运营管理端',
        orders: orders.length,
        alerts: devices.filter((item) => item.status === '故障').length,
      },
    }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/stations') {
    json(res, 200, { success: true, data: stations }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/devices') {
    const status = url.searchParams.get('status') || '';
    const data = devices.filter((item) => !status || item.status === status);
    json(res, 200, { success: true, data, total: data.length }, origin);
    return;
  }

  const deviceMatch = url.pathname.match(/^\/api\/devices\/([^/]+)$/);
  if (req.method === 'GET' && deviceMatch) {
    const data = devices.find((item) => item.pile_id === deviceMatch[1]);
    json(res, data ? 200 : 404, data ? { success: true, data } : { success: false, error: 'device not found' }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/orders') {
    json(res, 200, { success: true, data: orders, total: orders.length }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/products') {
    const data = devices.map((item) => ({
      id: item.pile_id,
      name: `${item.station_name} ${item.pile_id}`,
      status: item.status,
      stock: item.status === '空闲' ? 1 : 0,
      price: 0,
    }));
    json(res, 200, { success: true, data, total: data.length }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/cart') {
    json(res, 200, {
      success: true,
      data: [{ id: 'inspection-cart', name: '待提交巡检工单', quantity: 1 }],
    }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/alerts') {
    const data = devices
      .filter((item) => item.status === '故障' || item.health_score < 80)
      .map((item) => ({ id: `AL-${item.pile_id}`, pile_id: item.pile_id, level: item.health_score < 80 ? 'warning' : 'critical', message: `${item.pile_id} 需要巡检` }));
    json(res, 200, { success: true, data }, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/search') {
    const keyword = url.searchParams.get('q') || url.searchParams.get('keyword') || '';
    const data = devices.filter((item) => !keyword || item.pile_id.includes(keyword) || item.station_name.includes(keyword));
    json(res, 200, { success: true, keyword, data }, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/events') {
    const body = await readJson(req);
    db.prepare('INSERT INTO service_events (event_name, payload) VALUES (?, ?)').run(body.event || 'runtime_event', JSON.stringify(body));
    json(res, 201, { success: true, data: body }, origin);
    return;
  }

  json(res, 404, { success: false, error: 'API not found', path: url.pathname }, origin);
});

server.listen(port, host, () => {
  console.log(`may-89119 backend listening on http://${host}:${port}`);
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
