import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { mkdirSync } from 'fs';
import { initDb, getDb } from './db/init.js';
import { migrateDb } from './db/migrate.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import obuRoutes from './routes/obu.js';
import accountRoutes from './routes/accounts.js';
import tollRoutes from './routes/toll.js';
import exceptionRoutes from './routes/exceptions.js';
import disputeRoutes from './routes/disputes.js';
import operationRoutes from './routes/operations.js';
import openApiRoutes from './routes/openapi.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 59050;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 49050;
const HOST = '127.0.0.1';

function getProfileUser() {
  const db = getDb();
  return db.prepare('SELECT id, username, real_name, phone, role, vehicle_plate, fleet_name, status, created_at FROM users ORDER BY id LIMIT 1').get();
}

function getProfileUserFromRequest(req) {
  const db = getDb();
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET || 'etc_console_secret_key_2026');
      const user = db.prepare('SELECT id, username, real_name, phone, role, vehicle_plate, fleet_name, status, created_at FROM users WHERE id = ?').get(decoded.id);
      if (user) return user;
    } catch (_err) {
      return getProfileUser();
    }
  }
  return getProfileUser();
}

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/search', (req, res) => {
  try {
    const db = getDb();
    const q = String(req.query.q || '').trim();
    const like = `%${q}%`;
    const tollRecords = db.prepare(`
      SELECT id, vehicle_plate, gantry_name, toll_station_name, road_segment, fee, exit_time
      FROM toll_records
      WHERE ? = '' OR vehicle_plate LIKE ? OR gantry_name LIKE ? OR toll_station_name LIKE ? OR road_segment LIKE ?
      ORDER BY id DESC
      LIMIT 20
    `).all(q, like, like, like, like);
    const users = db.prepare(`
      SELECT id, username, real_name, role, vehicle_plate, fleet_name
      FROM users
      WHERE ? = '' OR username LIKE ? OR real_name LIKE ? OR vehicle_plate LIKE ? OR fleet_name LIKE ?
      ORDER BY id ASC
      LIMIT 10
    `).all(q, like, like, like, like);
    res.json({
      query: q,
      total: tollRecords.length + users.length,
      results: { tollRecords, users }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats', (req, res) => {
  try {
    const db = getDb();
    res.json({
      user_count: db.prepare("SELECT COUNT(*) AS count FROM users WHERE status = 'active'").get().count,
      device_count: db.prepare('SELECT COUNT(*) AS count FROM obu_devices').get().count,
      account_count: db.prepare("SELECT COUNT(*) AS count FROM etc_accounts WHERE status = 'normal'").get().count,
      toll_record_count: db.prepare('SELECT COUNT(*) AS count FROM toll_records').get().count,
      pending_exception_count: db.prepare("SELECT COUNT(*) AS count FROM exception_events WHERE status IN ('pending','processing')").get().count,
      pending_settlement_count: db.prepare("SELECT COUNT(*) AS count FROM settlements WHERE status = 'pending'").get().count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/dashboard', (req, res) => {
  try {
    const db = getDb();
    const recentToll = db.prepare('SELECT id, vehicle_plate, gantry_name, fee, exit_time FROM toll_records ORDER BY id DESC LIMIT 5').all();
    const exceptions = db.prepare('SELECT id, type, description, status, created_at FROM exception_events ORDER BY id DESC LIMIT 5').all();
    res.json({
      service: 'etc-admin-dashboard',
      recentToll,
      exceptions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/profile', (req, res) => {
  try {
    const user = getProfileUserFromRequest(req);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/profile', (req, res) => {
  try {
    const user = getProfileUserFromRequest(req);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products', (req, res) => {
  try {
    const db = getDb();
    const services = db.prepare(`
      SELECT id, service_name AS name, service_type AS category, api_endpoint, status, created_at
      FROM value_added_services
      ORDER BY id DESC
      LIMIT 20
    `).all();
    const deviceProducts = db.prepare(`
      SELECT device_sn AS id, model AS name, firmware_version AS category, activation_status AS status, batch_no AS api_endpoint, created_at
      FROM obu_devices
      ORDER BY id DESC
      LIMIT 10
    `).all();
    res.json({ products: [...services, ...deviceProducts], total: services.length + deviceProducts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', (req, res) => {
  try {
    const db = getDb();
    const orders = db.prepare(`
      SELECT id, vehicle_plate, gantry_name, toll_station_name, road_segment, fee AS total_amount, exit_time AS created_at
      FROM toll_records
      ORDER BY id DESC
      LIMIT 20
    `).all();
    res.json({ orders, total: orders.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cart', (req, res) => {
  res.json({
    items: [
      { id: 'obu-service', name: 'OBU激活与发行服务', quantity: 1, price: 0 },
      { id: 'toll-recharge', name: 'ETC账户充值', quantity: 1, price: 200 },
    ],
    total: 200,
    checkoutReady: true
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/obu', obuRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/toll', tollRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/open', openApiRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

mkdirSync('./data', { recursive: true });

initDb();
migrateDb();

app.listen(PORT, HOST, () => {
  console.log(`ETC Console Backend running at http://${HOST}:${PORT}`);
});
