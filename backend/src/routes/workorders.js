const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const { status, type, priority, assigned_user_id, created_by } = req.query;

  let sql = `
    SELECT wo.*, 
           u1.name as assigned_user_name,
           u2.name as creator_name,
           c.name as checkpoint_name,
           b.name as building_name
    FROM work_orders wo
    LEFT JOIN users u1 ON wo.assigned_user_id = u1.id
    LEFT JOIN users u2 ON wo.created_by = u2.id
    LEFT JOIN patrol_records pr ON wo.patrol_record_id = pr.id
    LEFT JOIN checkpoints c ON pr.checkpoint_id = c.id
    LEFT JOIN buildings b ON c.building_id = b.id
  `;

  const params = [];
  const conditions = [];

  if (status) {
    conditions.push('wo.status = ?');
    params.push(status);
  }
  if (type) {
    conditions.push('wo.type = ?');
    params.push(type);
  }
  if (priority) {
    conditions.push('wo.priority = ?');
    params.push(priority);
  }
  if (assigned_user_id) {
    conditions.push('wo.assigned_user_id = ?');
    params.push(assigned_user_id);
  }
  if (created_by) {
    conditions.push('wo.created_by = ?');
    params.push(created_by);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY wo.created_at DESC';

  const workOrders = db.prepare(sql).all(...params);
  res.json(workOrders);
});

router.get('/my', (req, res) => {
  const workOrders = db.prepare(`
    SELECT wo.*, 
           u1.name as assigned_user_name,
           u2.name as creator_name,
           c.name as checkpoint_name,
           b.name as building_name
    FROM work_orders wo
    LEFT JOIN users u1 ON wo.assigned_user_id = u1.id
    LEFT JOIN users u2 ON wo.created_by = u2.id
    LEFT JOIN patrol_records pr ON wo.patrol_record_id = pr.id
    LEFT JOIN checkpoints c ON pr.checkpoint_id = c.id
    LEFT JOIN buildings b ON c.building_id = b.id
    WHERE wo.assigned_user_id = ?
    ORDER BY wo.created_at DESC
  `).all(req.user.id);

  res.json(workOrders);
});

router.get('/:id', (req, res) => {
  const workOrder = db.prepare(`
    SELECT wo.*, 
           u1.name as assigned_user_name,
           u2.name as creator_name,
           c.name as checkpoint_name,
           b.name as building_name,
           pr.id as patrol_record_id
    FROM work_orders wo
    LEFT JOIN users u1 ON wo.assigned_user_id = u1.id
    LEFT JOIN users u2 ON wo.created_by = u2.id
    LEFT JOIN patrol_records pr ON wo.patrol_record_id = pr.id
    LEFT JOIN checkpoints c ON pr.checkpoint_id = c.id
    LEFT JOIN buildings b ON c.building_id = b.id
    WHERE wo.id = ?
  `).get(req.params.id);

  if (!workOrder) {
    return res.status(404).json({ error: '工单不存在' });
  }

  workOrder.logs = db.prepare(`
    SELECT wol.*, u.name as user_name
    FROM work_order_logs wol
    LEFT JOIN users u ON wol.user_id = u.id
    WHERE wol.work_order_id = ?
    ORDER BY wol.created_at
  `).all(req.params.id);

  res.json(workOrder);
});

router.post('/', (req, res) => {
  const { patrol_record_id, title, description, type, priority, assigned_user_id, due_time } = req.body;

  if (!title || !type) {
    return res.status(400).json({ error: '标题和类型不能为空' });
  }

  const result = db.prepare(`
    INSERT INTO work_orders (patrol_record_id, title, description, type, priority, assigned_user_id, created_by, due_time, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    patrol_record_id || null,
    title,
    description || '',
    type,
    priority || 'normal',
    assigned_user_id || null,
    req.user.id,
    due_time || null,
    assigned_user_id ? 'assigned' : 'pending'
  );

  const workOrderId = result.lastInsertRowid;

  db.prepare(`
    INSERT INTO work_order_logs (work_order_id, user_id, action, comment)
    VALUES (?, ?, ?, ?)
  `).run(workOrderId, req.user.id, 'create', '创建工单');

  const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(workOrderId);
  res.status(201).json(workOrder);
});

router.put('/:id', (req, res) => {
  const { title, description, type, priority, assigned_user_id, status, due_time } = req.body;

  const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
  if (!workOrder) {
    return res.status(404).json({ error: '工单不存在' });
  }

  const oldStatus = workOrder.status;
  const oldAssignee = workOrder.assigned_user_id;

  db.prepare(`
    UPDATE work_orders 
    SET title = ?, description = ?, type = ?, priority = ?, assigned_user_id = ?, status = ?, due_time = ?
    WHERE id = ?
  `).run(
    title || workOrder.title,
    description !== undefined ? description : workOrder.description,
    type || workOrder.type,
    priority || workOrder.priority,
    assigned_user_id !== undefined ? assigned_user_id : workOrder.assigned_user_id,
    status || workOrder.status,
    due_time !== undefined ? due_time : workOrder.due_time,
    req.params.id
  );

  const logs = [];
  if (status && status !== oldStatus) {
    logs.push({ action: 'status_change', comment: `状态从 ${oldStatus} 变为 ${status}` });
  }
  if (assigned_user_id !== undefined && assigned_user_id !== oldAssignee) {
    logs.push({ action: 'reassign', comment: '重新分配处理人' });
  }

  const insertLog = db.prepare(`
    INSERT INTO work_order_logs (work_order_id, user_id, action, comment)
    VALUES (?, ?, ?, ?)
  `);
  logs.forEach(log => {
    insertLog.run(req.params.id, req.user.id, log.action, log.comment);
  });

  const updated = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/process', (req, res) => {
  const { status, comment } = req.body;

  const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
  if (!workOrder) {
    return res.status(404).json({ error: '工单不存在' });
  }

  let newStatus = status;
  let action = 'update';

  if (workOrder.status === 'pending' && status === 'assigned') {
    action = 'assign';
  } else if (workOrder.status === 'assigned' && status === 'processing') {
    action = 'start';
  } else if (workOrder.status === 'processing' && status === 'completed') {
    action = 'complete';
    db.prepare('UPDATE work_orders SET completed_time = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  } else if (workOrder.status === 'completed' && status === 'verified') {
    action = 'verify';
    db.prepare('UPDATE work_orders SET verified_time = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  } else if (status === 'closed') {
    action = 'close';
  }

  db.prepare('UPDATE work_orders SET status = ? WHERE id = ?').run(newStatus, req.params.id);

  db.prepare(`
    INSERT INTO work_order_logs (work_order_id, user_id, action, comment)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.user.id, action, comment || '');

  const updated = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
