const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const projectDir = process.env.PROJECT_DIR || path.resolve(__dirname, '..');
const projectName = process.env.PROJECT_NAME || path.basename(projectDir);
const host = process.env.HOST || '127.0.0.1';
const backendPort = Number(process.env.BACKEND_PORT || 59089);
const frontendPort = Number(process.env.FRONTEND_PORT || backendPort - 10000);
const dbPath = path.resolve(projectDir, process.env.DB_PATH || 'data/app.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      provider TEXT NOT NULL,
      price INTEGER NOT NULL,
      rating REAL NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER,
      customer TEXT NOT NULL,
      phone TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      contact TEXT NOT NULL,
      detail TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const serviceCount = db.prepare('SELECT COUNT(*) AS count FROM services').get().count;
  if (serviceCount === 0) {
    const insert = db.prepare(`
      INSERT INTO services (title, category, provider, price, rating, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    [
      ['智能投顾组合诊断', '资产规划', 'PinAI 顾问中心', 199, 4.8, '可购买', '分析现金流、风险偏好和持仓结构，输出可执行的调仓建议。'],
      ['小微企业预算管家', '企业服务', '财务自动化实验室', 399, 4.7, '可购买', '为门店和工作室建立收入、成本、库存与税费预算模型。'],
      ['家庭账本自动整理', '个人中心', '本地数据助手', 99, 4.6, '可购买', '导入日常收支，自动生成分类、趋势和异常提醒。'],
      ['发票报销审核', '后台管理', '合规审核台', 149, 4.5, '审核中', '面向管理后台的票据查重、报销规则校验和审批留痕。'],
      ['资金周转测算', '搜索筛选', '现金流引擎', 129, 4.4, '可购买', '按客户、项目和周期筛选测算未来 90 天资金缺口。'],
    ].forEach((item) => insert.run(...item));
  }

  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount === 0) {
    const now = new Date().toISOString();
    db.prepare('INSERT INTO users (name, phone, role, created_at) VALUES (?, ?, ?, ?)').run('演示用户', '13800138000', 'user', now);
    db.prepare('INSERT INTO users (name, phone, role, created_at) VALUES (?, ?, ?, ?)').run('后台管理员', '13900139000', 'admin', now);
  }
}

function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

function get(sql, params = []) {
  return db.prepare(sql).get(...params);
}

function json(res, status, payload, origin) {
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Access-Control-Allow-Origin': origin || `http://127.0.0.1:${frontendPort}`,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    Vary: 'Origin',
  });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(new URLSearchParams(raw));
  }
}

function services(query) {
  const search = String(query.get('search') || query.get('q') || '').trim();
  const category = String(query.get('category') || '').trim();
  let sql = 'SELECT * FROM services WHERE 1=1';
  const params = [];
  if (search) {
    sql += ' AND (title LIKE ? OR provider LIKE ? OR description LIKE ? OR category LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category && category !== '全部') {
    sql += ' AND category = ?';
    params.push(category);
  }
  return all(`${sql} ORDER BY rating DESC, id ASC`, params);
}

