const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, a.name as app_name, e.name as env_name
    FROM tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    ORDER BY t.created_at DESC
  `).all();
  res.json(tasks);
});

router.get('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  res.json(task);
});

router.post('/', (req, res) => {
  const { app_id, env_id, name, type, cron_expr, command, created_by } = req.body;
  if (!app_id || !env_id || !name || !type || !command) {
    return res.status(400).json({ error: '必填字段缺失' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO tasks (id, app_id, env_id, name, type, cron_expr, command, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(id, app_id, env_id, name, type, cron_expr, command, created_by || 'admin');

  db.prepare(`
    INSERT INTO operation_logs (id, user_id, action, resource_type, resource_id, details)
    VALUES (?, ?, 'create', 'task', ?, ?)
  `).run(uuidv4(), created_by || 'admin', id, JSON.stringify({ name, type }));

  const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json(newTask);
});

router.put('/:id', (req, res) => {
  const { name, type, cron_expr, command, status } = req.body;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: '任务不存在' });

  db.prepare(`
    UPDATE tasks 
    SET name = ?, type = ?, cron_expr = ?, command = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name || task.name, type || task.type, cron_expr || task.cron_expr, 
        command || task.command, status || task.status, req.params.id);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/execute', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: '任务不存在' });

  const executionId = uuidv4();
  const createdBy = req.body.created_by || 'admin';

  db.prepare(`
    INSERT INTO executions (id, task_id, status, created_by)
    VALUES (?, ?, 'running', ?)
  `).run(executionId, req.params.id, createdBy);

  db.prepare(`
    INSERT INTO operation_logs (id, user_id, action, resource_type, resource_id, details)
    VALUES (?, ?, 'execute', 'task', ?, ?)
  `).run(uuidv4(), createdBy, req.params.id, JSON.stringify({ executionId }));

  setTimeout(() => {
    const success = Math.random() > 0.3;
    db.prepare(`
      UPDATE executions 
      SET status = ?, ended_at = CURRENT_TIMESTAMP, result = ?, error_log = ?
      WHERE id = ?
    `).run(
      success ? 'success' : 'failed',
      success ? JSON.stringify({ exitCode: 0, output: '执行完成' }) : null,
      success ? null : JSON.stringify({ error: '模拟执行失败', exitCode: 1 }),
      executionId
    );

    if (!success) {
      db.prepare(`
        INSERT INTO alerts (id, app_id, task_id, type, level, message, status)
        VALUES (?, ?, ?, 'task_failure', 'high', ?, 'open')
      `).run(uuidv4(), task.app_id, req.params.id, `任务执行失败: ${task.name}`);
    }
  }, 2000);

  const execution = db.prepare('SELECT * FROM executions WHERE id = ?').get(executionId);
  res.status(201).json(execution);
});

router.get('/:id/executions', (req, res) => {
  const executions = db.prepare(`
    SELECT * FROM executions WHERE task_id = ? ORDER BY started_at DESC
  `).all(req.params.id);
  res.json(executions);
});

module.exports = router;
