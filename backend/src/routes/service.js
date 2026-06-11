const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/shops', authenticateToken, (req, res) => {
  const { city, lat, lng } = req.query;
  
  let query = 'SELECT * FROM service_shops WHERE 1=1';
  const params = [];

  if (city) {
    query += ' AND city = ?';
    params.push(city);
  }

  const shops = db.prepare(query).all(...params);

  if (lat && lng) {
    shops.forEach(shop => {
      shop.distance = calculateDistance(parseFloat(lat), parseFloat(lng), shop.lat, shop.lng);
    });
    shops.sort((a, b) => a.distance - b.distance);
  }

  res.json({ shops });
});

router.post('/shops', authenticateToken, requireAdmin, (req, res) => {
  const { name, address, city, lat, lng, phone, business_hours } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Shop name is required' });
  }

  const result = db.prepare(`
    INSERT INTO service_shops (name, address, city, lat, lng, phone, business_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, address || null, city || null, lat || null, lng || null, phone || null, business_hours || null);

  const shop = db.prepare('SELECT * FROM service_shops WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ shop });
});

router.get('/fault-codes', authenticateToken, (req, res) => {
  const { code } = req.query;
  
  let query = 'SELECT * FROM fault_codes WHERE 1=1';
  const params = [];

  if (code) {
    query += ' AND code = ?';
    params.push(code);
  }

  const faultCodes = db.prepare(query).all(...params);
  res.json({ fault_codes: faultCodes });
});

router.get('/fault-codes/:code/recommend', authenticateToken, (req, res) => {
  const faultCode = db.prepare('SELECT * FROM fault_codes WHERE code = ?').get(req.params.code);
  
  if (!faultCode) {
    return res.status(404).json({ error: 'Fault code not found' });
  }

  const shops = db.prepare('SELECT * FROM service_shops ORDER BY rating DESC LIMIT 5').all();

  const recommendations = {
    fault_code: faultCode,
    severity: faultCode.severity,
    recommended_action: faultCode.recommended_action,
    estimated_cost: faultCode.estimated_cost,
    nearby_shops: shops,
    diy_steps: generateDIYSteps(faultCode.code)
  };

  res.json({ recommendations });
});

router.get('/spare-parts', authenticateToken, (req, res) => {
  const { category, keyword } = req.query;
  
  let query = 'SELECT * FROM spare_parts WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (keyword) {
    query += ' AND name LIKE ?';
    params.push(`%${keyword}%`);
  }

  query += ' ORDER BY name ASC';
  const parts = db.prepare(query).all(...params);

  res.json({ parts });
});

router.post('/spare-parts', authenticateToken, requireAdmin, (req, res) => {
  const { sku, name, category, price, stock, description, image_url } = req.body;

  if (!sku || !name || !price) {
    return res.status(400).json({ error: 'SKU, name and price are required' });
  }

  const result = db.prepare(`
    INSERT INTO spare_parts (sku, name, category, price, stock, description, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(sku, name, category || null, price, stock || 0, description || null, image_url || null);

  const part = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ part });
});

router.get('/orders', authenticateToken, (req, res) => {
  const { status } = req.query;
  
  let query = `
    SELECT so.*, d.vin, d.model, s.name as shop_name
    FROM service_orders so
    JOIN devices d ON so.device_id = d.id
    LEFT JOIN service_shops s ON so.shop_id = s.id
    WHERE so.user_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ' AND so.status = ?';
    params.push(status);
  }

  query += ' ORDER BY so.created_at DESC';
  const orders = db.prepare(query).all(...params);

  res.json({ orders });
});

router.post('/orders', authenticateToken, (req, res) => {
  const { device_id, fault_code, description, appointment_time, lat, lng } = req.body;

  if (!device_id) {
    return res.status(400).json({ error: 'Device ID is required' });
  }

  const device = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?').get(device_id, req.user.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  let shop_id = null;
  let technician_id = null;

  const shops = db.prepare('SELECT * FROM service_shops').all();
  if (shops.length > 0 && lat && lng) {
    shops.forEach(shop => {
      shop.distance = calculateDistance(parseFloat(lat), parseFloat(lng), shop.lat, shop.lng);
    });
    shops.sort((a, b) => a.distance - b.distance);
    shop_id = shops[0].id;

    const technicians = db.prepare('SELECT * FROM technicians WHERE shop_id = ? AND status = ?').all(shop_id, 'available');
    if (technicians.length > 0) {
      technician_id = technicians[0].id;
    }
  } else if (shops.length > 0) {
    shop_id = shops[0].id;
    const technicians = db.prepare('SELECT * FROM technicians WHERE shop_id = ? AND status = ?').all(shop_id, 'available');
    if (technicians.length > 0) {
      technician_id = technicians[0].id;
    }
  }

  const result = db.prepare(`
    INSERT INTO service_orders (user_id, device_id, shop_id, fault_code, description, status, technician_id, appointment_time)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(req.user.id, device_id, shop_id, fault_code || null, description || null, technician_id, appointment_time || null);

  const order = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ order, message: 'Service order created successfully' });
});

router.get('/orders/:id', authenticateToken, (req, res) => {
  const order = db.prepare(`
    SELECT so.*, d.vin, d.model, s.name as shop_name, s.address as shop_address, s.phone as shop_phone,
      t.name as technician_name, t.phone as technician_phone
    FROM service_orders so
    JOIN devices d ON so.device_id = d.id
    LEFT JOIN service_shops s ON so.shop_id = s.id
    LEFT JOIN technicians t ON so.technician_id = t.id
    WHERE so.id = ? AND so.user_id = ?
  `).get(req.params.id, req.user.id);

  if (!order) {
    return res.status(404).json({ error: 'Service order not found' });
  }

  res.json({ order });
});

router.put('/orders/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;

  const order = db.prepare('SELECT * FROM service_orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) {
    return res.status(404).json({ error: 'Service order not found' });
  }

  db.prepare('UPDATE service_orders SET status = ? WHERE id = ?').run(status, req.params.id);

  if (status === 'completed') {
    db.prepare('UPDATE service_orders SET completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  }

  res.json({ status: 'ok' });
});

function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

function generateDIYSteps(code) {
  const stepsMap = {
    'E001': ['检查电池连接', '重启设备', '如仍有问题请联系售后'],
    'E002': ['检查刹车系统', '清洁刹车盘', '调整刹车松紧度'],
    'E003': ['检查轮胎气压', '检查轮胎磨损', '必要时更换轮胎'],
    'E004': ['检查控制器连接', '重启设备', '如仍有问题请联系售后'],
    'E005': ['检查电机接线', '检查电机温度', '冷却后再试']
  };
  return stepsMap[code] || ['请联系专业维修人员'];
}

module.exports = router;
