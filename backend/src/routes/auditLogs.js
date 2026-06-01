const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireRole(['admin', 'auditor']), (req, res) => {
  const { entity_type, action_type, operator_id, start_date, end_date, page = 1, limit = 50 } = req.query;
  
  let query = `
    SELECT al.*
    FROM audit_logs al
    WHERE 1=1
  `;
  const params = [];

  if (entity_type) {
    query += ' AND al.entity_type = ?';
    params.push(entity_type);
  }
  if (action_type) {
    query += ' AND al.action_type = ?';
    params.push(action_type);
  }
  if (operator_id) {
    query += ' AND al.operator_id = ?';
    params.push(operator_id);
  }
  if (start_date) {
    query += ' AND al.created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND al.created_at <= ?';
    params.push(end_date);
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` ORDER BY al.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

  const logs = db.prepare(query).all(...params);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;

  res.json({
    data: logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }
  });
});

router.get('/:id', authenticateToken, requireRole(['admin', 'auditor']), (req, res) => {
  const log = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(req.params.id);
  
  if (!log) {
    return res.status(404).json({ error: '审计日志不存在' });
  }
  
  res.json(log);
});

module.exports = router;
