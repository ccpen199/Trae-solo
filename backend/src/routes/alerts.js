const express = require('express');
const { db } = require('../models/database');
const { authMiddleware, createAuditLog } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const { app_id, type, severity, status, responsible_user_id, page = 1, page_size = 20 } = req.query;
  let query = `
    SELECT a.*, app.name as app_name, t.name as task_name, 
           u.name as responsible_user_name,
           ack.name as acknowledged_by_name,
           res.name as resolved_by_name
    FROM alerts a
    LEFT JOIN applications app ON a.app_id = app.id
    LEFT JOIN stress_tasks t ON a.task_id = t.id
    LEFT JOIN users u ON a.responsible_user_id = u.id
    LEFT JOIN users ack ON a.acknowledged_by = ack.id
    LEFT JOIN users res ON a.resolved_by = res.id
    WHERE 1=1
  `;
  const params = [];

  if (app_id) { query += ' AND a.app_id = ?'; params.push(app_id); }
  if (type) { query += ' AND a.type = ?'; params.push(type); }
  if (severity) { query += ' AND a.severity = ?'; params.push(severity); }
  if (status) { query += ' AND a.status = ?'; params.push(status); }
  if (responsible_user_id) { query += ' AND a.responsible_user_id = ?'; params.push(responsible_user_id); }

  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const alerts = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE 1=1').get().count;

  const stats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM alerts 
    GROUP BY status
  `).all();

  res.json({ data: alerts, total, page: parseInt(page), page_size: parseInt(page_size), stats });
});

router.get('/:id', (req, res) => {
  const alert = db.prepare(`
    SELECT a.*, app.name as app_name, t.name as task_name, 
           u.name as responsible_user_name,
           ack.name as acknowledged_by_name,
           res.name as resolved_by_name
    FROM alerts a
    LEFT JOIN applications app ON a.app_id = app.id
    LEFT JOIN stress_tasks t ON a.task_id = t.id
    LEFT JOIN users u ON a.responsible_user_id = u.id
    LEFT JOIN users ack ON a.acknowledged_by = ack.id
    LEFT JOIN users res ON a.resolved_by = res.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }

  res.json(alert);
});

router.post('/:id/acknowledge', (req, res) => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }

  if (alert.status !== 'open') {
    return res.status(400).json({ error: '只有未处理的告警可以确认' });
  }

  db.prepare(`
    UPDATE alerts 
    SET status = ?, acknowledged_by = ?, acknowledged_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run('acknowledged', req.user.id, req.params.id);

  createAuditLog(req.user.id, 'acknowledge', 'alert', alert.alert_id, JSON.stringify({ status: 'open' }), JSON.stringify({ status: 'acknowledged' }), '确认告警');

  res.json({ message: '告警已确认' });
});

router.post('/:id/resolve', (req, res) => {
  const { closure_basis } = req.body;
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }

  if (!['open', 'acknowledged'].includes(alert.status)) {
    return res.status(400).json({ error: '该状态的告警无法解决' });
  }

  db.prepare(`
    UPDATE alerts 
    SET status = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, closure_basis = ?
    WHERE id = ?
  `).run('resolved', req.user.id, closure_basis || '已解决', req.params.id);

  createAuditLog(req.user.id, 'resolve', 'alert', alert.alert_id, JSON.stringify({ status: alert.status }), JSON.stringify({ status: 'resolved' }), closure_basis || '解决告警');

  res.json({ message: '告警已解决' });
});

router.post('/:id/close', (req, res) => {
  const { closure_basis } = req.body;
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }

  db.prepare(`
    UPDATE alerts 
    SET status = ?, closure_basis = ?
    WHERE id = ?
  `).run('closed', closure_basis || '已关闭', req.params.id);

  createAuditLog(req.user.id, 'close', 'alert', alert.alert_id, JSON.stringify({ status: alert.status }), JSON.stringify({ status: 'closed' }), closure_basis || '关闭告警');

  res.json({ message: '告警已关闭' });
});

router.get('/workbench/summary', (req, res) => {
  const openAlerts = db.prepare(`
    SELECT a.*, app.name as app_name, u.name as responsible_user_name
    FROM alerts a
    LEFT JOIN applications app ON a.app_id = app.id
    LEFT JOIN users u ON a.responsible_user_id = u.id
    WHERE a.status IN ('open', 'acknowledged')
    ORDER BY 
      CASE a.severity 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        ELSE 4 
      END,
      a.created_at DESC
    LIMIT 20
  `).all();

  const stats = db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
      SUM(CASE WHEN status = 'acknowledged' THEN 1 ELSE 0 END) as acknowledged_count,
      SUM(CASE WHEN severity = 'critical' AND status IN ('open', 'acknowledged') THEN 1 ELSE 0 END) as critical_count,
      SUM(CASE WHEN severity = 'high' AND status IN ('open', 'acknowledged') THEN 1 ELSE 0 END) as high_count
    FROM alerts
  `).get();

  const recentTasks = db.prepare(`
    SELECT t.*, a.name as app_name, e.name as env_name, u.name as creator_name
    FROM stress_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN users u ON t.created_by = u.id
    ORDER BY t.created_at DESC
    LIMIT 10
  `).all();

  const recentOrders = db.prepare(`
    SELECT co.*, a.name as app_name, u.name as requester_name
    FROM change_orders co
    LEFT JOIN applications a ON co.app_id = a.id
    LEFT JOIN users u ON co.requested_by = u.id
    ORDER BY co.created_at DESC
    LIMIT 10
  `).all();

  res.json({
    open_alerts: openAlerts,
    stats,
    recent_tasks: recentTasks,
    recent_orders: recentOrders
  });
});

module.exports = router;
