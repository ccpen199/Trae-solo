const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/call', (req, res) => {
  const { app_id, env_id, endpoint, method, response_code, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT cl.*, app.name as app_name, env.name as env_name
    FROM call_logs cl
    LEFT JOIN applications app ON cl.app_id = app.id
    LEFT JOIN environments env ON cl.env_id = env.id
    WHERE 1=1
  `;
  const params = [];
  
  if (app_id) {
    query += ' AND cl.app_id = ?';
    params.push(app_id);
  }
  if (env_id) {
    query += ' AND cl.env_id = ?';
    params.push(env_id);
  }
  if (endpoint) {
    query += ' AND cl.endpoint LIKE ?';
    params.push('%' + endpoint + '%');
  }
  if (method) {
    query += ' AND cl.method = ?';
    params.push(method);
  }
  if (response_code) {
    query += ' AND cl.response_code = ?';
    params.push(response_code);
  }
  
  query += ' ORDER BY cl.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const logs = db.prepare(query).all(...params);
  
  const countQuery = 'SELECT COUNT(*) as total FROM call_logs WHERE 1=1';
  const total = db.prepare(countQuery).get().total;
  
  res.json({
    list: logs,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/call/timeline', (req, res) => {
  const { app_id, hours = 24 } = req.query;
  
  const data = db.prepare(`
    SELECT 
      strftime('%Y-%m-%d %H:00:00', created_at) as time_point,
      COUNT(*) as count,
      SUM(CASE WHEN response_code >= 400 THEN 1 ELSE 0 END) as error_count
    FROM call_logs
    WHERE created_at >= datetime('now', ?)
    AND (app_id = ? OR ? IS NULL)
    GROUP BY time_point
    ORDER BY time_point
  `).all('-' + hours + ' hours', app_id || null, app_id || null);
  
  res.json(data);
});

router.get('/audit', (req, res) => {
  const { user_id, action, resource_type, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT al.*, u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (user_id) {
    query += ' AND al.user_id = ?';
    params.push(user_id);
  }
  if (action) {
    query += ' AND al.action = ?';
    params.push(action);
  }
  if (resource_type) {
    query += ' AND al.resource_type = ?';
    params.push(resource_type);
  }
  
  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const logs = db.prepare(query).all(...params);
  
  const countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
  const total = db.prepare(countQuery).get().total;
  
  res.json({
    list: logs,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

module.exports = router;
