const express = require('express');
const db = require('../database');
const { roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', roleMiddleware('admin', 'security', 'owner'), (req, res) => {
  const { user_id, resource_type, action, start_date, end_date } = req.query;
  
  let query = `SELECT * FROM audit_logs WHERE 1=1`;
  const params = [];

  if (user_id) {
    query += ' AND user_id = ?';
    params.push(user_id);
  }
  if (resource_type) {
    query += ' AND resource_type = ?';
    params.push(resource_type);
  }
  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }
  if (start_date) {
    query += ' AND created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND created_at <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY created_at DESC LIMIT 200';

  const logs = db.prepare(query).all(...params);
  res.json(logs);
});

module.exports = router;
