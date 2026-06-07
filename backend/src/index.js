const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

const db = require('./db/init');

const app = express();
const PORT = Number(process.env.BACKEND_PORT || 59014);
const databasePath = db.name || path.join(__dirname, '../data/app.sqlite');
const dbPath = path.join(__dirname, '../data/app.sqlite');

app.use(cors({
  origin: [
    `http://127.0.0.1:${process.env.FRONTEND_PORT || 49014}`,
    `http://localhost:${process.env.FRONTEND_PORT || 49014}`
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function rowOrNull(stmt, ...args) {
  return stmt.get(...args) || null;
}

function parseJson(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function currentUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token.includes('driver')) {
    return { id: 1, type: 'driver', name: '演示司机' };
  }
  if (token.includes('admin')) {
    return { id: 1, type: 'admin', name: '演示管理员' };
  }
  return { id: 1, type: 'shipper', name: '演示货主' };
}

function calculatePrice(input) {
  const distance = Number(input.distance || 10);
  const vehicleType = input.vehicle_type || '小面';
  const cargoWeight = Number(input.cargo_weight || 0);
  const cargoVolume = Number(input.cargo_volume || 0);
  const vehicleBase = { '小面': 38, '中面': 58, '金杯': 78, '厢货': 118, '平板': 168 };
  const kmRate = { '小面': 4.5, '中面': 5.8, '金杯': 7.2, '厢货': 9.5, '平板': 12 };
  const base = vehicleBase[vehicleType] || 58;
  const distanceFee = Math.round(distance * (kmRate[vehicleType] || 5.8));
  const loadingSurcharge = input.loading_requirement === 'heavy' ? 80 : input.loading_requirement === 'need_help' ? 40 : 0;
  const weightSurcharge = Math.max(0, Math.round((cargoWeight - 500) * 0.2));
  const volumeSurcharge = Math.max(0, Math.round((cargoVolume - 3) * 12));
  const timeMultiplier = 1;
  const subtotal = base + distanceFee + loadingSurcharge + weightSurcharge + volumeSurcharge;
  return {
    price: Math.round(subtotal * timeMultiplier),
    price_detail: {
      base,
      distance: distanceFee,
      loading_surcharge: loadingSurcharge,
      weight_surcharge: weightSurcharge,
      volume_surcharge: volumeSurcharge,
      time_multiplier: timeMultiplier
    }
  };
}

function decorateOrder(order) {
  if (!order) return order;
  return { ...order, price_detail: parseJson(order.price_detail, {}) };
}

function orderById(id) {
  return decorateOrder(rowOrNull(db.prepare('SELECT * FROM orders WHERE id = ?'), id));
}

function makeTracking(order) {
  if (!order) return [];
  const baseTime = order.created_at || new Date().toISOString();
  const entries = [
    { desc: `订单 ${order.order_no} 已发布，等待司机接单`, time: baseTime },
    { desc: order.driver_id ? '司机已接单，正在前往取货点' : '系统正在匹配附近司机', time: order.accepted_at || baseTime },
    { desc: '货物已取件，开始运输', time: order.picked_at || order.accepted_at || baseTime },
    { desc: '车辆接近目的地，预计很快送达', time: order.delivered_at || order.picked_at || baseTime }
  ];
  if (['delivered', 'completed'].includes(order.status)) {
    entries.unshift({ desc: '货物已送达，请确认收货', time: order.delivered_at || new Date().toISOString() });
  }
  if (order.status === 'completed') {
    entries.unshift({ desc: '订单已完成，感谢使用快货运', time: order.completed_at || new Date().toISOString() });
  }
  return entries;
}

function activeDriver() {
  return rowOrNull(db.prepare("SELECT * FROM drivers WHERE status = 'approved' ORDER BY online DESC, service_score DESC LIMIT 1"));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'freight-backend', database: databasePath, timestamp: new Date().toISOString() });
});

