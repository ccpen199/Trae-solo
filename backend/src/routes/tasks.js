const express = require('express');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const https = require('https');
const { db } = require('../models/database');
const { authMiddleware, createAuditLog } = require('../middleware/auth');
const { createAlert, getResponsibleUserId } = require('../utils/alert');

const router = express.Router();
const runningTasks = new Map();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const { app_id, env_id, status, page = 1, page_size = 20 } = req.query;
  let query = `
    SELECT t.*, a.name as app_name, e.name as env_name, u.name as creator_name
    FROM stress_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN users u ON t.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (app_id) { query += ' AND t.app_id = ?'; params.push(app_id); }
  if (env_id) { query += ' AND t.env_id = ?'; params.push(env_id); }
  if (status) { query += ' AND t.status = ?'; params.push(status); }

  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const tasks = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM stress_tasks WHERE 1=1').get().count;

  res.json({ data: tasks, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*, a.name as app_name, e.name as env_name, e.base_url, u.name as creator_name
    FROM stress_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN users u ON t.created_by = u.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const logs = db.prepare(`
    SELECT * FROM call_logs 
    WHERE task_id = ? 
    ORDER BY created_at DESC 
    LIMIT 100
  `).all(req.params.id);

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_requests,
      AVG(response_time) as avg_response_time,
      MIN(response_time) as min_response_time,
      MAX(response_time) as max_response_time,
      SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as success_count,
      SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count
    FROM call_logs WHERE task_id = ?
  `).get(req.params.id);

  res.json({ ...task, logs, stats });
});

