const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { ROLES } = require('../engines/permissionRuleEngine');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: '只有管理员可以查看审计日志' });
  }

  const { user_id, action, resource_type, start_date, end_date, page = 1, page_size = 20 } = req.query;

  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
  const params = [];

  if (user_id) {
    query += ' AND user_id = ?';
    params.push(parseInt(user_id));
  }

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }

  if (resource_type) {
    query += ' AND resource_type = ?';
    params.push(resource_type);
  }

  if (start_date) {
    query += ' AND DATE(created_at) >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND DATE(created_at) <= ?';
    params.push(end_date);
  }

  const totalResult = db.prepare(countQuery + (params.length > 0 ? ' AND ' + query.split('WHERE 1=1')[1] : '')).get(...params);
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const logs = db.prepare(query).all(...params, parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  res.json({
    logs,
    total: totalResult.total,
    page: parseInt(page),
    page_size: parseInt(page_size)
  });
});

router.get('/actions', authenticateToken, (req, res) => {
  const actions = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action').all();
  res.json({ actions: actions.map(a => a.action) });
});

router.get('/resource-types', authenticateToken, (req, res) => {
  const types = db.prepare('SELECT DISTINCT resource_type FROM audit_logs ORDER BY resource_type').all();
  res.json({ resourceTypes: types.map(t => t.resource_type) });
});

router.get('/document/:id', authenticateToken, (req, res) => {
  const docId = parseInt(req.params.id);
  
  if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.KNOWLEDGE_MANAGER) {
    return res.status(403).json({ error: '权限不足' });
  }

  const logs = db.prepare(`
    SELECT * FROM audit_logs 
    WHERE resource_type = 'document' AND resource_id = ?
    ORDER BY created_at DESC
  `).all(docId);

  res.json({ logs });
});

module.exports = router;
