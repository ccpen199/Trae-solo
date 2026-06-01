const express = require('express');
const { db } = require('../models/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const { user_id, resource_type, action, start_date, end_date, page = 1, page_size = 50 } = req.query;
  let query = `
    SELECT al.*, u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (user_id) { query += ' AND al.user_id = ?'; params.push(user_id); }
  if (resource_type) { query += ' AND al.resource_type = ?'; params.push(resource_type); }
  if (action) { query += ' AND al.action = ?'; params.push(action); }
  if (start_date) { query += ' AND al.created_at >= ?'; params.push(start_date); }
  if (end_date) { query += ' AND al.created_at <= ?'; params.push(end_date); }

  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const logs = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs WHERE 1=1').get().count;

  res.json({ data: logs, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/resource/:resource_type/:resource_id', (req, res) => {
  const logs = db.prepare(`
    SELECT al.*, u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.resource_type = ? AND al.resource_id = ?
    ORDER BY al.created_at ASC
  `).all(req.params.resource_type, req.params.resource_id);

  res.json({ data: logs });
});

module.exports = router;
