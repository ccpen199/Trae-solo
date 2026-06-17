require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./db/database');

const platformsRouter = require('./routes/platforms');
const ordersRouter = require('./routes/orders');
const merchantsRouter = require('./routes/merchants');
const afterSalesRouter = require('./routes/afterSales');
const compensationsRouter = require('./routes/compensations');
const settlementsRouter = require('./routes/settlements');

const app = express();
const PORT = process.env.BACKEND_PORT || 59214;

const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:49214';

app.use(cors({
  origin: frontendUrl,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/platforms', platformsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/merchants', merchantsRouter);
app.use('/api/after-sales', afterSalesRouter);
app.use('/api/compensations', compensationsRouter);
app.use('/api/settlements', settlementsRouter);

app.get('/api/dashboard/summary', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = DATE('now')) as today_orders,
      (SELECT COUNT(*) FROM orders WHERE delivery_status = 'delivering') as delivering_count,
      (SELECT COUNT(*) FROM orders WHERE delivery_status = 'delivered') as total_delivered,
      (SELECT COALESCE(SUM(total_fee), 0) FROM orders WHERE delivery_status = 'delivered') as total_revenue,
      (SELECT COUNT(*) FROM after_sales WHERE status = 'processing') as pending_after_sales,
      (SELECT COUNT(*) FROM compensations WHERE status = 'pending') as pending_compensations,
      (SELECT COUNT(*) FROM platforms WHERE status = 'active') as active_platforms,
      (SELECT COUNT(*) FROM merchants WHERE status = 'active') as active_merchants
  `).get();

  const recentOrders = db.prepare(`
    SELECT o.*, p.name as platform_name, p.logo as platform_logo, 
      p.capacity_saturation as platform_capacity, 
      p.on_time_rate as platform_ontime_rate,
      m.name as merchant_name
    FROM orders o
    LEFT JOIN platforms p ON o.platform_id = p.id
    LEFT JOIN merchants m ON o.merchant_id = m.id
    ORDER BY o.id DESC
    LIMIT 10
  `).all();

  const afterSalesList = db.prepare(`
    SELECT a.*, o.order_no, o.platform_id, p.name as platform_name, p.logo as platform_logo, m.name as merchant_name,
      CASE WHEN a.platform_ack = 1 THEN 1 ELSE 0 END as platform_synced
    FROM after_sales a
    LEFT JOIN orders o ON a.order_id = o.id
    LEFT JOIN platforms p ON o.platform_id = p.id
    LEFT JOIN merchants m ON o.merchant_id = m.id
    WHERE a.status = 'processing' OR a.status = 'accepted'
    ORDER BY a.id DESC
    LIMIT 5
  `).all();

  const compensationList = db.prepare(`
    SELECT c.*, o.order_no, o.platform_id, p.name as platform_name, p.logo as platform_logo
    FROM compensations c
    LEFT JOIN orders o ON c.order_id = o.id
    LEFT JOIN platforms p ON o.platform_id = p.id
    WHERE c.status = 'pending' OR c.status = 'review_pending'
    ORDER BY c.id DESC
    LIMIT 5
  `).all();

  const settlementList = db.prepare(`
    SELECT s.*, p.name as platform_name, p.logo as platform_logo
    FROM settlements s
    LEFT JOIN platforms p ON s.platform_id = p.id
    ORDER BY 
      CASE s.status 
        WHEN 'pending' THEN 1 
        WHEN 'reconciled' THEN 2 
        WHEN 'paid' THEN 3 
        ELSE 4 
      END,
      s.id DESC
    LIMIT 5
  `).all();

  const platformStats = db.prepare(`
    SELECT p.id, p.name, p.logo, p.code, p.base_price, p.per_km_price, p.per_kg_price,
      p.capacity_saturation, p.on_time_rate, p.loss_rate, p.complaint_rate,
      (SELECT COUNT(*) FROM orders o WHERE o.platform_id = p.id AND DATE(o.created_at) = DATE('now')) as today_orders,
      (SELECT COUNT(*) FROM orders o WHERE o.platform_id = p.id AND o.delivery_status = 'delivered') as total_delivered,
      (SELECT COUNT(*) FROM orders o WHERE o.platform_id = p.id AND o.delivery_status = 'exception') as exception_orders,
      (SELECT COUNT(*) FROM after_sales a LEFT JOIN orders o ON a.order_id = o.id WHERE o.platform_id = p.id AND a.status IN ('processing', 'accepted')) as pending_aftersales_count,
      (SELECT COUNT(*) FROM compensations c LEFT JOIN orders o ON c.order_id = o.id WHERE o.platform_id = p.id AND c.status IN ('pending', 'review_pending')) as pending_compensation_count
    FROM platforms p
    WHERE p.status = 'active'
    ORDER BY p.id
  `).all();

  const alertPlatforms = platformStats.filter(p =>
    p.capacity_saturation > 0.85 || p.complaint_rate > 0.02 || p.on_time_rate < 0.9
  ).map(p => ({
    ...p,
    alert_type: p.capacity_saturation > 0.85 ? 'capacity' : p.complaint_rate > 0.02 ? 'complaint' : 'ontime',
    alert_message: p.capacity_saturation > 0.85
      ? `运力饱和度达${(p.capacity_saturation * 100).toFixed(0)}%，超过预警线85%`
      : p.complaint_rate > 0.02
        ? `投诉率达${(p.complaint_rate * 100).toFixed(2)}%，超过预警线2%`
        : `准时率仅${(p.on_time_rate * 100).toFixed(1)}%，低于预警线90%`
  }));

  res.json({
    success: true,
    data: {
      ...stats,
      platform_stats: platformStats,
      recent_orders: recentOrders,
      after_sales_list: afterSalesList,
      compensation_list: compensationList,
      settlement_list: settlementList,
      alert_platforms: alertPlatforms
    }
  });
});

app.get(['/api/admin/stats', '/api/admin/dashboard'], (req, res) => {
  const summary = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM orders) as total_orders,
      (SELECT COUNT(*) FROM orders WHERE delivery_status = 'delivering') as delivering_count,
      (SELECT COUNT(*) FROM orders WHERE delivery_status = 'delivered') as delivered_count,
      (SELECT COALESCE(SUM(total_fee), 0) FROM orders WHERE delivery_status = 'delivered') as total_revenue,
      (SELECT COUNT(*) FROM platforms WHERE status = 'active') as active_platforms,
      (SELECT COUNT(*) FROM merchants WHERE status = 'active') as active_merchants,
      (SELECT COUNT(*) FROM after_sales WHERE status IN ('processing', 'accepted')) as pending_after_sales,
      (SELECT COUNT(*) FROM compensations WHERE status = 'pending') as pending_compensations
  `).get();

  const platformHealth = db.prepare(`
    SELECT id, code, name, logo, capacity_saturation, on_time_rate, loss_rate, complaint_rate, status
    FROM platforms
    ORDER BY id
  `).all();

  res.json({
    success: true,
    data: {
      ...summary,
      platform_health: platformHealth
    }
  });
});

