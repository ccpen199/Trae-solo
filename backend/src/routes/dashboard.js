const express = require('express');
const { db } = require('../database');

const router = express.Router();

router.get('/stats', (req, res) => {
  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const keyCount = db.prepare('SELECT COUNT(*) as count FROM api_keys WHERE status = ?').get('active').count;
  const pendingTasks = db.prepare('SELECT COUNT(*) as count FROM execution_tasks WHERE status != ?').get('completed').count;
  const openAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE status = ?').get('open').count;
  const pendingChanges = db.prepare('SELECT COUNT(*) as count FROM change_orders WHERE status = ?').get('pending').count;
  const todayLogs = db.prepare('SELECT COUNT(*) as count FROM call_logs WHERE DATE(created_at) = DATE(\'now\')').get().count;
  
  res.json({
    applications: appCount,
    activeKeys: keyCount,
    pendingTasks,
    openAlerts,
    pendingChanges,
    todayCalls: todayLogs
  });
});

router.get('/issues', (req, res) => {
  const issues = db.prepare(`
    SELECT 
      a.id,
      a.alert_id,
      a.type,
      a.level,
      a.title,
      a.message,
      a.status,
      a.created_at,
      u.name as assignee_name,
      app.name as app_name
    FROM alerts a
    LEFT JOIN users u ON a.assignee_id = u.id
    LEFT JOIN applications app ON a.app_id = app.id
    WHERE a.status = 'open'
    ORDER BY 
      CASE a.level 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'warning' THEN 3 
        ELSE 4 
      END,
      a.created_at DESC
    LIMIT 10
  `).all();
  
  const issuesWithActions = issues.map(issue => ({
    ...issue,
    suggested_action: getSuggestedAction(issue.type, issue.level),
    close_criteria: getCloseCriteria(issue.type)
  }));
  
  res.json(issuesWithActions);
});

router.get('/recent-activities', (req, res) => {
  const activities = db.prepare(`
    SELECT 
      al.id,
      al.action,
      al.resource_type,
      al.created_at,
      u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT 20
  `).all();
  
  res.json(activities);
});

router.get('/pending-tasks', (req, res) => {
  const tasks = db.prepare(`
    SELECT 
      t.id,
      t.task_id,
      t.type,
      t.name,
      t.status,
      t.created_at,
      u.name as assignee_name,
      app.name as app_name
    FROM execution_tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN applications app ON t.app_id = app.id
    WHERE t.status IN ('pending', 'running')
    ORDER BY t.created_at DESC
    LIMIT 10
  `).all();
  
  res.json(tasks);
});

function getSuggestedAction(type, level) {
  const actions = {
    permission: {
      high: '立即核查密钥使用范围，限制IP白名单',
      critical: '紧急禁用密钥，启动安全审计流程'
    },
    failure: {
      high: '检查接口可用性，查看错误日志',
      critical: '启动应急预案，考虑服务降级'
    },
    duplicate: {
      warning: '核对重复任务，取消冗余执行'
    },
    config: {
      high: '回滚配置变更，验证配置正确性'
    }
  };
  return (actions[type] && actions[type][level]) || '进一步核查问题详情';
}

function getCloseCriteria(type) {
  const criteria = {
    permission: '密钥权限范围确认无误，异常访问源已封禁',
    failure: '接口成功率恢复正常（>99.5%），持续监控15分钟无异常',
    duplicate: '重复任务已清理，确认无重复执行风险',
    config: '配置验证通过，系统运行正常'
  };
  return criteria[type] || '问题根因确认，修复措施验证通过';
}

module.exports = router;
