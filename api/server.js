import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'ip-platform.db');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59124);

mkdirSync(__dirname, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS trademark_cases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    category TEXT NOT NULL,
    progress INTEGER NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    work_type TEXT NOT NULL,
    hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS auth_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM trademark_cases').get().count;
  if (count > 0) return;

  const insertCase = db.prepare(`
    INSERT INTO trademark_cases (id, name, client, category, progress, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const cases = [
    ['TM-2026-001', '鸿蒙生态商标注册', '华为技术有限公司', '第9类 科学仪器', 68, '实审中'],
    ['TM-2026-023', '瑞幸咖啡商标监测', '瑞幸咖啡中国有限公司', '第35类 广告销售', 86, '公告中'],
    ['PT-2026-012', '5G 通信专利申请', '中兴通讯股份有限公司', 'H04W 通信网络', 52, '撰写中'],
    ['CR-2026-007', '短视频版权登记', '字节跳动有限公司', '视听作品', 100, '已登记'],
  ];
  db.exec('BEGIN');
  try {
    for (const item of cases) insertCase.run(...item);
    db.prepare(`
      INSERT INTO audit_events (actor, action, target, result)
      VALUES (?, ?, ?, ?)
    `).run('系统', '初始化健康数据', '知产全链条平台', '完成');
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

seed();

function ensureDefaultUsers() {
  const upsertUser = db.prepare(`
    INSERT INTO users (id, username, password, role, display_name, status)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
      password = excluded.password,
      role = excluded.role,
      display_name = excluded.display_name,
      status = excluded.status
  `);
  [
    ['user-agent', 'agent', 'agent123', 'agent', '张代理', 'active'],
    ['user-admin', 'admin', 'Admin@123', 'admin', '后台管理员', 'active'],
    ['user-client', 'client01', 'client123', 'client', '企业客户', 'active'],
  ].forEach((row) => upsertUser.run(...row));
}

ensureDefaultUsers();

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) req.destroy(new Error('request body too large'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function rows(sql, ...params) {
  return db.prepare(sql).all(...params);
}

function row(sql, ...params) {
  return db.prepare(sql).get(...params);
}

function publicUser(user) {
  return user ? {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.display_name,
    status: user.status,
  } : null;
}

function makeToken(user) {
  return Buffer.from(JSON.stringify({
    id: user.id,
    username: user.username,
    role: user.role,
    issuedAt: Date.now(),
  })).toString('base64url');
}

function getTokenUser(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    return publicUser(row('SELECT * FROM users WHERE id = ? AND status = ?', payload.id, 'active'));
  } catch {
    return null;
  }
}

function logAuth(username, action, result) {
  db.prepare('INSERT INTO auth_events (username, action, result) VALUES (?, ?, ?)').run(username, action, result);
}

function passwordMatches(user, password) {
  const aliases = {
    admin: ['Admin@123', 'admin123'],
    agent: ['agent123'],
    client01: ['client123'],
  };
  return user.password === password || (aliases[user.username] || []).includes(password);
}

async function handle(req, res) {
  const requestUrl = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { success: true });
  }

  if (requestUrl.pathname === '/api/health') {
    const caseCount = db.prepare('SELECT COUNT(*) AS count FROM trademark_cases').get().count;
    const uploadCount = db.prepare('SELECT COUNT(*) AS count FROM uploads').get().count;
    return sendJson(res, 200, {
      success: true,
      message: 'ok',
      service: 'may-89124 backend',
      database: path.basename(dbPath),
      data: { caseCount, uploadCount },
    });
  }

  if (requestUrl.pathname === '/api/auth/login' && req.method === 'POST') {
    const rawBody = await readBody(req).catch(() => '{}');
    const body = JSON.parse(rawBody || '{}');
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const user = row('SELECT * FROM users WHERE username = ?', username);

    if (!user || !passwordMatches(user, password) || user.status !== 'active') {
      logAuth(username || 'anonymous', 'login', 'failed');
      return sendJson(res, 401, { success: false, error: '账号或密码错误' });
    }

    logAuth(username, 'login', 'success');
    return sendJson(res, 200, { success: true, data: { token: makeToken(user), user: publicUser(user) } });
  }

  if (requestUrl.pathname === '/api/auth/register' && req.method === 'POST') {
    const rawBody = await readBody(req).catch(() => '{}');
    const body = JSON.parse(rawBody || '{}');
    const username = String(body.username || '').trim();
    const password = String(body.password || '').trim();
    const displayName = String(body.displayName || username || '企业客户').trim();

    if (!username || password.length < 6) {
      return sendJson(res, 400, { success: false, error: '用户名不能为空，密码至少 6 位' });
    }
    if (row('SELECT id FROM users WHERE username = ?', username)) {
      return sendJson(res, 409, { success: false, error: '账号已存在' });
    }

    const id = `user-${Date.now()}`;
    db.prepare(`
      INSERT INTO users (id, username, password, role, display_name, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, username, password, 'client', displayName, 'active');
    const user = row('SELECT * FROM users WHERE id = ?', id);
    logAuth(username, 'register', 'success');
    return sendJson(res, 200, { success: true, data: { token: makeToken(user), user: publicUser(user) } });
  }

  if (requestUrl.pathname === '/api/auth/me') {
    const user = getTokenUser(req);
    if (!user) return sendJson(res, 200, { success: false, authenticated: false, error: '未登录', data: null });
    return sendJson(res, 200, { success: true, data: user });
  }

  if (requestUrl.pathname === '/api/user/profile' || requestUrl.pathname === '/api/users/profile') {
    const user = getTokenUser(req) || {
      id: 'guest',
      username: 'guest',
      role: 'client',
      displayName: '访客客户',
      status: 'anonymous',
    };
    return sendJson(res, 200, {
      success: true,
      data: {
        ...user,
        profileSections: ['个人中心', '案件进度', '通知设置'],
      },
    });
  }

  if (
    requestUrl.pathname === '/api/dashboard' ||
    requestUrl.pathname === '/api/admin/stats' ||
    requestUrl.pathname === '/api/admin/dashboard'
  ) {
    return sendJson(res, 200, {
      success: true,
      data: {
        summary: { activeCases: 23, newThisMonth: 8, pendingReview: 5, expiringSoon: 3 },
        cases: rows('SELECT * FROM trademark_cases ORDER BY progress DESC'),
        auditEvents: rows('SELECT * FROM audit_events ORDER BY id DESC LIMIT 10'),
        authEvents: rows('SELECT * FROM auth_events ORDER BY id DESC LIMIT 10'),
      },
    });
  }

  if (requestUrl.pathname === '/api/search') {
    const keyword = requestUrl.searchParams.get('q') || '';
    const like = `%${keyword}%`;
    const caseResults = rows(
      `SELECT id, name, client, category, progress, status
       FROM trademark_cases
       WHERE name LIKE ? OR client LIKE ? OR category LIKE ? OR status LIKE ?
       ORDER BY progress DESC`,
      like,
      like,
      like,
      like,
    );
    const trademarkResults = [
      { id: 1, name: '星辰科技', regNo: '2026-000123', similarity: 95, category: '第9类 科学仪器' },
      { id: 2, name: '云翼信息', regNo: '2026-000456', similarity: 87, category: '第42类 科技服务' },
      { id: 3, name: '蓝鲸数据', regNo: '2026-000789', similarity: 82, category: '第9类 科学仪器' },
    ].filter((item) => !keyword || item.name.includes(keyword) || item.category.includes(keyword));
    return sendJson(res, 200, {
      success: true,
      data: {
        keyword,
        items: [...caseResults, ...trademarkResults],
        cases: caseResults,
        trademarks: trademarkResults,
        total: caseResults.length + trademarkResults.length,
      },
    });
  }

  if (requestUrl.pathname === '/api/trademark/search') {
    const threshold = Number(requestUrl.searchParams.get('threshold') || 50);
    const category = requestUrl.searchParams.get('category') || '';
    const results = [
      { id: 1, name: '星辰科技', regNo: '2026-000123', similarity: 95, category: '第9类 科学仪器' },
      { id: 2, name: '云翼信息', regNo: '2026-000456', similarity: 87, category: '第42类 科技服务' },
      { id: 3, name: '蓝鲸数据', regNo: '2026-000789', similarity: 82, category: '第9类 科学仪器' },
      { id: 4, name: '锐视传媒', regNo: '2026-000567', similarity: 71, category: '第35类 广告销售' },
    ].filter((item) => item.similarity >= threshold && (!category || item.category.includes(category)));
    return sendJson(res, 200, { success: true, data: results });
  }

  if (requestUrl.pathname === '/api/mock-upload' && req.method === 'POST') {
    const rawBody = await readBody(req).catch(() => '');
    const hashSource = `${Date.now()}:${rawBody.length}`;
    const hash = Buffer.from(hashSource).toString('hex').padEnd(64, '0').slice(0, 64);
    const result = db.prepare(`
      INSERT INTO uploads (file_name, work_type, hash)
      VALUES (?, ?, ?)
      RETURNING id, file_name, work_type, hash, created_at
    `).get('uploaded-work.dat', '作品存证', hash);
    return sendJson(res, 200, { success: true, data: result });
  }

  if (requestUrl.pathname === '/api/mock-upload' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      data: rows('SELECT * FROM uploads ORDER BY id DESC LIMIT 20'),
    });
  }

  if (requestUrl.pathname.startsWith('/api/')) {
    return sendJson(res, 404, { success: false, error: 'API not found' });
  }

  return sendJson(res, 404, { success: false, error: 'Not found' });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error(error);
    sendJson(res, 500, { success: false, error: 'Server internal error' });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