router.post('/', (req, res) => {
  const { app_id, env_id, name, description, api_endpoint, method = 'GET', headers, body, concurrency = 10, requests = 100 } = req.body;

  const validationErrors = [];
  if (!app_id) validationErrors.push('必须关联应用');
  if (!env_id) validationErrors.push('必须指定环境');
  if (!name) validationErrors.push('任务名称不能为空');
  if (!api_endpoint) validationErrors.push('API端点不能为空');

  const env = db.prepare('SELECT * FROM environments WHERE id = ?').get(env_id);
  if (!env) validationErrors.push('指定环境不存在或已停用');

  if (validationErrors.length > 0) {
    return res.status(400).json({ error: '字段校验失败', details: validationErrors });
  }

  const taskId = uuidv4();
  const result = db.prepare(`
    INSERT INTO stress_tasks (task_id, app_id, env_id, name, description, api_endpoint, method, headers, body, concurrency, requests, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(taskId, app_id, env_id, name, description, api_endpoint, method, headers ? JSON.stringify(headers) : null, body, concurrency, requests, req.user.id);

  createAuditLog(req.user.id, 'create', 'stress_task', taskId, null, JSON.stringify({ name, app_id, env_id }), '创建压测任务');

  const task = db.prepare('SELECT * FROM stress_tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

router.post('/:id/execute', (req, res) => {
  const task = db.prepare('SELECT t.*, e.base_url FROM stress_tasks t JOIN environments e ON t.env_id = e.id WHERE t.id = ?').get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  if (task.status === 'running') {
    createAlert('duplicate_execution', 'high', '重复执行压测任务', `任务 "${task.name}" 正在运行中，不允许重复执行`, {
      app_id: task.app_id,
      task_id: task.id,
      responsible_user_id: getResponsibleUserId(task.app_id),
      suggested_action: '请等待当前任务完成或取消后再执行'
    });
    return res.status(400).json({ error: '任务正在运行中，不允许重复执行' });
  }

  const recentTasks = db.prepare(`
    SELECT COUNT(*) as count FROM stress_tasks 
    WHERE app_id = ? AND status = 'running' AND id != ?
  `).get(task.app_id, req.params.id);

  if (recentTasks.count > 0) {
    createAlert('duplicate_execution', 'medium', '应用存在多个运行任务', `应用存在 ${recentTasks.count} 个同时运行的压测任务`, {
      app_id: task.app_id,
      responsible_user_id: getResponsibleUserId(task.app_id),
      suggested_action: '建议控制并发任务数量，避免影响服务稳定性'
    });
  }

  db.prepare('UPDATE stress_tasks SET status = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?').run('running', req.params.id);
  createAuditLog(req.user.id, 'execute', 'stress_task', task.task_id, null, null, '开始执行压测任务');

  executeTask(task);

  res.json({ message: '任务已开始执行', task_id: task.task_id });
});

const executeTask = async (task) => {
  const url = new URL(task.api_endpoint, task.base_url).toString();
  const headers = task.headers ? JSON.parse(task.headers) : {};
  let completed = 0;
  let success = 0;
  let failed = 0;
  const responseTimes = [];

  const makeRequest = () => {
    return new Promise((resolve) => {
      const start = Date.now();
      const client = url.startsWith('https') ? https : http;
      const parsedUrl = new URL(url);

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: task.method,
        headers: headers
      };

      const req = client.request(options, (res) => {
        const duration = Date.now() - start;
        responseTimes.push(duration);

        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          db.prepare(`
            INSERT INTO call_logs (log_id, task_id, app_id, env_id, method, url, status_code, response_time, response_body)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(uuidv4(), task.id, task.app_id, task.env_id, task.method, url, res.statusCode, duration, data.substring(0, 1000));

          if (res.statusCode >= 200 && res.statusCode < 300) {
            success++;
          } else {
            failed++;
          }
          completed++;
          resolve();
        });
      });

      req.on('error', (error) => {
        const duration = Date.now() - start;
        db.prepare(`
          INSERT INTO call_logs (log_id, task_id, app_id, env_id, method, url, status_code, response_time, error_message)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), task.id, task.app_id, task.env_id, task.method, url, 0, duration, error.message);
        
        failed++;
        completed++;
        resolve();
      });

      if (task.body && ['POST', 'PUT', 'PATCH'].includes(task.method)) {
        req.write(task.body);
      }
      req.end();
    });
  };

  const runBatch = async () => {
    if (!runningTasks.has(task.id)) return;
    
    const remaining = task.requests - completed;
    if (remaining <= 0) return;
    
    const batchSize = Math.min(task.concurrency, remaining);
    const promises = [];
    for (let i = 0; i < batchSize; i++) {
      if (runningTasks.has(task.id)) {
        promises.push(makeRequest());
      }
    }
    await Promise.all(promises);

    if (runningTasks.has(task.id) && completed < task.requests) {
      await runBatch();
    }
  };

  runningTasks.set(task.id, true);

  try {
    await runBatch();

    const result = {
      total: completed,
      success,
      failed,
      avgResponseTime: responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
      maxResponseTime: Math.max(...responseTimes, 0),
      minResponseTime: Math.min(...responseTimes, 0)
    };

    db.prepare(`
      UPDATE stress_tasks 
      SET status = ?, completed_at = CURRENT_TIMESTAMP, result = ?
      WHERE id = ?
    `).run(failed > 0 ? 'completed' : 'completed', JSON.stringify(result), task.id);

    if (failed > completed * 0.1) {
      createAlert('task_failure', 'high', '压测任务高失败率', `任务 "${task.name}" 失败率超过 10% (${failed}/${completed})`, {
        app_id: task.app_id,
        task_id: task.id,
        responsible_user_id: getResponsibleUserId(task.app_id),
        suggested_action: '请检查API服务状态、网络连接和请求配置'
      });
    }

  } catch (error) {
    db.prepare(`
      UPDATE stress_tasks 
      SET status = ?, completed_at = CURRENT_TIMESTAMP, result = ?
      WHERE id = ?
    `).run('failed', JSON.stringify({ error: error.message }), task.id);

    createAlert('task_failure', 'critical', '压测任务执行失败', `任务 "${task.name}" 执行失败: ${error.message}`, {
      app_id: task.app_id,
      task_id: task.id,
      responsible_user_id: getResponsibleUserId(task.app_id),
      suggested_action: '请检查任务配置和目标服务可用性，然后重试'
    });
  } finally {
    runningTasks.delete(task.id);
    createAuditLog(null, 'complete', 'stress_task', task.task_id, null, null, '压测任务执行完成');
  }
};

router.post('/:id/cancel', (req, res) => {
  const task = db.prepare('SELECT * FROM stress_tasks WHERE id = ?').get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  if (task.status !== 'running') {
    return res.status(400).json({ error: '只有运行中的任务才能取消' });
  }

  db.prepare('UPDATE stress_tasks SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run('cancelled', req.params.id);
  runningTasks.delete(req.params.id);

  createAuditLog(req.user.id, 'cancel', 'stress_task', task.task_id, null, null, '取消压测任务');

  res.json({ message: '任务已取消' });
});

router.get('/:id/logs', (req, res) => {
  const { page = 1, page_size = 50, status_code } = req.query;
  let query = 'SELECT * FROM call_logs WHERE task_id = ?';
  const params = [req.params.id];

  if (status_code) {
    query += ' AND status_code = ?';
    params.push(status_code);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const logs = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM call_logs WHERE task_id = ?').get(req.params.id).count;

  res.json({ data: logs, total, page: parseInt(page), page_size: parseInt(page_size) });
});

module.exports = router;
