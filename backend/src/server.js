const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

const app = express();
const PORT = process.env.BACKEND_PORT || 59025;

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const frontendPort = process.env.FRONTEND_PORT || 49025;
app.use(cors({
  origin: [
    `http://127.0.0.1:${frontendPort}`,
    `http://localhost:${frontendPort}`
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const db = require('./models/database');
db.init();
const { seed } = require('./migrations/seed_demo_data');
seed();

function getDemoUser(type = 'admin') {
  const database = db.getDb();
  const user = database.prepare(`
    SELECT id, username, name, id_card, phone, email, type, avatar, address, created_at
    FROM users
    WHERE type = ?
    ORDER BY id
    LIMIT 1
  `).get(type);

  return user || {
    id: 1,
    username: type === 'admin' ? 'admin' : 'demo',
    name: type === 'admin' ? '演示管理员' : '演示用户',
    type,
    phone: '13800000000',
    created_at: new Date().toISOString()
  };
}

function getDashboardPayload() {
  const database = db.getDb();
  const one = (sql) => database.prepare(sql).get().count || 0;
  const avgRating = database.prepare('SELECT AVG(rating) as avg FROM applications WHERE rating IS NOT NULL').get().avg || 0;
  const recentApplications = database.prepare(`
    SELECT a.*, u.name as user_name
    FROM applications a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all();

  return {
    statistics: {
      userCount: one('SELECT COUNT(*) as count FROM users'),
      certCount: one('SELECT COUNT(*) as count FROM certificates'),
      applicationCount: one('SELECT COUNT(*) as count FROM applications'),
      serviceCount: one('SELECT COUNT(*) as count FROM service_items'),
      pendingApplications: one("SELECT COUNT(*) as count FROM applications WHERE status = 'submitted'"),
      completedToday: one("SELECT COUNT(*) as count FROM applications WHERE status = 'completed' AND DATE(completed_time) = DATE('now')"),
      avgRating: Math.round(avgRating * 10) / 10
    },
    recentApplications
  };
}

app.get('/api/auth/me', (req, res) => {
  res.json(getDemoUser('admin'));
});

app.get('/api/users/profile', (req, res) => {
  res.json(getDemoUser('personal'));
});

app.get('/api/user/profile', (req, res) => {
  res.json(getDemoUser('personal'));
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const database = db.getDb();
  let services = database.prepare(`
    SELECT si.*, sc.name as category_name
    FROM service_items si
    LEFT JOIN service_categories sc ON si.category_id = sc.id
    WHERE ? = ''
       OR si.name LIKE ?
       OR si.description LIKE ?
       OR si.department LIKE ?
       OR sc.name LIKE ?
    ORDER BY si.is_hot DESC, si.sort_order ASC
    LIMIT 20
  `).all(keyword, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);

  if (!services.length) {
    services = database.prepare(`
      SELECT si.*, sc.name as category_name
      FROM service_items si
      LEFT JOIN service_categories sc ON si.category_id = sc.id
      ORDER BY si.is_hot DESC, si.sort_order ASC
      LIMIT 20
    `).all();
  }

  res.json({ list: services, total: services.length, keyword });
});

app.get('/api/admin/stats', (req, res) => {
  res.json(getDashboardPayload().statistics);
});

app.get('/api/admin/dashboard', (req, res) => {
  res.json(getDashboardPayload());
});

app.get('/api/products', (req, res) => {
  const database = db.getDb();
  const products = database.prepare(`
    SELECT si.id, si.name, si.department, si.description, si.handling_time, sc.name as category
    FROM service_items si
    LEFT JOIN service_categories sc ON si.category_id = sc.id
    ORDER BY si.is_hot DESC, si.sort_order ASC
    LIMIT 30
  `).all();
  res.json({ products, total: products.length, message: '政务服务事项列表' });
});

app.get('/api/orders', (req, res) => {
  const database = db.getDb();
  const orders = database.prepare(`
    SELECT a.*, u.name as user_name
    FROM applications a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 30
  `).all();
  res.json({ orders, total: orders.length, message: '政务办理申请记录' });
});

app.get('/api/cart', (req, res) => {
  res.json({ items: [], total: 0, message: '政务平台使用事项申请流程，无购物车' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/services', require('./routes/services'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/policy', require('./routes/policy'));
app.use('/api/city', require('./routes/city'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'gov-platform' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务启动于 http://127.0.0.1:${PORT}`);
});
