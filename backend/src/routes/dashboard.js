const express = require('express');
const router = express.Router();
const db = require('../models/database');

router.get('/stats', (req, res) => {
  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const envCount = db.prepare('SELECT COUNT(*) as count FROM environments').get().count;
  const secretCount = db.prepare('SELECT COUNT(*) as count FROM secrets WHERE status = ?').get('active').count;
  const alertCount = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE status = ?').get('open').count;
  const pendingChanges = db.prepare('SELECT COUNT(*) as count FROM change_orders WHERE status = ?').get('pending').count;
  const runningTasks = db.prepare('SELECT COUNT(*) as count FROM execution_tasks WHERE status = ?').get('running').count;
  
  res.json({
    data: {
      applications: appCount,
      environments: envCount,
      active_secrets: secretCount,
      open_alerts: alertCount,
      pending_changes: pendingChanges,
      running_tasks: runningTasks
    }
  });
});

router.get('/workbench', (req, res) => {
  const myAlerts = db.prepare(`
    SELECT a.*, app.name as app_name, u.real_name as assignee_name
    FROM alerts a
    LEFT JOIN applications app ON a.app_id = app.id
    LEFT JOIN users u ON a.assignee_id = u.id
    WHERE a.status = 'open'
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all();
  
  const pendingApprovals = db.prepare(`
    SELECT c.*, a.name as app_name, u.real_name as creator_name
    FROM change_orders c
    LEFT JOIN applications a ON c.app_id = a.id
    LEFT JOIN users u ON c.created_by = u.id
    WHERE c.status = 'pending'
    ORDER BY c.created_at DESC
    LIMIT 10
  `).all();
  
  const recentTasks = db.prepare(`
    SELECT t.*, a.name as app_name, u.real_name as executor_name
    FROM execution_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN users u ON t.executed_by = u.id
    ORDER BY t.created_at DESC
    LIMIT 10
  `).all();
  
  res.json({
    data: {
      my_alerts: myAlerts.map(a => ({
        ...a,
        assignee: a.assignee_name || '未分配',
        suggested_action: a.suggested_action || '请查看详情确认处理方案',
        close_basis: a.close_reason || ''
      })),
      pending_approvals: pendingApprovals,
      recent_tasks: recentTasks
    }
  });
});

module.exports = router;
