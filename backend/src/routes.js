const express = require('express');
const { Parser } = require('json2csv');
const { TaskExecutor } = require('./taskExecutor');

function createRoutes(db) {
  const router = express.Router();
  const taskExecutor = new TaskExecutor(db);

  router.get('/users', (req, res) => {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users);
  });

  router.get('/users/:id', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  });

  router.get('/applications', (req, res) => {
    const apps = db.prepare(`
      SELECT a.*, u.name as owner_name, u2.name as creator_name
      FROM applications a
      LEFT JOIN users u ON a.owner_id = u.id
      LEFT JOIN users u2 ON a.created_by = u2.id
      ORDER BY a.created_at DESC
    `).all();
    res.json(apps);
  });

  router.get('/applications/:id', (req, res) => {
    const app = db.prepare(`
      SELECT a.*, u.name as owner_name
      FROM applications a
      LEFT JOIN users u ON a.owner_id = u.id
      WHERE a.id = ?
    `).get(req.params.id);
    
    const environments = db.prepare('SELECT * FROM environments WHERE app_id = ?').all(req.params.id);
    const versions = db.prepare('SELECT * FROM versions WHERE app_id = ? ORDER BY created_at DESC').all(req.params.id);
    const secrets = db.prepare('SELECT id, app_id, env_id, secret_name, secret_type, status, valid_from, valid_until, created_at FROM secrets WHERE app_id = ?').all(req.params.id);
    
    res.json({ ...app, environments, versions, secrets });
  });

  router.post('/applications', (req, res) => {
    const { app_code, app_name, description, category, owner_id, tech_stack } = req.body;
    
    try {
      const result = db.prepare(`
        INSERT INTO applications (app_code, app_name, description, category, owner_id, tech_stack, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, 'active', 1)
      `).run(app_code, app_name, description, category, owner_id || null, tech_stack);

      db.prepare(`
        INSERT INTO operation_logs (user_id, operation, target_type, target_id, new_value)
        VALUES (1, 'create', 'application', ?, ?)
      `).run(result.lastInsertRowid, JSON.stringify(req.body));

      res.json({ id: result.lastInsertRowid, success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.put('/applications/:id', (req, res) => {
    const { app_name, description, category, owner_id, tech_stack, status } = req.body;
    
    const oldApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    
    db.prepare(`
      UPDATE applications 
      SET app_name = ?, description = ?, category = ?, owner_id = ?, tech_stack = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(app_name, description, category, owner_id || null, tech_stack, status, req.params.id);

    db.prepare(`
      INSERT INTO operation_logs (user_id, operation, target_type, target_id, old_value, new_value)
      VALUES (1, 'update', 'application', ?, ?, ?)
    `).run(req.params.id, JSON.stringify(oldApp), JSON.stringify(req.body));

    res.json({ success: true });
  });

  router.get('/environments', (req, res) => {
    const envs = db.prepare(`
      SELECT e.*, a.app_name, a.app_code
      FROM environments e
      JOIN applications a ON e.app_id = a.id
      ORDER BY e.created_at DESC
    `).all();
    res.json(envs);
  });

  router.post('/environments', (req, res) => {
    const { app_id, env_name, env_type, server_address } = req.body;
    
    const result = db.prepare(`
      INSERT INTO environments (app_id, env_name, env_type, server_address, status, created_by)
      VALUES (?, ?, ?, ?, 'active', 1)
    `).run(app_id, env_name, env_type, server_address);

    res.json({ id: result.lastInsertRowid, success: true });
  });

  router.get('/versions', (req, res) => {
    const versions = db.prepare(`
      SELECT v.*, a.app_name, a.app_code, e.env_name
      FROM versions v
      JOIN applications a ON v.app_id = a.id
      LEFT JOIN environments e ON v.env_id = e.id
      ORDER BY v.created_at DESC
    `).all();
    res.json(versions);
  });

  router.post('/versions', (req, res) => {
    const { app_id, env_id, version_number, release_notes } = req.body;
    
    const result = db.prepare(`
      INSERT INTO versions (app_id, env_id, version_number, release_notes, status, created_by)
      VALUES (?, ?, ?, ?, 'draft', 1)
    `).run(app_id, env_id || null, version_number, release_notes);

    db.prepare(`
      INSERT INTO version_history (version_id, change_type, new_value, changed_by)
      VALUES (?, 'create', ?, 1)
    `).run(result.lastInsertRowid, version_number);

    res.json({ id: result.lastInsertRowid, success: true });
  });

  router.get('/secrets', (req, res) => {
    const secrets = db.prepare(`
      SELECT s.*, a.app_name, e.env_name
      FROM secrets s
      JOIN applications a ON s.app_id = a.id
      LEFT JOIN environments e ON s.env_id = e.id
      ORDER BY s.created_at DESC
    `).all();
    res.json(secrets);
  });

  router.post('/secrets', (req, res) => {
    const { app_id, env_id, secret_name, secret_type, secret_value, valid_from, valid_until } = req.body;
    
    const result = db.prepare(`
      INSERT INTO secrets (app_id, env_id, secret_name, secret_type, secret_value, valid_from, valid_until, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 1)
    `).run(app_id, env_id || null, secret_name, secret_type, '***ENCRYPTED***', valid_from || null, valid_until || null);

    res.json({ id: result.lastInsertRowid, success: true });
  });

  router.get('/change-orders', (req, res) => {
    const orders = db.prepare(`
      SELECT co.*, a.app_name, e.env_name,
             u_creator.name as creator_name,
             u_submitter.name as submitter_name,
             u_executor.name as executor_name,
             u_reviewer.name as reviewer_name
      FROM change_orders co
      LEFT JOIN applications a ON co.app_id = a.id
      LEFT JOIN environments e ON co.env_id = e.id
      LEFT JOIN users u_creator ON co.created_by = u_creator.id
      LEFT JOIN users u_submitter ON co.submitted_by = u_submitter.id
      LEFT JOIN users u_executor ON co.executed_by = u_executor.id
      LEFT JOIN users u_reviewer ON co.reviewed_by = u_reviewer.id
      ORDER BY co.created_at DESC
    `).all();
    res.json(orders);
  });

  router.get('/change-orders/:id', (req, res) => {
    const order = db.prepare(`
      SELECT co.*, a.app_name, e.env_name,
             u_creator.name as creator_name,
             u_submitter.name as submitter_name,
             u_executor.name as executor_name,
             u_reviewer.name as reviewer_name
      FROM change_orders co
      LEFT JOIN applications a ON co.app_id = a.id
      LEFT JOIN environments e ON co.env_id = e.id
      LEFT JOIN users u_creator ON co.created_by = u_creator.id
      LEFT JOIN users u_submitter ON co.submitted_by = u_submitter.id
      LEFT JOIN users u_executor ON co.executed_by = u_executor.id
      LEFT JOIN users u_reviewer ON co.reviewed_by = u_reviewer.id
      WHERE co.id = ?
    `).get(req.params.id);

    const tasks = db.prepare('SELECT * FROM execution_tasks WHERE change_order_id = ?').all(req.params.id);
    const operationLogs = db.prepare('SELECT * FROM operation_logs WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC').all('change_order', req.params.id);
    
    res.json({ ...order, tasks, operationLogs });
  });

  function generateOrderNo() {
    const date = new Date();
    const prefix = `CO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = db.prepare("SELECT COUNT(*) as count FROM change_orders WHERE order_no LIKE ?").get(prefix + '%').count;
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  router.post('/change-orders', (req, res) => {
    const { title, type, app_id, env_id, content, priority, create_reason } = req.body;
    const order_no = generateOrderNo();
    
    const result = db.prepare(`
      INSERT INTO change_orders (order_no, title, type, app_id, env_id, content, priority, status, created_by, create_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'created', 1, ?)
    `).run(order_no, title, type, app_id || null, env_id || null, content, priority || 'medium', create_reason);

    db.prepare(`
      INSERT INTO operation_logs (user_id, operation, target_type, target_id, new_value)
      VALUES (1, 'create', 'change_order', ?, ?)
    `).run(result.lastInsertRowid, JSON.stringify({ title, type, content }));

    res.json({ id: result.lastInsertRowid, order_no, success: true });
  });

  router.post('/change-orders/:id/submit', (req, res) => {
    const { submit_reason } = req.body;
    const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
    
    if (order.status !== 'created') {
      return res.status(400).json({ error: '只能提交已创建的变更单' });
    }

    db.prepare(`
      UPDATE change_orders 
      SET status = 'submitted', submitted_by = 1, submitted_at = CURRENT_TIMESTAMP, submit_reason = ?
      WHERE id = ?
    `).run(submit_reason || '', req.params.id);

    db.prepare(`
      INSERT INTO operation_logs (user_id, operation, target_type, target_id, old_value, new_value)
      VALUES (1, 'submit', 'change_order', ?, ?, ?)
    `).run(req.params.id, order.status, 'submitted');

    res.json({ success: true });
  });

  router.post('/change-orders/:id/execute', (req, res) => {
    const { execute_reason } = req.body;
    const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
    
    if (order.status !== 'submitted') {
      return res.status(400).json({ error: '只能执行已提交的变更单' });
    }

    db.prepare(`
      UPDATE change_orders 
      SET status = 'executing', executed_by = 1, executed_at = CURRENT_TIMESTAMP, execute_reason = ?
      WHERE id = ?
    `).run(execute_reason || '', req.params.id);

    db.prepare(`
      INSERT INTO operation_logs (user_id, operation, target_type, target_id, old_value, new_value)
      VALUES (1, 'execute', 'change_order', ?, ?, ?)
    `).run(req.params.id, order.status, 'executing');

    res.json({ success: true });
  });

  router.post('/change-orders/:id/review', (req, res) => {
    const { review_reason } = req.body;
    const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
    
    if (order.status !== 'executing') {
      return res.status(400).json({ error: '只能复核执行中的变更单' });
    }

    db.prepare(`
      UPDATE change_orders 
      SET status = 'reviewed', reviewed_by = 1, reviewed_at = CURRENT_TIMESTAMP, review_reason = ?
      WHERE id = ?
    `).run(review_reason || '', req.params.id);

    db.prepare(`
      INSERT INTO operation_logs (user_id, operation, target_type, target_id, old_value, new_value)
      VALUES (1, 'review', 'change_order', ?, ?, ?)
    `).run(req.params.id, order.status, 'reviewed');

    res.json({ success: true });
  });

  router.post('/change-orders/:id/reject', (req, res) => {
    const { reject_reason } = req.body;
    const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
    
    if (!['submitted', 'executing'].includes(order.status)) {
      return res.status(400).json({ error: '只能退回已提交或执行中的变更单' });
    }

    db.prepare(`
      UPDATE change_orders 
      SET status = 'rejected', reviewed_by = 1, reject_reason = ?
      WHERE id = ?
    `).run(reject_reason || '', req.params.id);

    db.prepare(`
      INSERT INTO operation_logs (user_id, operation, target_type, target_id, old_value, new_value)
      VALUES (1, 'reject', 'change_order', ?, ?, ?)
    `).run(req.params.id, order.status, 'rejected');

    res.json({ success: true });
  });

  router.post('/change-orders/:id/close', (req, res) => {
    const { close_reason } = req.body;
    const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id);
    
    if (!['reviewed', 'rejected'].includes(order.status)) {
      return res.status(400).json({ error: '只能关闭已复核或已退回的变更单' });
    }

    db.prepare(`
      UPDATE change_orders 
      SET status = 'closed', closed_by = 1, closed_at = CURRENT_TIMESTAMP, close_reason = ?
      WHERE id = ?
    `).run(close_reason || '', req.params.id);

    db.prepare(`
      INSERT INTO operation_logs (user_id, operation, target_type, target_id, old_value, new_value)
      VALUES (1, 'close', 'change_order', ?, ?, ?)
    `).run(req.params.id, order.status, 'closed');

    res.json({ success: true });
  });

  router.get('/execution-tasks', (req, res) => {
    const tasks = db.prepare(`
      SELECT et.*, co.order_no, co.title, u.name as executor_name
      FROM execution_tasks et
      LEFT JOIN change_orders co ON et.change_order_id = co.id
      LEFT JOIN users u ON et.executed_by = u.id
      ORDER BY et.created_at DESC
    `).all();
    res.json(tasks);
  });

  function generateTaskNo() {
    const date = new Date();
    const prefix = `TK${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = db.prepare("SELECT COUNT(*) as count FROM execution_tasks WHERE task_no LIKE ?").get(prefix + '%').count;
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  router.post('/execution-tasks', (req, res) => {
    const { change_order_id, task_type, target, parameters } = req.body;
    const task_no = generateTaskNo();
    
    const result = db.prepare(`
      INSERT INTO execution_tasks (task_no, change_order_id, task_type, target, parameters, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(task_no, change_order_id || null, task_type, target, parameters ? JSON.stringify(parameters) : null);

    res.json({ id: result.lastInsertRowid, task_no, success: true });
  });

  router.get('/execution-tasks/:id/status', (req, res) => {
    const status = taskExecutor.getTaskStatus(req.params.id);
    if (!status) {
      return res.status(404).json({ error: '任务不存在' });
    }
    res.json(status);
  });

  router.post('/execution-tasks/:id/start', async (req, res) => {
    try {
      const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(req.params.id);
      if (!task) {
        return res.status(404).json({ error: '任务不存在' });
      }

      if (task.status === 'running') {
        return res.status(400).json({ error: '任务正在执行中' });
      }

      db.prepare(`
        UPDATE execution_tasks 
        SET executed_by = 1
        WHERE id = ?
      `).run(req.params.id);

      taskExecutor.executeTask(req.params.id).catch(err => {
        console.error('Task execution error:', err);
      });

      res.json({ success: true, message: '任务已开始执行' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/execution-tasks/:id/cancel', (req, res) => {
    const success = taskExecutor.cancelTask(req.params.id);
    if (success) {
      res.json({ success: true, message: '任务已取消' });
    } else {
      res.status(400).json({ error: '无法取消任务，任务可能已完成或不存在' });
    }
  });

  router.post('/execution-tasks/:id/complete', (req, res) => {
    const { result, success } = req.body;
    db.prepare(`
      UPDATE execution_tasks 
      SET status = ?, result = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(success ? 'completed' : 'failed', result || '', req.params.id);

    if (!success) {
      db.prepare(`
        INSERT INTO alarm_records (alarm_type, severity, source, message, related_id, related_type, handle_result)
        VALUES ('task_failure', 'high', 'execution', '任务执行失败', ?, 'task', 'pending')
      `).run(req.params.id);
    }

    res.json({ success: true });
  });

  router.get('/call-logs', (req, res) => {
    const logs = db.prepare(`
      SELECT cl.*, et.task_no, u.name as caller_name
      FROM call_logs cl
      LEFT JOIN execution_tasks et ON cl.task_id = et.id
      LEFT JOIN users u ON cl.called_by = u.id
      ORDER BY cl.called_at DESC
      LIMIT 100
    `).all();
    res.json(logs);
  });

  router.post('/call-logs', (req, res) => {
    const { task_id, api_name, method, request_url, request_body, response_status, response_body, duration_ms } = req.body;
    
    const result = db.prepare(`
      INSERT INTO call_logs (task_id, api_name, method, request_url, request_body, response_status, response_body, duration_ms, called_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(task_id || null, api_name, method || null, request_url || null, request_body || null, response_status || null, response_body || null, duration_ms || null);

    if (response_status && response_status >= 400) {
      db.prepare(`
        INSERT INTO alarm_records (alarm_type, severity, source, message, related_id, related_type, handle_result)
        VALUES ('api_error', 'medium', 'api_call', ?, ?, 'call_log', 'pending')
      `).run(`API调用失败: ${api_name}`, result.lastInsertRowid);
    }

    res.json({ id: result.lastInsertRowid, success: true });
  });

  router.get('/alarm-records', (req, res) => {
    const alarms = db.prepare(`
      SELECT ar.*, u.name as handler_name
      FROM alarm_records ar
      LEFT JOIN users u ON ar.handled_by = u.id
      ORDER BY ar.created_at DESC
      LIMIT 100
    `).all();
    res.json(alarms);
  });

  router.post('/alarm-records/:id/handle', (req, res) => {
    const { handle_result } = req.body;
    db.prepare(`
      UPDATE alarm_records 
      SET handle_result = ?, handled_by = 1, handled_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(handle_result, req.params.id);

    res.json({ success: true });
  });

  router.get('/operation-logs', (req, res) => {
    const logs = db.prepare(`
      SELECT ol.*, u.name as user_name
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      ORDER BY ol.created_at DESC
      LIMIT 100
    `).all();
    res.json(logs);
  });

  router.get('/classification-rules', (req, res) => {
    const rules = db.prepare('SELECT * FROM classification_rules ORDER BY priority DESC').all();
    res.json(rules);
  });

  router.post('/classification-rules', (req, res) => {
    const { rule_name, rule_type, pattern, priority, owner_id } = req.body;
    
    try {
      const result = db.prepare(`
        INSERT INTO classification_rules (rule_name, rule_type, pattern, priority, owner_id, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(rule_name, rule_type, pattern, priority || 0, owner_id || null);

      res.json({ id: result.lastInsertRowid, success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/permissions', (req, res) => {
    const perms = db.prepare(`
      SELECT p.*, u.name as user_name, u_grant.name as granter_name
      FROM permissions p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN users u_grant ON p.granted_by = u_grant.id
      ORDER BY p.created_at DESC
    `).all();
    res.json(perms);
  });

  router.post('/permissions', (req, res) => {
    const { user_id, resource_type, resource_id, action, valid_from, valid_until } = req.body;
    
    const now = new Date().toISOString();
    if (valid_from && valid_from < now) {
      return res.status(400).json({ error: '权限生效时间不能早于当前时间' });
    }
    if (valid_from && valid_until && valid_from > valid_until) {
      return res.status(400).json({ error: '权限生效时间不能晚于失效时间' });
    }

    const result = db.prepare(`
      INSERT INTO permissions (user_id, resource_type, resource_id, action, granted_by, valid_from, valid_until)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `).run(user_id, resource_type, resource_id || null, action, valid_from || null, valid_until || null);

    res.json({ id: result.lastInsertRowid, success: true });
  });

  router.get('/permission-audit', (req, res) => {
    const audits = db.prepare(`
      SELECT pa.*, u.name as user_name
      FROM permission_audit pa
      JOIN users u ON pa.user_id = u.id
      ORDER BY pa.audited_at DESC
      LIMIT 100
    `).all();
    res.json(audits);
  });

  router.get('/dashboard/stats', (req, res) => {
    const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get();
    const envCount = db.prepare('SELECT COUNT(*) as count FROM environments').get();
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM change_orders').get();
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM execution_tasks').get();
    const alarmCount = db.prepare("SELECT COUNT(*) as count FROM alarm_records WHERE handle_result IS NULL OR handle_result = 'pending'").get();
    
    const ordersByStatus = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM change_orders 
      GROUP BY status
    `).all();

    const tasksByStatus = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM execution_tasks 
      GROUP BY status
    `).all();

    const recentActivities = db.prepare(`
      SELECT 'change_order' as type, title, status, created_at, order_no as no
      FROM change_orders
      UNION ALL
      SELECT 'task' as type, task_type as title, status, created_at, task_no as no
      FROM execution_tasks
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    res.json({
      appCount: appCount.count,
      envCount: envCount.count,
      orderCount: orderCount.count,
      taskCount: taskCount.count,
      alarmCount: alarmCount.count,
      ordersByStatus,
      tasksByStatus,
      recentActivities
    });
  });

  router.get('/export/:type', (req, res) => {
    const { type } = req.params;
    let result = {
      export_type: type,
      export_time: new Date().toISOString(),
      version: '1.0',
      data: []
    };

    switch (type) {
      case 'applications':
        result.data = db.prepare(`
          SELECT a.*, u.name as owner_name, c.name as creator_name
          FROM applications a
          LEFT JOIN users u ON a.owner_id = u.id
          LEFT JOIN users c ON a.created_by = c.id
        `).all();
        break;
      case 'change-orders':
        result.data = db.prepare(`
          SELECT co.*, a.app_name, e.env_name,
                 u1.name as creator_name, u2.name as submitter_name,
                 u3.name as executor_name, u4.name as reviewer_name
          FROM change_orders co
          LEFT JOIN applications a ON co.app_id = a.id
          LEFT JOIN environments e ON co.env_id = e.id
          LEFT JOIN users u1 ON co.created_by = u1.id
          LEFT JOIN users u2 ON co.submitted_by = u2.id
          LEFT JOIN users u3 ON co.executed_by = u3.id
          LEFT JOIN users u4 ON co.reviewed_by = u4.id
        `).all();
        break;
      case 'execution-tasks':
        result.data = db.prepare(`
          SELECT et.*, co.order_no, u.name as executor_name
          FROM execution_tasks et
          LEFT JOIN change_orders co ON et.change_order_id = co.id
          LEFT JOIN users u ON et.executed_by = u.id
        `).all();
        break;
      default:
        return res.status(400).json({ error: '不支持的导出类型' });
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-export-${Date.now()}.json"`);
    res.json(result);
  });

  return router;
}

module.exports = { createRoutes };
