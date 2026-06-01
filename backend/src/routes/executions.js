const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const webhookExecutor = require('../utils/webhookExecutor');
const validator = require('../utils/validator');
const { permissionMiddleware, auditMiddleware } = require('../middleware/auth');

router.get('/tasks', (req, res) => {
  const { config_id, status, created_by, start_time, end_time, limit = 50, offset = 0 } = req.query;
  let query = `
    SELECT et.*, wc.name as config_name, a.name as app_name, u.name as creator_name
    FROM execution_tasks et
    JOIN webhook_configs wc ON et.config_id = wc.id
    JOIN applications a ON wc.app_id = a.id
    JOIN users u ON et.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (config_id) {
    query += ' AND et.config_id = ?';
    params.push(config_id);
  }
  if (status) {
    query += ' AND et.status = ?';
    params.push(status);
  }
  if (created_by) {
    query += ' AND et.created_by = ?';
    params.push(created_by);
  }
  if (start_time) {
    query += ' AND et.created_at >= ?';
    params.push(start_time);
  }
  if (end_time) {
    query += ' AND et.created_at <= ?';
    params.push(end_time);
  }

  query += ' ORDER BY et.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const tasks = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM execution_tasks').get().count;

  res.json({ tasks, total });
});

router.get('/tasks/:id', (req, res) => {
  const task = db.prepare(`
    SELECT et.*, wc.name as config_name, wc.url as config_url, a.name as app_name, u.name as creator_name
    FROM execution_tasks et
    JOIN webhook_configs wc ON et.config_id = wc.id
    JOIN applications a ON wc.app_id = a.id
    JOIN users u ON et.created_by = u.id
    WHERE et.id = ?
  `).get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const logs = db.prepare(
    'SELECT * FROM call_logs WHERE task_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);

  const exceptions = db.prepare(
    'SELECT * FROM exception_records WHERE task_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);

  res.json({ ...task, logs, exceptions });
});

router.post('/tasks', permissionMiddleware(['admin', 'devops', 'developer', 'owner']), auditMiddleware('create', 'task'), (req, res) => {
  const { config_id, payload, scheduled_at, priority } = req.body;
  const userId = req.user.id;

  const validation = validator.validateTaskCreation(config_id, userId, payload);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  db.prepare(`
    INSERT INTO execution_tasks (
      id, config_id, task_type, payload, priority, scheduled_at, status, created_by
    ) VALUES (?, ?, 'manual', ?, ?, ?, 'pending', ?)
  `).run(
    id, config_id, JSON.stringify(payload),
    priority || 5, scheduled_at || null, userId
  );

  if (!scheduled_at) {
    setImmediate(() => {
      webhookExecutor.executeTask(id).catch(console.error);
    });
  }

  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(id);
  res.status(201).json(task);
});

router.post('/tasks/:id/retry', permissionMiddleware(['admin', 'devops', 'owner']), auditMiddleware('retry', 'task'), (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;

  const originalTask = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(taskId);
  if (!originalTask) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const newId = `task-${Date.now()}-retry`;
  db.prepare(`
    INSERT INTO execution_tasks (
      id, config_id, task_type, payload, priority, status, created_by
    ) VALUES (?, ?, 'retry', ?, 5, 'pending', ?)
  `).run(newId, originalTask.config_id, originalTask.payload, userId);

  setImmediate(() => {
    webhookExecutor.executeTask(newId).catch(console.error);
  });

  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(newId);
  res.status(201).json(task);
});

router.get('/logs', (req, res) => {
  const { config_id, task_id, success, start_time, end_time, limit = 100, offset = 0 } = req.query;
  let query = `
    SELECT cl.*, wc.name as config_name, a.name as app_name
    FROM call_logs cl
    JOIN webhook_configs wc ON cl.config_id = wc.id
    JOIN applications a ON wc.app_id = a.id
    WHERE 1=1
  `;
  const params = [];

  if (config_id) {
    query += ' AND cl.config_id = ?';
    params.push(config_id);
  }
  if (task_id) {
    query += ' AND cl.task_id = ?';
    params.push(task_id);
  }
  if (success !== undefined) {
    query += ' AND cl.success = ?';
    params.push(success === 'true' ? 1 : 0);
  }
  if (start_time) {
    query += ' AND cl.created_at >= ?';
    params.push(start_time);
  }
  if (end_time) {
    query += ' AND cl.created_at <= ?';
    params.push(end_time);
  }

  query += ' ORDER BY cl.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const logs = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM call_logs').get().count;

  res.json({ logs, total });
});

router.get('/logs/:id', (req, res) => {
  const log = db.prepare(`
    SELECT cl.*, wc.name as config_name, a.name as app_name, et.payload as task_payload
    FROM call_logs cl
    JOIN webhook_configs wc ON cl.config_id = wc.id
    JOIN applications a ON wc.app_id = a.id
    JOIN execution_tasks et ON cl.task_id = et.id
    WHERE cl.id = ?
  `).get(req.params.id);

  if (!log) {
    return res.status(404).json({ error: '日志不存在' });
  }

  res.json(log);
});

module.exports = router;
