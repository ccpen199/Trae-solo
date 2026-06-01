require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { db, initDatabase } = require('./database');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initDatabase();

const app = express();
const PORT = process.env.BACKEND_PORT || 58954;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48954}`
}));
app.use(express.json());

function recordAudit(orderId, dispatchId, actionType, details, operator = 'system') {
  db.prepare('INSERT INTO audits (order_id, dispatch_id, action_type, action_details, operator) VALUES (?, ?, ?, ?, ?)')
    .run(orderId, dispatchId, actionType, JSON.stringify(details), operator);
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/customers', (req, res) => {
  const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
  res.json(customers);
});

app.get('/api/drivers', (req, res) => {
  const drivers = db.prepare('SELECT * FROM drivers ORDER BY created_at DESC').all();
  res.json(drivers);
});

app.get('/api/vehicles', (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY created_at DESC').all();
  res.json(vehicles);
});

app.get('/api/probes', (req, res) => {
  const probes = db.prepare('SELECT * FROM temperature_probes ORDER BY created_at DESC').all();
  res.json(probes);
});

app.post('/api/orders', (req, res) => {
  const { drug_batch, drug_name, temp_zone_required, min_temp, max_temp, customer_id, deadline, qualifications_required, probe_id } = req.body;

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
  if (!customer) {
    return res.status(400).json({ error: '客户不存在' });
  }

  const requiredQuals = (qualifications_required || '').split(',').filter(q => q);
  const customerQuals = (customer.qualification_ids || '').split(',').filter(q => q);
  
  const missingQuals = requiredQuals.filter(q => !customerQuals.includes(q));
  if (missingQuals.length > 0) {
    return res.status(400).json({ error: `客户资质不全，缺少: ${missingQuals.join(', ')}` });
  }

  const orderNo = 'ORD' + Date.now();
  const result = db.prepare(`
    INSERT INTO orders (order_no, drug_batch, drug_name, temp_zone_required, min_temp, max_temp, customer_id, deadline, qualifications_required, probe_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderNo, drug_batch, drug_name, temp_zone_required, min_temp, max_temp, customer_id, deadline, qualifications_required, probe_id);

  recordAudit(result.lastInsertRowid, null, 'order_created', req.body, 'admin');
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(order);
});

app.get('/api/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, c.name as customer_name 
    FROM orders o 
    LEFT JOIN customers c ON o.customer_id = c.id 
    ORDER BY o.created_at DESC
  `).all();
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, c.name as customer_name, c.address as customer_address, c.phone as customer_phone
    FROM orders o 
    LEFT JOIN customers c ON o.customer_id = c.id 
    WHERE o.id = ?
  `).get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  const audits = db.prepare('SELECT * FROM audits WHERE order_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ ...order, audits });
});

