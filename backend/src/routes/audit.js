const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { permissionMiddleware } = require('../middleware/auth');
const validator = require('../utils/validator');

router.get('/logs', permissionMiddleware(['admin', 'security', 'devops']), (req, res) => {
  const { user_id, action, resource_type, start_time, end_time, limit = 100, offset = 0 } = req.query;
  let query = `
    SELECT al.*, u.name as user_name
    FROM audit_logs al
    JOIN users u ON al.user_id = u.id
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
  if (start_time) {
    query += ' AND al.created_at >= ?';
    params.push(start_time);
  }
  if (end_time) {
    query += ' AND al.created_at <= ?';
    params.push(end_time);
  }

  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const logs = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;

  res.json({ logs, total });
});

router.get('/exceptions', (req, res) => {
  const { task_id, handled, start_time, end_time, limit = 50, offset = 0 } = req.query;
  let query = `
    SELECT er.*, wc.name as config_name, a.name as app_name, u.name as handled_by_name
    FROM exception_records er
    JOIN call_logs cl ON er.log_id = cl.id
    JOIN webhook_configs wc ON cl.config_id = wc.id
    JOIN applications a ON wc.app_id = a.id
    LEFT JOIN users u ON er.handled_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (task_id) {
    query += ' AND er.task_id = ?';
    params.push(task_id);
  }
  if (handled !== undefined) {
    query += ' AND er.handled = ?';
    params.push(handled === 'true' ? 1 : 0);
  }
  if (start_time) {
    query += ' AND er.created_at >= ?';
    params.push(start_time);
  }
  if (end_time) {
    query += ' AND er.created_at <= ?';
    params.push(end_time);
  }

  query += ' ORDER BY er.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const exceptions = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM exception_records').get().count;

  res.json({ exceptions, total });
});

router.post('/exceptions/:id/handle', permissionMiddleware(['admin', 'devops', 'owner']), (req, res) => {
  const { compensation_action, manual_remark } = req.body;
  const exceptionId = req.params.id;
  const userId = req.user.id;

  const exception = db.prepare('SELECT * FROM exception_records WHERE id = ?').get(exceptionId);
  if (!exception) {
    return res.status(404).json({ error: '异常记录不存在' });
  }

  db.prepare(`
    UPDATE exception_records 
    SET handled = 1, handled_by = ?, handled_at = CURRENT_TIMESTAMP,
        compensation_action = ?, manual_remark = ?
    WHERE id = ?
  `).run(userId, compensation_action || '', manual_remark || '', exceptionId);

  db.prepare(`
    UPDATE alerts 
    SET status = 'resolved', acknowledged_by = ?, acknowledged_at = CURRENT_TIMESTAMP
    WHERE log_id = ?
  `).run(userId, exception.log_id);

  res.json({ success: true, message: '异常已处理' });
});

router.get('/alerts', (req, res) => {
  const { status, severity, start_time, end_time, limit = 50, offset = 0 } = req.query;
  let query = `
    SELECT a.*, wc.name as config_name, u.name as acknowledged_by_name
    FROM alerts a
    LEFT JOIN call_logs cl ON a.log_id = cl.id
    LEFT JOIN webhook_configs wc ON cl.config_id = wc.id
    LEFT JOIN users u ON a.acknowledged_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  if (severity) {
    query += ' AND a.severity = ?';
    params.push(severity);
  }
  if (start_time) {
    query += ' AND a.created_at >= ?';
    params.push(start_time);
  }
  if (end_time) {
    query += ' AND a.created_at <= ?';
    params.push(end_time);
  }

  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const alerts = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM alerts').get().count;

  res.json({ alerts, total });
});

router.post('/alerts/:id/acknowledge', permissionMiddleware(['admin', 'devops', 'owner']), (req, res) => {
  const alertId = req.params.id;
  const userId = req.user.id;

  db.prepare(`
    UPDATE alerts 
    SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(userId, alertId);

  res.json({ success: true, message: '告警已确认' });
});

module.exports = router;
