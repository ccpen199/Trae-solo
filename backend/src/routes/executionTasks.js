const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog, createAlert } = require('../utils/audit');
const { checkPermission } = require('../middleware/auth');

router.get('/', checkPermission('task:read'), (req, res) => {
  const { status, type, app_id, page = 1, page_size = 20 } = req.query;
  
  let query = `
    SELECT t.*, a.name as app_name, e.name as env_name, u.real_name as creator_name, ex.real_name as executor_name
    FROM execution_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN users u ON t.created_by = u.id
    LEFT JOIN users ex ON t.executed_by = ex.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (type) { query += ' AND t.type = ?'; params.push(type); }
  if (app_id) { query += ' AND t.app_id = ?'; params.push(app_id); }
  
  const total = db.prepare(query.replace('SELECT t.*', 'SELECT COUNT(*) as count')).get(...params).count;
  
  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
  
  const tasks = db.prepare(query).all(...params);
  
  res.json({ data: tasks, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.post('/', checkPermission('task:write'), (req, res) => {
  const { change_order_id, type, title, app_id, env_id, params } = req.body;
  
  if (!type || !title) {
    return res.status(400).json({ error: '任务类型和标题不能为空' });
  }
  
  const taskId = `TASK${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  
  try {
    const result = db.prepare(`
      INSERT INTO execution_tasks (task_id, change_order_id, type, title, app_id, env_id, params, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(taskId, change_order_id || null, type, title, app_id || null, env_id || null, JSON.stringify(params || {}), req.user.id);
    
    createAuditLog(req.user.id, 'create', 'execution_task', result.lastInsertRowid, null, req.body, req.ip, req.get('User-Agent'));
    
    res.status(201).json({ id: result.lastInsertRowid, task_id: taskId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/execute', checkPermission('task:execute'), (req, res) => {
  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  try {
    db.prepare(`
      UPDATE execution_tasks
      SET status = 'running', started_at = CURRENT_TIMESTAMP, executed_by = ?
      WHERE id = ?
    `).run(req.user.id, req.params.id);
    
    setTimeout(() => {
      const success = Math.random() > 0.2;
      const newStatus = success ? 'success' : 'failed';
      const result = success ? { message: '执行成功' } : null;
      const error = success ? null : '模拟执行失败：配置验证不通过';
      
      db.prepare(`
        UPDATE execution_tasks
        SET status = ?, result = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStatus, JSON.stringify(result || {}), error, req.params.id);
      
      if (!success) {
        createAlert(
          'task_failed',
          'error',
          `任务执行失败: ${task.title}`,
          `任务 ${task.task_id} 执行失败，请检查配置后重试`,
          task.app_id,
          task.env_id,
          task.created_by,
          '请检查任务参数并重新执行，或联系运维人员协助'
        );
      }
      
      createAuditLog(req.user.id, 'execute', 'execution_task', req.params.id, task, { ...task, status: newStatus }, req.ip, req.get('User-Agent'));
    }, 1000);
    
    res.json({ success: true, message: '任务已开始执行' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