app.get('/api/products', (req, res) => {
  const products = db.prepare(`
    SELECT
      id,
      code,
      name,
      logo,
      base_price,
      per_km_price,
      per_kg_price,
      min_delivery_time,
      max_delivery_time,
      capacity_saturation,
      status
    FROM platforms
    WHERE status = 'active'
    ORDER BY id
  `).all();

  res.json({
    success: true,
    data: products.map(platform => ({
      id: platform.id,
      sku: platform.code,
      name: `${platform.logo} ${platform.name} 配送服务`,
      category: '即时配送平台',
      base_price: platform.base_price,
      per_km_price: platform.per_km_price,
      per_kg_price: platform.per_kg_price,
      delivery_window: `${platform.min_delivery_time}-${platform.max_delivery_time}分钟`,
      capacity_saturation: platform.capacity_saturation,
      status: platform.status
    }))
  });
});

app.get(['/api/auth/me', '/api/users/profile', '/api/user/profile'], (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'local-admin',
      username: 'admin',
      role: 'admin',
      name: '配送调度中台管理员',
      permissions: ['dashboard.read', 'orders.manage', 'platforms.monitor', 'settlements.audit']
    }
  });
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const like = `%${keyword}%`;
  const orders = keyword
    ? db.prepare(`
      SELECT o.id, o.order_no, o.delivery_status, o.total_fee, p.name as platform_name, m.name as merchant_name
      FROM orders o
      LEFT JOIN platforms p ON o.platform_id = p.id
      LEFT JOIN merchants m ON o.merchant_id = m.id
      WHERE o.order_no LIKE ? OR p.name LIKE ? OR m.name LIKE ?
      ORDER BY o.id DESC LIMIT 10
    `).all(like, like, like)
    : db.prepare(`
      SELECT o.id, o.order_no, o.delivery_status, o.total_fee, p.name as platform_name, m.name as merchant_name
      FROM orders o
      LEFT JOIN platforms p ON o.platform_id = p.id
      LEFT JOIN merchants m ON o.merchant_id = m.id
      ORDER BY o.id DESC LIMIT 10
    `).all();
  const platforms = keyword
    ? db.prepare('SELECT id, code, name, status, capacity_saturation FROM platforms WHERE name LIKE ? OR code LIKE ? LIMIT 10').all(like, like)
    : db.prepare('SELECT id, code, name, status, capacity_saturation FROM platforms ORDER BY id LIMIT 10').all();
  res.json({ success: true, data: { query: keyword, orders, platforms } });
});

app.get('/api/cart', (req, res) => {
  const platform = db.prepare(`
    SELECT id, code, name, base_price
    FROM platforms
    WHERE status = 'active'
    ORDER BY id LIMIT 1
  `).get();
  const items = platform ? [{
    id: platform.id,
    sku: platform.code,
    name: `${platform.name} 配送服务`,
    price: platform.base_price,
    quantity: 1
  }] : [];
  res.json({
    success: true,
    data: {
      id: 'delivery-local-cart',
      items,
      total: items.reduce((sum, item) => sum + Number(item.price || 0), 0)
    }
  });
});

app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`========================================`);
  console.log(`  配送调度中台 - 后端服务`);
  console.log(`  端口: ${PORT}`);
  console.log(`  地址: http://127.0.0.1:${PORT}`);
  console.log(`  健康检查: http://127.0.0.1:${PORT}/api/health`);
  console.log(`========================================`);
});

module.exports = app;
