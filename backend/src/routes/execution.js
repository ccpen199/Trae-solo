const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateToken, auditLog } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/tasks', (req, res) => {
  const { status, app_id, env_id, task_type, page = 1, pageSize = 20 } = req.query;
  
  let query = `
    SELECT t.*, a.app_name, e.env_name, u.name as executor_name, co.title as order_title
    FROM execution_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN users u ON t.executor_id = u.id
    LEFT JOIN change_orders co ON t.order_id = co.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }
  if (app_id) {
    query += ' AND t.app_id = ?';
    params.push(app_id);
  }
  if (env_id) {
    query += ' AND t.env_id = ?';
    params.push(env_id);
  }
  if (task_type) {
    query += ' AND t.task_type = ?';
    params.push(task_type);
  }

  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const tasks = db.prepare(query).all(...params);
  
  const countQuery = 'SELECT COUNT(*) as total FROM execution_tasks WHERE 1=1';
  const { total } = db.prepare(countQuery).get();

  res.json({
    list: tasks,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/tasks/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*, a.app_name, e.env_name, u.name as executor_name, co.title as order_title
    FROM execution_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN users u ON t.executor_id = u.id
    LEFT JOIN change_orders co ON t.order_id = co.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const logs = db.prepare(`
    SELECT * FROM call_logs WHERE task_id = ? ORDER BY created_at DESC
  `).all(req.params.id);

  const exceptions = db.prepare(`
    SELECT * FROM exception_records WHERE task_id = ? ORDER BY created_at DESC
  `).all(req.params.id);

  res.json({
    ...task,
    logs,
    exceptions
  });
});

router.post('/tasks/:id/execute', (req, res) => {
  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  if (task.status !== 'pending') {
    return res.status(400).json({ error: '任务已执行或已失败' });
  }

  const existingTask = db.prepare(`
    SELECT * FROM execution_tasks 
    WHERE order_id = ? AND status IN ('pending', 'running') AND id != ?
  `).get(task.order_id, req.params.id);

  if (existingTask) {
    return res.status(400).json({ error: '存在未完成的关联任务，请先处理' });
  }

  db.prepare(`
    UPDATE execution_tasks 
    SET status = 'running', executor_id = ?, executed_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(req.user.id, req.params.id);

  const startTime = Date.now();

  setTimeout(() => {
    const duration = Date.now() - startTime;
    const success = Math.random() > 0.2;

    if (success) {
      db.prepare(`
        UPDATE execution_tasks 
        SET status = 'success', result = ? 
        WHERE id = ?
      `).run(JSON.stringify({ message: '执行成功', timestamp: new Date().toISOString() }), req.params.id);

      db.prepare(`
        INSERT INTO call_logs (app_id, task_id, endpoint, method, request_data, response_data, status_code, duration, ip_address)
        VALUES (?, ?, '/api/execute', 'POST', ?, ?, 200, ?, ?)
      `).run(task.app_id, req.params.id, JSON.stringify({ task_id: req.params.id }), JSON.stringify({ success: true }), duration, req.ip);

      if (task.order_id) {
        const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(task.order_id);
        if (order && order.status === 'executing') {
          const currentNode = db.prepare('SELECT * FROM approval_nodes WHERE id = ?').get(order.current_node_id);
          const nextNode = db.prepare(`
            SELECT * FROM approval_nodes 
            WHERE workflow_id = ? AND node_order > ? 
            ORDER BY node_order ASC LIMIT 1
          `).get(order.workflow_id, currentNode?.node_order || 0);

          if (nextNode) {
            db.prepare(`
              UPDATE change_orders SET current_node_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            `).run(nextNode.id, task.order_id);
          } else {
            db.prepare(`
              UPDATE change_orders SET status = 'completed', current_node_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            `).run(task.order_id);
          }
        }
      }
    } else {
      db.prepare(`
        UPDATE execution_tasks 
        SET status = 'failed', result = ? 
        WHERE id = ?
      `).run(JSON.stringify({ message: '执行失败', error: '模拟的网络错误' }), req.params.id);

      db.prepare(`
        INSERT INTO exception_records (task_id, order_id, error_type, error_message, original_request, status)
        VALUES (?, ?, 'execution_error', ?, ?, 'pending')
      `).run(req.params.id, task.order_id, '模拟的网络错误: Connection timeout', JSON.stringify({ task_id: req.params.id }));

      db.prepare(`
        INSERT INTO alert_records (app_id, task_id, alert_type, severity, message)
        VALUES (?, ?, 'execution_failed', 'high', ?)
      `).run(task.app_id, req.params.id, `任务执行失败: ${task.task_no}`);
    }
  }, 1000);

  auditLog(req, 'execute', 'execution_task', req.params.id, task, { status: 'running' });

  res.json({ message: '任务已开始执行' });
});

