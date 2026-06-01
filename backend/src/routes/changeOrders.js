const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../models/database');
const { authMiddleware, createAuditLog } = require('../middleware/auth');
const { createAlert, getResponsibleUserId } = require('../utils/alert');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const { app_id, type, status, page = 1, page_size = 20 } = req.query;
  let query = `
    SELECT co.*, a.name as app_name, e.name as env_name,
           req.name as requester_name, app.name as approver_name, exe.name as executor_name
    FROM change_orders co
    LEFT JOIN applications a ON co.app_id = a.id
    LEFT JOIN environments e ON co.env_id = e.id
    LEFT JOIN users req ON co.requested_by = req.id
    LEFT JOIN users app ON co.approved_by = app.id
    LEFT JOIN users exe ON co.executed_by = exe.id
    WHERE 1=1
  `;
  const params = [];

  if (app_id) { query += ' AND co.app_id = ?'; params.push(app_id); }
  if (type) { query += ' AND co.type = ?'; params.push(type); }
  if (status) { query += ' AND co.status = ?'; params.push(status); }

  query += ' ORDER BY co.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const orders = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM change_orders WHERE 1=1').get().count;

  res.json({ data: orders, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT co.*, a.name as app_name, e.name as env_name,
           req.name as requester_name, app.name as approver_name, exe.name as executor_name
    FROM change_orders co
    LEFT JOIN applications a ON co.app_id = a.id
    LEFT JOIN environments e ON co.env_id = e.id
    LEFT JOIN users req ON co.requested_by = req.id
    LEFT JOIN users app ON co.approved_by = app.id
    LEFT JOIN users exe ON co.executed_by = exe.id
    WHERE co.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  const timeline = db.prepare(`
    SELECT al.*, u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.resource_id = ?
    ORDER BY al.created_at ASC
  `).all(order.order_id);

  res.json({ ...order, timeline });
});

router.post('/', (req, res) => {
  const { type, title, description, app_id, env_id, reason, impact, recovery_path, status = 'draft' } = req.body;

  const validationErrors = [];
  if (!type) validationErrors.push('变更类型不能为空');
  if (!title) validationErrors.push('变更标题不能为空');
  if (!reason) validationErrors.push('变更原因不能为空');

  if (validationErrors.length > 0) {
    return res.status(400).json({ error: '字段校验失败', details: validationErrors });
  }

  const orderId = uuidv4();
  const result = db.prepare(`
    INSERT INTO change_orders (order_id, type, title, description, app_id, env_id, status, reason, impact, recovery_path, requested_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderId, type, title, description, app_id, env_id, status, reason, impact, recovery_path || '默认恢复路径：回滚到上一版本', req.user.id);

  createAuditLog(req.user.id, 'create', 'change_order', orderId, null, JSON.stringify({ type, title, app_id }), '创建变更单');

  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(order);
});

router.post('/:id/submit', (req, res) => {
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  if (order.status !== 'draft') {
    return res.status(400).json({ error: '只有草稿状态的变更单可以提交审批' });
  }

  db.prepare('UPDATE change_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('pending_approval', req.params.id);
  createAuditLog(req.user.id, 'submit', 'change_order', order.order_id, JSON.stringify({ status: 'draft' }), JSON.stringify({ status: 'pending_approval' }), '提交变更单审批');

  createAlert('config_misuse', 'medium', '变更单待审批', `变更单 "${order.title}" 已提交审批`, {
    app_id: order.app_id,
    order_id: order.id,
    responsible_user_id: getResponsibleUserId(order.app_id),
    suggested_action: '请及时审批或驳回变更申请'
  });

  res.json({ message: '变更单已提交审批' });
});

router.post('/:id/approve', (req, res) => {
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  if (order.status !== 'pending_approval') {
    return res.status(400).json({ error: '只有待审批状态的变更单可以审批' });
  }

  db.prepare('UPDATE change_orders SET status = ?, approved_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('approved', req.user.id, req.params.id);
  createAuditLog(req.user.id, 'approve', 'change_order', order.order_id, JSON.stringify({ status: 'pending_approval' }), JSON.stringify({ status: 'approved' }), '审批通过变更单');

  res.json({ message: '变更单已批准' });
});

router.post('/:id/reject', (req, res) => {
  const { reason } = req.body;
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  if (order.status !== 'pending_approval') {
    return res.status(400).json({ error: '只有待审批状态的变更单可以驳回' });
  }

  db.prepare('UPDATE change_orders SET status = ?, approved_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('rejected', req.user.id, req.params.id);
  createAuditLog(req.user.id, 'reject', 'change_order', order.order_id, JSON.stringify({ status: 'pending_approval' }), JSON.stringify({ status: 'rejected' }), reason || '驳回变更单');

  res.json({ message: '变更单已驳回' });
});

router.post('/:id/execute', (req, res) => {
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  if (order.status !== 'approved') {
    return res.status(400).json({ error: '只有已批准的变更单可以执行' });
  }

  db.prepare('UPDATE change_orders SET status = ?, executed_by = ?, executed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('executing', req.user.id, req.params.id);
  createAuditLog(req.user.id, 'execute', 'change_order', order.order_id, JSON.stringify({ status: 'approved' }), JSON.stringify({ status: 'executing' }), '开始执行变更');

  setTimeout(() => {
    db.prepare('UPDATE change_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', req.params.id);
    createAuditLog(req.user.id, 'complete', 'change_order', order.order_id, JSON.stringify({ status: 'executing' }), JSON.stringify({ status: 'completed' }), '变更执行完成');
  }, 2000);

  res.json({ message: '变更执行中' });
});

router.post('/:id/rollback', (req, res) => {
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  if (order.status !== 'completed') {
    return res.status(400).json({ error: '只有已完成的变更单可以回滚' });
  }

  db.prepare('UPDATE change_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('rolled_back', req.params.id);
  createAuditLog(req.user.id, 'rollback', 'change_order', order.order_id, JSON.stringify({ status: 'completed' }), JSON.stringify({ status: 'rolled_back' }), '回滚变更');

  createAlert('config_misuse', 'high', '变更已回滚', `变更单 "${order.title}" 已执行回滚操作`, {
    app_id: order.app_id,
    order_id: order.id,
    responsible_user_id: getResponsibleUserId(order.app_id),
    suggested_action: '请检查回滚后系统状态，确认恢复正常'
  });

  res.json({ message: '变更已回滚' });
});

module.exports = router;
