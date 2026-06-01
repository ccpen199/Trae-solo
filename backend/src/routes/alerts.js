const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { createAuditLog } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, level, type } = req.query;
  
  let query = `
    SELECT a.*, app.name as app_name, u.name as responsible_name, uc.name as closer_name
    FROM alerts a
    LEFT JOIN applications app ON a.app_id = app.id
    LEFT JOIN users u ON a.responsible_id = u.id
    LEFT JOIN users uc ON a.closed_by = uc.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  if (level) {
    query += ' AND a.level = ?';
    params.push(level);
  }
  if (type) {
    query += ' AND a.type = ?';
    params.push(type);
  }

  query += ' ORDER BY a.created_at DESC';

  const alerts = db.prepare(query).all(...params);
  res.json(alerts);
});

router.get('/:id', (req, res) => {
  const alert = db.prepare(`
    SELECT a.*, app.name as app_name, u.name as responsible_name
    FROM alerts a
    LEFT JOIN applications app ON a.app_id = app.id
    LEFT JOIN users u ON a.responsible_id = u.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }

  res.json(alert);
});

router.post('/', (req, res) => {
  const { type, level, title, message, task_id, app_id, responsible_id, suggested_action } = req.body;
  const user = req.user;

  const id = uuidv4();
  db.prepare(`
    INSERT INTO alerts (id, type, level, title, message, task_id, app_id, responsible_id, suggested_action)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, type, level, title, message, task_id || null, app_id || null, responsible_id || null, suggested_action || '');

  createAuditLog(user.id, user.name, 'create_alert', 'alert', id, { title, level }, req.ip);

  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  res.status(201).json(alert);
});

router.post('/:id/close', (req, res) => {
  const alertId = req.params.id;
  const user = req.user;
  const { close_reason } = req.body;

  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }

  db.prepare(`
    UPDATE alerts 
    SET status = 'closed', closed_by = ?, closed_at = CURRENT_TIMESTAMP, close_reason = ?
    WHERE id = ?
  `).run(user.id, close_reason || '', alertId);

  createAuditLog(user.id, user.name, 'close_alert', 'alert', alertId, { close_reason }, req.ip);

  res.json({ message: '告警已关闭' });
});

module.exports = router;
