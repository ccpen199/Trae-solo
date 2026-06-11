const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const projectDir = path.resolve(__dirname, '..');
loadEnv(path.join(projectDir, '.env'));

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || 59102);
const dbPath = path.join(projectDir, 'data', 'app.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
initDatabase();

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';

  if (req.method === 'OPTIONS') {
    return write(res, 204, '', origin);
  }

  try {
    const url = new URL(req.url || '/', `http://${host}:${port}`);
    const pathname = url.pathname;

    if (req.method === 'GET' && pathname === '/api/health') {
      return json(res, 200, {
        ok: true,
        status: 'ok',
        project: 'may-89102',
        name: '上海一网通办移动端超级系统后台服务中枢',
        db: dbPath,
        counts: summaryCounts(),
        time: new Date().toISOString()
      }, origin);
    }

    if (req.method === 'GET' && (pathname === '/api/profile' || pathname === '/api/user/profile' || pathname === '/api/users/profile')) {
      const user = one('SELECT * FROM users WHERE id = 1');
      return json(res, 200, {
        user,
        identity: one('SELECT * FROM identities WHERE user_id = 1'),
        certificates: all('SELECT * FROM certificates WHERE user_id = ? ORDER BY id', [1]),
        dataVault: all('SELECT * FROM personal_data WHERE user_id = ? ORDER BY sort_order', [1]),
        applications: all('SELECT * FROM applications WHERE user_id = ? ORDER BY id DESC LIMIT 10', [1])
      }, origin);
    }

    if (req.method === 'GET' && pathname === '/api/auth/me') {
      const user = one('SELECT * FROM users WHERE id = 1');
      return json(res, 200, {
        ok: true,
        user,
        role: 'admin',
        permissions: ['search', 'service-admin', 'audit-read']
      }, origin);
    }

    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const body = await readJson(req);
      addAudit('登录认证', `${body.phone || body.username || '演示用户'} 使用随申码完成统一登录`);
      return json(res, 200, {
        token: 'demo-token-may-89102',
        user: one('SELECT * FROM users WHERE id = 1')
      }, origin);
    }

    if (req.method === 'GET' && (pathname === '/api/services' || pathname === '/api/search')) {
      const keyword = `%${url.searchParams.get('keyword') || url.searchParams.get('q') || ''}%`;
      const category = url.searchParams.get('category') || '';
      const rows = all(`
        SELECT * FROM services
        WHERE (name LIKE ? OR description LIKE ? OR category LIKE ?)
          AND (? = '' OR category = ?)
        ORDER BY hot DESC, sort_order ASC, id ASC
      `, [keyword, keyword, keyword, category, category]);
      return json(res, 200, { list: rows, total: rows.length }, origin);
    }

    if (req.method === 'GET' && pathname === '/api/orders') {
      const rows = all('SELECT * FROM applications ORDER BY id DESC LIMIT 20');
      return json(res, 200, { list: rows, total: rows.length }, origin);
    }

    if (req.method === 'GET' && (pathname === '/api/teachers' || pathname === '/api/courses' || pathname === '/api/bookings')) {
      const rows = all('SELECT * FROM services ORDER BY hot DESC, sort_order ASC, id ASC LIMIT 12');
      return json(res, 200, {
        list: rows.map((row) => ({
          id: row.id,
          title: row.name,
          name: row.name,
          category: row.category,
          description: row.description,
          status: row.hot ? 'hot' : 'available'
        })),
        total: rows.length
      }, origin);
    }

    if (req.method === 'GET' && pathname === '/api/reminders') {
      const status = url.searchParams.get('status') || '';
      const rows = all(`
        SELECT * FROM reminders
        WHERE (? = '' OR status = ?)
        ORDER BY priority DESC, due_date ASC, id ASC
      `, [status, status]);
      return json(res, 200, { list: rows, total: rows.length }, origin);
    }

    if (req.method === 'POST' && pathname === '/api/reminders') {
      const body = await readJson(req);
      const result = db.prepare(`
        INSERT INTO reminders (title, type, channel, due_date, priority, status, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        body.title || '主动服务提醒',
        body.type || '政务提醒',
        body.channel || '随申办消息',
        body.dueDate || body.due_date || new Date().toISOString().slice(0, 10),
        Number(body.priority || 3),
        body.status || '待推送',
        body.description || '由后台服务中枢生成的主动式服务推送'
      );
      addAudit('主动推送', `创建提醒 ${body.title || '主动服务提醒'}`);
      return json(res, 201, { id: Number(result.lastInsertRowid), message: '提醒规则已创建' }, origin);
    }

    if (req.method === 'POST' && pathname === '/api/applications') {
      const body = await readJson(req);
      const service = one('SELECT name FROM services WHERE id = ?', [Number(body.serviceId || body.service_id || 1)]) || { name: '一网通办服务' };
      const result = db.prepare(`
        INSERT INTO applications (user_id, service_name, status, submit_channel, created_at)
        VALUES (1, ?, ?, ?, ?)
      `).run(service.name, '受理中', body.channel || '移动端', new Date().toISOString());
      addAudit('事项办理', `提交 ${service.name}`);
      return json(res, 201, { id: Number(result.lastInsertRowid), message: '事项已提交并进入受理' }, origin);
    }

    if (req.method === 'GET' && (pathname === '/api/admin/summary' || pathname === '/api/admin/dashboard')) {
      return json(res, 200, {
        counts: summaryCounts(),
        reminders: all('SELECT type, COUNT(*) AS count FROM reminders GROUP BY type ORDER BY count DESC'),
        channels: all('SELECT channel, COUNT(*) AS count FROM reminders GROUP BY channel ORDER BY count DESC'),
        auditLogs: all('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 12')
      }, origin);
    }

    if (req.method === 'GET' && pathname === '/api/audit') {
      return json(res, 200, { list: all('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50') }, origin);
    }

    if (req.method === 'GET' && pathname === '/api') {
      return json(res, 200, {
        project: 'may-89102',
        endpoints: ['/api/health', '/api/profile', '/api/services', '/api/reminders', '/api/admin/summary']
      }, origin);
    }

    return json(res, 404, { ok: false, error: 'API endpoint not found', path: pathname }, origin);
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message || String(error) }, origin);
  }
});

server.listen(port, host, () => {
  console.log(`Backend ready on http://${host}:${port}`);
  console.log(`SQLite database: ${dbPath}`);
});

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      district TEXT NOT NULL,
      real_name_status TEXT NOT NULL,
      credit_score INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS identities (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      suishen_code TEXT NOT NULL,
      status TEXT NOT NULL,
      last_verified_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS personal_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      value TEXT NOT NULL,
      status TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      entry TEXT NOT NULL,
      hot INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      channel TEXT NOT NULL,
      due_date TEXT NOT NULL,
      priority INTEGER NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      service_name TEXT NOT NULL,
      status TEXT NOT NULL,
      submit_channel TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  if (scalar('SELECT COUNT(*) FROM users') === 0) {
    db.prepare('INSERT INTO users VALUES (1, ?, ?, ?, ?, ?)')
      .run('王一网', '13800138000', '浦东新区', '已实名', 782);
    db.prepare('INSERT INTO identities VALUES (1, 1, ?, ?, ?)')
      .run('SH-SSM-2026-0001', '随申码绿码', new Date().toISOString());
  }

  if (scalar('SELECT COUNT(*) FROM certificates') === 0) {
    const stmt = db.prepare('INSERT INTO certificates (user_id, name, issuer, status, updated_at) VALUES (1, ?, ?, ?, ?)');
    [
      ['居民身份证电子证照', '上海市公安局', '可调取'],
      ['社会保障卡电子证照', '上海市人社局', '可调取'],
      ['不动产权电子证明', '上海市规划资源局', '需二次授权'],
      ['居住证电子证照', '上海市大数据中心', '可调取']
    ].forEach((item) => stmt.run(item[0], item[1], item[2], new Date().toISOString()));
  }

  if (scalar('SELECT COUNT(*) FROM personal_data') === 0) {
    const stmt = db.prepare('INSERT INTO personal_data (user_id, name, category, value, status, sort_order) VALUES (1, ?, ?, ?, ?, ?)');
    [
      ['养老金账户', '三金查询', '累计缴费 126 个月', '已同步', 1],
      ['医保个人账户', '三金查询', '余额 3862.50 元', '已同步', 2],
      ['公积金账户', '三金查询', '月缴存 2880 元', '已同步', 3],
      ['健康档案', '健康数据', '最近体检 2026-05-18', '需授权查看', 4],
      ['个人信用报告', '信用服务', '信用良好，无逾期记录', '可在线申请', 5]
    ].forEach((item) => stmt.run(...item));
  }

  if (scalar('SELECT COUNT(*) FROM services') === 0) {
    const stmt = db.prepare('INSERT INTO services (name, category, description, entry, hot, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    [
      ['随申码统一身份核验', '身份凭证', '以随申码作为移动端统一身份凭证，完成实名、授权和办事状态核验。', '立即核验', 1, 1],
      ['电子证照调取', '电子证照', '统一调取身份证、社保卡、居住证等电子证照，支持办件材料免提交。', '调取证照', 1, 2],
      ['三金查询', '个人数据', '聚合社保、医保、公积金账户查询，展示缴存、余额和异动提醒。', '查询三金', 1, 3],
      ['健康档案授权', '健康数据', '对接居民健康档案、体检记录和慢病随访信息，按需授权给办事场景。', '授权查看', 0, 4],
      ['信用报告申请', '信用服务', '在线发起个人信用报告申请，接收生成进度和结果通知。', '申请报告', 0, 5],
      ['主动服务推送', '主动提醒', '配置医保到期、学籍变动、证照过期等主动式服务推送规则。', '配置提醒', 1, 6]
    ].forEach((item) => stmt.run(...item));
  }

  if (scalar('SELECT COUNT(*) FROM reminders') === 0) {
    const stmt = db.prepare('INSERT INTO reminders (title, type, channel, due_date, priority, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
    [
      ['医保参保即将到期提醒', '医保到期', '随申办消息', '2026-06-18', 5, '待推送', '检测到居民医保参保周期即将结束，建议提前续保。'],
      ['学籍变动材料复用提醒', '学籍变动', '短信+站内信', '2026-06-12', 4, '已推送', '学籍状态发生变更，可复用电子证照办理相关事项。'],
      ['居住证电子证照过期提醒', '证照过期', '随申办消息', '2026-07-01', 3, '待推送', '居住证有效期即将到期，可在线预约续签。'],
      ['信用报告年度更新提醒', '信用报告', '站内信', '2026-06-30', 2, '待确认', '年度信用报告可在线申请并下载。']
    ].forEach((item) => stmt.run(...item));
  }

  if (scalar('SELECT COUNT(*) FROM applications') === 0) {
    const stmt = db.prepare('INSERT INTO applications (user_id, service_name, status, submit_channel, created_at) VALUES (1, ?, ?, ?, ?)');
    [
      ['电子证照调取', '已办结', '移动端'],
      ['三金查询', '已办结', '移动端'],
      ['信用报告申请', '受理中', '移动端']
    ].forEach((item) => stmt.run(item[0], item[1], item[2], new Date().toISOString()));
  }

  if (scalar('SELECT COUNT(*) FROM audit_logs') === 0) {
    addAudit('系统启动', '初始化上海一网通办移动端后台服务中枢演示数据');
  }
}

function summaryCounts() {
  return {
    users: scalar('SELECT COUNT(*) FROM users'),
    certificates: scalar('SELECT COUNT(*) FROM certificates'),
    services: scalar('SELECT COUNT(*) FROM services'),
    reminders: scalar('SELECT COUNT(*) FROM reminders'),
    applications: scalar('SELECT COUNT(*) FROM applications')
  };
}

function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

function one(sql, params = []) {
  return db.prepare(sql).get(...params);
}

function scalar(sql, params = []) {
  const row = one(sql, params);
  return row ? Number(Object.values(row)[0]) : 0;
}

function addAudit(action, detail) {
  db.prepare('INSERT INTO audit_logs (action, detail, created_at) VALUES (?, ?, ?)')
    .run(action, detail, new Date().toISOString());
}

function readJson(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(Object.fromEntries(new URLSearchParams(body)));
      }
    });
  });
}

function write(res, status, body, origin = '', contentType = 'text/plain; charset=utf-8') {
  const allowOrigin = /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin) ? origin : '*';
  res.writeHead(status, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
  });
  res.end(body);
}

function json(res, status, payload, origin = '') {
  write(res, status, JSON.stringify(payload), origin, 'application/json; charset=utf-8');
}