app.get(['/api/auth/me', '/api/users/profile', '/api/user/profile'], (req, res) => {
  const user = currentUser(req);
  res.json({
    user,
    profile: {
      id: user.id,
      name: user.name,
      type: user.type,
      phone: user.type === 'driver' ? '13800138001' : '13900139001'
    }
  });
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const like = `%${keyword}%`;
  const orders = keyword
    ? db.prepare(`
        SELECT id, order_no, start_address, end_address, cargo_type, status, price, created_at
        FROM orders
        WHERE order_no LIKE ? OR start_address LIKE ? OR end_address LIKE ? OR cargo_type LIKE ?
        ORDER BY created_at DESC
        LIMIT 20
      `).all(like, like, like, like)
    : db.prepare(`
        SELECT id, order_no, start_address, end_address, cargo_type, status, price, created_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT 20
      `).all();
  const drivers = keyword
    ? db.prepare(`
        SELECT id, name, phone, vehicle_type, vehicle_number, service_score, status, online
        FROM drivers
        WHERE name LIKE ? OR phone LIKE ? OR vehicle_type LIKE ? OR vehicle_number LIKE ?
        ORDER BY online DESC, service_score DESC
        LIMIT 20
      `).all(like, like, like, like)
    : db.prepare(`
        SELECT id, name, phone, vehicle_type, vehicle_number, service_score, status, online
        FROM drivers
        ORDER BY online DESC, service_score DESC
        LIMIT 20
      `).all();

  res.json({
    keyword,
    total: orders.length + drivers.length,
    orders,
    drivers
  });
});

app.post('/api/auth/shipper/login', (req, res) => {
  const phone = req.body.phone || '13900139001';
  let user = rowOrNull(db.prepare('SELECT id, phone, name, type FROM shippers WHERE phone = ?'), phone);
  if (!user) {
    db.prepare('INSERT INTO shippers (phone, name, type, password) VALUES (?, ?, ?, ?)').run(phone, req.body.name || '演示货主', 'personal', req.body.password || '123456');
    user = rowOrNull(db.prepare('SELECT id, phone, name, type FROM shippers WHERE phone = ?'), phone);
  }
  res.json({ token: 'local-demo-shipper', user });
});

app.post('/api/auth/shipper/register', (req, res) => {
  const phone = req.body.phone || `139${Date.now().toString().slice(-8)}`;
  db.prepare('INSERT OR IGNORE INTO shippers (phone, name, type, password) VALUES (?, ?, ?, ?)').run(phone, req.body.name || '新货主', 'personal', req.body.password || '123456');
  const user = rowOrNull(db.prepare('SELECT id, phone, name, type FROM shippers WHERE phone = ?'), phone);
  res.json({ token: 'local-demo-shipper', user });
});

app.post('/api/auth/driver/login', (req, res) => {
  const phone = req.body.phone || '13800138001';
  const user = rowOrNull(db.prepare('SELECT * FROM drivers WHERE phone = ?'), phone) || activeDriver();
  res.json({ token: 'local-demo-driver', user });
});

app.post('/api/auth/driver/register', (req, res) => {
  const phone = req.body.phone || `138${Date.now().toString().slice(-8)}`;
  db.prepare(`
    INSERT OR IGNORE INTO drivers (phone, name, password, vehicle_type, vehicle_number, service_score, order_count, status, lat, lng, online)
    VALUES (?, ?, ?, ?, ?, 5.0, 0, 'pending', 39.9042, 116.4074, 0)
  `).run(phone, req.body.name || '新司机', req.body.password || '123456', req.body.vehicle_type || '小面', req.body.vehicle_number || '待录入');
  const user = rowOrNull(db.prepare('SELECT * FROM drivers WHERE phone = ?'), phone);
  res.json({ token: 'local-demo-driver', user });
});

app.post('/api/auth/admin/login', (req, res) => {
  res.json({ token: 'local-demo-admin', user: { id: 1, username: req.body.username || 'admin', name: '演示管理员', role: 'admin' } });
});

