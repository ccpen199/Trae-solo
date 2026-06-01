const express = require('express');
const db = require('../database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', roleMiddleware(['admin', 'manager', 'auditor']), (req, res) => {
  const { page = 1, pageSize = 20, module, operation, userId, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (module) {
    whereClause += ' AND module = ?';
    params.push(module);
  }
  
  if (operation) {
    whereClause += ' AND operation = ?';
    params.push(operation);
  }
  
  if (userId) {
    whereClause += ' AND user_id = ?';
    params.push(userId);
  }
  
  if (status !== undefined) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  
  const logs = db.prepare(`
    SELECT ol.*, u.name as user_name, u.username
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    ${whereClause}
    ORDER BY ol.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM operation_logs ol ${whereClause}`).get(...params).count;
  
  res.json({ list: logs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/modules', (req, res) => {
  const modules = db.prepare(`
    SELECT DISTINCT module FROM operation_logs ORDER BY module
  `).all().map(row => row.module);
  
  const operations = db.prepare(`
    SELECT DISTINCT operation FROM operation_logs ORDER BY operation
  `).all().map(row => row.operation);
  
  res.json({ modules, operations });
});

module.exports = router;
