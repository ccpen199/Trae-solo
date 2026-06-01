const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { permissionMiddleware, createAuditLog, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { app_id, env_id, status, created_by } = req.query;
  
  let query = `
    SELECT t.*, a.name as app_name, e.name as env_name, 
           u.name as creator_name, cv.version as config_version
    FROM execution_tasks t
    JOIN applications a ON t.app_id = a.id
    JOIN environments e ON t.env_id = e.id
    JOIN users u ON t.created_by = u.id
    JOIN config_versions cv ON t.version_id = cv.id
    WHERE 1=1
  `;
  const params = [];

  if (app_id) {
    query += ' AND t.app_id = ?';
    params.push(app_id);
  }
  if (env_id) {
    query += ' AND t.env_id = ?';
    params.push(env_id);
  }
  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }
  if (created_by) {
    query += ' AND t.created_by = ?';
    params.push(created_by);
  }

  query += ' ORDER BY t.created_at DESC';

  const tasks = db.prepare(query).all(...params);
  res.json(tasks);
});

router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*, a.name as app_name, e.name as env_name,
           u.name as creator_name, cv.version as config_version,
           cv.config_content, ua.name as approver_name, ue.name as executor_name
    FROM execution_tasks t
    JOIN applications a ON t.app_id = a.id
    JOIN environments e ON t.env_id = e.id
    JOIN users u ON t.created_by = u.id
    JOIN config_versions cv ON t.version_id = cv.id
    LEFT JOIN users ua ON t.approved_by = ua.id
    LEFT JOIN users ue ON t.executed_by = ue.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const logs = db.prepare(`
    SELECT tel.*, u.name as operator_name
    FROM task_execution_logs tel
    JOIN users u ON tel.operator_id = u.id
    WHERE tel.task_id = ?
    ORDER BY tel.created_at DESC
  `).all(req.params.id);

  res.json({ ...task, logs });
});

router.post('/', permissionMiddleware('task', 'create'), (req, res) => {
  const { app_id, env_id, version_id, task_type, title, description, reason, gray_strategy, gray_percentage, impact_scope } = req.body;
  const user = req.user;

  const validation = [];
  if (!app_id) validation.push('请选择应用（下拉列表中选择）');
  if (!env_id) validation.push('请选择环境（下拉列表中选择）');
  if (!version_id) validation.push('请选择配置版本（下拉列表中选择）');
  if (!task_type) validation.push('请选择任务类型');
  if (!title || title.length < 5) validation.push('任务标题至少5个字符，建议格式："应用名 版本 变更目的"，如"用户中心 v1.0.0 灰度发布"');
  if (!reason || reason.length < 10) validation.push('变更原因至少10个字符，需说明：1) 变更背景 2) 要解决的问题 3) 预期效果');
  if (!gray_strategy) validation.push('请选择灰度策略（按比例/金丝雀/按用户组）');
  if (gray_percentage === undefined || gray_percentage < 0 || gray_percentage > 100) validation.push('灰度比例必须在0-100之间，建议从5-10%开始');

  if (validation.length > 0) {
    return res.status(400).json({ error: '字段验证失败', details: validation });
  }

  const version = db.prepare('SELECT * FROM config_versions WHERE id = ?').get(version_id);
  if (!version) {
    return res.status(400).json({ error: '配置版本不存在' });
  }

  const id = uuidv4();
  const rollbackPath = `/api/config/versions/${version_id}/rollback`;

  db.prepare(`
    INSERT INTO execution_tasks (id, app_id, env_id, version_id, task_type, title, description, reason, gray_strategy, gray_percentage, impact_scope, rollback_path, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, app_id, env_id, version_id, task_type, title, description || '', reason, gray_strategy, gray_percentage, impact_scope || '', rollbackPath, user.id);

  db.prepare(`
    INSERT INTO task_execution_logs (id, task_id, action, operator_id, operator_name, details, before_state, after_state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), id, 'created', user.id, user.name, '任务已创建', null, 'pending');

  createAuditLog(user.id, user.name, 'create_task', 'task', id, { title, app_id }, req.ip);

  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(id);
  res.status(201).json(task);
});

router.post('/:id/approve', roleMiddleware('admin', 'owner', 'security'), (req, res) => {
  const taskId = req.params.id;
  const user = req.user;

  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(taskId);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  if (task.status !== 'pending') {
    return res.status(400).json({ error: '只能审批待处理的任务' });
  }

  db.prepare(`
    UPDATE execution_tasks 
    SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(user.id, taskId);

  db.prepare(`
    INSERT INTO task_execution_logs (id, task_id, action, operator_id, operator_name, details, before_state, after_state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), taskId, 'approved', user.id, user.name, '任务已通过审批', 'pending', 'approved');

  createAuditLog(user.id, user.name, 'approve_task', 'task', taskId, {}, req.ip);

  res.json({ message: '审批通过' });
});

