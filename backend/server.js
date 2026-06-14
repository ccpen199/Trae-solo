const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJECT_DIR = path.resolve(__dirname, '..');
const ENV_FILE = path.join(PROJECT_DIR, '.env');
const DATA_DIR = path.join(PROJECT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'app.sqlite');

function loadEnv() {
  const env = {};
  if (!fs.existsSync(ENV_FILE)) return env;
  for (const rawLine of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index === -1) continue;
    env[line.slice(0, index)] = line.slice(index + 1);
  }
  return env;
}

const env = loadEnv();
const HOST = env.HOST || '127.0.0.1';
const PORT = Number(env.BACKEND_PORT || 59082);
const FRONTEND_PORT = Number(env.FRONTEND_PORT || 49082);

fs.mkdirSync(DATA_DIR, { recursive: true });

function sqlite(sql) {
  return execFileSync('/usr/bin/sqlite3', ['-json', DB_FILE, sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

function initDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS service_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      department TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant TEXT NOT NULL,
      item_title TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    INSERT INTO service_items (title, category, department, status, updated_at)
      SELECT '企业备案进度查询', '企业服务', '综合窗口', '可在线办理', datetime('now')
      WHERE NOT EXISTS (SELECT 1 FROM service_items);
    INSERT INTO service_items (title, category, department, status, updated_at)
      SELECT '材料补正提醒', '消息服务', '审批中心', '实时同步', datetime('now')
      WHERE (SELECT COUNT(*) FROM service_items) < 2;
    INSERT INTO applications (applicant, item_title, status, created_at)
      SELECT '演示用户', '企业备案进度查询', '已受理', datetime('now')
      WHERE NOT EXISTS (SELECT 1 FROM applications);
  `;
  execFileSync('/usr/bin/sqlite3', [DB_FILE, schema], { stdio: 'ignore' });
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': `http://127.0.0.1:${FRONTEND_PORT}`,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
    req.on('error', reject);
  });
}

initDatabase();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

    if (req.method === 'OPTIONS') {
      return json(res, 204, {});
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      return json(res, 200, {
        ok: true,
        service: 'may-89082-local-service',
        sqlite: DB_FILE,
        port: PORT,
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/service-items') {
      const rows = JSON.parse(sqlite('SELECT * FROM service_items ORDER BY id;') || '[]');
      return json(res, 200, { ok: true, data: rows });
    }

    if (req.method === 'GET' && url.pathname === '/api/applications') {
      const rows = JSON.parse(sqlite('SELECT * FROM applications ORDER BY id DESC;') || '[]');
      return json(res, 200, { ok: true, data: rows });
    }

    if (req.method === 'POST' && url.pathname === '/api/applications') {
      const body = await readBody(req);
      const applicant = String(body.applicant || '窗口用户').replace(/'/g, "''");
      const itemTitle = String(body.itemTitle || '企业备案进度查询').replace(/'/g, "''");
      sqlite(`INSERT INTO applications (applicant, item_title, status, created_at) VALUES ('${applicant}', '${itemTitle}', '已提交', datetime('now')); SELECT last_insert_rowid() AS id;`);
      return json(res, 201, { ok: true, message: '提交成功' });
    }

    return json(res, 404, { ok: false, message: '接口不存在' });
  } catch (error) {
    return json(res, 500, { ok: false, message: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`may-89082 backend listening on http://${HOST}:${PORT}`);
  console.log(`health: http://${HOST}:${PORT}/api/health`);
});
