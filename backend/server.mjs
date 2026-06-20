import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const loadEnvFile = () => {
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const idx = trimmed.indexOf('=');
    if (idx === -1) {
      continue;
    }

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

loadEnvFile();

const host = process.env.HOST || '127.0.0.1';
const port = Number.parseInt(process.env.BACKEND_PORT || '59274', 10);
const dbDir = path.join(projectRoot, 'data');
const dbPath = path.join(dbDir, 'app.db');

fs.mkdirSync(dbDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS service_health (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    project TEXT NOT NULL,
    last_booted_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_no TEXT NOT NULL,
    status TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quote_price INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
`);

db.prepare(`
  INSERT INTO service_health (id, project, last_booted_at)
  VALUES (1, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    project = excluded.project,
    last_booted_at = excluded.last_booted_at
`).run('may-89274', new Date().toISOString());

const orderCount = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
if (!orderCount) {
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, order_no, status, customer_name, category, quote_price, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const seededOrders = [
    ['ord_00001', 'HX202606200001', 'pending_pickup', '周女士', '名表', 95800, '2026-06-20T08:30:00.000Z'],
    ['ord_00002', 'HX202606190742', 'inspecting', '林先生', '高值数码', 12600, '2026-06-19T13:20:00.000Z'],
    ['ord_00003', 'HX202606180415', 'completed', '赵女士', '奢侈箱包', 21400, '2026-06-18T10:15:00.000Z'],
  ];

  for (const order of seededOrders) {
    insertOrder.run(...order);
  }
}

const writeJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(payload));
};

const parseBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    writeJson(res, 400, { code: 400, message: 'bad request' });
    return;
  }

  const url = new URL(req.url, `http://${host}:${port}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    const health = db.prepare('SELECT project, last_booted_at FROM service_health WHERE id = 1').get();
    const orderStats = db.prepare('SELECT COUNT(*) AS total FROM orders').get();
    writeJson(res, 200, {
      code: 0,
      message: 'ok',
      data: {
        status: 'healthy',
        host,
        port,
        sqlite: {
          path: dbPath,
          ready: true,
        },
        project: health.project,
        lastBootedAt: health.last_booted_at,
        orderCount: orderStats.total,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/orders') {
    const rows = db.prepare(`
      SELECT id, order_no, status, customer_name, category, quote_price, created_at
      FROM orders
      ORDER BY datetime(created_at) DESC
    `).all();

    writeJson(res, 200, {
      code: 0,
      message: 'ok',
      data: {
        list: rows.map((row) => ({
          id: row.id,
          orderNo: row.order_no,
          status: row.status,
          customerName: row.customer_name,
          category: row.category,
          quotePrice: row.quote_price,
          createdAt: row.created_at,
        })),
        total: rows.length,
      },
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/orders') {
    try {
      const body = await parseBody(req);
      const now = new Date().toISOString();
      const id = `ord_${Date.now()}`;
      const orderNo = `HX${now.slice(0, 10).replaceAll('-', '')}${String(Date.now()).slice(-4)}`;
      db.prepare(`
        INSERT INTO orders (id, order_no, status, customer_name, category, quote_price, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        orderNo,
        body.status || 'pending_pickup',
        body.customerName || '新客户',
        body.category || '高值数码',
        Number.parseInt(body.quotePrice || '0', 10) || 0,
        now
      );

      writeJson(res, 201, {
        code: 0,
        message: 'created',
        data: {
          id,
          orderNo,
          status: body.status || 'pending_pickup',
          customerName: body.customerName || '新客户',
          category: body.category || '高值数码',
          quotePrice: Number.parseInt(body.quotePrice || '0', 10) || 0,
          createdAt: now,
        },
      });
    } catch (error) {
      writeJson(res, 400, {
        code: 400,
        message: error instanceof Error ? error.message : 'invalid payload',
      });
    }
    return;
  }

  writeJson(res, 404, {
    code: 404,
    message: `Not found: ${req.method} ${url.pathname}`,
  });
});

server.listen(port, host, () => {
  console.log(`[may-89274] backend listening on http://${host}:${port}`);
  console.log(`[may-89274] health -> http://${host}:${port}/api/health`);
  console.log(`[may-89274] sqlite -> ${dbPath}`);
});
