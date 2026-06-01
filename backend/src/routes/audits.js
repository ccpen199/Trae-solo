const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const router = express.Router();

router.get('/logs', (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT 200
  `).all();
  res.json(logs);
});

router.get('/logs/export', (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM operation_logs ORDER BY created_at DESC
  `).all();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="operation-logs.json"');
  res.json(logs);
});

router.get('/alerts', (req, res) => {
  const alerts = db.prepare(`
    SELECT a.*, app.name as app_name
    FROM alerts a
    LEFT JOIN applications app ON a.app_id = app.id
    ORDER BY a.created_at DESC
  `).all();
  res.json(alerts);
});

router.post('/alerts/:id/resolve', (req, res) => {
  const { resolution } = req.body;
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) return res.status(404).json({ error: '告警不存在' });

  db.prepare(`
    UPDATE alerts 
    SET status = 'resolved', resolution = ?, resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(resolution || '已处理', req.params.id);

  db.prepare(`
    INSERT INTO operation_logs (id, user_id, action, resource_type, resource_id, details)
    VALUES (?, ?, 'resolve', 'alert', ?, ?)
  `).run(uuidv4(), 'admin', req.params.id, JSON.stringify({ resolution }));

  const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.get('/permissions', (req, res) => {
  const perms = db.prepare(`
    SELECT p.*, a.name as app_name
    FROM permissions p
    LEFT JOIN applications a ON p.app_id = a.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(perms);
});

router.post('/permissions/check', (req, res) => {
  const { user_id, app_id, required_role } = req.body;
  
  const perm = db.prepare(`
    SELECT * FROM permissions 
    WHERE user_id = ? AND (app_id = ? OR app_id IS NULL)
    ORDER BY CASE WHEN app_id IS NULL THEN 1 ELSE 0 END
  `).get(user_id, app_id);

  const roleHierarchy = { 'viewer': 1, 'developer': 2, 'owner': 3, 'admin': 4 };
  const hasPermission = perm && (
    roleHierarchy[perm.role] >= (roleHierarchy[required_role] || 0)
  );

  db.prepare(`
    INSERT INTO operation_logs (id, user_id, action, resource_type, resource_id, details)
    VALUES (?, ?, 'permission_check', 'permission', ?, ?)
  `).run(uuidv4(), user_id, app_id || 'global', JSON.stringify({ required_role, hasPermission }));

  res.json({ hasPermission, user_role: perm?.role });
});

router.get('/executions', (req, res) => {
  const executions = db.prepare(`
    SELECT e.*, t.name as task_name, a.name as app_name
    FROM executions e
    LEFT JOIN tasks t ON e.task_id = t.id
    LEFT JOIN applications a ON t.app_id = a.id
    ORDER BY e.started_at DESC LIMIT 100
  `).all();
  res.json(executions);
});

router.get('/executions/:id/call-logs', (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM call_logs WHERE execution_id = ? ORDER BY created_at ASC
  `).all(req.params.id);
  res.json(logs);
});

router.get('/dashboard/stats', (req, res) => {
  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get();
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
  const executionCount = db.prepare('SELECT COUNT(*) as count FROM executions').get();
  const alertCount = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status = 'open'").get();
  
  const recentExecutions = db.prepare(`
    SELECT status, COUNT(*) as count FROM executions 
    WHERE started_at >= datetime('now', '-7 days')
    GROUP BY status
  `).all();

  const statusBreakdown = {};
  recentExecutions.forEach(e => {
    statusBreakdown[e.status] = e.count;
  });

  res.json({
    applications: appCount.count,
    tasks: taskCount.count,
    executions: executionCount.count,
    openAlerts: alertCount.count,
    recentStatusBreakdown: statusBreakdown
  });
});

module.exports = router;
