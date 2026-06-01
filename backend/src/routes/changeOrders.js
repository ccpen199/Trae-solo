const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog } = require('../utils/audit');
const { checkPermission } = require('../middleware/auth');

router.get('/', checkPermission('change:read'), (req, res) => {
  const { status, type, app_id, page = 1, page_size = 20 } = req.query;
  
  let query = `
    SELECT c.*, a.name as app_name, u.real_name as creator_name, ap.real_name as approver_name
    FROM change_orders c
    LEFT JOIN applications a ON c.app_id = a.id
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN users ap ON c.approved_by = ap.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) { query += ' AND c.status = ?'; params.push(status); }
  if (type) { query += ' AND c.type = ?'; params.push(type); }
  if (app_id) { query += ' AND c.app_id = ?'; params.push(app_id); }
  
  const total = db.prepare(query.replace('SELECT c.*', 'SELECT COUNT(*) as count')).get(...params).count;
  
  query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
  
  const orders = db.prepare(query).all(...params);
  
  res.json({ data: orders, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/:id', checkPermission('change:read'), (req, res) => {
  const order = db.prepare(`
    SELECT c.*, a.name as app_name, e.name as env_name, u.real_name as creator_name, ap.real_name as approver_name
    FROM change_orders c
    LEFT JOIN applications a ON c.app_id = a.id
    LEFT JOIN environments e ON c.env_id = e.id
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN users ap ON c.approved_by = ap.id
    WHERE c.id = ?
  `).get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }
  
  const tasks = db.prepare(`
    SELECT t.*, u.real_name as executor_name
    FROM execution_tasks t
    LEFT JOIN users u ON t.executed_by = u.id
    WHERE t.change_order_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.id);
  
  res.json({ ...order, tasks });
});

router.post('/', checkPermission('change:write'), (req, res) => {
  const { type, title, description, app_id, env_id, reason, impact, recovery_path } = req.body;
  
  if (!type || !title || !reason) {
    return res.status(400).json({ error: '类型、标题和变更原因不能为空' });
  }
  
  const changeNo = `CO${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  
  try {
    const result = db.prepare(`
      INSERT INTO change_orders (change_no, type, title, description, app_id, env_id, reason, impact, recovery_path, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(changeNo, type, title, description || '', app_id || null, env_id || null, reason, impact || '', recovery_path || '', req.user.id);
    
    createAuditLog(req.user.id, 'create', 'change_order', result.lastInsertRowid, null, req.body, req.ip, req.get('User-Agent'));
    
    res.status(201).json({ id: result.lastInsertRowid, change_no: changeNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/approve', checkPermission('change:approve'), (req, res) => {
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }
  
  try {
    db.prepare(`
      UPDATE change_orders
      SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, req.params.id);
    
    createAuditLog(req.user.id, 'approve', 'change_order', req.params.id, order, { ...order, status: 'approved' }, req.ip, req.get('User-Agent'));
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/execute', checkPermission('change:execute'), (req, res) => {
  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }
  if (order.status !== 'approved') {
    return res.status(400).json({ error: '变更单未批准，无法执行' });
  }
  
  try {
    db.prepare(`
      UPDATE change_orders
      SET status = 'executed', executed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
    
    createAuditLog(req.user.id, 'execute', 'change_order', req.params.id, order, { ...order, status: 'executed' }, req.ip, req.get('User-Agent'));
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
