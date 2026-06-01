const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { createAuditLog } = require('../utils/audit');
const { checkPermission } = require('../middleware/auth');

router.get('/', checkPermission('alert:read'), (req, res) => {
  const { status, level, type, assignee_id, page = 1, page_size = 20 } = req.query;
  
  let query = `
    SELECT a.*, app.name as app_name, env.name as env_name, 
           u.real_name as assignee_name, c.real_name as closer_name
    FROM alerts a
    LEFT JOIN applications app ON a.app_id = app.id
    LEFT JOIN environments env ON a.env_id = env.id
    LEFT JOIN users u ON a.assignee_id = u.id
    LEFT JOIN users c ON a.closed_by = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) { query += ' AND a.status = ?'; params.push(status); }
  if (level) { query += ' AND a.level = ?'; params.push(level); }
  if (type) { query += ' AND a.type = ?'; params.push(type); }
  if (assignee_id) { query += ' AND a.assignee_id = ?'; params.push(assignee_id); }
  
  const total = db.prepare(query.replace('SELECT a.*', 'SELECT COUNT(*) as count')).get(...params).count;
  
  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
  
  const alerts = db.prepare(query).all(...params);
  
  res.json({ data: alerts, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.post('/:id/assign', checkPermission('alert:write'), (req, res) => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }
  
  try {
    db.prepare(`
      UPDATE alerts
      SET assignee_id = ?
      WHERE id = ?
    `).run(req.body.assignee_id, req.params.id);
    
    createAuditLog(req.user.id, 'assign', 'alert', req.params.id, alert, { ...alert, assignee_id: req.body.assignee_id }, req.ip, req.get('User-Agent'));
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/close', checkPermission('alert:write'), (req, res) => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }
  
  if (!req.body.close_reason) {
    return res.status(400).json({ error: '关闭原因不能为空' });
  }
  
  try {
    db.prepare(`
      UPDATE alerts
      SET status = 'closed', close_reason = ?, closed_by = ?, closed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.body.close_reason, req.user.id, req.params.id);
    
    createAuditLog(req.user.id, 'close', 'alert', req.params.id, alert, { ...alert, status: 'closed' }, req.ip, req.get('User-Agent'));
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
