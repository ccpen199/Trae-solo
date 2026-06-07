require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env'), override: true });

const express = require('express');
const cors = require('cors');
const { initDatabase, getDb } = require('./db/init');

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const paymentRoutes = require('./routes/payment');
const collaborationRoutes = require('./routes/collaboration');
const interactiveRoutes = require('./routes/interactive');
const monitoringRoutes = require('./routes/monitoring');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.BACKEND_PORT || 59040;

app.use(cors({
  origin: 'http://127.0.0.1:49040',
  credentials: true
}));

app.use(express.json());

app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1a3a5c"/><path d="M18 18h28v8H18zM18 30h28v6H18zM18 40h28v6H18z" fill="#fff"/></svg>');
});

function userWithoutPassword(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function demoUserPayload() {
  const db = getDb();
  const user = db.prepare(`
    SELECT * FROM users
    ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'staff' THEN 1 ELSE 2 END, created_at
    LIMIT 1
  `).get();
  return userWithoutPassword(user) || {
    id: 'demo-admin',
    username: 'admin',
    real_name: '系统管理员',
    role: 'admin',
    auth_source: 'local',
    level: 'province'
  };
}

function adminSummaryPayload() {
  const db = getDb();
  const users = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  const services = db.prepare('SELECT COUNT(*) as cnt FROM service_items WHERE status = ?').get('active').cnt;
  const approvals = db.prepare('SELECT COUNT(*) as cnt FROM approval_tasks').get().cnt;
  const payments = db.prepare('SELECT COUNT(*) as cnt FROM payments').get().cnt;
  const visits = db.prepare('SELECT COALESCE(SUM(visit_count), 0) as total FROM behavior_stats').get().total || 0;
  return { users, services, approvals, payments, visits };
}

function authStatsPayload() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const total = db.prepare("SELECT COUNT(*) as cnt FROM auth_logs WHERE date(created_at) = ?").get(today).cnt;
  const caCount = db.prepare("SELECT COUNT(*) as cnt FROM auth_logs WHERE date(created_at) = ? AND auth_source = 'ca'").get(today).cnt;
  const alipayCount = db.prepare("SELECT COUNT(*) as cnt FROM auth_logs WHERE date(created_at) = ? AND auth_source = 'alipay'").get(today).cnt;
  const mztCount = db.prepare("SELECT COUNT(*) as cnt FROM auth_logs WHERE date(created_at) = ? AND auth_source = 'minzhengtong'").get(today).cnt;
  const base = total || 1;
  return {
    total,
    caRatio: Number(((caCount / base) * 100).toFixed(1)),
    alipayRatio: Number(((alipayCount / base) * 100).toFixed(1)),
    mztratio: Number(((mztCount / base) * 100).toFixed(1))
  };
}

function authLogsPayload(page = 1, pageSize = 20) {
  const db = getDb();
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const size = Math.max(1, Math.min(100, Number.parseInt(pageSize, 10) || 20));
  const offset = (currentPage - 1) * size;
  const total = db.prepare('SELECT COUNT(*) as cnt FROM auth_logs').get().cnt;
  const list = db.prepare(`
    SELECT al.id, u.username, al.auth_source, al.ip_address, al.status, al.created_at
    FROM auth_logs al
    LEFT JOIN users u ON u.id = al.user_id
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(size, offset).map((row) => ({
    id: row.id,
    username: row.username || '演示用户',
    channel: ({ local: '账号密码', ca: 'CA证书', alipay: '支付宝', minzhengtong: '闽政通' })[row.auth_source] || row.auth_source,
    ip: row.ip_address || '127.0.0.1',
    time: row.created_at,
    status: row.status === 'success' ? '成功' : '失败'
  }));
  return { list, total, page: currentPage, pageSize: size };
}

app.get('/api/auth/me', (req, res) => {
  res.json({ success: true, data: demoUserPayload() });
});

app.get('/api/auth/stats', (req, res) => {
  res.json({ success: true, data: authStatsPayload() });
});

app.get('/api/auth/logs', (req, res) => {
  res.json({ success: true, data: authLogsPayload(req.query.page, req.query.pageSize) });
});

app.get(['/api/users/profile', '/api/user/profile'], (req, res) => {
  res.json({ success: true, data: demoUserPayload() });
});

app.get('/api/admin/stats', (req, res) => {
  res.json({ success: true, data: adminSummaryPayload() });
});

app.get('/api/admin/dashboard', (req, res) => {
  const db = getDb();
  const stats = adminSummaryPayload();
  const approvals = db.prepare(`
    SELECT id, title, current_node, status, created_at
    FROM approval_tasks
    ORDER BY created_at DESC
    LIMIT 8
  `).all();
  const services = db.prepare(`
    SELECT id, name, department, visit_count, one_done_rate
    FROM service_items
    WHERE status = 'active'
    ORDER BY visit_count DESC
    LIMIT 8
  `).all();
  res.json({ success: true, data: { stats, approvals, services } });
});

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/interactive', interactiveRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

initDatabase();

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务已启动: http://127.0.0.1:${PORT}`);
  console.log(`API 基础路径: http://127.0.0.1:${PORT}/api`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
