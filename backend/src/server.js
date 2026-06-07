const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

const app = express();
const PORT = process.env.BACKEND_PORT || 59017;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 49017}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require('./database');
db.init();

function demoUserFromRequest(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token === 'local-demo-admin') {
    return { id: 1, username: 'admin', type: 'enterprise' };
  }
  if (token === 'local-demo-personal') {
    return { id: 2, username: 'user1', type: 'personal' };
  }
  return { id: 1, username: 'admin', type: 'enterprise' };
}

function buildAdminDashboard() {
  const database = db.getDb();
  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const productCount = database.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const orderCount = database.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const pendingTickets = database.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get().count;
  const recentOrders = database.prepare(`
    SELECT o.*, u.username
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `).all();
  const salesByCategory = database.prepare(`
    SELECT p.category, SUM(oi.quantity * oi.price) as total_sales
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    GROUP BY p.category
  `).all();

  return {
    stats: { userCount, productCount, orderCount, pendingTickets },
    recentOrders,
    salesByCategory
  };
}

app.get('/api/auth/me', (req, res) => {
  const demoUser = demoUserFromRequest(req);
  res.json({ user: demoUser });
});

app.get('/api/users/profile', (req, res) => {
  const database = db.getDb();
  const demoUser = demoUserFromRequest(req);
  const user = database.prepare('SELECT id, username, email, type, phone, address, status, created_at FROM users WHERE id = ?').get(demoUser.id);
  res.json(user || demoUser);
});

app.get('/api/user/profile', (req, res) => {
  const database = db.getDb();
  const demoUser = demoUserFromRequest(req);
  const user = database.prepare('SELECT id, username, email, type, phone, address, status, created_at FROM users WHERE id = ?').get(demoUser.id);
  res.json(user || demoUser);
});

app.get('/api/search', (req, res) => {
  const database = db.getDb();
  const q = `%${String(req.query.q || req.query.keyword || '').trim()}%`;
  const products = database.prepare(`
    SELECT id, name, category, description, price, stock
    FROM products
    WHERE status = 'approved' AND (? = '%%' OR name LIKE ? OR description LIKE ? OR category LIKE ?)
    ORDER BY created_at DESC
    LIMIT 20
  `).all(q, q, q, q);
  const tickets = database.prepare(`
    SELECT id, title, type AS category, status, created_at
    FROM tickets
    WHERE ? = '%%' OR title LIKE ? OR type LIKE ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(q, q, q);
  res.json({ products, tickets, total: products.length + tickets.length });
});

app.get('/api/admin/stats', (req, res) => {
  res.json(buildAdminDashboard().stats);
});

app.get('/api/admin/dashboard', (req, res) => {
  res.json(buildAdminDashboard());
});

app.get('/api/orders', (req, res) => {
  const database = db.getDb();
  const orders = database.prepare(`
    SELECT o.*, u.username
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 20
  `).all();
  res.json({ orders, total: orders.length });
});

app.get('/api/cart', (req, res) => {
  res.json({
    items: [],
    total: 0,
    message: '邮品商城采用立即购买流程，演示购物车为空'
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
