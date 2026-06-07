const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = 'gd-gov-service-2024-secret-key';

function verifyAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'admin') return null;
    return decoded;
  } catch {
    return null;
  }
}

router.get('/dashboard', (req, res) => {
  const admin = verifyAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: '未授权' });
  }

  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const pendingApplications = db.prepare('SELECT COUNT(*) as count FROM applications WHERE status = ?').get('pending').count;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM work_orders').get().count;
  const pendingOrders = db.prepare('SELECT COUNT(*) as count FROM work_orders WHERE status = ?').get('pending').count;
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayApplications = db.prepare(
    'SELECT COUNT(*) as count FROM applications WHERE created_at >= ?'
  ).get(todayStart.toISOString()).count;

  const systems = db.prepare('SELECT * FROM system_health').all();

  const applicationStats = db.prepare(`
    SELECT 
      strftime('%Y-%m-%d', created_at) as date,
      COUNT(*) as count
    FROM applications 
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY strftime('%Y-%m-%d', created_at)
    ORDER BY date
  `).all();

  res.json({
    stats: {
      totalApplications,
      pendingApplications,
      totalOrders,
      pendingOrders,
      totalUsers,
      todayApplications
    },
    systems,
    applicationStats
  });
});

router.get('/applications', (req, res) => {
  const admin = verifyAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: '未授权' });
  }

  const { status, page = 1, pageSize = 20 } = req.query;
  let sql = 'SELECT * FROM applications';
  const params = [];

  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const applications = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM applications' + (status ? ' WHERE status = ?' : '')).get(...(status ? [status] : [])).count;

  res.json({
    list: applications,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/applications/:id/process', (req, res) => {
  const admin = verifyAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: '未授权' });
  }

  const { status, remark, handler } = req.body;
  const { id } = req.params;

  db.prepare('UPDATE applications SET status = ?, handler = ?, current_step = current_step + 1 WHERE id = ?').run(
    status || 'processing', handler || '管理员', id
  );

  db.prepare(`
    INSERT INTO application_logs (application_id, action, operator, remark)
    VALUES (?, ?, ?, ?)
  `).run(id, status === 'completed' ? 'complete' : 'process', handler || '管理员', remark || '');

  if (status === 'completed') {
    db.prepare('UPDATE applications SET completed_at = ?, result = ? WHERE id = ?').run(
      new Date().toISOString(), remark || '办理完成', id
    );
  }

  res.json({ success: true });
});

router.get('/workorders', (req, res) => {
  const admin = verifyAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: '未授权' });
  }

  const { status, page = 1, pageSize = 20 } = req.query;
  let sql = 'SELECT * FROM work_orders';
  const params = [];

  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const orders = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM work_orders' + (status ? ' WHERE status = ?' : '')).get(...(status ? [status] : [])).count;

  res.json({
    list: orders,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/workorders/:id/assign', (req, res) => {
  const admin = verifyAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: '未授权' });
  }

  const { assignedTo, assignedDepartment } = req.body;
  const { id } = req.params;

  db.prepare('UPDATE work_orders SET assigned_to = ?, assigned_department = ?, status = ? WHERE id = ?').run(
    assignedTo || '', assignedDepartment || '', 'processing', id
  );

  res.json({ success: true });
});

router.get('/services', (req, res) => {
  const admin = verifyAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: '未授权' });
  }

  const services = db.prepare('SELECT * FROM service_items ORDER BY id').all();
  res.json(services);
});

router.post('/services', (req, res) => {
  const admin = verifyAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: '未授权' });
  }

  const { code, name, category, department, description, materials, processSteps, handlingTime, fee } = req.body;

  const result = db.prepare(`
    INSERT INTO service_items (code, name, category, department, description, materials, process_steps, handling_time, fee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code, name, category, department, description, materials, processSteps, handlingTime, fee);

  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/services/:id', (req, res) => {
  const admin = verifyAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: '未授权' });
  }

  const { code, name, category, department, description, materials, processSteps, handlingTime, fee, status } = req.body;
  const { id } = req.params;

  db.prepare(`
    UPDATE service_items 
    SET code = ?, name = ?, category = ?, department = ?, description = ?, 
        materials = ?, process_steps = ?, handling_time = ?, fee = ?, status = ?
    WHERE id = ?
  `).run(code, name, category, department, description, materials, processSteps, handlingTime, fee, status || 'active', id);

  res.json({ success: true });
});

router.get('/overdue/applications', (req, res) => {
  const admin = verifyAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: '未授权' });
  }

  const now = new Date().toISOString();
  const overdueApps = db.prepare(`
    SELECT * FROM applications 
    WHERE status NOT IN ('completed', 'cancelled') 
      AND handling_deadline < ?
    ORDER BY handling_deadline
  `).all(now);

  res.json(overdueApps);
});

router.get('/health/systems', (req, res) => {
  const admin = verifyAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: '未授权' });
  }

  const systems = db.prepare('SELECT * FROM system_health ORDER BY department').all();
  
  const updatedSystems = systems.map(s => ({
    ...s,
    status: Math.random() > 0.05 ? 'online' : 'offline',
    response_time: Math.floor(Math.random() * 200) + 30,
    last_check: new Date().toISOString()
  }));

  res.json(updatedSystems);
});

module.exports = router;
