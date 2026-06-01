const express = require('express');
const router = express.Router();
const db = require('../models/database');

router.get('/summary', (req, res) => {
  const { start_time, end_time, app_id } = req.query;
  let timeFilter = '1=1';
  const params = [];

  if (start_time) {
    timeFilter += ' AND created_at >= ?';
    params.push(start_time);
  }
  if (end_time) {
    timeFilter += ' AND created_at <= ?';
    params.push(end_time);
  }

  const appFilter = app_id ? ' AND app_id = ?' : '';
  if (app_id) params.push(app_id);

  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications WHERE status = ?').get('active').count;
  const configCount = db.prepare('SELECT COUNT(*) as count FROM webhook_configs WHERE status = ?').get('active').count;
  
  const taskStats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM execution_tasks
    WHERE ${timeFilter}
    GROUP BY status
  `).all(...params.slice(0, 2));

  const logStats = db.prepare(`
    SELECT 
      success,
      COUNT(*) as count,
      AVG(duration) as avg_duration
    FROM call_logs
    WHERE ${timeFilter}
    GROUP BY success
  `).all(...params.slice(0, 2));

  const pendingChanges = db.prepare(`
    SELECT COUNT(*) as count FROM change_orders WHERE status = 'pending'
  `).get().count;

  const activeAlerts = db.prepare(`
    SELECT COUNT(*) as count FROM alerts WHERE status = 'active'
  `).get().count;

  const recentFailures = db.prepare(`
    SELECT cl.*, wc.name as config_name, a.name as app_name, et.created_by
    FROM call_logs cl
    JOIN webhook_configs wc ON cl.config_id = wc.id
    JOIN applications a ON wc.app_id = a.id
    JOIN execution_tasks et ON cl.task_id = et.id
    WHERE cl.success = 0
    ORDER BY cl.created_at DESC
    LIMIT 10
  `).all();

  res.json({
    apps: { total: appCount },
    configs: { total: configCount },
    tasks: taskStats,
    logs: logStats,
    pendingChanges,
    activeAlerts,
    recentFailures
  });
});

router.get('/trends', (req, res) => {
  const { start_time, end_time, group_by = 'day' } = req.query;
  
  let dateFormat = '%Y-%m-%d';
  if (group_by === 'hour') dateFormat = '%Y-%m-%d %H:00';
  if (group_by === 'week') dateFormat = '%Y-%W';

  const taskTrends = db.prepare(`
    SELECT 
      strftime(?, created_at) as period,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM execution_tasks
    WHERE created_at >= DATE('now', '-30 days')
    GROUP BY period
    ORDER BY period DESC
    LIMIT 30
  `).all(dateFormat);

  const successRateTrends = db.prepare(`
    SELECT 
      strftime(?, created_at) as period,
      COUNT(*) as total,
      SUM(success) as success_count,
      ROUND(SUM(success) * 100.0 / COUNT(*), 2) as success_rate
    FROM call_logs
    WHERE created_at >= DATE('now', '-30 days')
    GROUP BY period
    ORDER BY period DESC
    LIMIT 30
  `).all(dateFormat);

  res.json({ taskTrends, successRateTrends });
});

router.get('/export/tasks', (req, res) => {
  const { start_time, end_time, status, config_id } = req.query;
  let query = `
    SELECT 
      et.id, et.status, et.task_type, et.priority,
      wc.name as config_name, a.name as app_name, a.code as app_code,
      u.name as creator_name,
      et.created_at, et.started_at, et.completed_at,
      et.result
    FROM execution_tasks et
    JOIN webhook_configs wc ON et.config_id = wc.id
    JOIN applications a ON wc.app_id = a.id
    JOIN users u ON et.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (start_time) {
    query += ' AND et.created_at >= ?';
    params.push(start_time);
  }
  if (end_time) {
    query += ' AND et.created_at <= ?';
    params.push(end_time);
  }
  if (status) {
    query += ' AND et.status = ?';
    params.push(status);
  }
  if (config_id) {
    query += ' AND et.config_id = ?';
    params.push(config_id);
  }

  query += ' ORDER BY et.created_at DESC LIMIT 1000';
  
  const tasks = db.prepare(query).all(...params);
  res.json(tasks);
});

router.get('/top-failures', (req, res) => {
  const { limit = 10 } = req.query;
  
  const failures = db.prepare(`
    SELECT 
      wc.id as config_id,
      wc.name as config_name,
      a.name as app_name,
      COUNT(*) as failure_count,
      MAX(cl.created_at) as last_failure
    FROM call_logs cl
    JOIN webhook_configs wc ON cl.config_id = wc.id
    JOIN applications a ON wc.app_id = a.id
    WHERE cl.success = 0 AND cl.created_at >= DATE('now', '-7 days')
    GROUP BY wc.id
    ORDER BY failure_count DESC
    LIMIT ?
  `).all(parseInt(limit));

  res.json(failures);
});

module.exports = router;
