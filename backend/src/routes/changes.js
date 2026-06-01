const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/orders', (req, res) => {
  const { status, type, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT co.*, app.name as app_name, creator.name as creator_name, reviewer.name as reviewer_name
    FROM change_orders co
    LEFT JOIN applications app ON co.app_id = app.id
    LEFT JOIN users creator ON co.created_by = creator.id
    LEFT JOIN users reviewer ON co.reviewed_by = reviewer.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND co.status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND co.type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY co.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const orders = db.prepare(query).all(...params);
  
  const countQuery = 'SELECT COUNT(*) as total FROM change_orders WHERE 1=1';
  const total = db.prepare(countQuery).get().total;
  
  res.json({
    list: orders,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT co.*, app.name as app_name, creator.name as creator_name, reviewer.name as reviewer_name
    FROM change_orders co
    LEFT JOIN applications app ON co.app_id = app.id
    LEFT JOIN users creator ON co.created_by = creator.id
    LEFT JOIN users reviewer ON co.reviewed_by = reviewer.id
    WHERE co.id = ?
  `).get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }
  
  res.json(order);
});

router.post('/orders', (req, res) => {
  const { app_id, type, title, description, change_content, impact, rollback_plan } = req.body;
  
  if (!type || !title) {
    return res.status(400).json({ error: '变更类型和标题不能为空' });
  }
  
  const validation = validateChangeOrder(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error, field: validation.field });
  }
  
  const orderId = 'CO-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);
  
  const result = db.prepare(`
    INSERT INTO change_orders (order_id, app_id, type, title, description, change_content, impact, rollback_plan, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1)
  `).run(
    orderId,
    app_id || null,
    type,
    title,
    description || '',
    change_content ? JSON.stringify(change_content) : null,
    impact || '',
    rollback_plan || ''
  );
  
  db.prepare(`
    INSERT INTO audit_logs (log_id, user_id, action, resource_type, resource_id, new_value, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    `audit-${Date.now()}`,
    1,
    'create',
    'change_order',
    result.lastInsertRowid,
    JSON.stringify({ order_id: orderId, title, type }),
    req.ip
  );
  
  res.json({
    id: result.lastInsertRowid,
    order_id: orderId,
    title,
    type,
    status: 'pending'
  });
});

function validateChangeOrder(data) {
  if (data.type === 'version' && !data.change_content?.version) {
    return { valid: false, error: '版本变更必须指定目标版本号', field: 'change_content' };
  }
  if (data.impact === 'high' && (!data.rollback_plan || data.rollback_plan.length < 10)) {
    return { valid: false, error: '高影响变更必须提供详细的回滚方案', field: 'rollback_plan' };
  }
  return { valid: true };
}

router.put('/orders/:id/review', (req, res) => {
  const { status, reviewed_by } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的审核状态' });
  }
  
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }
  
  if (order.status !== 'pending') {
    return res.status(400).json({ error: '只能审核待审核状态的变更单' });
  }
  
  db.prepare(`
    UPDATE change_orders SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, reviewed_by || 1, req.params.id);
  
  db.prepare(`
    INSERT INTO audit_logs (log_id, user_id, action, resource_type, resource_id, old_value, new_value, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `audit-${Date.now()}`,
    1,
    'review',
    'change_order',
    req.params.id,
    JSON.stringify({ status: order.status }),
    JSON.stringify({ status }),
    req.ip
  );
  
  res.json({ message: '审核完成' });
});

router.get('/alerts', (req, res) => {
  const { status, level, type, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT a.*, app.name as app_name, env.name as env_name, u.name as assignee_name
    FROM alerts a
    LEFT JOIN applications app ON a.app_id = app.id
    LEFT JOIN environments env ON a.env_id = env.id
    LEFT JOIN users u ON a.assignee_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  if (level) {
    query += ' AND a.level = ?';
    params.push(level);
  }
  if (type) {
    query += ' AND a.type = ?';
    params.push(type);
  }
  
  query += ` ORDER BY 
    CASE a.level WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'warning' THEN 3 ELSE 4 END,
    a.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), offset);
  
  const alerts = db.prepare(query).all(...params);
  
  const countQuery = 'SELECT COUNT(*) as total FROM alerts WHERE 1=1';
  const total = db.prepare(countQuery).get().total;
  
  res.json({
    list: alerts,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/alerts/:id', (req, res) => {
  const alert = db.prepare(`
    SELECT a.*, app.name as app_name, env.name as env_name, u.name as assignee_name
    FROM alerts a
    LEFT JOIN applications app ON a.app_id = app.id
    LEFT JOIN environments env ON a.env_id = env.id
    LEFT JOIN users u ON a.assignee_id = u.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }
  
  res.json(alert);
});

router.put('/alerts/:id', (req, res) => {
  const { status, assignee_id, resolution } = req.body;
  
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }
  
  let updateQuery = 'UPDATE alerts SET ';
  const updateParams = [];
  
  if (status) {
    updateQuery += 'status = ?, ';
    updateParams.push(status);
    if (status === 'resolved') {
      updateQuery += 'resolved_at = CURRENT_TIMESTAMP, ';
    }
  }
  if (assignee_id) {
    updateQuery += 'assignee_id = ?, ';
    updateParams.push(assignee_id);
  }
  if (resolution) {
    updateQuery += 'resolution = ?, ';
    updateParams.push(resolution);
  }
  
  updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
  updateParams.push(req.params.id);
  
  db.prepare(updateQuery).run(...updateParams);
  
  db.prepare(`
    INSERT INTO audit_logs (log_id, user_id, action, resource_type, resource_id, old_value, new_value, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `audit-${Date.now()}`,
    1,
    'update',
    'alert',
    req.params.id,
    JSON.stringify({ status: alert.status, assignee_id: alert.assignee_id }),
    JSON.stringify({ status, assignee_id }),
    req.ip
  );
  
  res.json({ message: '更新成功' });
});

module.exports = router;
