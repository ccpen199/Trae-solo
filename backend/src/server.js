const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env'), override: true });
const db = require('./database');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const contractRoutes = require('./routes/contractRoutes');
const adminRoutes = require('./routes/adminRoutes');
const businessRoutes = require('./routes/businessRoutes');

const app = express();
const FRONTEND_PORT = process.env.FRONTEND_PORT || 49030;
const BACKEND_PORT = process.env.BACKEND_PORT || 59030;

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'direct-home-platform-api'
  });
});

function safeGet(sql, params = []) {
  try {
    return db.prepare(sql).get(...params) || {};
  } catch (error) {
    return {};
  }
}

function safeAll(sql, params = []) {
  try {
    return db.prepare(sql).all(...params);
  } catch (error) {
    return [];
  }
}

function demoUser() {
  return safeGet('SELECT id, username, phone, real_name, role, credit_score, is_verified FROM users WHERE username = ?', ['admin']) || {
    id: 1,
    username: 'admin',
    phone: '13800000000',
    real_name: '演示管理员',
    role: 'admin',
    credit_score: 100,
    is_verified: 1
  };
}

function propertyList(keyword = '') {
  const q = String(keyword || '').trim();
  const params = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];
  const where = q ? 'WHERE p.title LIKE ? OR p.address LIKE ? OR p.community LIKE ?' : '';
  return safeAll(`
    SELECT p.id, p.title as name, p.title, p.description, p.property_type as category,
           p.rent_mode, p.price, p.area, p.rooms, p.address, p.city, p.district,
           p.community, p.status, p.is_verified, u.real_name as owner_name
    FROM properties p
    LEFT JOIN users u ON p.owner_id = u.id
    ${where}
    ORDER BY p.is_verified DESC, p.created_at DESC
    LIMIT 20
  `, params);
}

function adminStats() {
  return {
    totalUsers: safeGet('SELECT COUNT(*) as count FROM users').count || 0,
    totalProperties: safeGet('SELECT COUNT(*) as count FROM properties').count || 0,
    verifiedProperties: safeGet('SELECT COUNT(*) as count FROM properties WHERE is_verified = 1').count || 0,
    pendingProperties: safeGet("SELECT COUNT(*) as count FROM properties WHERE status = 'pending'").count || 0,
    totalContracts: safeGet('SELECT COUNT(*) as count FROM contracts').count || 0,
    activeContracts: safeGet("SELECT COUNT(*) as count FROM contracts WHERE status = 'active'").count || 0,
    pendingDisputes: safeGet("SELECT COUNT(*) as count FROM disputes WHERE status = 'pending'").count || 0
  };
}

app.get('/api/users/profile', (req, res) => {
  res.json({ user: demoUser() });
});

app.get('/api/user/profile', (req, res) => {
  res.json({ user: demoUser() });
});

app.get('/api/search', (req, res) => {
  const keyword = req.query.q || req.query.keyword || '';
  const properties = propertyList(keyword);
  res.json({ properties, products: properties, total: properties.length, keyword });
});

app.get('/api/products', (req, res) => {
  const products = propertyList('');
  res.json({ products, total: products.length });
});

app.get('/api/listings', (req, res) => {
  const keyword = req.query.q || req.query.keyword || '';
  const properties = propertyList(keyword);
  res.json({ listings: properties, properties, products: properties, total: properties.length });
});

app.get('/api/listings/:id', (req, res) => {
  const property = safeGet(`
    SELECT p.*, u.real_name as owner_name
    FROM properties p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?
  `, [req.params.id]);
  if (!property.id) {
    return res.status(404).json({ error: '房源不存在' });
  }
  res.json({ listing: property, property, product: property });
});

app.get('/api/orders', (req, res) => {
  const orders = safeAll(`
    SELECT so.*, p.title as property_title, u.real_name as user_name
    FROM service_orders so
    LEFT JOIN properties p ON so.property_id = p.id
    LEFT JOIN users u ON so.user_id = u.id
    ORDER BY so.created_at DESC
    LIMIT 20
  `);
  res.json({ orders, total: orders.length });
});

app.get('/api/cart', (req, res) => {
  res.json({ items: [], total: 0, message: '直连家园使用房源交易和服务订单流程，无购物车' });
});

app.get('/api/admin/stats', (req, res) => {
  const stats = adminStats();
  res.json({ stats, overview: stats });
});

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', businessRoutes);

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`\n========================================`);
  console.log(`🚀 后端服务已启动`);
  console.log(`📍 地址: http://127.0.0.1:${BACKEND_PORT}`);
  console.log(`🔍 健康检查: http://127.0.0.1:${BACKEND_PORT}/api/health`);
  console.log(`========================================\n`);
});

module.exports = app;
