require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

const PORT = process.env.BACKEND_PORT || 59093;
const HOST = process.env.HOST || '127.0.0.1';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://127.0.0.1:49093';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  const db = require('./db');
  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const result = stmt.get();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      port: PORT,
      database: 'connected',
      userCount: result.count
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

const db = require('./db');

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
  const user = stmt.get(username, password);
  
  if (!user) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }
  
  delete user.password;
  res.json({
    code: 200,
    message: '登录成功',
    data: user
  });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, real_name, phone, role, id_card } = req.body;
  
  const checkStmt = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ?');
  const exists = checkStmt.get(username, phone);
  if (exists) {
    return res.status(400).json({ code: 400, message: '用户名或手机号已存在' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO users (username, password, real_name, phone, role, id_card, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `);
  const result = stmt.run(username, password, real_name, phone, role || 'resident', id_card);
  
  res.json({
    code: 200,
    message: '注册成功，等待审核',
    data: { id: result.lastInsertRowid }
  });
});

app.get('/api/users/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(req.params.id);
  if (user) delete user.password;
  res.json({ code: 200, data: user });
});

app.get('/api/users', (req, res) => {
  const { role, status } = req.query;
  let sql = 'SELECT * FROM users WHERE 1=1';
  const params = [];
  
  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  const stmt = db.prepare(sql);
  const users = stmt.all(...params);
  users.forEach(u => delete u.password);
  
  res.json({ code: 200, data: users });
});

app.put('/api/users/:id/verify', (req, res) => {
  const { status, verified_by } = req.body;
  const stmt = db.prepare(`
    UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.run(status || 'verified', req.params.id);
  res.json({ code: 200, message: '审核完成' });
});

app.get('/api/buildings', (req, res) => {
  const stmt = db.prepare('SELECT * FROM buildings ORDER BY name');
  const buildings = stmt.all();
  res.json({ code: 200, data: buildings });
});

app.get('/api/rooms', (req, res) => {
  const { building_id, status } = req.query;
  let sql = `
    SELECT r.*, b.name as building_name, 
           u.real_name as owner_name, u.phone as owner_phone
    FROM rooms r
    LEFT JOIN buildings b ON r.building_id = b.id
    LEFT JOIN users u ON r.owner_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (building_id) {
    sql += ' AND r.building_id = ?';
    params.push(building_id);
  }
  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY b.name, r.floor, r.unit_number';
  
  const stmt = db.prepare(sql);
  const rooms = stmt.all(...params);
  res.json({ code: 200, data: rooms });
});

app.post('/api/user-rooms/bind', (req, res) => {
  const { user_id, room_id, relation } = req.body;
  const stmt = db.prepare(`
    INSERT INTO user_rooms (user_id, room_id, relation, bind_status)
    VALUES (?, ?, ?, 'pending')
  `);
  const result = stmt.run(user_id, room_id, relation || 'tenant');
  res.json({ code: 200, message: '绑定申请已提交', data: { id: result.lastInsertRowid } });
});

app.get('/api/user-rooms', (req, res) => {
  const { user_id, bind_status } = req.query;
  let sql = `
    SELECT ur.*, r.unit_number, r.floor, r.area,
           b.name as building_name, u.real_name as user_name
    FROM user_rooms ur
    LEFT JOIN rooms r ON ur.room_id = r.id
    LEFT JOIN buildings b ON r.building_id = b.id
    LEFT JOIN users u ON ur.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (user_id) {
    sql += ' AND ur.user_id = ?';
    params.push(user_id);
  }
  if (bind_status) {
    sql += ' AND ur.bind_status = ?';
    params.push(bind_status);
  }
  
  const stmt = db.prepare(sql);
  const records = stmt.all(...params);
  res.json({ code: 200, data: records });
});

app.put('/api/user-rooms/:id/verify', (req, res) => {
  const { bind_status, verified_by } = req.body;
  const stmt = db.prepare(`
    UPDATE user_rooms 
    SET bind_status = ?, verified_at = CURRENT_TIMESTAMP, verified_by = ?
    WHERE id = ?
  `);
  stmt.run(bind_status || 'verified', verified_by, req.params.id);
  
  if (bind_status === 'verified') {
    const urStmt = db.prepare('SELECT user_id, room_id FROM user_rooms WHERE id = ?');
    const ur = urStmt.get(req.params.id);
    if (ur) {
      db.prepare('UPDATE rooms SET owner_id = ?, status = \'occupied\' WHERE id = ?')
        .run(ur.user_id, ur.room_id);
    }
  }
  
  res.json({ code: 200, message: '审核完成' });
});

app.get('/api/access-devices', (req, res) => {
  const { building_id, status } = req.query;
  let sql = `
    SELECT d.*, b.name as building_name
    FROM access_devices d
    LEFT JOIN buildings b ON d.building_id = b.id
    WHERE 1=1
  `;
  const params = [];
  
  if (building_id) {
    sql += ' AND d.building_id = ?';
    params.push(building_id);
  }
  if (status) {
    sql += ' AND d.status = ?';
    params.push(status);
  }
  
  const stmt = db.prepare(sql);
  const devices = stmt.all(...params);
  res.json({ code: 200, data: devices });
});

app.get('/api/access-records', (req, res) => {
  const { user_id, device_id, limit } = req.query;
  let sql = `
    SELECT ar.*, u.real_name as user_name,
           d.name as device_name, d.location as device_location
    FROM access_records ar
    LEFT JOIN users u ON ar.user_id = u.id
    LEFT JOIN access_devices d ON ar.device_id = d.id
    WHERE 1=1
  `;
  const params = [];
  
  if (user_id) {
    sql += ' AND ar.user_id = ?';
    params.push(user_id);
  }
  if (device_id) {
    sql += ' AND ar.device_id = ?';
    params.push(device_id);
  }
  
  sql += ' ORDER BY ar.access_time DESC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit));
  }
  
  const stmt = db.prepare(sql);
  const records = stmt.all(...params);
  res.json({ code: 200, data: records });
});

app.post('/api/access/verify', (req, res) => {
  const { user_id, device_id, access_type, temperature, mask_detected, auth_code } = req.body;
  
  let user = null;
  let visitor = null;
  
  if (auth_code) {
    const vStmt = db.prepare(`
      SELECT * FROM visitors 
      WHERE auth_code = ? AND status = 'active'
      AND valid_from <= CURRENT_TIMESTAMP AND valid_to >= CURRENT_TIMESTAMP
    `);
    visitor = vStmt.get(auth_code);
    
    if (!visitor) {
      const stmt = db.prepare(`
        INSERT INTO access_records (device_id, access_type, result, temperature, mask_detected)
        VALUES (?, ?, 'fail', ?, ?)
      `);
      stmt.run(device_id, access_type || 'qrcode', temperature, mask_detected || 0);
      
      return res.status(403).json({ code: 403, message: '授权码无效或已过期' });
    }
    
    if (temperature && temperature > 37.3) {
      db.prepare(`
        INSERT INTO alerts (type, level, title, content, device_id, status)
        VALUES ('high_temperature', 'warning', '体温异常检测', ?, ?, 'pending')
      `).run(`检测到高温 ${temperature} 度，访客：${visitor.visitor_name}`, device_id);
    }
  }
  
  const stmt = db.prepare(`
    INSERT INTO access_records (user_id, device_id, access_type, result, temperature, mask_detected)
    VALUES (?, ?, ?, 'success', ?, ?)
  `);
  stmt.run(user_id || null, device_id, access_type || 'card', temperature, mask_detected || 1);
  
  res.json({
    code: 200,
    message: '认证通过',
    data: {
      access_allowed: true,
      visitor: visitor
    }
  });
});

app.get('/api/visitors', (req, res) => {
  const { host_user_id, status } = req.query;
  let sql = `
    SELECT v.*, u.real_name as host_name,
           r.unit_number as room_number, b.name as building_name
    FROM visitors v
    LEFT JOIN users u ON v.host_user_id = u.id
    LEFT JOIN rooms r ON v.host_room_id = r.id
    LEFT JOIN buildings b ON r.building_id = b.id
    WHERE 1=1
  `;
  const params = [];
  
  if (host_user_id) {
    sql += ' AND v.host_user_id = ?';
    params.push(host_user_id);
  }
  if (status) {
    sql += ' AND v.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY v.created_at DESC';
  
  const stmt = db.prepare(sql);
  const visitors = stmt.all(...params);
  res.json({ code: 200, data: visitors });
});

app.post('/api/visitors', (req, res) => {
  const {
    visitor_name, visitor_phone, visitor_id_card,
    host_user_id, host_room_id,
    valid_from, valid_to,
    access_areas, access_buildings,
    created_by
  } = req.body;
  
  const authCode = 'AUTH' + Date.now();
  const qrCode = JSON.stringify({
    auth_code: authCode,
    visitor: visitor_name,
    valid_from,
    valid_to
  });
  
  const stmt = db.prepare(`
    INSERT INTO visitors (
      visitor_name, visitor_phone, visitor_id_card,
      host_user_id, host_room_id,
      valid_from, valid_to,
      access_areas, access_buildings,
      auth_code, qr_code, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    visitor_name, visitor_phone, visitor_id_card,
    host_user_id, host_room_id,
    valid_from, valid_to,
    access_areas, access_buildings,
    authCode, qrCode, created_by
  );
  
  const buildings = (access_buildings || '').split(',').filter(b => b);
  buildings.forEach(b => {
    db.prepare(`
      INSERT INTO access_grants (visitor_id, building_id, expires_at)
      VALUES (?, ?, ?)
    `).run(result.lastInsertRowid, parseInt(b), valid_to);
  });
  
  res.json({
    code: 200,
    message: '访客授权成功',
    data: {
      id: result.lastInsertRowid,
      auth_code: authCode,
      qr_code: qrCode
    }
  });
});

app.post('/api/visitors/:id/checkin', (req, res) => {
  const { temperature } = req.body;
  const stmt = db.prepare(`
    UPDATE visitors 
    SET checkin_time = CURRENT_TIMESTAMP, temperature = ?, status = 'checked_in'
    WHERE id = ?
  `);
  stmt.run(temperature, req.params.id);
  
  if (temperature > 37.3) {
    const vStmt = db.prepare('SELECT * FROM visitors WHERE id = ?');
    const visitor = vStmt.get(req.params.id);
    db.prepare(`
      INSERT INTO alerts (type, level, title, content, status)
      VALUES ('high_temperature', 'warning', '体温异常登记', ?, 'pending')
    `).run(`访客 ${visitor.visitor_name} 登记体温 ${temperature} 度`);
  }
  
  res.json({ code: 200, message: '登记成功' });
});

app.post('/api/visitors/:id/checkout', (req, res) => {
  const stmt = db.prepare(`
    UPDATE visitors SET checkout_time = CURRENT_TIMESTAMP, status = 'completed'
    WHERE id = ?
  `);
  stmt.run(req.params.id);
  res.json({ code: 200, message: '签出成功' });
});

app.get('/api/visitors/overstay', (req, res) => {
  const stmt = db.prepare(`
    SELECT v.*, u.real_name as host_name,
           r.unit_number as room_number, b.name as building_name
    FROM visitors v
    LEFT JOIN users u ON v.host_user_id = u.id
    LEFT JOIN rooms r ON v.host_room_id = r.id
    LEFT JOIN buildings b ON r.building_id = b.id
    WHERE v.status IN ('active', 'checked_in')
    AND v.valid_to < CURRENT_TIMESTAMP
    AND v.checkout_time IS NULL
    ORDER BY v.valid_to ASC
  `);
  const visitors = stmt.all();
  res.json({ code: 200, data: visitors });
});

app.get('/api/product-categories', (req, res) => {
  const stmt = db.prepare('SELECT * FROM product_categories WHERE status = \'active\' ORDER BY sort_order');
  const categories = stmt.all();
  res.json({ code: 200, data: categories });
});

app.get('/api/merchants', (req, res) => {
  const { qualification_status, category_id } = req.query;
  let sql = `
    SELECT m.*, c.name as category_name,
           (SELECT AVG(rating) FROM reviews WHERE merchant_id = m.id) as avg_rating,
           (SELECT COUNT(*) FROM reviews WHERE merchant_id = m.id) as review_count
    FROM merchants m
    LEFT JOIN product_categories c ON m.category_id = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (qualification_status) {
    sql += ' AND m.qualification_status = ?';
    params.push(qualification_status);
  }
  if (category_id) {
    sql += ' AND m.category_id = ?';
    params.push(category_id);
  }
  
  sql += ' ORDER BY m.rating DESC';
  
  const stmt = db.prepare(sql);
  const merchants = stmt.all(...params);
  res.json({ code: 200, data: merchants });
});

app.get('/api/merchants/:id', (req, res) => {
  const stmt = db.prepare(`
    SELECT m.*, c.name as category_name,
           (SELECT AVG(rating) FROM reviews WHERE merchant_id = m.id) as avg_rating,
           (SELECT COUNT(*) FROM reviews WHERE merchant_id = m.id) as review_count
    FROM merchants m
    LEFT JOIN product_categories c ON m.category_id = c.id
    WHERE m.id = ?
  `);
  const merchant = stmt.get(req.params.id);
  
  const productsStmt = db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM orders WHERE product_id = p.id AND status != 'cancelled') as sales_count
    FROM products p
    WHERE p.merchant_id = ? AND p.status = 'on_sale'
  `);
  merchant.products = productsStmt.run(req.params.id);
  
  const reviewsStmt = db.prepare(`
    SELECT r.*, u.real_name as user_name
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.merchant_id = ?
    ORDER BY r.created_at DESC
    LIMIT 10
  `);
  merchant.reviews = reviewsStmt.all(req.params.id);
  
  res.json({ code: 200, data: merchant });
});

app.put('/api/merchants/:id/verify', (req, res) => {
  const { qualification_status, verified_by } = req.body;
  const stmt = db.prepare(`
    UPDATE merchants 
    SET qualification_status = ?, verified_at = CURRENT_TIMESTAMP, verified_by = ?
    WHERE id = ?
  `);
  stmt.run(qualification_status || 'verified', verified_by, req.params.id);
  res.json({ code: 200, message: '资质审核完成' });
});

app.get('/api/products', (req, res) => {
  const { category_id, merchant_id, keyword, status, sort, min_price, max_price } = req.query;
  let sql = `
    SELECT p.*, c.name as category_name, m.name as merchant_name, m.rating as merchant_rating,
           (SELECT COUNT(*) FROM orders WHERE product_id = p.id AND status != 'cancelled') as sales_count
    FROM products p
    LEFT JOIN product_categories c ON p.category_id = c.id
    LEFT JOIN merchants m ON p.merchant_id = m.id
    WHERE p.status = 'on_sale'
  `;
  const params = [];
  
  if (category_id) {
    sql += ' AND p.category_id = ?';
    params.push(category_id);
  }
  if (merchant_id) {
    sql += ' AND p.merchant_id = ?';
    params.push(merchant_id);
  }
  if (keyword) {
    sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (min_price) {
    sql += ' AND p.price >= ?';
    params.push(parseFloat(min_price));
  }
  if (max_price) {
    sql += ' AND p.price <= ?';
    params.push(parseFloat(max_price));
  }
  
  if (sort === 'price_asc') sql += ' ORDER BY p.price ASC';
  else if (sort === 'price_desc') sql += ' ORDER BY p.price DESC';
  else if (sort === 'sales') sql += ' ORDER BY sales_count DESC';
  else if (sort === 'rating') sql += ' ORDER BY m.rating DESC';
  else sql += ' ORDER BY p.created_at DESC';
  
  const stmt = db.prepare(sql);
  const products = stmt.all(...params);
  
  products.forEach(p => {
    p.is_low_stock = p.stock <= p.stock_warning;
    p.is_expiring_soon = p.expiry_date && new Date(p.expiry_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  });
  
  res.json({ code: 200, data: products });
});

app.get('/api/products/:id', (req, res) => {
  const stmt = db.prepare(`
    SELECT p.*, c.name as category_name, m.name as merchant_name,
           m.qualification_status as merchant_qualification,
           (SELECT COUNT(*) FROM orders WHERE product_id = p.id AND status != 'cancelled') as sales_count
    FROM products p
    LEFT JOIN product_categories c ON p.category_id = c.id
    LEFT JOIN merchants m ON p.merchant_id = m.id
    WHERE p.id = ?
  `);
  const product = stmt.get(req.params.id);
  
  const logsStmt = db.prepare(`
    SELECT l.*, u.real_name as operator_name
    FROM inventory_logs l
    LEFT JOIN users u ON l.operator_id = u.id
    WHERE l.product_id = ?
    ORDER BY l.created_at DESC
    LIMIT 20
  `);
  product.inventory_logs = logsStmt.all(req.params.id);
  
  res.json({ code: 200, data: product });
});

app.post('/api/products/:id/purchase', (req, res) => {
  const { user_id, quantity, coupon_id, visitor_id, remark } = req.body;
  
  const pStmt = db.prepare('SELECT * FROM products WHERE id = ?');
  const product = pStmt.get(req.params.id);
  
  if (!product || product.status !== 'on_sale') {
    return res.status(400).json({ code: 400, message: '商品不可购买' });
  }
  if (product.stock < quantity) {
    return res.status(400).json({ code: 400, message: '库存不足' });
  }
  
  let totalAmount = product.price * quantity;
  
  if (coupon_id) {
    const cStmt = db.prepare('SELECT * FROM coupons WHERE id = ? AND user_id = ? AND status = \'unused\'');
    const coupon = cStmt.get(coupon_id, user_id);
    if (coupon && totalAmount >= coupon.min_amount) {
      totalAmount -= coupon.value;
      if (totalAmount < 0) totalAmount = 0;
    }
  }
  
  const orderNo = 'ORD' + Date.now();
  
  const tx = db.transaction(() => {
    const oStmt = db.prepare(`
      INSERT INTO orders (order_no, user_id, product_id, quantity, total_amount, coupon_id, visitor_id, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const orderId = oStmt.run(orderNo, user_id, parseInt(req.params.id), quantity, totalAmount, coupon_id || null, visitor_id || null, remark).lastInsertRowid;
    
    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
      .run(quantity, req.params.id);
    
    db.prepare(`
      INSERT INTO inventory_logs (product_id, change_type, quantity, stock_before, stock_after, operator_id, remark)
      VALUES (?, 'sale', ?, ?, ?, ?, ?)
    `).run(req.params.id, -quantity, product.stock, product.stock - quantity, user_id, `订单 ${orderNo}`);
    
    const newStock = product.stock - quantity;
    if (newStock <= product.stock_warning) {
      db.prepare(`
        INSERT OR IGNORE INTO alerts (type, level, title, content, status)
        VALUES ('stock_warning', 'info', '库存预警', ?, 'pending')
      `).run(`商品【${product.name}】库存不足，当前库存：${newStock}`);
    }
    
    if (coupon_id) {
      db.prepare('UPDATE coupons SET status = \'used\', used_at = CURRENT_TIMESTAMP, order_id = ? WHERE id = ?')
        .run(orderId, coupon_id);
    }
    
    return { orderId, orderNo, totalAmount };
  });
  
  try {
    const result = tx();
    res.json({
      code: 200,
      message: '下单成功',
      data: result
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/orders/:id/pay', (req, res) => {
  const stmt = db.prepare(`
    UPDATE orders 
    SET status = 'paid', pay_status = 'paid', pay_time = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(req.params.id);
  res.json({ code: 200, message: '支付成功' });
});

app.get('/api/orders', (req, res) => {
  const { user_id, status, limit } = req.query;
  let sql = `
    SELECT o.*, p.name as product_name, p.image as product_image,
           m.name as merchant_name, u.real_name as user_name,
           cp.code as coupon_code, cp.value as coupon_value,
           v.visitor_name, v.auth_code
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN merchants m ON p.merchant_id = m.id
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN coupons cp ON o.coupon_id = cp.id
    LEFT JOIN visitors v ON o.visitor_id = v.id
    WHERE 1=1
  `;
  const params = [];
  
  if (user_id) {
    sql += ' AND o.user_id = ?';
    params.push(user_id);
  }
  if (status) {
    sql += ' AND o.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY o.created_at DESC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit));
  }
  
  const stmt = db.prepare(sql);
  const orders = stmt.all(...params);
  res.json({ code: 200, data: orders });
});

app.get('/api/coupons', (req, res) => {
  const { user_id, status } = req.query;
  let sql = `
    SELECT c.*, u.real_name as user_name
    FROM coupons c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (user_id) {
    sql += ' AND c.user_id = ?';
    params.push(user_id);
  }
  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY c.created_at DESC';
  
  const stmt = db.prepare(sql);
  const coupons = stmt.all(...params);
  
  coupons.forEach(c => {
    c.is_expiring_soon = c.status === 'unused' && c.expires_at && new Date(c.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    c.is_expired = c.status === 'unused' && c.expires_at && new Date(c.expires_at) < new Date();
  });
  
  res.json({ code: 200, data: coupons });
});

app.get('/api/announcements', (req, res) => {
  const { user_id, type, limit } = req.query;
  let sql = `
    SELECT a.*, u.real_name as publisher_name,
    CASE WHEN ar.id IS NOT NULL THEN 1 ELSE 0 END as is_read,
    ar.read_at
    FROM announcements a
    LEFT JOIN users u ON a.published_by = u.id
    LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = ?
    WHERE a.status = 'published'
  `;
  const params = [user_id || 0];
  
  if (type) {
    sql += ' AND a.type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY a.created_at DESC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit));
  }
  
  const stmt = db.prepare(sql);
  const announcements = stmt.all(...params);
  res.json({ code: 200, data: announcements });
});

app.post('/api/announcements/:id/read', (req, res) => {
  const { user_id } = req.body;
  
  const checkStmt = db.prepare('SELECT id FROM announcement_reads WHERE announcement_id = ? AND user_id = ?');
  if (checkStmt.get(req.params.id, user_id)) {
    return res.json({ code: 200, message: '已标记为已读' });
  }
  
  const stmt = db.prepare('INSERT INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)');
  stmt.run(req.params.id, user_id);
  res.json({ code: 200, message: '标记已读成功' });
});

app.post('/api/announcements', (req, res) => {
  const { title, content, type, target_roles, published_by } = req.body;
  const stmt = db.prepare(`
    INSERT INTO announcements (title, content, type, target_roles, published_by)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(title, content, type || 'notice', target_roles || 'all', published_by);
  res.json({ code: 200, message: '发布成功', data: { id: result.lastInsertRowid } });
});

app.get('/api/alerts', (req, res) => {
  const { status, level, limit } = req.query;
  let sql = `
    SELECT a.*, d.name as device_name, b.name as building_name,
           u.real_name as handled_by_name
    FROM alerts a
    LEFT JOIN access_devices d ON a.device_id = d.id
    LEFT JOIN buildings b ON a.building_id = b.id
    LEFT JOIN users u ON a.handled_by = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  if (level) {
    sql += ' AND a.level = ?';
    params.push(level);
  }
  
  sql += ' ORDER BY a.created_at DESC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit));
  }
  
  const stmt = db.prepare(sql);
  const alerts = stmt.all(...params);
  res.json({ code: 200, data: alerts });
});

app.put('/api/alerts/:id/handle', (req, res) => {
  const { handled_by, handle_result, status } = req.body;
  const stmt = db.prepare(`
    UPDATE alerts 
    SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP, handle_result = ?
    WHERE id = ?
  `);
  stmt.run(status || 'resolved', handled_by, handle_result, req.params.id);
  res.json({ code: 200, message: '处置完成' });
});

app.get('/api/security-events', (req, res) => {
  const { status, level } = req.query;
  let sql = `
    SELECT se.*, d.name as device_name, b.name as building_name,
           u.real_name as handled_by_name,
           iu.real_name as involved_user_name,
           iv.visitor_name as involved_visitor_name
    FROM security_events se
    LEFT JOIN access_devices d ON se.device_id = d.id
    LEFT JOIN buildings b ON se.building_id = b.id
    LEFT JOIN users u ON se.handled_by = u.id
    LEFT JOIN users iu ON se.involved_user_id = iu.id
    LEFT JOIN visitors iv ON se.involved_visitor_id = iv.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND se.status = ?';
    params.push(status);
  }
  if (level) {
    sql += ' AND se.level = ?';
    params.push(level);
  }
  
  sql += ' ORDER BY se.created_at DESC';
  
  const stmt = db.prepare(sql);
  const events = stmt.all(...params);
  res.json({ code: 200, data: events });
});

app.put('/api/security-events/:id/handle', (req, res) => {
  const { handled_by, closure_note, status } = req.body;
  const stmt = db.prepare(`
    UPDATE security_events 
    SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP, closure_note = ?
    WHERE id = ?
  `);
  stmt.run(status || 'closed', handled_by, closure_note, req.params.id);
  res.json({ code: 200, message: '处置完成' });
});

app.get('/api/device-health-logs', (req, res) => {
  const { device_id, limit } = req.query;
  let sql = `
    SELECT h.*, d.name as device_name
    FROM device_health_logs h
    LEFT JOIN access_devices d ON h.device_id = d.id
    WHERE 1=1
  `;
  const params = [];
  
  if (device_id) {
    sql += ' AND h.device_id = ?';
    params.push(device_id);
  }
  
  sql += ' ORDER BY h.check_time DESC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit));
  }
  
  const stmt = db.prepare(sql);
  const logs = stmt.all(...params);
  res.json({ code: 200, data: logs });
});

app.get('/api/dashboard/stats', (req, res) => {
  const result = {
    users: {
      total: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      pending: db.prepare('SELECT COUNT(*) as count FROM users WHERE status = \'pending\'').get().count,
      verified: db.prepare('SELECT COUNT(*) as count FROM users WHERE status = \'verified\'').get().count
    },
    rooms: {
      total: db.prepare('SELECT COUNT(*) as count FROM rooms').get().count,
      occupied: db.prepare('SELECT COUNT(*) as count FROM rooms WHERE status = \'occupied\'').get().count,
      vacant: db.prepare('SELECT COUNT(*) as count FROM rooms WHERE status = \'vacant\'').get().count
    },
    devices: {
      total: db.prepare('SELECT COUNT(*) as count FROM access_devices').get().count,
      online: db.prepare('SELECT COUNT(*) as count FROM access_devices WHERE status = \'online\'').get().count,
      warning: db.prepare('SELECT COUNT(*) as count FROM access_devices WHERE status = \'warning\'').get().count,
      offline: db.prepare('SELECT COUNT(*) as count FROM access_devices WHERE status = \'offline\'').get().count
    },
    visitors: {
      today: db.prepare('SELECT COUNT(*) as count FROM visitors WHERE DATE(created_at) = DATE(\'now\')').get().count,
      active: db.prepare('SELECT COUNT(*) as count FROM visitors WHERE status IN (\'active\', \'checked_in\')').get().count,
      overstay: db.prepare('SELECT COUNT(*) as count FROM visitors WHERE status IN (\'active\', \'checked_in\') AND valid_to < CURRENT_TIMESTAMP AND checkout_time IS NULL').get().count
    },
    orders: {
      today: db.prepare('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE(\'now\')').get().count,
      pending: db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = \'pending\'').get().count,
      total_amount: db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE pay_status = \'paid\'').get().total
    },
    alerts: {
      pending: db.prepare('SELECT COUNT(*) as count FROM alerts WHERE status = \'pending\'').get().count,
      today: db.prepare('SELECT COUNT(*) as count FROM alerts WHERE DATE(created_at) = DATE(\'now\')').get().count
    },
    events: {
      open: db.prepare('SELECT COUNT(*) as count FROM security_events WHERE status = \'open\'').get().count,
      closed_rate: (() => {
        const total = db.prepare('SELECT COUNT(*) as count FROM security_events').get().count;
        const closed = db.prepare('SELECT COUNT(*) as count FROM security_events WHERE status = \'closed\'').get().count;
        return total > 0 ? Math.round(closed / total * 100) : 100;
      })()
    },
    merchants: {
      total: db.prepare('SELECT COUNT(*) as count FROM merchants').get().count,
      pending: db.prepare('SELECT COUNT(*) as count FROM merchants WHERE qualification_status = \'pending\'').get().count
    },
    products: {
      low_stock: db.prepare('SELECT COUNT(*) as count FROM products WHERE stock <= stock_warning AND status = \'on_sale\'').get().count,
      expiring: db.prepare('SELECT COUNT(*) as count FROM products WHERE expiry_date IS NOT NULL AND expiry_date < DATE(\'now\', \'+7 days\') AND status = \'on_sale\'').get().count
    },
    coupons: {
      expiring: db.prepare('SELECT COUNT(*) as count FROM coupons WHERE status = \'unused\' AND expires_at IS NOT NULL AND expires_at < DATETIME(\'now\', \'+7 days\')').get().count
    }
  };
  
  res.json({ code: 200, data: result });
});

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'API 不存在',
    path: req.path
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    code: 500,
    message: err.message
  });
});

app.listen(PORT, HOST, () => {
  console.log(`\n========================================`);
  console.log(`  后端服务启动成功!`);
  console.log(`  地址: http://${HOST}:${PORT}`);
  console.log(`  健康: http://${HOST}:${PORT}/api/health`);
  console.log(`  CORS: ${CORS_ORIGIN}`);
  console.log(`========================================\n`);
});