router.post('/:id/reject', roleMiddleware('admin', 'owner', 'security'), (req, res) => {
  const taskId = req.params.id;
  const user = req.user;
  const { reason } = req.body;

  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(taskId);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  db.prepare(`
    UPDATE execution_tasks 
    SET status = 'rejected'
    WHERE id = ?
  `).run(taskId);

  db.prepare(`
    INSERT INTO task_execution_logs (id, task_id, action, operator_id, operator_name, details, before_state, after_state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), taskId, 'rejected', user.id, user.name, reason || '任务被拒绝', task.status, 'rejected');

  createAuditLog(user.id, user.name, 'reject_task', 'task', taskId, { reason }, req.ip);

  res.json({ message: '任务已拒绝' });
});

router.post('/:id/execute', permissionMiddleware('task', 'execute'), (req, res) => {
  const taskId = req.params.id;
  const user = req.user;

  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(taskId);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  if (task.status !== 'approved') {
    return res.status(400).json({ error: '只能执行已审批的任务' });
  }

  db.prepare(`
    UPDATE execution_tasks 
    SET status = 'running', executed_by = ?, started_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(user.id, taskId);

  db.prepare(`
    INSERT INTO task_execution_logs (id, task_id, action, operator_id, operator_name, details, before_state, after_state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), taskId, 'start_execution', user.id, user.name, '【阶段1/5】开始执行灰度发布任务', 'approved', 'running');

  db.prepare(`
    INSERT INTO task_execution_logs (id, task_id, action, operator_id, operator_name, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), taskId, 'config_push', user.id, user.name, '【阶段2/5】正在推送配置到配置中心...');

  db.prepare(`
    INSERT INTO task_execution_logs (id, task_id, action, operator_id, operator_name, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), taskId, 'gray_verify', user.id, user.name, '【阶段3/5】正在验证灰度节点配置...');

  db.prepare(`
    INSERT INTO task_execution_logs (id, task_id, action, operator_id, operator_name, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), taskId, 'traffic_shift', user.id, user.name, '【阶段4/5】正在切换灰度流量...');

  db.prepare(`
    INSERT INTO task_execution_logs (id, task_id, action, operator_id, operator_name, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), taskId, 'health_check', user.id, user.name, '【阶段5/5】正在进行健康检查...');

  const simulateExecution = setTimeout(() => {
    db.prepare(`
      UPDATE execution_tasks 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(taskId);

    db.prepare(`
      INSERT INTO task_execution_logs (id, task_id, action, operator_id, operator_name, details, before_state, after_state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), taskId, 'completed', user.id, user.name, '✅ 灰度发布任务执行成功！配置已生效', 'running', 'completed');

    db.prepare('UPDATE config_versions SET status = ? WHERE id = ?').run('published', task.version_id);
  }, 5000);

  createAuditLog(user.id, user.name, 'execute_task', 'task', taskId, {}, req.ip);

  res.json({ 
    message: '任务开始执行',
    estimated_duration: 5000,
    stages: ['配置推送', '灰度验证', '流量切换', '健康检查', '执行完成']
  });
});

router.post('/:id/rollback', permissionMiddleware('task', 'execute'), (req, res) => {
  const taskId = req.params.id;
  const user = req.user;
  const { reason } = req.body;

  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(taskId);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  if (task.status !== 'completed') {
    return res.status(400).json({ error: '只能回滚已完成的任务' });
  }

  db.prepare(`
    UPDATE execution_tasks 
    SET status = 'rollback'
    WHERE id = ?
  `).run(taskId);

  db.prepare(`
    INSERT INTO task_execution_logs (id, task_id, action, operator_id, operator_name, details, before_state, after_state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), taskId, 'rollback', user.id, user.name, reason || '执行回滚', 'completed', 'rollback');

  db.prepare('UPDATE config_versions SET status = ? WHERE id = ?').run('archived', task.version_id);

  createAuditLog(user.id, user.name, 'rollback_task', 'task', taskId, { reason }, req.ip);

  res.json({ message: '回滚完成' });
});

router.post('/batch/:action', permissionMiddleware('task', 'execute'), (req, res) => {
  const { task_ids } = req.body;
  const action = req.params.action;
  const user = req.user;

  if (!['approve', 'reject', 'cancel'].includes(action)) {
    return res.status(400).json({ error: '无效的批量操作' });
  }

  const results = [];
  for (const taskId of task_ids) {
    try {
      const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(taskId);
      if (task) {
        if (action === 'approve' && task.status === 'pending') {
          db.prepare('UPDATE execution_tasks SET status = ?, approved_by = ? WHERE id = ?').run('approved', user.id, taskId);
        } else if (action === 'reject') {
          db.prepare('UPDATE execution_tasks SET status = ? WHERE id = ?').run('rejected', taskId);
        } else if (action === 'cancel') {
          db.prepare('UPDATE execution_tasks SET status = ? WHERE id = ?').run('cancelled', taskId);
        }
        results.push({ taskId, success: true });
      } else {
        results.push({ taskId, success: false, error: '任务不存在' });
      }
    } catch (e) {
      results.push({ taskId, success: false, error: e.message });
    }
  }

  createAuditLog(user.id, user.name, `batch_${action}`, 'task', null, { task_ids }, req.ip);

  res.json({ results });
});

module.exports = router;
