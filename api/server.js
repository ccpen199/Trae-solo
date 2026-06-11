import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'talent-match.db');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59129);

mkdirSync(__dirname, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS positions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    salary TEXT NOT NULL,
    status TEXT NOT NULL,
    applicants INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS talent_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    position_count INTEGER NOT NULL,
    talent_count INTEGER NOT NULL
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
  const count = db.prepare('SELECT COUNT(*) AS count FROM positions').get().count;
  if (count > 0) return;

  const insertPosition = db.prepare(`
    INSERT INTO positions (id, title, category, department, location, salary, status, applicants, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['j1', '功能安全经理', '智能驾驶', '自动驾驶事业部', '北京/上海', '50-80K', '招聘中', 47, '2026-06-09'],
    ['j2', 'BMS高级算法工程师', '新能源', '电池系统部', '上海/合肥', '40-65K', '招聘中', 32, '2026-06-08'],
    ['j3', '底盘CAE高级工程师', '汽车制造', '底盘开发中心', '长春/武汉', '35-55K', '招聘中', 23, '2026-06-07'],
    ['j4', 'IATF质量体系经理', '零部件', '质量管理部', '广州/常州', '35-60K', '草稿', 18, '2026-06-06'],
  ].forEach((row) => insertPosition.run(...row));

  const insertCategory = db.prepare(`
    INSERT INTO talent_categories (id, name, description, position_count, talent_count)
    VALUES (?, ?, ?, ?, ?)
  `);
  [
    ['cat-auto', '汽车制造', '车身、底盘、工艺和整车开发岗位分类', 52, 3240],
    ['cat-parts', '零部件', '质量体系、供应链和关键零部件工程岗位分类', 38, 2860],
    ['cat-ev', '新能源', 'BMS、电驱、电池热管理和充电平台岗位分类', 41, 4120],
    ['cat-ad', '智能驾驶', '功能安全、感知算法和车载软件岗位分类', 25, 2627],
  ].forEach((row) => insertCategory.run(...row));

  db.prepare(`
    INSERT INTO audit_events (actor, action, target, result)
    VALUES (?, ?, ?, ?)
  `).run('系统', '初始化', '车聘通 SQLite 数据库', '完成');
}

seed();

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy(new Error('request body too large'));
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

async function handle(req, res) {
  const requestUrl = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  if (req.method === 'OPTIONS') return sendJson(res, 200, { success: true });

  if (requestUrl.pathname === '/api/health') {
    return sendJson(res, 200, {
      success: true,
      message: 'ok',
      project: 'may-89129',
      database: path.basename(dbPath),
      data: {
        positions: row('SELECT COUNT(*) AS count FROM positions').count,
        categories: row('SELECT COUNT(*) AS count FROM talent_categories').count,
        auditEvents: row('SELECT COUNT(*) AS count FROM audit_events').count,
      },
    });
  }

  if (requestUrl.pathname === '/api/positions' && req.method === 'GET') {
    const keyword = requestUrl.searchParams.get('keyword') || '';
    const category = requestUrl.searchParams.get('category') || '';
    const params = [];
    const conditions = [];
    if (keyword) {
      conditions.push('(title LIKE ? OR department LIKE ? OR location LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const items = rows(`SELECT * FROM positions ${where} ORDER BY created_at DESC`, ...params);
    return sendJson(res, 200, { success: true, data: { items, total: items.length } });
  }

  if (requestUrl.pathname === '/api/positions' && req.method === 'POST') {
    const rawBody = await readBody(req).catch(() => '{}');
    const body = JSON.parse(rawBody || '{}');
    const id = `j-${Date.now()}`;
    db.prepare(`
      INSERT INTO positions (id, title, category, department, location, salary, status, applicants, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.title || '新增汽车人才岗位',
      body.category || '智能驾驶',
      body.department || '招聘管理部',
      body.location || '上海',
      body.salary || '30-50K',
      '招聘中',
      0,
      new Date().toISOString().slice(0, 10),
    );
    db.prepare('INSERT INTO audit_events (actor, action, target, result) VALUES (?, ?, ?, ?)').run('管理员', '新增职位', id, '完成');
    return sendJson(res, 200, { success: true, data: row('SELECT * FROM positions WHERE id = ?', id) });
  }

  if (requestUrl.pathname === '/api/categories') {
    return sendJson(res, 200, {
      success: true,
      data: rows('SELECT * FROM talent_categories ORDER BY position_count DESC'),
    });
  }

  if (requestUrl.pathname === '/api/search') {
    const keyword = requestUrl.searchParams.get('q') || requestUrl.searchParams.get('keyword') || '';
    const like = `%${keyword}%`;
    const positions = rows(
      `SELECT id, title as name, category, department, location, salary, status
       FROM positions
       WHERE title LIKE ? OR category LIKE ? OR department LIKE ? OR location LIKE ?
       ORDER BY created_at DESC`,
      like,
      like,
      like,
      like,
    );
    const categories = rows(
      `SELECT id, name, description, position_count, talent_count
       FROM talent_categories
       WHERE name LIKE ? OR description LIKE ?
       ORDER BY position_count DESC`,
      like,
      like,
    );
    return sendJson(res, 200, {
      success: true,
      data: {
        keyword,
        items: [...positions, ...categories],
        positions,
        categories,
        total: positions.length + categories.length,
      },
    });
  }

  if (
    requestUrl.pathname === '/api/admin/summary' ||
    requestUrl.pathname === '/api/admin/stats' ||
    requestUrl.pathname === '/api/admin/dashboard'
  ) {
    return sendJson(res, 200, {
      success: true,
      data: {
        summary: {
          activePositions: row("SELECT COUNT(*) AS count FROM positions WHERE status = '招聘中'").count,
          draftPositions: row("SELECT COUNT(*) AS count FROM positions WHERE status = '草稿'").count,
          applicants: row('SELECT COALESCE(SUM(applicants), 0) AS total FROM positions').total,
          categories: row('SELECT COUNT(*) AS count FROM talent_categories').count,
        },
        recentEvents: rows('SELECT * FROM audit_events ORDER BY id DESC LIMIT 10'),
      },
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
  console.log(`may-89129 backend ready on http://${HOST}:${PORT}`);
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
