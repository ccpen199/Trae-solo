const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../..', '.env') });

const express = require('express');
const cors = require('cors');
const { db, projectDir } = require('./db');

const app = express();
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || 53455);
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 43455);

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true,
}));
app.use(express.json());

const all = (sql, params = []) => db.prepare(sql).all(...params);
const get = (sql, params = []) => db.prepare(sql).get(...params);
const run = (sql, params = []) => db.prepare(sql).run(...params);

app.get('/api/health', (req, res) => {
  const orders = get('SELECT COUNT(*) AS count FROM orders').count;
  res.json({
    status: 'ok',
    service: 'escort-service-platform',
    db: 'connected',
    orders,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/dashboard', (req, res) => {
  const stats = {
    patients: get('SELECT COUNT(*) AS count FROM patients').count,
    escorts: get('SELECT COUNT(*) AS count FROM escorts').count,
    orders: get('SELECT COUNT(*) AS count FROM orders').count,
    revenue: get('SELECT COALESCE(SUM(total_fee), 0) AS value FROM orders').value,
    avgRating: get('SELECT COALESCE(AVG(rating), 0) AS value FROM escorts').value,
  };
  res.json({ stats });
});

app.get('/api/patients', (req, res) => {
  res.json(all('SELECT * FROM patients ORDER BY created_at DESC'));
});

app.post('/api/patients', (req, res) => {
  const { name, phone, age, gender } = req.body || {};
  if (!name || !phone) {
    return res.status(400).json({ error: '姓名和电话为必填项' });
  }
  try {
    const result = run(`
      INSERT INTO patients (name, phone, age, gender)
      VALUES (?, ?, ?, ?)
    `, [String(name).trim(), String(phone).trim(), Number(age || 0), gender || '']);
    res.status(201).json(get('SELECT * FROM patients WHERE id = ?', [result.lastInsertRowid]));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/escorts', (req, res) => {
  res.json(all('SELECT * FROM escorts ORDER BY rating DESC'));
});

app.get('/api/escorts/:id', (req, res) => {
  const escort = get('SELECT * FROM escorts WHERE id = ?', [req.params.id]);
  if (!escort) return res.status(404).json({ error: '陪诊师不存在' });
  res.json(escort);
});

app.post('/api/escorts', (req, res) => {
  const { name, phone, city, hospitals, qualifications, rating, available_times, forbidden_tags } = req.body || {};
  if (!name || !phone || !city) {
    return res.status(400).json({ error: '姓名、电话、城市为必填项' });
  }
  try {
    const result = run(`
      INSERT INTO escorts (name, phone, city, hospitals, qualifications, rating, available_times, forbidden_tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, phone, city, hospitals || '', qualifications || '', rating || 5, available_times || '', forbidden_tags || '']);
    res.status(201).json(get('SELECT * FROM escorts WHERE id = ?', [result.lastInsertRowid]));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/escorts/match/:orderId', (req, res) => {
  const order = get('SELECT * FROM orders WHERE id = ?', [req.params.orderId]);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  
  const escorts = all(`
    SELECT * FROM escorts 
    WHERE status = 'active'
    ORDER BY rating DESC
    LIMIT 5
  `);
  res.json(escorts.map(e => ({ ...e, matchScore: Math.random() * 30 + 70 })));
});

function genOrderNo() {
  const d = new Date();
  return 'ES' + d.getFullYear() + 
    (d.getMonth()+1).toString().padStart(2,'0') + 
    d.getDate().toString().padStart(2,'0') + 
    d.getHours().toString().padStart(2,'0') + 
    d.getMinutes().toString().padStart(2,'0') +
    Math.floor(Math.random()*1000).toString().padStart(3,'0');
}

function normalizeDateTime(body) {
  if (body.appointmentTime) return String(body.appointmentTime);
  const date = body.serviceDate || body.service_date || body.visit_date || '';
  const time = body.serviceTime || body.service_time || body.visit_time || '09:00';
  return date ? `${date}T${time}` : '';
}

function normalizeServiceItems(value) {
  if (Array.isArray(value)) return value.join(',');
  return value || '';
}

app.get('/api/orders', (req, res) => {
  const { status, patient_id, escort_id } = req.query;
  let sql = `
    SELECT o.*, 
      p.name as patient_name, p.phone as patient_phone,
      e.name as escort_name
    FROM orders o
    LEFT JOIN patients p ON o.patient_id = p.id
    LEFT JOIN escorts e ON o.escort_id = e.id
  `;
  let conditions = [];
  let params = [];
  
  if (status) { conditions.push('o.status = ?'); params.push(status); }
  if (patient_id) { conditions.push('o.patient_id = ?'); params.push(patient_id); }
  if (escort_id) { conditions.push('o.escort_id = ?'); params.push(escort_id); }
  
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY o.created_at DESC';
  
  res.json(all(sql, params));
});

app.get('/api/orders/:id', (req, res) => {
  const order = get(`
    SELECT o.*, 
      p.name as patient_name, p.phone as patient_phone,
      e.name as escort_name
    FROM orders o
    LEFT JOIN patients p ON o.patient_id = p.id
    LEFT JOIN escorts e ON o.escort_id = e.id
    WHERE o.id = ?
  `, [req.params.id]);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  
  const assignments = all('SELECT * FROM assignments WHERE order_id = ? ORDER BY created_at DESC', [req.params.id]);
  const records = all('SELECT * FROM service_records WHERE order_id = ? ORDER BY created_at ASC', [req.params.id]);
  const settlement = get('SELECT * FROM settlements WHERE order_id = ?', [req.params.id]);
  
  res.json({ ...order, assignments, records, settlement });
});

app.post('/api/orders', (req, res) => {
  const body = req.body || {};
  const patientName = body.patientName || body.patient_name;
  const phone = body.phone || body.patient_phone;
  const hospital = body.hospital;
  const department = body.department;
  const appointmentTime = normalizeDateTime(body);
  const duration = Number(body.duration || body.estimated_duration || body.service_hours || 2);
  const condition = body.condition || body.condition_summary || body.description || '';
  const services = body.services || body.escort_items || body.service_type || '';
  const specialRequirements = body.specialRequirements || body.special_requirements || body.special_needs || '';
  
  if (!patientName || !phone || !hospital || !department || !appointmentTime) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }
  
  try {
    let patient = get('SELECT * FROM patients WHERE phone = ?', [phone]);
    if (!patient) {
      const result = run('INSERT INTO patients (name, phone) VALUES (?, ?)', [patientName, phone]);
      patient = get('SELECT * FROM patients WHERE id = ?', [result.lastInsertRowid]);
    }
    
    const orderNo = genOrderNo();
    const serviceFee = (duration || 2) * 100;
    
    const result = run(`
      INSERT INTO orders (
        order_no, patient_id, hospital, department, visit_date, visit_time,
        condition_summary, escort_items, special_needs, status, service_fee, total_fee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNo, patient.id, hospital, department,
      appointmentTime.split('T')[0] || appointmentTime,
      appointmentTime.split('T')[1]?.substring(0,5) || '09:00',
      condition,
      normalizeServiceItems(services),
      specialRequirements || '',
      'pending',
      serviceFee,
      serviceFee
    ]);
    
    const order = get('SELECT * FROM orders WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, orderNo, order_no: order.order_no, order });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/orders/:id/assign', (req, res) => {
  const { escort_id, assigned_by, reason } = req.body || {};
  if (!escort_id) return res.status(400).json({ error: '请选择陪诊师' });
  
  const order = get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  
  run('INSERT INTO assignments (order_id, escort_id, assigned_by, reason, assignment_type) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, escort_id, assigned_by || '系统', reason || '', 'auto']);
  
  run('UPDATE orders SET escort_id = ?, status = ? WHERE id = ?', [escort_id, 'assigned', req.params.id]);
  
  res.json({ success: true, message: '派单成功' });
});

app.post('/api/orders/:id/reassign', (req, res) => {
  const { escort_id, assigned_by, reason } = req.body || {};
  if (!escort_id || !reason) return res.status(400).json({ error: '请选择陪诊师并填写改派原因' });
  
  const order = get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  
  run('INSERT INTO assignments (order_id, escort_id, assigned_by, reason, assignment_type) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, escort_id, assigned_by || '客服', reason, 'reassign']);
  
  run('UPDATE orders SET escort_id = ?, status = ? WHERE id = ?', [escort_id, 'assigned', req.params.id]);
  
  res.json({ success: true, message: '改派成功' });
});

app.get('/api/service/records/:orderId', (req, res) => {
  res.json(all('SELECT * FROM service_records WHERE order_id = ? ORDER BY created_at ASC', [req.params.orderId]));
});

app.post('/api/service/records', (req, res) => {
  const { order_id, status, location, remark, image_url, created_by } = req.body || {};
  if (!order_id || !status) return res.status(400).json({ error: '必填字段不能为空' });
  
  const result = run(`
    INSERT INTO service_records (order_id, status, location, remark, image_url, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [order_id, status, location || '', remark || '', image_url || '', created_by || 0]);
  
  if (status === 'completed') {
    run('UPDATE orders SET status = ? WHERE id = ?', ['completed', order_id]);
  } else if (status === 'departed') {
    run('UPDATE orders SET status = ? WHERE id = ?', ['in_service', order_id]);
  }
  
  res.status(201).json({ success: true, id: result.lastInsertRowid });
});

app.get('/api/settlements', (req, res) => {
  res.json(all(`
    SELECT s.*, o.order_no, p.name as patient_name, e.name as escort_name
    FROM settlements s
    LEFT JOIN orders o ON s.order_id = o.id
    LEFT JOIN patients p ON o.patient_id = p.id
    LEFT JOIN escorts e ON o.escort_id = e.id
    ORDER BY s.created_at DESC
  `));
});

app.post('/api/settlements', (req, res) => {
  const { order_id, total_amount, refund_amount, complaint, evidence } = req.body || {};
  if (!order_id || !total_amount) return res.status(400).json({ error: '必填字段不能为空' });
  
  const escortShare = total_amount * 0.7;
  const platformFee = total_amount * 0.3;
  
  const result = run(`
    INSERT INTO settlements (order_id, total_amount, escort_share, platform_fee, refund_amount, status, complaint, evidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [order_id, total_amount, escortShare, platformFee, refund_amount || 0, 'completed', complaint || '', evidence || '']);
  
  run('UPDATE orders SET status = ? WHERE id = ?', ['settled', order_id]);
  
  res.status(201).json({ success: true, id: result.lastInsertRowid });
});

app.post('/api/orders/:id/refund', (req, res) => {
  const { amount, reason, remark } = req.body || {};
  if (!amount || !reason) return res.status(400).json({ error: '退款金额和原因不能为空' });

  const order = get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) return res.status(404).json({ error: '订单不存在' });

  const result = run(`
    INSERT INTO refunds (order_id, amount, reason, remark, status)
    VALUES (?, ?, ?, ?, ?)
  `, [req.params.id, Number(amount), reason, remark || '', 'submitted']);

  res.status(201).json({
    success: true,
    refund: get('SELECT * FROM refunds WHERE id = ?', [result.lastInsertRowid])
  });
});

app.get('/api/complaints', (req, res) => {
  res.json(all('SELECT * FROM complaints ORDER BY created_at DESC'));
});

app.post('/api/complaints', (req, res) => {
  const body = req.body || {};
  if (!body.order_no || !body.patient_name || !body.type || !body.content) {
    return res.status(400).json({ error: '订单号、投诉人、类型和内容不能为空' });
  }

  const result = run(`
    INSERT INTO complaints (order_no, patient_name, phone, type, content, status, create_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    body.order_no,
    body.patient_name,
    body.phone || '',
    body.type,
    body.content,
    body.status || 'pending',
    body.create_time || new Date().toISOString(),
  ]);

  res.status(201).json({ success: true, complaint: get('SELECT * FROM complaints WHERE id = ?', [result.lastInsertRowid]) });
});

app.post('/api/complaints/:id/handle', (req, res) => {
  const { result, remark, status } = req.body || {};
  const complaint = get('SELECT * FROM complaints WHERE id = ?', [req.params.id]);
  if (!complaint) return res.status(404).json({ error: '投诉记录不存在' });

  run(`
    UPDATE complaints
    SET status = ?, handle_result = ?, handler = ?, handle_time = ?
    WHERE id = ?
  `, [
    status || 'processed',
    remark || (result === 'agree' ? '同意投诉' : '驳回投诉'),
    '客服主管',
    new Date().toISOString(),
    req.params.id,
  ]);

  res.json({ success: true, complaint: get('SELECT * FROM complaints WHERE id = ?', [req.params.id]) });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, user: { username: 'admin', role: 'admin', name: '管理员' } });
  } else if (username === 'service' && password === 'service123') {
    res.json({ success: true, user: { username: 'service', role: 'service', name: '客服' } });
  } else {
    res.status(401).json({ error: '用户名或密码错误' });
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, HOST, () => {
  console.log(`Escort service API listening at http://${HOST}:${PORT}`);
  console.log(`Project directory: ${projectDir}`);
});