app.get('/api/stats', (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
  const activeOrders = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE status IN ('pending','accepted','picked','in_transit')").get().count;
  const completedOrders = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE status = 'completed'").get().count;
  const totalDrivers = db.prepare('SELECT COUNT(*) AS count FROM drivers').get().count;
  const approvedDrivers = db.prepare("SELECT COUNT(*) AS count FROM drivers WHERE status = 'approved'").get().count;
  const onlineDrivers = db.prepare("SELECT COUNT(*) AS count FROM drivers WHERE online = 1 AND status = 'approved'").get().count;
  const revenue = db.prepare("SELECT COALESCE(SUM(price), 0) AS total FROM orders WHERE status = 'completed'").get().total;
  const today = new Date().toISOString().slice(0, 10);
  const todayRevenue = db.prepare("SELECT COALESCE(SUM(price), 0) AS total FROM orders WHERE status = 'completed' AND date(created_at/1000, 'unixepoch') = ?").get(today).total;

  const idleDrivers = db.prepare(`
    SELECT COUNT(*) AS count FROM drivers
    WHERE status = 'approved' AND online = 1
    AND id NOT IN (SELECT DISTINCT driver_id FROM orders WHERE status IN ('accepted','picked','in_transit') AND driver_id IS NOT NULL)
  `).get().count;

  const qualityStats = db.prepare(`
    SELECT
      COALESCE(CAST(SUM(is_on_time) AS REAL) / NULLIF(COUNT(*), 0), 0) as on_time_rate,
      COALESCE(CAST((SELECT COUNT(*) FROM complaints) AS REAL) / NULLIF(COUNT(*), 0), 0) as complaint_rate,
      COALESCE(CAST(SUM(has_damage) AS REAL) / NULLIF(COUNT(*), 0), 0) as damage_rate,
      COALESCE((SELECT COUNT(*) FROM complaints), 0) as total_complaints,
      COALESCE((SELECT COUNT(*) FROM complaints WHERE status = 'pending'), 0) as pending_complaints
    FROM orders WHERE status = 'completed'
  `).get();

  const capacityStats = {
    online_drivers: onlineDrivers,
    active_orders: activeOrders,
    total_approved: approvedDrivers,
    idle_drivers: idleDrivers,
    empty_rate: onlineDrivers > 0 ? idleDrivers / onlineDrivers : 0
  };

  const revenueStats = {
    today_revenue: todayRevenue,
    total_revenue: revenue,
    avg_price: completedOrders > 0 ? Math.round(revenue / completedOrders) : 0,
    today_orders: db.prepare("SELECT COUNT(*) AS count FROM orders WHERE date(created_at/1000, 'unixepoch') = ?").get(today).count
  };

  res.json({
    order_stats: { total_orders: totalOrders, active_orders: activeOrders, completed_orders: completedOrders },
    driver_stats: { total_drivers: totalDrivers, online_drivers: onlineDrivers, avg_score: db.prepare('SELECT AVG(service_score) AS avg FROM drivers WHERE status = ?').get('approved').avg },
    capacity_stats: capacityStats,
    quality_stats: qualityStats,
    revenue_stats: revenueStats
  });
});

app.get('/api/public/quality', (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count || 1;
  const late = db.prepare('SELECT COUNT(*) AS count FROM orders WHERE is_on_time = 0').get().count;
  const damaged = db.prepare('SELECT COUNT(*) AS count FROM orders WHERE has_damage = 1').get().count;
  const complaints = db.prepare('SELECT COUNT(*) AS count FROM complaints').get().count;

  const recentComplaints = db.prepare(`
    SELECT c.id, c.order_id, o.order_no, c.type, c.content, c.status, c.created_at
    FROM complaints c
    JOIN orders o ON c.order_id = o.id
    ORDER BY c.created_at DESC
    LIMIT 10
  `).all();

  const avgPrice = db.prepare('SELECT COALESCE(AVG(price), 0) AS avg FROM orders WHERE status = ?').get('completed').avg;
  const priceAnomalies = avgPrice > 0 ? db.prepare(`
    SELECT id, order_no, price, distance, vehicle_type,
           ROUND(ABS(price - ?) / ? * 100, 1) AS deviation_pct
    FROM orders
    WHERE status = 'completed' AND ABS(price - ?) / ? > 0.5
    ORDER BY ABS(price - ?) DESC
    LIMIT 10
  `).all(avgPrice, avgPrice, avgPrice, avgPrice, avgPrice) : [];

  res.json({
    quality_metrics: {
      on_time_rate: Math.round((1 - late / totalOrders) * 1000) / 1000,
      complaint_rate: Math.round((complaints / totalOrders) * 1000) / 1000,
      damage_rate: Math.round((damaged / totalOrders) * 1000) / 1000,
      total_orders: totalOrders
    },
    recent_complaints: recentComplaints,
    price_anomalies: priceAnomalies
  });
});