router.post('/tasks/:id/retry', (req, res) => {
  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  if (task.status !== 'failed') {
    return res.status(400).json({ error: '只有失败的任务可以重试' });
  }

  const task_no = 'TASK-' + Date.now() + '-' + uuidv4().substring(0, 4).toUpperCase();

  const result = db.prepare(`
    INSERT INTO execution_tasks (task_no, order_id, app_id, env_id, task_type, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(task_no, task.order_id, task.app_id, task.env_id, task.task_type);

  auditLog(req, 'retry', 'execution_task', result.lastInsertRowid, null, { original_task_id: req.params.id });

  res.json({
    id: result.lastInsertRowid,
    task_no,
    message: '重试任务已创建'
  });
});

router.get('/logs', (req, res) => {
  const { app_id, task_id, status_code, page = 1, pageSize = 50 } = req.query;
  
  let query = 'SELECT * FROM call_logs WHERE 1=1';
  const params = [];

  if (app_id) {
    query += ' AND app_id = ?';
    params.push(app_id);
  }
  if (task_id) {
    query += ' AND task_id = ?';
    params.push(task_id);
  }
  if (status_code) {
    query += ' AND status_code = ?';
    params.push(status_code);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const logs = db.prepare(query).all(...params);
  
  const { total } = db.prepare('SELECT COUNT(*) as total FROM call_logs WHERE 1=1').get();

  res.json({ list: logs, total });
});

router.get('/exceptions', (req, res) => {
  const { status, task_id, page = 1, pageSize = 20 } = req.query;
  
  let query = 'SELECT * FROM exception_records WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (task_id) {
    query += ' AND task_id = ?';
    params.push(task_id);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const exceptions = db.prepare(query).all(...params);
  
  const { total } = db.prepare('SELECT COUNT(*) as total FROM exception_records WHERE 1=1').get();

  res.json({ list: exceptions, total });
});

router.post('/exceptions/:id/resolve', (req, res) => {
  const { compensation_action, manual_notes } = req.body;
  
  db.prepare(`
    UPDATE exception_records 
    SET compensation_action = ?, manual_notes = ?, status = 'resolved', resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(compensation_action, manual_notes, req.params.id);

  auditLog(req, 'resolve', 'exception', req.params.id, null, { compensation_action });

  res.json({ message: '已标记为已解决' });
});

router.get('/alerts', (req, res) => {
  const { status, severity, page = 1, pageSize = 20 } = req.query;
  
  let query = `
    SELECT ar.*, a.app_name
    FROM alert_records ar
    LEFT JOIN applications a ON ar.app_id = a.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND ar.status = ?';
    params.push(status);
  }
  if (severity) {
    query += ' AND ar.severity = ?';
    params.push(severity);
  }

  query += ' ORDER BY ar.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const alerts = db.prepare(query).all(...params);
  
  const { total } = db.prepare('SELECT COUNT(*) as total FROM alert_records WHERE 1=1').get();

  res.json({ list: alerts, total });
});

module.exports = router;
