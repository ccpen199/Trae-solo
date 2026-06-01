import express from 'express';
import db from '../database/init.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/overview', checkPermission('report', 'export'), (req, res) => {
  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const envCount = db.prepare('SELECT COUNT(*) as count FROM environments').get().count;
  const strategyCount = db.prepare('SELECT COUNT(*) as count FROM backup_strategies').get().count;
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  
  const taskStats = db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      COUNT(*) as total
    FROM tasks
    WHERE created_at >= datetime('now', '-30 days')
  `).get();

  const successRate = taskStats.total > 0 ? ((taskStats.success / taskStats.total) * 100).toFixed(2) : 0;

  const alertStats = db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN severity = 'critical' AND status = 'active' THEN 1 ELSE 0 END) as critical
    FROM alerts
  `).get();

  res.json({
    apps: appCount,
    environments: envCount,
    strategies: strategyCount,
    tasks: taskCount,
    task_stats: {
      ...taskStats,
      success_rate: parseFloat(successRate)
    },
    alerts: alertStats,
    period: '近30天'
  });
});

router.get('/task-trend', checkPermission('report', 'export'), (req, res) => {
  const { days = 7 } = req.query;
  
  const trend = db.prepare(`
    SELECT 
      date(created_at) as date,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      COUNT(*) as total
    FROM tasks
    WHERE created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY date(created_at)
    ORDER BY date
  `).all(days);

  res.json(trend);
});

router.get('/export-tasks', checkPermission('report', 'export'), (req, res) => {
  const { start_date, end_date, status } = req.query;
  
  let query = `
    SELECT 
      t.task_no as 任务编号,
      t.task_type as 任务类型,
      a.app_name as 应用名称,
      e.env_name as 环境名称,
      bs.strategy_name as 策略名称,
      t.status as 状态,
      u.real_name as 操作人,
      t.created_at as 创建时间,
      t.started_at as 开始时间,
      t.completed_at as 完成时间,
      t.duration_seconds as 耗时(秒),
      t.error_message as 错误信息
    FROM tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN backup_strategies bs ON t.strategy_id = bs.id
    LEFT JOIN users u ON t.operator_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    query += ' AND t.created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND t.created_at <= ?';
    params.push(end_date);
  }
  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }

  query += ' ORDER BY t.created_at DESC LIMIT 10000';

  const tasks = db.prepare(query).all(...params);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, description)
    VALUES ('export', ?, ?, 'export', 'report', ?)
  `).run(req.user.id, req.user.username, `导出任务报表，共${tasks.length}条`);

  res.json({
    data: tasks,
    filename: `task_report_${new Date().toISOString().slice(0, 10)}.csv`
  });
});

export default router;
