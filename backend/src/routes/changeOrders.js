const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { createAuditLog, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, type, app_id } = req.query;
  
  let query = `
    SELECT co.*, a.name as app_name, u.name as creator_name, ua.name as approver_name
    FROM change_orders co
    JOIN users u ON co.created_by = u.id
    LEFT JOIN applications a ON co.app_id = a.id
    LEFT JOIN users ua ON co.approved_by = ua.id
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
  if (app_id) {
    query += ' AND co.app_id = ?';
    params.push(app_id);
  }

  query += ' ORDER BY co.created_at DESC';

  const orders = db.prepare(query).all(...params);
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT co.*, a.name as app_name, u.name as creator_name, ua.name as approver_name
    FROM change_orders co
    JOIN users u ON co.created_by = u.id
    LEFT JOIN applications a ON co.app_id = a.id
    LEFT JOIN users ua ON co.approved_by = ua.id
    WHERE co.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  res.json(order);
});

router.post('/', (req, res) => {
  const { title, description, type, app_id, risk_level } = req.body;
  const user = req.user;

  const validation = [];
  if (!title || title.length < 5) validation.push('标题至少5个字符');
  if (!type) validation.push('变更类型不能为空');
  if (!['config', 'feature', 'hotfix', 'rollback'].includes(type)) validation.push('无效的变更类型');

  if (validation.length > 0) {
    return res.status(400).json({ error: '字段验证失败', details: validation });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO change_orders (id, title, description, type, app_id, risk_level, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description || '', type, app_id || null, risk_level || 'medium', user.id);

  createAuditLog(user.id, user.name, 'create_change_order', 'change_order', id, { title, type }, req.ip);

  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id);
  res.status(201).json(order);
});

router.post('/:id/approve', roleMiddleware('admin', 'owner', 'security'), (req, res) => {
  const orderId = req.params.id;
  const user = req.user;

  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  db.prepare(`
    UPDATE change_orders 
    SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(user.id, orderId);

  createAuditLog(user.id, user.name, 'approve_change_order', 'change_order', orderId, {}, req.ip);

  res.json({ message: '审批通过' });
});

module.exports = router;
