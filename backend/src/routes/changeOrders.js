const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const orders = db.prepare(`
    SELECT co.*, a.name as app_name
    FROM change_orders co
    LEFT JOIN applications a ON co.app_id = a.id
    ORDER BY co.created_at DESC
  `).all();
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: '变更单不存在' });
  res.json(order);
});

router.post('/', (req, res) => {
  const { app_id, type, title, content, created_by } = req.body;
  if (!app_id || !type || !title) {
    return res.status(400).json({ error: '必填字段缺失' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO change_orders (id, app_id, type, title, content, status, created_by)
    VALUES (?, ?, ?, ?, ?, 'draft', ?)
  `).run(id, app_id, type, title, content, created_by || 'admin');

  db.prepare(`
    INSERT INTO operation_logs (id, user_id, action, resource_type, resource_id, details)
    VALUES (?, ?, 'create', 'change_order', ?, ?)
  `).run(uuidv4(), created_by || 'admin', id, JSON.stringify({ title, type }));

  const newOrder = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id);
  res.status(201).json(newOrder);
});

router.post('/:id/submit', (req, res) => {
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: '变更单不存在' });
  if (order.status !== 'draft') {
    return res.status(400).json({ error: '只有草稿状态可以提交' });
  }

  db.prepare(`
    UPDATE change_orders 
    SET status = 'pending_review', submitted_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  db.prepare(`
    INSERT INTO operation_logs (id, user_id, action, resource_type, resource_id, details)
    VALUES (?, ?, 'submit', 'change_order', ?, ?)
  `).run(uuidv4(), order.created_by, req.params.id, JSON.stringify({ from: 'draft', to: 'pending_review' }));

  const updated = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/review', (req, res) => {
  const { action, reviewed_by, reason } = req.body;
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: '变更单不存在' });
  if (order.status !== 'pending_review') {
    return res.status(400).json({ error: '只有待审核状态可以审批' });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  db.prepare(`
    UPDATE change_orders 
    SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, reason = ?
    WHERE id = ?
  `).run(newStatus, reviewed_by || 'admin', reason, req.params.id);

  db.prepare(`
    INSERT INTO operation_logs (id, user_id, action, resource_type, resource_id, details)
    VALUES (?, ?, 'review', 'change_order', ?, ?)
  `).run(uuidv4(), reviewed_by || 'admin', req.params.id, JSON.stringify({ from: 'pending_review', to: newStatus, reason }));

  if (action === 'approve') {
    db.prepare(`
      INSERT INTO alerts (id, app_id, type, level, message, status)
      VALUES (?, ?, 'config_change', 'info', ?, 'open')
    `).run(uuidv4(), order.app_id, `配置变更已批准: ${order.title}`);
  }

  const updated = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/close', (req, res) => {
  const { reason } = req.body;
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: '变更单不存在' });

  db.prepare(`
    UPDATE change_orders 
    SET status = 'closed', reason = ?
    WHERE id = ?
  `).run(reason, req.params.id);

  const updated = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