app.get('/api/public/orders', (req, res) => {
  const status = req.query.status;
  const limit = parseInt(req.query.limit || 20);
  const orders = status
    ? db.prepare(`
        SELECT o.id, o.order_no, o.start_address, o.end_address, o.distance, o.vehicle_type,
               o.status, o.price, o.created_at,
               s.name as shipper_name, d.name as driver_name
        FROM orders o
        LEFT JOIN shippers s ON o.shipper_id = s.id
        LEFT JOIN drivers d ON o.driver_id = d.id
        WHERE o.status = ?
        ORDER BY o.created_at DESC
        LIMIT ?
      `).all(status, limit)
    : db.prepare(`
        SELECT o.id, o.order_no, o.start_address, o.end_address, o.distance, o.vehicle_type,
               o.status, o.price, o.created_at,
               s.name as shipper_name, d.name as driver_name
        FROM orders o
        LEFT JOIN shippers s ON o.shipper_id = s.id
        LEFT JOIN drivers d ON o.driver_id = d.id
        ORDER BY o.created_at DESC
        LIMIT ?
      `).all(limit);
  res.json({ orders, count: orders.length });
});

app.get('/api/products', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, order_no, cargo_type, vehicle_type, distance, price, status,
           start_address, end_address, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 30
  `).all();
  res.json({
    products: rows.map(order => ({
      id: order.id,
      name: `${order.cargo_type} ${order.vehicle_type}`,
      category: order.vehicle_type,
      price: order.price,
      status: order.status,
      description: `${order.start_address} -> ${order.end_address}`,
      order_no: order.order_no,
      distance: order.distance,
      created_at: order.created_at
    })),
    total: rows.length
  });
});

app.get('/api/cart', (_req, res) => {
  res.json({ items: [], total: 0, message: '快货运使用即时下单流程，无独立购物车' });
});

app.get('/api/public/nearby-drivers', (req, res) => {
  const lat = Number(req.query.lat || 39.9);
  const lng = Number(req.query.lng || 116.4);
  const drivers = db.prepare("SELECT * FROM drivers WHERE status = 'approved' ORDER BY online DESC, service_score DESC").all()
    .map((driver, index) => ({
      ...driver,
      distance: Math.round((Math.abs((driver.lat || lat) - lat) + Math.abs((driver.lng || lng) - lng) + 0.8 + index * 0.4) * 10) / 10,
      has_active_order: Boolean(db.prepare("SELECT COUNT(*) AS count FROM orders WHERE driver_id = ? AND status IN ('accepted','picked','in_transit')").get(driver.id).count)
    }));
  res.json({ drivers });
});

app.get('/api/drivers/nearby', (req, res) => {
  const lat = Number(req.query.lat || 39.9);
  const lng = Number(req.query.lng || 116.4);
  const drivers = db.prepare("SELECT * FROM drivers WHERE status = 'approved' ORDER BY online DESC, service_score DESC").all()
    .map((driver, index) => ({
      ...driver,
      distance: Math.round((Math.abs((driver.lat || lat) - lat) + Math.abs((driver.lng || lng) - lng) + 0.8 + index * 0.4) * 10) / 10,
      has_active_order: Boolean(db.prepare("SELECT COUNT(*) AS count FROM orders WHERE driver_id = ? AND status IN ('accepted','picked','in_transit')").get(driver.id).count)
    }));
  res.json({ drivers, total: drivers.length });
});

app.post('/api/orders/estimate', (req, res) => {
  res.json(calculatePrice(req.body || {}));
});

app.post('/api/orders', (req, res) => {
  const user = currentUser(req);
  const estimate = calculatePrice(req.body || {});
  const insuredValue = Number(req.body.insured_value || 0);
  const insuranceFee = insuredValue > 0 ? Math.round(insuredValue * 0.003) : 0;
  const driver = activeDriver();
  const orderNo = `FY${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Date.now().toString().slice(-5)}`;
  const result = db.prepare(`
    INSERT INTO orders (
      order_no, shipper_id, driver_id, cargo_type, cargo_weight, cargo_volume, cargo_desc,
      start_address, start_lat, start_lng, end_address, end_lat, end_lng, distance,
      vehicle_type, loading_requirement, price, price_detail, insured_value, insurance_fee, status, remark, estimated_arrival
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now','+2 hours'))
  `).run(
    orderNo,
    user.type === 'shipper' ? user.id : 1,
    driver?.id || null,
    req.body.cargo_type || '日用品',
    Number(req.body.cargo_weight || 100),
    Number(req.body.cargo_volume || 1),
    req.body.cargo_desc || '',
    req.body.start_address || '北京市朝阳区国贸',
    Number(req.body.start_lat || 39.9087),
    Number(req.body.start_lng || 116.4605),
    req.body.end_address || '北京市海淀区中关村',
    Number(req.body.end_lat || 39.9842),
    Number(req.body.end_lng || 116.3074),
    Number(req.body.distance || 10),
    req.body.vehicle_type || '小面',
    req.body.loading_requirement || '',
    estimate.price + insuranceFee,
    JSON.stringify(estimate.price_detail),
    insuredValue,
    insuranceFee,
    req.body.remark || ''
  );
  if (insuredValue > 0) {
    db.prepare('INSERT INTO insurance_orders (order_id, policy_no, insured_value, premium) VALUES (?, ?, ?, ?)')
      .run(result.lastInsertRowid, `INS${Date.now().toString().slice(-8)}`, insuredValue, insuranceFee);
  }
  res.status(201).json({ order: orderById(result.lastInsertRowid) });
});

app.get('/api/orders', (req, res) => {
  const status = req.query.status;
  const rows = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 50').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50').all();
  res.json({ orders: rows.map(decorateOrder), total: rows.length });
});

app.get('/api/orders/my', (req, res) => {
  const user = currentUser(req);
  const status = req.query.status;
  const filters = [];
  const params = [];
  if (user.type === 'driver') {
    filters.push('(driver_id = ? OR status = ?)');
    params.push(user.id, 'pending');
  } else {
    filters.push('shipper_id = ?');
    params.push(1);
  }
  if (status) {
    filters.push('status = ?');
    params.push(status);
  }
  const rows = db.prepare(`SELECT * FROM orders WHERE ${filters.join(' AND ')} ORDER BY created_at DESC`).all(...params);
  res.json({ orders: rows.map(decorateOrder) });
});

app.get('/api/orders/:id', (req, res) => {
  const order = orderById(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  const driver = order.driver_id ? rowOrNull(db.prepare('SELECT * FROM drivers WHERE id = ?'), order.driver_id) : null;
  const shipper = rowOrNull(db.prepare('SELECT id, phone, name, type FROM shippers WHERE id = ?'), order.shipper_id);
  const evidences = db.prepare('SELECT * FROM order_evidences WHERE order_id = ? ORDER BY created_at DESC').all(order.id);
  const insurance = rowOrNull(db.prepare('SELECT * FROM insurance_orders WHERE order_id = ? ORDER BY created_at DESC LIMIT 1'), order.id);
  const review = rowOrNull(db.prepare('SELECT * FROM reviews WHERE order_id = ?'), order.id);
  res.json({ order, driver, shipper, evidences, insurance, review });
});

app.post('/api/orders/:id/accept', (req, res) => {
  const driver = activeDriver();
  db.prepare("UPDATE orders SET status = 'accepted', driver_id = ?, accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(driver?.id || 1, req.params.id);
  res.json({ order: orderById(req.params.id) });
});

app.post('/api/orders/:id/pickup', (req, res) => {
  db.prepare("UPDATE orders SET status = 'picked', picked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json({ order: orderById(req.params.id) });
});

app.post('/api/orders/:id/deliver', (req, res) => {
  db.prepare("UPDATE orders SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json({ order: orderById(req.params.id) });
});

app.post('/api/orders/:id/complete', (req, res) => {
  db.prepare("UPDATE orders SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json({ order: orderById(req.params.id) });
});

app.post('/api/orders/:id/sign', (req, res) => {
  db.prepare('UPDATE orders SET signed_at = CURRENT_TIMESTAMP, driver_signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  res.json({ ok: true, order: orderById(req.params.id) });
});

app.post('/api/orders/:id/review', (req, res) => {
  const order = orderById(req.params.id);
  if (!order || !order.driver_id) return res.status(400).json({ error: '订单无司机信息' });
  db.prepare('INSERT OR REPLACE INTO reviews (order_id, shipper_id, driver_id, score, content) VALUES (?, ?, ?, ?, ?)')
    .run(order.id, order.shipper_id, order.driver_id, Number(req.body.score || 5), req.body.content || '');
  db.prepare('UPDATE drivers SET service_score = (SELECT ROUND(AVG(score), 1) FROM reviews WHERE driver_id = ?) WHERE id = ?').run(order.driver_id, order.driver_id);
  res.json({ ok: true });
});

app.post('/api/orders/:id/complaint', (req, res) => {
  db.prepare('INSERT INTO complaints (order_id, complainant_id, type, content) VALUES (?, ?, ?, ?)')
    .run(req.params.id, 1, req.body.type || 'service', req.body.content || '服务体验待核实');
  res.status(201).json({ ok: true });
});

app.post('/api/drivers/evidence', (req, res) => {
  const orderId = Number(req.body.order_id || 1);
  db.prepare('INSERT INTO order_evidences (order_id, driver_id, type, file_url, remark) VALUES (?, ?, ?, ?, ?)')
    .run(orderId, 1, req.body.type || 'image', req.body.file_url || 'https://dummyimage.com/320x200/e6f4ff/1677ff&text=delivery-proof', req.body.remark || '演示上传凭证');
  res.status(201).json({ ok: true });
});

app.get('/api/drivers/profile', (req, res) => {
  const driver = activeDriver();
  const recentReviews = db.prepare(`
    SELECT r.*, o.order_no FROM reviews r JOIN orders o ON o.id = r.order_id
    WHERE r.driver_id = ? ORDER BY r.created_at DESC LIMIT 5
  `).all(driver?.id || 1);
  res.json({ driver: { ...driver, recent_reviews: recentReviews } });
});

app.post('/api/drivers/location', (req, res) => {
  db.prepare('UPDATE drivers SET lat = ?, lng = ?, online = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(Number(req.body.lat || 39.9042), Number(req.body.lng || 116.4074), Number(req.body.online ?? 1), 1);
  res.json({ ok: true });
});

app.get('/api/tracking/query', (req, res) => {
  const orderNo = String(req.query.order_no || '').trim();
  const order = orderNo
    ? rowOrNull(db.prepare('SELECT * FROM orders WHERE order_no = ? OR id = ?'), orderNo, Number(orderNo) || -1)
    : rowOrNull(db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1'));
  if (!order) return res.status(404).json({ error: '未找到订单轨迹' });
  res.json({ order_no: order.order_no, status: order.status, traces: makeTracking(order) });
});

app.get('/api/admin/dashboard', (req, res) => {
  const one = (sql, key = 'count') => db.prepare(sql).get()[key] || 0;
  res.json({
    today_orders: {
      count: one("SELECT COUNT(*) AS count FROM orders WHERE date(created_at) = date('now')"),
      revenue: Math.round(one("SELECT COALESCE(SUM(price), 0) AS total FROM orders WHERE date(created_at) = date('now')", 'total'))
    },
    order_stats: {
      total_orders: one('SELECT COUNT(*) AS count FROM orders'),
      pending_orders: one("SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'"),
      accepted_orders: one("SELECT COUNT(*) AS count FROM orders WHERE status = 'accepted'"),
      picked_orders: one("SELECT COUNT(*) AS count FROM orders WHERE status IN ('picked','in_transit')"),
      delivered_orders: one("SELECT COUNT(*) AS count FROM orders WHERE status = 'delivered'"),
      completed_orders: one("SELECT COUNT(*) AS count FROM orders WHERE status = 'completed'"),
      total_revenue: Math.round(one("SELECT COALESCE(SUM(price), 0) AS total FROM orders", 'total'))
    },
    driver_stats: {
      approved_drivers: one("SELECT COUNT(*) AS count FROM drivers WHERE status = 'approved'"),
      pending_drivers: one("SELECT COUNT(*) AS count FROM drivers WHERE status = 'pending'"),
      online_drivers: one("SELECT COUNT(*) AS count FROM drivers WHERE online = 1"),
      avg_score: one('SELECT COALESCE(AVG(service_score), 0) AS avg FROM drivers', 'avg')
    },
    complaint_stats: {
      pending_complaints: one("SELECT COUNT(*) AS count FROM complaints WHERE status = 'pending'")
    }
  });
});

app.get('/api/admin/stats', (_req, res) => {
  const one = (sql, key = 'count') => db.prepare(sql).get()[key] || 0;
  res.json({
    overview: {
      totalOrders: one('SELECT COUNT(*) AS count FROM orders'),
      activeOrders: one("SELECT COUNT(*) AS count FROM orders WHERE status IN ('pending','accepted','picked','in_transit')"),
      completedOrders: one("SELECT COUNT(*) AS count FROM orders WHERE status = 'completed'"),
      totalDrivers: one('SELECT COUNT(*) AS count FROM drivers'),
      onlineDrivers: one("SELECT COUNT(*) AS count FROM drivers WHERE online = 1"),
      totalRevenue: Math.round(one("SELECT COALESCE(SUM(price), 0) AS total FROM orders", 'total'))
    },
    recentOrders: db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10').all().map(decorateOrder)
  });
});

app.get('/api/admin/quality-metrics', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count || 1;
  const complaints = db.prepare('SELECT COUNT(*) AS count FROM complaints').get().count;
  const damage = db.prepare('SELECT COUNT(*) AS count FROM orders WHERE has_damage = 1').get().count;
  const late = db.prepare('SELECT COUNT(*) AS count FROM orders WHERE is_on_time = 0').get().count;
  res.json({
    total_orders: total,
    on_time_rate: Math.round((1 - late / total) * 1000) / 10,
    complaint_rate: Math.round((complaints / total) * 1000) / 10,
    damage_rate: Math.round((damage / total) * 1000) / 10
  });
});

app.get('/api/admin/capacity-dashboard', (req, res) => {
  const drivers = db.prepare("SELECT * FROM drivers WHERE status = 'approved' ORDER BY online DESC, service_score DESC").all();
  const activeOrders = db.prepare("SELECT * FROM orders WHERE status IN ('pending','accepted','picked','in_transit') ORDER BY created_at DESC").all().map(decorateOrder);
  res.json({ drivers, active_orders: activeOrders });
});

app.get('/api/admin/audit/orders', (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.max(1, Number(req.query.page_size || 10));
  const total = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
  const orders = db.prepare(`
    SELECT o.*, s.name AS shipper_name, d.name AS driver_name
    FROM orders o
    LEFT JOIN shippers s ON s.id = o.shipper_id
    LEFT JOIN drivers d ON d.id = o.driver_id
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, (page - 1) * pageSize).map(decorateOrder);
  res.json({ total, page, page_size: pageSize, orders });
});

