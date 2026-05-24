const express = require('express');
const db = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireRole('admin', 'operator'), (req, res) => {
  const { user_id, action, target_type, page = 1, pageSize = 50 } = req.query;
  let sql = `
    SELECT ol.*, u.nickname as user_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (user_id) {
    sql += ' AND ol.user_id = ?';
    params.push(user_id);
  }
  if (action) {
    sql += ' AND ol.action LIKE ?';
    params.push(`%${action}%`);
  }
  if (target_type) {
    sql += ' AND ol.target_type = ?';
    params.push(target_type);
  }
  
  sql += ' ORDER BY ol.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (page - 1) * pageSize);
  
  const logs = db.prepare(sql).all(...params);
  res.json(logs);
});

router.get('/actions', authenticate, requireRole('admin'), (req, res) => {
  const actions = db.prepare(`
    SELECT DISTINCT action FROM operation_logs ORDER BY action
  `).all().map(a => a.action);
  res.json(actions);
});

module.exports = router;
