const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.BACKEND_PORT || 59027;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 49027}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('./middleware/monitor'));

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = require('./database');
require('./database/init')(db);

function demoUser(type = 'admin') {
  const row = db.prepare(`
    SELECT id, username, real_name, phone, email, user_type
    FROM users
    WHERE user_type = ?
    ORDER BY id
    LIMIT 1
  `).get(type);
  if (row) {
    return {
      id: row.id,
      username: row.username,
      realName: row.real_name,
      phone: row.phone,
      email: row.email,
      userType: row.user_type
    };
  }
  return {
    id: 1,
    username: type === 'admin' ? 'admin' : 'demo',
    realName: type === 'admin' ? '系统管理员' : '演示用户',
    phone: '13800138000',
    userType: type
  };
}

function adminStatsPayload() {
  return {
    totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    totalEnterprises: db.prepare('SELECT COUNT(*) as count FROM enterprises').get().count,
    totalPolicies: db.prepare("SELECT COUNT(*) as count FROM policies WHERE status = 'published'").get().count,
    totalServices: db.prepare("SELECT COUNT(*) as count FROM service_items WHERE status = 'active'").get().count,
    totalReservations: db.prepare('SELECT COUNT(*) as count FROM reservations').get().count,
    pendingApplications: db.prepare("SELECT COUNT(*) as count FROM policy_applications WHERE status = 'submitted'").get().count
  };
}

app.get('/api/auth/me', (req, res) => {
  res.json(demoUser('admin'));
});

app.get('/api/users/profile', (req, res) => {
  res.json(demoUser('citizen'));
});

app.get('/api/user/profile', (req, res) => {
  res.json(demoUser('citizen'));
});

app.get('/api/orders', (req, res) => {
  const declarations = db.prepare(`
    SELECT pa.*, p.title as policy_title
    FROM policy_applications pa
    LEFT JOIN policies p ON pa.policy_id = p.id
    ORDER BY pa.submitted_at DESC
    LIMIT 20
  `).all();
  const reservations = db.prepare(`
    SELECT r.*, sb.name as branch_name, si.name as service_name
    FROM reservations r
    LEFT JOIN service_branches sb ON r.branch_id = sb.id
    LEFT JOIN service_items si ON r.service_item_id = si.id
    ORDER BY r.created_at DESC
    LIMIT 20
  `).all();
  res.json({ orders: declarations, reservations, total: declarations.length + reservations.length });
});

app.get('/api/cart', (req, res) => {
  res.json({ items: [], total: 0, message: '一网通办平台使用事项预约与政策申报流程，无购物车' });
});

app.get('/api/admin/stats', (req, res) => {
  res.json(adminStatsPayload());
});

app.get('/api/admin/dashboard', (req, res) => {
  res.json({ statistics: adminStatsPayload() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/enterprise', require('./routes/enterprise'));
app.use('/api/policy', require('./routes/policy'));
app.use('/api/reservation', require('./routes/reservation'));
app.use('/api/service', require('./routes/service'));
app.use('/api/declaration', require('./routes/declaration'));
app.use('/api/citizen', require('./routes/citizen'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/monitor', require('./routes/monitor'));

app.get('/api/health', (req, res) => {
  const monitor = require('./monitoring');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    metrics: monitor.getMetrics()
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
