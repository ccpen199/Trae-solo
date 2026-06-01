const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireRole('manager'), (req, res) => {
  const { page = 1, pageSize = 50, module, action, userId } = req.query;
  
  let query = `
    SELECT a.*, u.name as user_name
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (module) {
    query += ' AND a.module = ?';
    params.push(module);
  }
  if (action) {
    query += ' AND a.action = ?';
    params.push(action);
  }
  if (userId) {
    query += ' AND a.user_id = ?';
    params.push(userId);
  }

  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const logs = db.prepare(query).all(...params);

  const countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
  const total = db.prepare(countQuery).get();

  res.json({ logs, total: total.total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/stats', authenticateToken, requireRole('manager'), (req, res) => {
  const stats = db.prepare(`
    SELECT 
      module,
      COUNT(*) as count
    FROM audit_logs
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY module
    ORDER BY count DESC
  `).all();

  const userStats = db.prepare(`
    SELECT 
      u.name,
      COUNT(*) as count
    FROM audit_logs a
    JOIN users u ON a.user_id = u.id
    WHERE a.created_at >= datetime('now', '-30 days')
    GROUP BY a.user_id
    ORDER BY count DESC
    LIMIT 10
  `).all();

  res.json({ moduleStats: stats, userStats });
});

module.exports = router;
