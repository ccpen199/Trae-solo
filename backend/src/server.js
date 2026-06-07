import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '../.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/devices.js';
import studentRoutes from './routes/students.js';
import transactionRoutes from './routes/transactions.js';
import alertRoutes from './routes/alerts.js';
import analyticsRoutes from './routes/analytics.js';
import pricingRoutes from './routes/pricing.js';
import messageRoutes from './routes/messages.js';
import db from './database.js';

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || 59033);

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 49033}`,
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function demoProfilePayload() {
  const student = db.prepare('SELECT * FROM students ORDER BY id LIMIT 1').get();
  if (student) {
    return {
      user: {
        id: student.id,
        studentId: student.student_id,
        name: student.name,
        phone: student.phone,
        email: student.email,
        department: student.department,
        balance: student.balance,
        role: 'student',
        status: student.status
      }
    };
  }
  const admin = db.prepare('SELECT * FROM admin_users ORDER BY id LIMIT 1').get();
  return {
    user: {
      id: admin?.id || 1,
      username: admin?.username || 'admin',
      role: admin?.role || 'admin',
      name: '演示管理员'
    }
  };
}

function adminStatsPayload() {
  return {
    totalStudents: db.prepare('SELECT COUNT(*) as count FROM students').get().count,
    totalDevices: db.prepare('SELECT COUNT(*) as count FROM devices').get().count,
    onlineDevices: db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'online'").get().count,
    totalTransactions: db.prepare('SELECT COUNT(*) as count FROM transactions').get().count,
    totalRevenue: db.prepare('SELECT COALESCE(SUM(amount), 0) as amount FROM transactions').get().amount,
    unreadAlerts: db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status = 'unread'").get().count
  };
}

app.get('/api/auth/me', (req, res) => {
  res.json(demoProfilePayload());
});

app.get('/api/users/profile', (req, res) => {
  res.json(demoProfilePayload());
});

app.get('/api/user/profile', (req, res) => {
  res.json(demoProfilePayload());
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const like = `%${keyword}%`;
  const devices = db.prepare(`
    SELECT id, name, location, building, floor, status
    FROM devices
    WHERE ? = '' OR id LIKE ? OR name LIKE ? OR location LIKE ? OR building LIKE ?
    ORDER BY updated_at DESC
    LIMIT 20
  `).all(keyword, like, like, like, like);
  const students = db.prepare(`
    SELECT id, student_id, name, phone, department, balance, status
    FROM students
    WHERE ? = '' OR student_id LIKE ? OR name LIKE ? OR phone LIKE ? OR department LIKE ?
    ORDER BY updated_at DESC
    LIMIT 20
  `).all(keyword, like, like, like, like);
  res.json({ keyword, devices, students, total: devices.length + students.length });
});

app.get('/api/admin/stats', (req, res) => {
  res.json({ stats: adminStatsPayload() });
});

app.get('/api/admin/dashboard', (req, res) => {
  const recentTransactions = db.prepare(`
    SELECT t.*, s.name as student_name, d.name as device_name
    FROM transactions t
    LEFT JOIN students s ON t.student_id = s.student_id
    LEFT JOIN devices d ON t.device_id = d.id
    ORDER BY t.start_time DESC
    LIMIT 10
  `).all();
  res.json({ stats: adminStatsPayload(), recentTransactions });
});

app.get('/api/products', (req, res) => {
  const products = db.prepare(`
    SELECT id, name, location, building, status, fault_code
    FROM devices
    ORDER BY updated_at DESC
    LIMIT 20
  `).all();
  res.json({ products, message: '校园热水服务以设备终端和套餐资费作为运营对象' });
});

app.get('/api/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT t.*, s.name as student_name, d.name as device_name
    FROM transactions t
    LEFT JOIN students s ON t.student_id = s.student_id
    LEFT JOIN devices d ON t.device_id = d.id
    ORDER BY t.start_time DESC
    LIMIT 50
  `).all();
  res.json({ orders, total: orders.length });
});

app.get('/api/cart', (req, res) => {
  res.json({ items: [], total: 0, message: '校园热水系统使用账户充值和用水订单流程，无购物车' });
});

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/messages', messageRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
});
