import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const host = process.env.HOST || '127.0.0.1';
const frontendPort = Number(process.env.FRONTEND_PORT || 49315);
const backendPort = Number(process.env.BACKEND_PORT || 59315);
const sqlitePath = resolve(process.cwd(), process.env.SQLITE_PATH || './data/app.sqlite');

mkdirSync(dirname(sqlitePath), { recursive: true });

const db = new DatabaseSync(sqlitePath);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS service_boots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    host TEXT NOT NULL,
    frontend_port INTEGER NOT NULL,
    backend_port INTEGER NOT NULL
  );
`);

const startedAt = new Date().toISOString();
const insertBoot = db.prepare(`
  INSERT INTO service_boots (started_at, host, frontend_port, backend_port)
  VALUES (?, ?, ?, ?)
`);
const bootRecord = insertBoot.run(startedAt, host, frontendPort, backendPort);

const countBoots = db.prepare('SELECT COUNT(*) AS total FROM service_boots');

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': `http://${host}:${frontendPort}`,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${backendPort}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': `http://${host}:${frontendPort}`,
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    const boots = countBoots.get();

    writeJson(res, 200, {
      ok: true,
      service: 'elo-master-local-api',
      host,
      frontendUrl: `http://${host}:${frontendPort}/`,
      backendUrl: `http://${host}:${backendPort}`,
      sqlitePath,
      startedAt,
      bootId: Number(bootRecord.lastInsertRowid),
      totalBoots: boots.total,
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/meta') {
    writeJson(res, 200, {
      appName: 'ELO Master',
      domain: 'game boosting marketplace',
      features: [
        'provider matching',
        'order monitoring',
        'wallet settlement',
        'risk control',
      ],
    });
    return;
  }

  writeJson(res, 404, {
    ok: false,
    message: `Route ${url.pathname} is not defined`,
  });
});

server.listen(backendPort, host, () => {
  console.log(
    JSON.stringify({
      status: 'listening',
      host,
      frontendPort,
      backendPort,
      sqlitePath,
      startedAt,
    }),
  );
});
