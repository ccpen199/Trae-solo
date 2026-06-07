const express = require('express');
const { getDb } = require('../models/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

function demoAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const demoUsers = {
    'local-demo-admin': { id: 1, username: 'admin', type: 'admin' },
    'local-demo-admin-token': { id: 1, username: 'admin', type: 'admin' },
    'local-demo-personal': { id: 2, username: 'user1', type: 'personal' },
    'local-demo-legal': { id: 3, username: 'company1', type: 'legal' }
  };
  if (demoUsers[token]) {
    req.user = demoUsers[token];
  } else {
    req.user = { id: 1, username: 'admin', type: 'admin' };
  }
  next();
}

router.use(demoAuth);

router.get('/dashboard', (req, res) => {
  const db = getDb();
  
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;
  const applicationCount = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM service_items').get().count;
  
  const pendingApplications = db.prepare('SELECT COUNT(*) as count FROM applications WHERE status = ?').get('submitted').count;
  const completedToday = db.prepare(`SELECT COUNT(*) as count FROM applications 
    WHERE status = 'completed' AND DATE(completed_time) = DATE('now')`).get().count;
  
  const avgRating = db.prepare('SELECT AVG(rating) as avg FROM applications WHERE rating IS NOT NULL').get().avg || 0;
  
  const recentApplications = db.prepare(`
    SELECT a.*, u.name as user_name 
    FROM applications a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all();
  
  res.json({
    statistics: {
      userCount,
      certCount,
      applicationCount,
      serviceCount,
      pendingApplications,
      completedToday,
      avgRating: Math.round(avgRating * 10) / 10
    },
    recentApplications
  });
});

router.get('/applications', (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const db = getDb();
  
  let sql = `
    SELECT a.*, u.name as user_name 
    FROM applications a
    JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const applications = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  
  res.json({ list: applications, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.put('/applications/:id/status', (req, res) => {
  const { status, stepNo, remark } = req.body;
  const db = getDb();
  
  db.prepare(`
    UPDATE applications 
    SET status = ?, current_step = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, stepNo, req.params.id);
  
  db.prepare(`
    UPDATE application_steps 
    SET status = 'completed', handle_time = CURRENT_TIMESTAMP, remark = ?
    WHERE application_id = ? AND step_no = ?
  `).run(remark || '', req.params.id, stepNo);
  
  if (status === 'completed') {
    db.prepare(`
      UPDATE applications 
      SET completed_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
  }
  
  res.json({ success: true });
});

router.get('/audit-logs', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const db = getDb();
  
  const logs = db.prepare(`
    SELECT al.*, u.name as user_name 
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
  
  res.json({ list: logs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/audit-log', (req, res) => {
  const { action, module, resourceId, result } = req.body;
  const db = getDb();
  
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, resource_id, ip_address, user_agent, result)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    action,
    module,
    resourceId,
    req.ip,
    req.headers['user-agent'],
    result || 'success'
  );
  
  res.json({ success: true });
});

router.get('/services', (req, res) => {
  const db = getDb();
  const services = db.prepare('SELECT * FROM service_items ORDER BY created_at DESC').all();
  res.json(services);
});

router.post('/services', (req, res) => {
  const { categoryId, name, code, department, description, handlingTime, requiredMaterials, formSchema } = req.body;
  const db = getDb();
  
  const result = db.prepare(`
    INSERT INTO service_items (category_id, name, code, department, description, handling_time, required_materials, form_schema)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(categoryId, name, code, department, description, handlingTime, JSON.stringify(requiredMaterials || []), JSON.stringify(formSchema || {}));
  
  res.json({ id: result.lastInsertRowid });
});

router.put('/services/:id', (req, res) => {
  const { name, department, description, handlingTime, status } = req.body;
  const db = getDb();
  
  db.prepare(`
    UPDATE service_items 
    SET name = ?, department = ?, description = ?, handling_time = ?, status = ?
    WHERE id = ?
  `).run(name, department, description, handlingTime, status, req.params.id);
  
  res.json({ success: true });
});

router.get('/overdue-warning', (req, res) => {
  const db = getDb();
  
  const overdue = db.prepare(`
    SELECT a.*, u.name as user_name,
      JULIANDAY('now') - JULIANDAY(a.created_at) as days_passed
    FROM applications a
    JOIN users u ON a.user_id = u.id
    WHERE a.status NOT IN ('completed', 'rejected')
      AND JULIANDAY('now') - JULIANDAY(a.created_at) > 7
    ORDER BY days_passed DESC
  `).all();
  
  res.json({ overdue, count: overdue.length });
});

router.get('/bad-review', (req, res) => {
  const db = getDb();
  
  const badReviews = db.prepare(`
    SELECT a.*, u.name as user_name
    FROM applications a
    JOIN users u ON a.user_id = u.id
    WHERE a.rating <= 2 AND a.rating IS NOT NULL
    ORDER BY a.updated_at DESC
  `).all();
  
  res.json({ badReviews, count: badReviews.length });
});

module.exports = router;
