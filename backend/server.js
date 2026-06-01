const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJECT_DIR = path.resolve(__dirname, '..');
loadEnv(path.join(PROJECT_DIR, '.env'));

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || 53454);
const DB_PATH = path.resolve(PROJECT_DIR, process.env.DB_PATH || './backend/data/app.sqlite');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function sqlite(sql, json = false) {
  const args = json ? ['-json', DB_PATH, sql] : [DB_PATH, sql];
  const output = execFileSync('sqlite3', args, { encoding: 'utf8' }).trim();
  return json ? (output ? JSON.parse(output) : []) : output;
}

function initDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  sqlite(`
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS service_sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      status TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      assignee TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(site_id) REFERENCES service_sites(id)
    );
    CREATE TABLE IF NOT EXISTS service_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(site_id) REFERENCES service_sites(id)
    );
  `);

  const count = Number(sqlite('SELECT COUNT(*) FROM service_sites;') || 0);
  if (count === 0) {
    sqlite(`
      INSERT INTO service_sites (name, region, status, capacity) VALUES
        ('North Hub', 'north', 'online', 86),
        ('Airport Field Desk', 'east', 'attention', 61),
        ('South Maintenance Room', 'south', 'online', 74);
      INSERT INTO work_orders (site_id, title, priority, status, assignee) VALUES
        (1, 'Refresh edge gateway certificate', 'high', 'in_progress', 'Ops A'),
        (2, 'Inspect backup network link', 'medium', 'queued', 'Ops B'),
        (3, 'Validate nightly SQLite backup', 'low', 'done', 'Ops C');
      INSERT INTO service_events (site_id, event_type, message, severity) VALUES
        (1, 'health', 'API and local SQLite are online', 'info'),
        (2, 'network', 'Secondary link latency is above baseline', 'warning'),
        (3, 'storage', 'Database checkpoint completed', 'info');
    `);
  }
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  });
  res.end(payload);
}

function dashboard() {
  const sites = sqlite('SELECT * FROM service_sites ORDER BY id;', true);
  const orders = sqlite(`
    SELECT wo.*, ss.name AS site_name
    FROM work_orders wo
    JOIN service_sites ss ON ss.id = wo.site_id
    ORDER BY
      CASE wo.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      wo.id;
  `, true);
  const events = sqlite(`
    SELECT se.*, ss.name AS site_name
    FROM service_events se
    JOIN service_sites ss ON ss.id = se.site_id
    ORDER BY se.id DESC
    LIMIT 8;
  `, true);
  const summary = sqlite(`
    SELECT
      (SELECT COUNT(*) FROM service_sites) AS sites,
      (SELECT COUNT(*) FROM service_sites WHERE status = 'online') AS online_sites,
      (SELECT COUNT(*) FROM work_orders WHERE status != 'done') AS open_orders,
      (SELECT COUNT(*) FROM service_events WHERE severity = 'warning') AS warnings;
  `, true)[0];
  return { summary, sites, orders, events };
}

initDb();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });

  try {
    if (url.pathname === '/api/health') {
      const summary = dashboard().summary;
      return send(res, 200, {
        status: 'ok',
        service: 'may-63454-backend',
        database: DB_PATH,
        counts: summary,
        timestamp: new Date().toISOString()
      });
    }
    if (url.pathname === '/api/dashboard') return send(res, 200, dashboard());
    if (url.pathname === '/api/sites') return send(res, 200, { data: dashboard().sites });
    return send(res, 404, { error: 'api_not_found', path: url.pathname });
  } catch (error) {
    return send(res, 500, { error: 'internal_error', message: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Backend listening on http://${HOST}:${PORT}`);
  console.log(`SQLite database: ${DB_PATH}`);
});