function boundedLimit(query, fallback = 12, max = 50) {
  const parsed = Number(query.get('limit') || fallback);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function currentUser() {
  return get('SELECT * FROM users ORDER BY id LIMIT 1');
}

function profileData() {
  return {
    user: currentUser(),
    stats: {
      orders: get('SELECT COUNT(*) AS count FROM orders').count,
      submissions: get('SELECT COUNT(*) AS count FROM submissions').count,
    },
  };
}

function adminSummary() {
  return {
    users: get('SELECT COUNT(*) AS count FROM users').count,
    services: get('SELECT COUNT(*) AS count FROM services').count,
    orders: get('SELECT COUNT(*) AS count FROM orders').count,
    submissions: get('SELECT COUNT(*) AS count FROM submissions').count,
    revenue: get('SELECT COALESCE(SUM(amount), 0) AS total FROM orders').total,
    modules: ['登录注册', '搜索筛选', '购买提交', '个人中心', '后台管理'],
    logs: all('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5'),
  };
}

async function handle(req, res) {
  const origin = req.headers.origin;
  if (req.method === 'OPTIONS') return json(res, 204, {}, origin);
  const url = new URL(req.url || '/', `http://${host}:${backendPort}`);
  const route = url.pathname.replace(/\/$/, '') || '/';

  if (req.method === 'GET' && route === '/api/health') {
    return json(res, 200, { ok: true, status: 'ok', project: projectName, db: dbPath, time: Date.now() }, origin);
  }
  if (req.method === 'GET' && ['/api/services', '/api/products', '/api/tasks', '/api/search', '/api/teachers', '/api/courses', '/api/bookings'].includes(route)) {
    return json(res, 200, { ok: true, data: services(url.searchParams) }, origin);
  }
  if (req.method === 'GET' && route === '/api/categories') {
    return json(res, 200, { ok: true, data: all('SELECT DISTINCT category FROM services ORDER BY category').map((r) => r.category) }, origin);
  }
  if (req.method === 'GET' && route === '/api/orders') {
    const limit = boundedLimit(url.searchParams);
    return json(res, 200, {
      ok: true,
      data: all('SELECT * FROM orders ORDER BY id DESC LIMIT ?', [limit]),
      total: get('SELECT COUNT(*) AS count FROM orders').count,
    }, origin);
  }
  if (req.method === 'GET' && ['/api/profile', '/api/auth/me', '/api/users/profile', '/api/user/profile'].includes(route)) {
    return json(res, 200, { ok: true, data: profileData(), user: currentUser() }, origin);
  }
  if (req.method === 'GET' && ['/api/admin/summary', '/api/admin/dashboard', '/api/admin/stats'].includes(route)) {
    return json(res, 200, {
      ok: true,
      data: adminSummary(),
    }, origin);
  }
  if (req.method === 'GET' && route === '/api/cart') {
    return json(res, 200, {
      ok: true,
      data: {
        items: all('SELECT * FROM orders ORDER BY id DESC LIMIT 5'),
        total: get('SELECT COALESCE(SUM(amount), 0) AS total FROM orders').total,
      },
    }, origin);
  }

  if (req.method === 'POST' && ['/api/auth/login', '/api/auth/register', '/api/login', '/api/register'].includes(route)) {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const phone = String(body.phone || '13800138000');
    let user = get('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user) {
      db.prepare('INSERT INTO users (name, phone, role, created_at) VALUES (?, ?, ?, ?)').run(String(body.name || '注册用户'), phone, 'user', now);
      user = get('SELECT * FROM users WHERE phone = ?', [phone]);
    }
    return json(res, 200, { ok: true, token: `local-token-${user.id}`, user }, origin);
  }
  if (req.method === 'POST' && ['/api/orders', '/api/purchase', '/api/buy'].includes(route)) {
    const body = await readBody(req);
    const serviceId = Number(body.serviceId || body.service_id || 1);
    const item = get('SELECT * FROM services WHERE id = ?', [serviceId]) || get('SELECT * FROM services ORDER BY id LIMIT 1');
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO orders (service_id, customer, phone, amount, status, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(serviceId, String(body.customer || '演示用户'), String(body.phone || '13800138000'), Number(body.amount || item.price), '已提交', String(body.note || '网页提交的购买申请'), now);
    db.prepare('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)').run('user', `提交订单 #${result.lastInsertRowid}`, now);
    return json(res, 200, { ok: true, data: get('SELECT * FROM orders WHERE id = ?', [result.lastInsertRowid]) }, origin);
  }
  if (req.method === 'POST' && ['/api/submissions', '/api/submit', '/api/requests'].includes(route)) {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO submissions (kind, title, contact, detail, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('需求提交', String(body.title || '新的业务需求'), String(body.contact || '13800138000'), String(body.detail || '需要平台安排顾问跟进'), '待处理', now);
    return json(res, 200, { ok: true, data: get('SELECT * FROM submissions WHERE id = ?', [result.lastInsertRowid]) }, origin);
  }

  return json(res, 404, { ok: false, error: `Unknown endpoint: ${route}` }, origin);
}

initDb();
const server = http.createServer((req, res) => handle(req, res).catch((error) => json(res, 500, { ok: false, error: error.message }, req.headers.origin)));
server.listen(backendPort, host, () => {
  console.log(`${projectName} backend listening on http://${host}:${backendPort}`);
  console.log(`SQLite database: ${dbPath}`);
});
