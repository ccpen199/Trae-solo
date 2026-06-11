import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'real-estate.db');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59126);

mkdirSync(__dirname, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    district TEXT NOT NULL,
    price INTEGER NOT NULL,
    rooms INTEGER NOT NULL,
    verification_status TEXT NOT NULL,
    vr_enabled INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    store TEXT NOT NULL,
    credit_score INTEGER NOT NULL,
    pending_tasks INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operator TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM properties').get().count;
  if (count > 0) return;

  const insertProperty = db.prepare(`
    INSERT INTO properties (id, title, district, price, rooms, verification_status, vr_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAgent = db.prepare(`
    INSERT INTO agents (id, name, store, credit_score, pending_tasks)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (operator, action, target, result)
    VALUES (?, ?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    [
      ['p-001', '翠湖天地 3室2厅', '黄浦区', 2380, 3, 'verified', 1],
      ['p-002', '保利西岸 1室1厅', '徐汇区', 780, 1, 'flagged', 0],
      ['p-003', '浦东星河湾 4室2厅', '浦东新区', 1980, 4, 'verified', 1],
      ['p-004', '长宁观邸 2室2厅', '长宁区', 980, 2, 'pending', 1],
    ].forEach((item) => insertProperty.run(...item));

    [
      ['a-001', '赵强', '翠湖天地店', 86, 3],
      ['a-002', '刘晓梅', '虹口店', 92, 1],
      ['a-003', '王浩', '浦东联洋店', 74, 5],
    ].forEach((item) => insertAgent.run(...item));

    insertAudit.run('系统', '初始化房源验真数据', '全量房源', '完成');
    insertAudit.run('管理员', '信用分复议', '经纪人 赵强 68→73', '通过');
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
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

function rows(sql, ...params) {
  return db.prepare(sql).all(...params);
}

function handle(req, res) {
  const requestUrl = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { success: true });
  }

  if (requestUrl.pathname === '/api/health') {
    const propertyCount = db.prepare('SELECT COUNT(*) AS count FROM properties').get().count;
    const agentCount = db.prepare('SELECT COUNT(*) AS count FROM agents').get().count;
    return sendJson(res, 200, {
      success: true,
      message: 'ok',
      service: 'may-89126 backend',
      database: path.basename(dbPath),
      data: { propertyCount, agentCount },
    });
  }

  if (requestUrl.pathname === '/api/properties') {
    const district = requestUrl.searchParams.get('district') || '';
    const status = requestUrl.searchParams.get('status') || '';
    const params = [];
    const filters = [];
    if (district) {
      filters.push('district = ?');
      params.push(district);
    }
    if (status) {
      filters.push('verification_status = ?');
      params.push(status);
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    return sendJson(res, 200, {
      success: true,
      data: rows(`SELECT * FROM properties ${where} ORDER BY price DESC`, ...params),
    });
  }

  if (requestUrl.pathname === '/api/agents') {
    return sendJson(res, 200, {
      success: true,
      data: rows('SELECT * FROM agents ORDER BY credit_score DESC'),
    });
  }

  if (requestUrl.pathname === '/api/admin/audit') {
    return sendJson(res, 200, {
      success: true,
      data: rows('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 20'),
    });
  }

  if (requestUrl.pathname === '/api/dashboard') {
    const summary = {
      verified: db.prepare("SELECT COUNT(*) AS count FROM properties WHERE verification_status = 'verified'").get().count,
      pending: db.prepare("SELECT COUNT(*) AS count FROM properties WHERE verification_status = 'pending'").get().count,
      flagged: db.prepare("SELECT COUNT(*) AS count FROM properties WHERE verification_status = 'flagged'").get().count,
      agents: db.prepare('SELECT COUNT(*) AS count FROM agents').get().count,
    };
    return sendJson(res, 200, { success: true, data: summary });
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
