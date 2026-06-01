const { db } = require('../models/database');
const { v4: uuidv4 } = require('uuid');

const validateTaskExecution = (taskId, userId) => {
  const task = db.prepare('SELECT * FROM execution_tasks WHERE task_id = ?').get(taskId);
  if (!task) {
    return { valid: false, reason: '任务不存在' };
  }

  if (task.status !== 'approved' && task.status !== 'pending') {
    return { valid: false, reason: '任务状态不允许执行' };
  }

  const hasPermission = db.prepare(`
    SELECT 1 FROM users u
    WHERE u.id = ? AND u.role IN ('platform_engineer', 'ops', 'security_admin')
  `).get(userId);

  if (!hasPermission) {
    return { valid: false, reason: '没有执行权限' };
  }

  if (task.previous_task_id) {
    const prevTask = db.prepare('SELECT status FROM execution_tasks WHERE id = ?').get(task.previous_task_id);
    if (prevTask && prevTask.status !== 'success') {
      return { valid: false, reason: '上一节点任务未成功完成' };
    }
  }

  if (task.required_materials) {
    const required = JSON.parse(task.required_materials);
    if (!required.every(m => m.submitted)) {
      return { valid: false, reason: '存在未提交的必填材料' };
    }
  }

  if (task.config_version_id) {
    const config = db.prepare('SELECT status FROM mfa_config_versions WHERE id = ?').get(task.config_version_id);
    if (!config || config.status !== 'approved') {
      return { valid: false, reason: '配置版本未通过审批' };
    }
  }

  return { valid: true, task };
};

const createTask = (req, res) => {
  const { taskType, appId, envId, configVersionId, priority, requiredMaterials } = req.body;

  if (!taskType || !appId) {
    return res.status(400).json({ error: '任务类型和应用ID不能为空' });
  }

  const taskId = `task_${Date.now()}_${uuidv4().substr(0, 8)}`;

  const stmt = db.prepare(`
    INSERT INTO execution_tasks (task_id, task_type, app_id, env_id, config_version_id, priority, required_materials, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `);

  const result = stmt.run(
    taskId, 
    taskType, 
    appId, 
    envId || null, 
    configVersionId || null, 
    priority || 'normal',
    requiredMaterials ? JSON.stringify(requiredMaterials) : null,
    req.user.id
  );

  res.json({
    id: result.lastInsertRowid,
    taskId,
    message: '任务创建成功'
  });
};

const getTasks = (req, res) => {
  const { status, appId, taskType, executor, startDate, endDate } = req.query;

  let query = `
    SELECT t.*, a.app_name, e.env_name, creator.real_name as creator_name, 
           executor.real_name as executor_name, approver.real_name as approver_name
    FROM execution_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN users creator ON t.created_by = creator.id
    LEFT JOIN users executor ON t.executor_id = executor.id
    LEFT JOIN users approver ON t.approver_id = approver.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }

  if (appId) {
    query += ' AND t.app_id = ?';
    params.push(appId);
  }

  if (taskType) {
    query += ' AND t.task_type = ?';
    params.push(taskType);
  }

  if (executor) {
    query += ' AND t.executor_id = ?';
    params.push(executor);
  }

  if (startDate) {
    query += ' AND t.created_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND t.created_at <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY t.created_at DESC LIMIT 100';

  const tasks = db.prepare(query).all(...params);

  res.json({ tasks });
};

const getTaskById = (req, res) => {
  const task = db.prepare(`
    SELECT t.*, a.app_name, e.env_name, creator.real_name as creator_name, 
           executor.real_name as executor_name, approver.real_name as approver_name
    FROM execution_tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN users creator ON t.created_by = creator.id
    LEFT JOIN users executor ON t.executor_id = executor.id
    LEFT JOIN users approver ON t.approver_id = approver.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const logs = db.prepare(`
    SELECT * FROM call_logs WHERE task_id = ? ORDER BY created_at DESC
  `).all(task.task_id);

  const exceptions = db.prepare(`
    SELECT * FROM exception_records WHERE task_id = ? ORDER BY created_at DESC
  `).all(task.task_id);

  res.json({ task, logs, exceptions });
};

const approveTask = (req, res) => {
  const { id } = req.params;

  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  db.prepare(`
    UPDATE execution_tasks 
    SET status = 'approved', approver_id = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, id);

  res.json({ message: '任务审批通过' });
};

const executeTask = async (req, res) => {
  const { id } = req.params;
  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(id);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const validation = validateTaskExecution(task.task_id, req.user.id);
  if (!validation.valid) {
    db.prepare(`
      INSERT INTO exception_records (exception_id, task_id, failure_reason, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(`exc_${Date.now()}`, task.task_id, `执行校验失败: ${validation.reason}`);

    return res.status(400).json({ error: validation.reason });
  }

  db.prepare(`
    UPDATE execution_tasks 
    SET status = 'executing', executor_id = ?, started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, id);

  const logId = `log_${Date.now()}`;
  db.prepare(`
    INSERT INTO call_logs (log_id, task_id, app_id, env_id, operation_type, request_data, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(logId, task.task_id, task.app_id, task.env_id, task.task_type, JSON.stringify(req.body), req.user.id);

  setTimeout(() => {
    const success = Math.random() > 0.2;
    
    if (success) {
      db.prepare(`
        UPDATE execution_tasks 
        SET status = 'success', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);

      db.prepare(`
        UPDATE call_logs 
        SET status = 'success', response_data = ?, execution_time = ?
        WHERE log_id = ?
      `).run(JSON.stringify({ result: '执行成功', timestamp: new Date().toISOString() }), Math.floor(Math.random() * 1000), logId);
    } else {
      const errorMsg = '模拟执行失败：网络超时或配置错误';
      db.prepare(`
        UPDATE execution_tasks 
        SET status = 'failed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);

      db.prepare(`
        UPDATE call_logs 
        SET status = 'failed', error_message = ?, execution_time = ?
        WHERE log_id = ?
      `).run(errorMsg, Math.floor(Math.random() * 500), logId);

      db.prepare(`
        INSERT INTO exception_records (exception_id, task_id, log_id, original_request, failure_reason, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(`exc_${Date.now()}`, task.task_id, logId, JSON.stringify(req.body), errorMsg);

      db.prepare(`
        INSERT INTO alerts (alert_id, alert_type, severity, app_id, task_id, log_id, title, message, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', CURRENT_TIMESTAMP)
      `).run(
        `alert_${Date.now()}`, 
        'system_error', 
        'error',
        task.app_id,
        task.task_id,
        logId,
        '任务执行失败',
        `任务 ${task.task_id} 执行失败: ${errorMsg}`,
      );
    }
  }, 1000);

  res.json({ taskId: task.task_id, message: '任务开始执行', status: 'executing' });
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  approveTask,
  executeTask,
  validateTaskExecution
};
