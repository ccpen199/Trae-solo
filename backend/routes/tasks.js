const express = require('express');
const crypto = require('crypto');
const db = require('../database');

const router = express.Router();

function generateTaskNo() {
  const date = new Date();
  const prefix = `TASK${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const count = db.prepare('SELECT COUNT(*) as count FROM execution_tasks WHERE task_no LIKE ?').get(`${prefix}%`).count;
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

function addTaskLog(taskId, logLevel, logType, message, details, operatorId) {
  db.prepare(`
    INSERT INTO task_execution_logs (task_id, log_level, log_type, message, details, operator_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(taskId, logLevel, logType, message, details ? JSON.stringify(details) : null, operatorId);
}

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, status, app_id, task_type } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (status) {
    whereClause += ' AND t.status = ?';
    params.push(status);
  }
  if (app_id) {
    whereClause += ' AND t.app_id = ?';
    params.push(app_id);
  }
  if (task_type) {
    whereClause += ' AND t.task_type = ?';
    params.push(task_type);
  }

  const tasks = db.prepare(`
    SELECT t.*, a.app_name, a.app_key, e.env_name, e.env_type, 
           creator.name as creator_name, executor.name as executor_name,
           v.version as migration_version
    FROM execution_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN migration_versions v ON t.version_id = v.id
    LEFT JOIN users creator ON t.created_by = creator.id
    LEFT JOIN users executor ON t.executed_by = executor.id
    ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM execution_tasks t ${whereClause}
  `).get(...params);

  res.json({
    list: tasks,
    total: total.count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/dashboard', (req, res) => {
  const statusStats = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM execution_tasks 
    GROUP BY status
  `).all();

  const todayStats = db.prepare(`
    SELECT 
      COUNT(*) as total_today,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_today,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_today
    FROM execution_tasks 
    WHERE DATE(created_at) = DATE('now')
  `).get();

  const recentTasks = db.prepare(`
    SELECT t.*, a.app_name, e.env_name
    FROM execution_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    ORDER BY t.created_at DESC
    LIMIT 10
  `).all();

  res.json({
    statusStats,
    todayStats,
    recentTasks
  });
});

router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*, a.app_name, a.app_key, e.env_name, e.env_type, e.db_type,
           creator.name as creator_name, executor.name as executor_name,
           reviewer.name as reviewer_name, v.version, v.description as version_desc,
           v.script_content
    FROM execution_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN migration_versions v ON t.version_id = v.id
    LEFT JOIN users creator ON t.created_by = creator.id
    LEFT JOIN users executor ON t.executed_by = executor.id
    LEFT JOIN users reviewer ON t.reviewed_by = reviewer.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const logs = db.prepare(`
    SELECT l.*, u.name as operator_name
    FROM task_execution_logs l
    LEFT JOIN users u ON l.operator_id = u.id
    WHERE l.task_id = ?
    ORDER BY l.created_at ASC
  `).all(req.params.id);

  res.json({ ...task, logs });
});

router.post('/', (req, res) => {
  const { app_id, env_id, version_id, task_type, priority, scheduled_at, description } = req.body;

  const taskNo = generateTaskNo();
  
  const result = db.prepare(`
    INSERT INTO execution_tasks (task_no, app_id, env_id, version_id, task_type, priority, scheduled_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(taskNo, app_id, env_id, version_id || null, task_type, priority || 'normal', scheduled_at || null, req.user.id);

  const taskId = result.lastInsertRowid;
  addTaskLog(taskId, 'info', 'create', '任务已创建', { description }, req.user.id);

  db.prepare('INSERT INTO operation_logs (user_id, operation, module, details) VALUES (?, ?, ?, ?)')
    .run(req.user.id, 'create_task', 'tasks', JSON.stringify({ taskNo, task_type, app_id }));

  res.json({ id: taskId, task_no: taskNo, message: '创建成功' });
});

router.post('/:id/submit', (req, res) => {
  const taskId = req.params.id;
  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(taskId);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  if (task.status !== 'created') {
    return res.status(400).json({ error: '只有已创建状态的任务可以提交' });
  }

  db.prepare(`
    UPDATE execution_tasks 
    SET status = 'submitted', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(taskId);

  addTaskLog(taskId, 'info', 'submit', '任务已提交审核', null, req.user.id);

  res.json({ message: '提交成功' });
});

router.post('/:id/execute', (req, res) => {
  const taskId = req.params.id;
  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(taskId);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  if (!['submitted', 'reviewing'].includes(task.status)) {
    return res.status(400).json({ error: '任务状态不允许执行' });
  }

  const existingTasks = db.prepare(`
    SELECT COUNT(*) as count 
    FROM execution_tasks 
    WHERE app_id = ? AND env_id = ? AND version_id = ? AND status = 'executing'
  `).get(task.app_id, task.env_id, task.version_id);

  if (existingTasks.count > 0) {
    db.prepare(`
      INSERT INTO alerts (alert_type, severity, task_id, app_id, title, description, status)
      VALUES ('duplicate_execution', 'high', ?, ?, '检测到重复执行', '同一环境同一版本有正在执行的任务', 'auto_blocked')
    `).run(taskId, task.app_id);

    return res.status(400).json({ error: '检测到重复执行，已自动拦截' });
  }

  db.prepare(`
    UPDATE execution_tasks 
    SET status = 'executing', executed_at = CURRENT_TIMESTAMP, executed_by = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, taskId);

  addTaskLog(taskId, 'info', 'execute', '开始执行任务', null, req.user.id);

  setTimeout(() => {
    const success = Math.random() > 0.3;
    if (success) {
      db.prepare(`
        UPDATE execution_tasks 
        SET status = 'success', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(taskId);
      addTaskLog(taskId, 'info', 'execute', '任务执行成功', null, null);
    } else {
      db.prepare(`
        UPDATE execution_tasks 
        SET status = 'failed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(taskId);
      addTaskLog(taskId, 'error', 'execute', '任务执行失败', { error: '模拟执行错误' }, null);
      
      db.prepare(`
        INSERT INTO alerts (alert_type, severity, task_id, app_id, title, description, status)
        VALUES ('task_failure', 'high', ?, ?, '任务执行失败', '迁移任务执行失败，请检查', 'pending')
      `).run(taskId, task.app_id);
    }
  }, 2000);

  res.json({ message: '执行中' });
});

router.post('/:id/review', (req, res) => {
  const taskId = req.params.id;
  const { result, reject_reason } = req.body;
  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(taskId);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  if (task.status !== 'submitted') {
    return res.status(400).json({ error: '只有已提交状态的任务可以审核' });
  }

  if (result === 'approve') {
    db.prepare(`
      UPDATE execution_tasks 
      SET status = 'reviewing', reviewed_by = ?, review_result = 'manual_review', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, taskId);
    addTaskLog(taskId, 'info', 'review', '审核通过，等待执行', null, req.user.id);
  } else if (result === 'reject') {
    db.prepare(`
      UPDATE execution_tasks 
      SET status = 'rejected', reviewed_by = ?, reject_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, reject_reason, taskId);
    addTaskLog(taskId, 'warn', 'reject', `任务被退回: ${reject_reason}`, null, req.user.id);
  }

  res.json({ message: '审核完成' });
});

router.post('/:id/close', (req, res) => {
  const taskId = req.params.id;
  const { close_reason } = req.body;

  db.prepare(`
    UPDATE execution_tasks 
    SET status = 'closed', close_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(close_reason, taskId);

  addTaskLog(taskId, 'info', 'close', `任务已关闭: ${close_reason}`, null, req.user.id);

  res.json({ message: '关闭成功' });
});

router.post('/:id/rollback', (req, res) => {
  const taskId = req.params.id;
  const { rollback_reason } = req.body;

  db.prepare(`
    UPDATE execution_tasks 
    SET status = 'rollbacked', rollback_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(rollback_reason, taskId);

  addTaskLog(taskId, 'warn', 'rollback', `执行回滚: ${rollback_reason}`, null, req.user.id);

  res.json({ message: '回滚成功' });
});

module.exports = router;
