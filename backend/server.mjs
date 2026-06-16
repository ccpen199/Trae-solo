import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const env = loadEnv(path.join(projectRoot, '.env'));

const host = '127.0.0.1';
const port = Number(env.BACKEND_PORT || 59198);
const frontendUrl = env.FRONTEND_URL || 'http://127.0.0.1:49198';
const dbPath = path.resolve(projectRoot, env.DB_PATH || './data/app.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS service_health (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    service TEXT NOT NULL,
    frontend_url TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS resume_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);
db.prepare(`
  INSERT INTO service_health (id, service, frontend_url, updated_at)
  VALUES (1, 'resume-workbench-backend', ?, CURRENT_TIMESTAMP)
  ON CONFLICT(id) DO UPDATE SET frontend_url = excluded.frontend_url, updated_at = CURRENT_TIMESTAMP
`).run(frontendUrl);

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${host}:${port}`);

  if (req.method === 'OPTIONS') {
    return send(res, 204, '');
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
    const health = db.prepare('SELECT service, frontend_url, updated_at FROM service_health WHERE id = 1').get();
    return sendJson(res, 200, {
      status: 'ok',
      service: health.service,
      frontendUrl: health.frontend_url,
      database: path.relative(projectRoot, dbPath),
      updatedAt: health.updated_at,
    });
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/resumes/summary') {
    const totalEvents = db.prepare('SELECT COUNT(*) AS count FROM resume_events').get();
    return sendJson(res, 200, {
      service: '智能简历工作台',
      storage: 'SQLite + IndexedDB local mode',
      totalEvents: totalEvents.count,
      capabilities: ['health-check', 'resume-event-audit', 'local-data-summary'],
    });
  }

  if (
    req.method === 'GET' &&
    ['/api/auth/me', '/api/users/profile', '/api/user/profile'].includes(requestUrl.pathname)
  ) {
    const totalEvents = db.prepare('SELECT COUNT(*) AS count FROM resume_events').get();
    return sendJson(res, 200, {
      id: 'local-user',
      name: '本地简历用户',
      role: 'user',
      accountMode: 'local-only',
      privacyMode: 'AES local encryption',
      frontendUrl,
      resumeEventCount: totalEvents.count,
      capabilities: ['profile-overview', 'local-resume-cache', 'privacy-settings'],
    });
  }

  if (req.method === 'GET' && (requestUrl.pathname === '/api/admin/stats' || requestUrl.pathname === '/api/admin/dashboard')) {
    const totalEvents = db.prepare('SELECT COUNT(*) AS count FROM resume_events').get();
    return sendJson(res, 200, {
      service: '智能简历工作台',
      module: 'local-admin-summary',
      totalResumeEvents: totalEvents.count,
      storageStatus: 'ok',
      privacyMode: 'local-only',
    });
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/search') {
    const q = requestUrl.searchParams.get('q') || '';
    return sendJson(res, 200, {
      query: q,
      matchMode: q ? 'keyword' : 'default',
      results: [
        { type: 'resume', title: '本地简历草稿', summary: '支持模板、ATS 检测、AI 诊断和加密本地存储' },
        { type: 'template', title: '技术岗模板', summary: '覆盖项目经历、技能标签和岗位关键词' },
        { type: 'admin', title: '本地后台概览', summary: '提供简历事件、存储状态和隐私模式审计' },
      ],
    });
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/products') {
    return sendJson(res, 200, {
      items: [
        { id: 'tpl-tech', name: '技术岗简历模板', price: 0, category: 'resume-template' },
        { id: 'ats-local', name: 'ATS 本地检测', price: 0, category: 'resume-tool' },
      ],
    });
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/orders') {
    return sendJson(res, 200, {
      items: [
        { id: 'resume-order-local', status: 'completed', name: '本地简历导出记录', amount: 0 },
      ],
    });
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/cart') {
    return sendJson(res, 200, {
      id: 'local-resume-cart',
      total: 0,
      items: [{ id: 'tpl-tech', name: '技术岗简历模板', quantity: 1, price: 0 }],
    });
  }

  sendJson(res, 404, { error: '接口不存在', path: requestUrl.pathname });
});

server.listen(port, host, () => {
  console.log(`backend listening at http://${host}:${port}`);
  console.log(`health check http://${host}:${port}/api/health`);
});

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return acc;
    const index = trimmed.indexOf('=');
    acc[trimmed.slice(0, index)] = trimmed.slice(index + 1);
    return acc;
  }, {});
}

function sendJson(res, statusCode, payload) {
  send(res, statusCode, JSON.stringify(payload));
}

function send(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': frontendUrl,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(body);
}
