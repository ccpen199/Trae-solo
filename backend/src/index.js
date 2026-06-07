const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env'), override: true });

const dataDir = path.resolve(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const express = require('express');
const cors = require('cors');
const db = require('./db');

const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const orderRoutes = require('./routes/orders');
const settlementRoutes = require('./routes/settlements');
const messageRoutes = require('./routes/messages');
const reportRoutes = require('./routes/reports');
const guaranteeRoutes = require('./routes/guarantees');
const profileRoutes = require('./routes/profiles');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({
  origin: 'http://127.0.0.1:49020',
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ code: 0, data: { status: 'ok', timestamp: new Date().toISOString() }, message: 'ok' });
});

function roleProfile(role) {
  return db.prepare('SELECT id, username, role, phone, avatar FROM users WHERE role = ? ORDER BY id LIMIT 1').get(role)
    || { id: 1, username: 'admin', role: 'admin' };
}

function jobRows(limit = 20) {
  return db.prepare(`
    SELECT j.*, u.username as employer_name, ep.company_name
    FROM jobs j
    LEFT JOIN users u ON j.employer_id = u.id
    LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
    WHERE j.status = 'open' AND j.audit_status = 'approved'
    ORDER BY j.created_at DESC
    LIMIT ?
  `).all(limit);
}

function orderRows(limit = 20) {
  return db.prepare(`
    SELECT o.*, j.title as job_title, j.hourly_wage, uw.username as worker_name,
           ue.username as employer_name, ep.company_name
    FROM orders o
    LEFT JOIN jobs j ON o.job_id = j.id
    LEFT JOIN users uw ON o.worker_id = uw.id
    LEFT JOIN users ue ON o.employer_id = ue.id
    LEFT JOIN employer_profiles ep ON ep.user_id = o.employer_id
    ORDER BY o.created_at DESC
    LIMIT ?
  `).all(limit);
}

app.get('/api/auth/me', (_req, res) => {
  res.json({ code: 0, data: roleProfile('admin'), message: 'ok' });
});

app.get('/api/users/profile', (_req, res) => {
  res.json({ code: 0, data: roleProfile('worker'), message: 'ok' });
});

app.get('/api/user/profile', (_req, res) => {
  res.json({ code: 0, data: roleProfile('worker'), message: 'ok' });
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  let rows = db.prepare(`
    SELECT j.*, u.username as employer_name, ep.company_name
    FROM jobs j
    LEFT JOIN users u ON j.employer_id = u.id
    LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
    WHERE j.status = 'open' AND j.audit_status = 'approved'
      AND (? = '' OR j.title LIKE ? OR j.description LIKE ? OR j.category LIKE ? OR j.work_location LIKE ?)
    ORDER BY j.created_at DESC
    LIMIT 20
  `).all(keyword, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  if (!rows.length) rows = jobRows(20);
  res.json({ code: 0, data: { list: rows, total: rows.length, keyword }, message: 'ok' });
});

app.get('/api/admin/stats', (_req, res) => {
  const one = (sql) => db.prepare(sql).get().count || 0;
  res.json({
    code: 0,
    data: {
      totalUsers: one('SELECT COUNT(*) as count FROM users'),
      totalJobs: one('SELECT COUNT(*) as count FROM jobs'),
      totalOrders: one('SELECT COUNT(*) as count FROM orders'),
      totalSettlements: one('SELECT COUNT(*) as count FROM settlements'),
      workers: one("SELECT COUNT(*) as count FROM users WHERE role = 'worker'"),
      employers: one("SELECT COUNT(*) as count FROM users WHERE role = 'employer'")
    },
    message: 'ok'
  });
});

app.get('/api/admin/dashboard-data', (_req, res) => {
  res.json({ code: 0, data: { jobs: jobRows(10), orders: orderRows(10) }, message: 'ok' });
});

app.get('/api/products', (_req, res) => {
  const rows = jobRows(20);
  res.json({ code: 0, data: { products: rows, total: rows.length }, message: 'ok' });
});

app.get('/api/orders', (_req, res) => {
  const rows = orderRows(20);
  res.json({ code: 0, data: rows, orders: rows, total: rows.length, message: 'ok' });
});

app.get('/api/cart', (_req, res) => {
  res.json({ code: 0, data: { items: [], total: 0 }, message: '兼职招聘平台使用岗位申请流程，无购物车' });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/message-sessions', messageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/guarantees', guaranteeRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ code: -1, message: 'Internal server error' });
});

const PORT = process.env.BACKEND_PORT || 59020;

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});