app.post('/api/dispatches/check', (req, res) => {
  const { order_id, vehicle_id, driver_id } = req.body;
  const issues = [];

  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
  if (!driver) {
    issues.push('司机不存在');
  } else {
    if (!driver.cold_chain_cert) {
      issues.push('司机无冷链运输资质');
    }
    const today = new Date().toISOString().split('T')[0];
    if (driver.cert_expiry && driver.cert_expiry < today) {
      issues.push('司机冷链资质已过期');
    }
    if (driver.license_expiry < today) {
      issues.push('司机驾照已过期');
    }
    if (driver.status !== 'active') {
      issues.push('司机状态非活跃');
    }
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle) {
    issues.push('车辆不存在');
  } else {
    if (vehicle.device_status !== 'normal') {
      issues.push('车载设备状态异常');
    }
    if (vehicle.status !== 'idle') {
      issues.push('车辆非空闲状态');
    }
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (order && vehicle) {
    if (order.min_temp < vehicle.min_temp || order.max_temp > vehicle.max_temp) {
      issues.push('车辆温控能力不满足订单要求');
    }
  }

  res.json({ eligible: issues.length === 0, issues });
});

app.post('/api/dispatches', (req, res) => {
  const { order_id, vehicle_id, driver_id, scheduled_time, route } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) {
    return res.status(400).json({ error: '订单不存在' });
  }

  const issues = [];
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  const today = new Date().toISOString().split('T')[0];

  if (driver && (!driver.cold_chain_cert || (driver.cert_expiry && driver.cert_expiry < today) || driver.license_expiry < today)) {
    issues.push('司机资质校验失败');
  }
  if (vehicle && (vehicle.device_status !== 'normal' || vehicle.status !== 'idle')) {
    issues.push('车辆/设备状态校验失败');
  }
  if (issues.length > 0) {
    return res.status(400).json({ error: issues.join('; ') });
  }

  const result = db.prepare(`
    INSERT INTO dispatches (order_id, vehicle_id, driver_id, scheduled_time, route)
    VALUES (?, ?, ?, ?, ?)
  `).run(order_id, vehicle_id, driver_id, scheduled_time, route);

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('dispatched', order_id);
  db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run('in_transit', vehicle_id);

  recordAudit(order_id, result.lastInsertRowid, 'dispatch_created', req.body, 'dispatcher');

  const dispatch = db.prepare(`
    SELECT d.*, o.order_no, v.plate_number, dr.name as driver_name
    FROM dispatches d
    LEFT JOIN orders o ON d.order_id = o.id
    LEFT JOIN vehicles v ON d.vehicle_id = v.id
    LEFT JOIN drivers dr ON d.driver_id = dr.id
    WHERE d.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(dispatch);
});

app.get('/api/dispatches', (req, res) => {
  const dispatches = db.prepare(`
    SELECT d.*, o.order_no, o.drug_name, v.plate_number, dr.name as driver_name
    FROM dispatches d
    LEFT JOIN orders o ON d.order_id = o.id
    LEFT JOIN vehicles v ON d.vehicle_id = v.id
    LEFT JOIN drivers dr ON d.driver_id = dr.id
    ORDER BY d.created_at DESC
  `).all();
  res.json(dispatches);
});

app.post('/api/dispatches/:id/start', (req, res) => {
  const dispatch = db.prepare('SELECT * FROM dispatches WHERE id = ?').get(req.params.id);
  if (!dispatch) {
    return res.status(404).json({ error: '配送不存在' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE dispatches SET actual_departure = ?, status = ? WHERE id = ?')
    .run(now, 'in_transit', req.params.id);

  recordAudit(dispatch.order_id, req.params.id, 'dispatch_started', { time: now }, 'driver');
  res.json({ success: true });
});

app.post('/api/temperature-records', (req, res) => {
  const { dispatch_id, probe_id, temperature, location } = req.body;
  
  const dispatch = db.prepare('SELECT d.*, o.min_temp, o.max_temp FROM dispatches d LEFT JOIN orders o ON d.order_id = o.id WHERE d.id = ?').get(dispatch_id);
  if (!dispatch) {
    return res.status(404).json({ error: '配送不存在' });
  }

  const is_alert = temperature < dispatch.min_temp || temperature > dispatch.max_temp;
  const alert_type = is_alert ? (temperature < dispatch.min_temp ? 'below_range' : 'above_range') : null;

  const result = db.prepare(`
    INSERT INTO temperature_records (dispatch_id, probe_id, temperature, location, is_alert, alert_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(dispatch_id, probe_id, temperature, location, is_alert ? 1 : 0, alert_type);

  if (is_alert) {
    db.prepare(`
      INSERT INTO alerts (dispatch_id, alert_type, alert_level, message)
      VALUES (?, ?, ?, ?)
    `).run(dispatch_id, alert_type, 'warning', `温度异常: ${temperature}°C，范围: ${dispatch.min_temp}-${dispatch.max_temp}°C`);
  }

  res.status(201).json({ id: result.lastInsertRowid, is_alert });
});

app.get('/api/dispatches/:id/temperatures', (req, res) => {
  const records = db.prepare(`
    SELECT * FROM temperature_records 
    WHERE dispatch_id = ? 
    ORDER BY timestamp DESC
    LIMIT 100
  `).all(req.params.id);
  res.json(records);
});

app.get('/api/alerts', (req, res) => {
  const alerts = db.prepare(`
    SELECT a.*, o.order_no, v.plate_number
    FROM alerts a
    LEFT JOIN dispatches d ON a.dispatch_id = d.id
    LEFT JOIN orders o ON d.order_id = o.id
    LEFT JOIN vehicles v ON d.vehicle_id = v.id
    ORDER BY a.created_at DESC
  `).all();
  res.json(alerts);
});

app.post('/api/alerts/:id/handle', (req, res) => {
  const { handled_by, handling_notes } = req.body;
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE alerts 
    SET status = 'handled', handled_by = ?, handled_at = ?, handling_notes = ?
    WHERE id = ?
  `).run(handled_by, now, handling_notes, req.params.id);

  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  recordAudit(null, alert.dispatch_id, 'alert_handled', { alert_id: req.params.id, handling_notes }, handled_by);

  res.json({ success: true });
});

app.post('/api/signoffs', (req, res) => {
  const { dispatch_id, receiver_name, receiver_id, temperature, status, exception_notes } = req.body;
  const now = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO signoffs (dispatch_id, receiver_name, receiver_id, signoff_time, temperature, status, exception_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(dispatch_id, receiver_name, receiver_id, now, temperature, status, exception_notes);

  const dispatch = db.prepare('SELECT * FROM dispatches WHERE id = ?').get(dispatch_id);
  
  const newStatus = status === 'accepted' ? 'delivered' : 'rejected';
  db.prepare('UPDATE dispatches SET actual_arrival = ?, status = ? WHERE id = ?').run(now, newStatus, dispatch_id);
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(newStatus, dispatch.order_id);
  
  const vehicle = db.prepare('SELECT vehicle_id FROM dispatches WHERE id = ?').get(dispatch_id);
  db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run('idle', vehicle.vehicle_id);

  recordAudit(dispatch.order_id, dispatch_id, 'signoff_' + status, req.body, receiver_name);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.get('/api/signoffs/:dispatchId', (req, res) => {
  const signoff = db.prepare('SELECT * FROM signoffs WHERE dispatch_id = ?').get(req.params.dispatchId);
  res.json(signoff || null);
});

app.get('/api/audit/:orderId', (req, res) => {
  const audits = db.prepare(`
    SELECT a.*, o.order_no
    FROM audits a
    LEFT JOIN orders o ON a.order_id = o.id
    WHERE a.order_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.orderId);
  res.json(audits);
});

app.get('/api/report/temperature/:dispatchId', (req, res) => {
  const dispatch = db.prepare(`
    SELECT d.*, o.order_no, o.drug_name, o.min_temp, o.max_temp,
           v.plate_number, dr.name as driver_name, c.name as customer_name
    FROM dispatches d
    LEFT JOIN orders o ON d.order_id = o.id
    LEFT JOIN vehicles v ON d.vehicle_id = v.id
    LEFT JOIN drivers dr ON d.driver_id = dr.id
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE d.id = ?
  `).get(req.params.dispatchId);

  const temperatures = db.prepare(`
    SELECT * FROM temperature_records 
    WHERE dispatch_id = ? 
    ORDER BY timestamp ASC
  `).all(req.params.dispatchId);

  const alerts = db.prepare(`
    SELECT * FROM alerts WHERE dispatch_id = ?
  `).all(req.params.dispatchId);

  const signoff = db.prepare(`
    SELECT * FROM signoffs WHERE dispatch_id = ?
  `).get(req.params.dispatchId);

  res.json({ dispatch, temperatures, alerts, signoff });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
