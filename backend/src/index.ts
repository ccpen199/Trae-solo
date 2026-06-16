import express from 'express';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import db, { initDB } from './db';
import { seed } from './seed';

import authRouter from './routes/auth';
import brandsRouter from './routes/brands';
import couriersRouter from './routes/couriers';
import ordersRouter from './routes/orders';
import priceRouter from './routes/price';
import dashboardRouter from './routes/dashboard';
import openapiRouter from './routes/openapi';
import notificationsRouter from './routes/notifications';
import complaintsRouter from './routes/complaints';
import branchesRouter from './routes/branches';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = Number(process.env.BACKEND_PORT || '59219');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:49219';
const JWT_SECRET = process.env.JWT_SECRET || 'express-open-platform-secret-key-2026';

app.use(cors({
  origin: [
    FRONTEND_URL,
    FRONTEND_URL.replace('127.0.0.1', 'localhost'),
    `http://127.0.0.1:${process.env.FRONTEND_PORT || '49219'}`,
    `http://localhost:${process.env.FRONTEND_PORT || '49219'}`,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Key', 'X-App-Sign'],
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

initDB();
try {
  seed();
} catch (e) {
  console.log('Seed warning:', e);
}

function listQuery(table: string, limit = 20) {
  return db.prepare(`SELECT * FROM ${table} ORDER BY id DESC LIMIT ?`).all(limit);
}

function getDashboardOverview() {
  const summary = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM shipment_orders) AS total_orders,
      (SELECT COUNT(*) FROM shipment_orders WHERE status IN ('out_for_delivery', 'in_transit', 'picked')) AS active_orders,
      (SELECT COUNT(*) FROM shipment_orders WHERE status = 'exception') AS exception_orders,
      (SELECT COUNT(*) FROM courier_brands WHERE api_status = 'active') AS active_brands,
      (SELECT COUNT(*) FROM couriers WHERE work_status = 'online') AS online_couriers,
      (SELECT COUNT(*) FROM branches WHERE status = 'active') AS active_branches,
      (SELECT COUNT(*) FROM complaints WHERE status IN ('pending', 'processing')) AS pending_complaints,
      (SELECT COALESCE(SUM(total_amount), 0) FROM shipment_orders) AS total_amount
  `).get();

  const brandStats = db.prepare(`
    SELECT
      cb.id,
      cb.code,
      cb.name,
      cb.rating,
      cb.coverage_score,
      cb.avg_delivery_hours,
      cb.api_status,
      COUNT(so.id) AS order_count,
      COALESCE(SUM(so.total_amount), 0) AS revenue
    FROM courier_brands cb
    LEFT JOIN shipment_orders so ON so.brand_id = cb.id
    GROUP BY cb.id
    ORDER BY order_count DESC
    LIMIT 10
  `).all();

  const recentOrders = db.prepare(`
    SELECT so.*, cb.name AS brand_name, c.name AS courier_name
    FROM shipment_orders so
    LEFT JOIN courier_brands cb ON cb.id = so.brand_id
    LEFT JOIN couriers c ON c.id = so.courier_id
    ORDER BY so.id DESC
    LIMIT 12
  `).all();

  const alerts = db.prepare(`
    SELECT
      so.id,
      so.order_no,
      so.tracking_no,
      so.status,
      so.receiver_address,
      so.is_address_abnormal,
      cb.name AS brand_name
    FROM shipment_orders so
    LEFT JOIN courier_brands cb ON cb.id = so.brand_id
    WHERE so.status = 'exception' OR so.is_address_abnormal = 1
    ORDER BY so.id DESC
    LIMIT 8
  `).all();

  return { summary, brandStats, recentOrders, alerts };
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'express-logistics-open-platform',
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

  if (!user || !bcrypt.compareSync(String(password || ''), user.password)) {
    return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      phone: user.phone,
    },
  });
});

app.get('/api/dashboard/overview', (_req, res) => {
  res.json(getDashboardOverview());
});

app.get('/api/dashboard/stats', (_req, res) => {
  res.json(getDashboardOverview());
});

app.get('/api/brands', (req, res) => {
  const keyword = String(req.query.keyword || '').trim();
  const minCoverage = Number(req.query.minCoverage || 0);
  const params: any[] = [];
  let where = 'WHERE 1 = 1';

  if (keyword) {
    where += ' AND (name LIKE ? OR code LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (minCoverage > 0) {
    where += ' AND coverage_score >= ?';
    params.push(minCoverage);
  }

  const brands = db.prepare(`
    SELECT * FROM courier_brands
    ${where}
    ORDER BY rating DESC, coverage_score DESC
    LIMIT 50
  `).all(...params);

  res.json({ items: brands, total: brands.length });
});

app.get('/api/couriers', (req, res) => {
  const status = String(req.query.status || '');
  const rows = status
    ? db.prepare('SELECT * FROM couriers WHERE work_status = ? ORDER BY rating DESC LIMIT 50').all(status)
    : listQuery('couriers', 50);

  res.json({ items: rows, total: rows.length });
});

app.get('/api/orders', (req, res) => {
  const keyword = String(req.query.keyword || '').trim();
  const status = String(req.query.status || '').trim();
  const params: any[] = [];
  let where = 'WHERE 1 = 1';

  if (keyword) {
    where += ' AND (so.order_no LIKE ? OR so.tracking_no LIKE ? OR so.sender_name LIKE ? OR so.receiver_name LIKE ? OR so.goods_name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (status) {
    where += ' AND so.status = ?';
    params.push(status);
  }

  const orders = db.prepare(`
    SELECT so.*, cb.name AS brand_name, c.name AS courier_name
    FROM shipment_orders so
    LEFT JOIN courier_brands cb ON cb.id = so.brand_id
    LEFT JOIN couriers c ON c.id = so.courier_id
    ${where}
    ORDER BY so.id DESC
    LIMIT 80
  `).all(...params);

  res.json({ items: orders, total: orders.length });
});

app.get('/api/orders/:id/tracking', (req, res) => {
  const orderId = Number(req.params.id);
  const order = db.prepare('SELECT * FROM shipment_orders WHERE id = ?').get(orderId);
  const events = db.prepare('SELECT * FROM tracking_events WHERE order_id = ? ORDER BY created_at DESC').all(orderId);
  res.json({ order, events });
});

app.get('/api/price/compare', (req, res) => {
  const weight = Number(req.query.weight || 1);
  const rows = db.prepare(`
    SELECT
      id,
      code,
      name,
      base_price,
      per_kg_price,
      avg_delivery_hours,
      coverage_score,
      rating,
      ROUND(base_price + per_kg_price * MAX(0, ? - 1), 2) AS estimated_price
    FROM courier_brands
    WHERE api_status = 'active'
    ORDER BY estimated_price ASC, rating DESC
    LIMIT 12
  `).all(weight);

  res.json({ weight, items: rows });
});

app.get('/api/branches', (req, res) => {
  const city = String(req.query.city || '').trim();
  const rows = city
    ? db.prepare('SELECT * FROM branches WHERE city LIKE ? ORDER BY daily_throughput DESC LIMIT 50').all(`%${city}%`)
    : db.prepare('SELECT * FROM branches ORDER BY daily_throughput DESC LIMIT 50').all();

  res.json({ items: rows, total: rows.length });
});

app.get('/api/complaints', (_req, res) => {
  const rows = db.prepare(`
    SELECT cp.*, so.order_no, so.tracking_no, c.name AS courier_name
    FROM complaints cp
    LEFT JOIN shipment_orders so ON so.id = cp.order_id
    LEFT JOIN couriers c ON c.id = cp.courier_id
    ORDER BY cp.id DESC
    LIMIT 50
  `).all();

  res.json({ items: rows, total: rows.length });
});

app.get('/api/open/status', (_req, res) => {
  const apps = listQuery('api_applications', 20);
  res.json({
    status: 'active',
    gateway: 'openapi',
    apps,
    scopes: ['order.create', 'tracking.query', 'price.compare', 'complaint.sync'],
  });
});

app.use('/api/auth', authRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/couriers', couriersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/price', priceRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/open', openapiRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/branches', branchesRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || '服务器内部错误',
  });
});

app.use((_req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running at http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
});