app.get('/api/admin/drivers', (req, res) => {
  const status = req.query.status;
  const drivers = status
    ? db.prepare('SELECT * FROM drivers WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM drivers ORDER BY created_at DESC').all();
  res.json({ drivers });
});

app.post('/api/admin/drivers/:id/approve', (req, res) => {
  db.prepare("UPDATE drivers SET status = 'approved', online = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/admin/drivers/:id/reject', (req, res) => {
  db.prepare("UPDATE drivers SET status = 'rejected', online = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/complaints', (req, res) => {
  const status = req.query.status;
  const sql = `
    SELECT c.*, o.order_no, o.price
    FROM complaints c
    LEFT JOIN orders o ON o.id = c.order_id
    ${status ? 'WHERE c.status = ?' : ''}
    ORDER BY c.created_at DESC
  `;
  const complaints = status ? db.prepare(sql).all(status) : db.prepare(sql).all();
  res.json({ complaints });
});

app.post('/api/admin/complaints/:id/handle', (req, res) => {
  db.prepare("UPDATE complaints SET status = 'handled', result = ?, handler_id = 1 WHERE id = ?")
    .run(req.body.result || '已核实并完成处理', req.params.id);
  res.json({ ok: true });
});

app.use((req, res) => {
  res.status(404).json({ error: `未找到接口 ${req.method} ${req.path}` });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
