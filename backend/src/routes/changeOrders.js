const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateToken, auditLog } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const { status, app_id, creator_id, change_type, start_date, end_date, page = 1, pageSize = 20 } = req.query;
  
  let query = `
    SELECT co.*, a.app_name, u.name as creator_name, w.workflow_name
    FROM change_orders co
    LEFT JOIN applications a ON co.app_id = a.id
    LEFT JOIN users u ON co.creator_id = u.id
    LEFT JOIN approval_workflows w ON co.workflow_id = w.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND co.status = ?';
    params.push(status);
  }
  if (app_id) {
    query += ' AND co.app_id = ?';
    params.push(app_id);
  }
  if (creator_id) {
    query += ' AND co.creator_id = ?';
    params.push(creator_id);
  }
  if (change_type) {
    query += ' AND co.change_type = ?';
    params.push(change_type);
  }
  if (start_date) {
    query += ' AND co.created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND co.created_at <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY co.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const orders = db.prepare(query).all(...params);
  
  const countQuery = 'SELECT COUNT(*) as total FROM change_orders WHERE 1=1';
  const { total } = db.prepare(countQuery).get();

  res.json({
    list: orders,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT co.*, a.app_name, u.name as creator_name, w.workflow_name
    FROM change_orders co
    LEFT JOIN applications a ON co.app_id = a.id
    LEFT JOIN users u ON co.creator_id = u.id
    LEFT JOIN approval_workflows w ON co.workflow_id = w.id
    WHERE co.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  const approvalRecords = db.prepare(`
    SELECT ar.*, u.name as approver_name, an.node_name
    FROM approval_records ar
    LEFT JOIN users u ON ar.approver_id = u.id
    LEFT JOIN approval_nodes an ON ar.node_id = an.id
    WHERE ar.order_id = ?
    ORDER BY ar.created_at ASC
  `).all(req.params.id);

  const nodes = db.prepare(`
    SELECT an.*, u.name as approver_name
    FROM approval_nodes an
    LEFT JOIN users u ON an.approver_id = u.id
    WHERE an.workflow_id = ?
    ORDER BY an.node_order ASC
  `).all(order.workflow_id);

  res.json({
    ...order,
    approval_records: approvalRecords,
    nodes
  });
});

router.post('/', (req, res) => {
  const { app_id, workflow_id, change_type, title, description, config_data } = req.body;
  
  if (!app_id || !change_type || !title) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const order_no = 'CO-' + Date.now() + '-' + uuidv4().substring(0, 4).toUpperCase();

  let actualWorkflowId = workflow_id;
  let firstNodeId = null;

  if (!actualWorkflowId) {
    const workflowResult = db.prepare(`
      INSERT INTO approval_workflows (app_id, workflow_name, workflow_type, created_by)
      VALUES (?, ?, ?, ?)
    `).run(app_id, title + '-审批流程', change_type, req.user.id);
    actualWorkflowId = workflowResult.lastInsertRowid;

    const nodes = [
      { node_name: '应用负责人审批', node_order: 1, approver_role: 'owner' },
      { node_name: '安全管理员审批', node_order: 2, approver_role: 'security' },
      { node_name: '运维执行', node_order: 3, approver_role: 'operator', node_type: 'execute' }
    ];

    nodes.forEach((node, index) => {
      const nodeResult = db.prepare(`
        INSERT INTO approval_nodes (workflow_id, node_name, node_order, approver_role, node_type)
        VALUES (?, ?, ?, ?, ?)
      `).run(actualWorkflowId, node.node_name, node.node_order, node.approver_role, node.node_type || 'approval');
      
      if (index === 0) {
        firstNodeId = nodeResult.lastInsertRowid;
      }
    });
  } else {
    firstNodeId = db.prepare(`
      SELECT id FROM approval_nodes WHERE workflow_id = ? ORDER BY node_order ASC LIMIT 1
    `).get()?.id;
  }

  const stmt = db.prepare(`
    INSERT INTO change_orders (order_no, app_id, workflow_id, change_type, title, description, config_data, status, current_node_id, creator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `);
  
  const result = stmt.run(order_no, app_id, actualWorkflowId, change_type, title, description, JSON.stringify(config_data || {}), firstNodeId, req.user.id);
  const orderId = result.lastInsertRowid;

  auditLog(req, 'create', 'change_order', orderId, null, { order_no, title });

  res.json({
    id: orderId,
    order_no,
    status: 'pending'
  });
});

router.post('/:id/submit', (req, res) => {
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  if (order.status !== 'draft' && order.status !== 'pending') {
    return res.status(400).json({ error: '当前状态不允许提交' });
  }

  const firstNode = db.prepare(`
    SELECT * FROM approval_nodes WHERE workflow_id = ? ORDER BY node_order ASC LIMIT 1
  `).get(order.workflow_id);

  if (!firstNode) {
    return res.status(400).json({ error: '审批流程未配置节点' });
  }

  db.prepare(`
    UPDATE change_orders SET status = 'approving', current_node_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(firstNode.id, req.params.id);

  auditLog(req, 'submit', 'change_order', req.params.id, order, { status: 'approving' });

  res.json({ message: '提交成功' });
});

router.post('/:id/approve', (req, res) => {
  const { comment, attachments } = req.body;
  
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  if (order.status !== 'approving') {
    return res.status(400).json({ error: '当前状态不允许审批' });
  }

  const currentNode = db.prepare('SELECT * FROM approval_nodes WHERE id = ?').get(order.current_node_id);
  if (!currentNode) {
    return res.status(400).json({ error: '审批节点不存在' });
  }

  if (currentNode.approver_role && currentNode.approver_role !== req.user.role) {
    return res.status(403).json({ error: '您没有权限审批此节点' });
  }

  db.prepare(`
    INSERT INTO approval_records (order_id, node_id, approver_id, action, comment, attachments)
    VALUES (?, ?, ?, 'approve', ?, ?)
  `).run(req.params.id, currentNode.id, req.user.id, comment, JSON.stringify(attachments || []));

  const nextNode = db.prepare(`
    SELECT * FROM approval_nodes 
    WHERE workflow_id = ? AND node_order > ? 
    ORDER BY node_order ASC LIMIT 1
  `).get(order.workflow_id, currentNode.node_order);

  if (nextNode) {
    db.prepare(`
      UPDATE change_orders SET current_node_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(nextNode.id, req.params.id);

    if (nextNode.node_type === 'execute') {
      db.prepare(`
        UPDATE change_orders SET status = 'executing', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(req.params.id);
    }
  } else {
    db.prepare(`
      UPDATE change_orders SET status = 'completed', current_node_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);
  }

  auditLog(req, 'approve', 'change_order', req.params.id, order, { action: 'approve' });

  res.json({ message: '审批通过' });
});

router.post('/:id/reject', (req, res) => {
  const { comment } = req.body;
  
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  if (order.status !== 'approving') {
    return res.status(400).json({ error: '当前状态不允许审批' });
  }

  const currentNode = db.prepare('SELECT * FROM approval_nodes WHERE id = ?').get(order.current_node_id);

  db.prepare(`
    INSERT INTO approval_records (order_id, node_id, approver_id, action, comment)
    VALUES (?, ?, ?, 'reject', ?)
  `).run(req.params.id, currentNode.id, req.user.id, comment);

  db.prepare(`
    UPDATE change_orders SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);

  auditLog(req, 'reject', 'change_order', req.params.id, order, { action: 'reject' });

  res.json({ message: '已驳回' });
});

module.exports = router;
