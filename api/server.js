import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59127);
const dbPath = path.join(__dirname, 'civic-services.db');

mkdirSync(__dirname, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    online_available INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    applicant TEXT NOT NULL,
    status TEXT NOT NULL,
    current_step INTEGER NOT NULL,
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
`);

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM services').get().count;
  if (count > 0) return;

  const insertService = db.prepare(`
    INSERT INTO services (id, name, department, category, description, online_available)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  [
    ['ss1', '社保缴费查询', '人社局', '社保', '查询个人社保缴费记录及缴费状态', 1],
    ['hf1', '公积金提取', '公积金中心', '公积金', '住房消费、退休等情形公积金提取', 1],
    ['ps1', '居住证办理', '公安局', '户籍', '非本市户籍人员居住证申领', 1],
    ['mi1', '医保报销', '医保局', '医疗', '门诊及住院医疗费用报销', 1],
    ['tr1', '车辆年检预约', '交警支队', '交通', '机动车年度检验预约', 1],
    ['mk1', '营业执照办理', '市场监管局', '商务', '企业或个体工商户营业执照办理', 1],
  ].forEach((item) => insertService.run(...item));

  db.prepare(`
    INSERT INTO applications (id, service_id, applicant, status, current_step)
    VALUES (?, ?, ?, ?, ?)
  `).run('app-20260609-001', 'hf1', '王伟', 'processing', 2);

  db.prepare(`
    INSERT INTO audit_events (actor, action, target, result)
    VALUES (?, ?, ?, ?)
  `).run('系统', '初始化政务服务数据', '掌上办事中枢', '完成');
}

seed();

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function rows(sql, ...params) {
  return db.prepare(sql).all(...params);
}

function handle(req, res) {
  const requestUrl = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { success: true });
  }

  if (requestUrl.pathname === '/api/health') {
    const serviceCount = db.prepare('SELECT COUNT(*) AS count FROM services').get().count;
    const applicationCount = db.prepare('SELECT COUNT(*) AS count FROM applications').get().count;
    return sendJson(res, 200, {
      success: true,
      message: 'ok',
      service: 'may-89127 backend',
      database: path.basename(dbPath),
      data: { serviceCount, applicationCount },
    });
  }

  if (requestUrl.pathname === '/api/services') {
    const category = requestUrl.searchParams.get('category') || '';
    const query = requestUrl.searchParams.get('q') || '';
    const filters = [];
    const params = [];
    if (category) {
      filters.push('category = ?');
      params.push(category);
    }
    if (query) {
      filters.push('(name LIKE ? OR description LIKE ? OR department LIKE ?)');
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    return sendJson(res, 200, {
      success: true,
      data: rows(`SELECT * FROM services ${where} ORDER BY department, name`, ...params),
    });
  }

  if (requestUrl.pathname === '/api/search') {
    const query = requestUrl.searchParams.get('q') || '';
    return sendJson(res, 200, {
      success: true,
      data: rows(
        `SELECT id, name, department, category, description FROM services
         WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
         ORDER BY department, name`,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`,
      ),
    });
  }

  if (
    requestUrl.pathname === '/api/user/profile' ||
    requestUrl.pathname === '/api/users/profile' ||
    requestUrl.pathname === '/api/auth/me'
  ) {
    return sendJson(res, 200, {
      success: true,
      data: {
        id: 'citizen-demo',
        name: '王伟',
        role: 'citizen',
        tags: ['郑州市民', '高频办件', '政策匹配'],
      },
    });
  }

  if (requestUrl.pathname === '/api/admin/stats' || requestUrl.pathname === '/api/admin/dashboard') {
    return sendJson(res, 200, {
      success: true,
      data: {
        services: db.prepare('SELECT COUNT(*) AS count FROM services').get().count,
        processingApplications: db.prepare("SELECT COUNT(*) AS count FROM applications WHERE status = 'processing'").get().count,
        categories: rows('SELECT category, COUNT(*) AS count FROM services GROUP BY category'),
        auditEvents: rows('SELECT * FROM audit_events ORDER BY id DESC LIMIT 10'),
      },
    });
  }

  if (requestUrl.pathname.startsWith('/api/')) {
    return sendJson(res, 404, { success: false, error: 'API not found' });
  }

  return sendJson(res, 404, { success: false, error: 'Not found' });
}

const server = http.createServer((req, res) => {
  try {
    handle(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { success: false, error: 'Server internal error' });
  }
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
