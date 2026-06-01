import express from 'express';
import db from '../database/init.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import { validateTaskExecution, preventDuplicateTask } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

const simulateTaskExecution = async (taskId, strategy, taskType = 'backup', sourceTaskId = null) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let steps = [];
      
      if (taskType === 'restore') {
        steps = [
          { name: '权限校验', status: 'success', input: 'check permissions', output: 'granted' },
          { name: '读取备份文件', status: 'success', input: 'read backup file', output: 'file loaded' },
          { name: '校验备份完整性', status: 'success', input: 'verify checksum', output: 'verified' },
          { name: '停止数据库服务', status: 'success', input: 'stop service', output: 'stopped' },
          { name: '执行数据恢复', status: Math.random() > 0.1 ? 'success' : 'failed', input: 'restore data', output: '' },
          { name: '重建索引', status: 'success', input: 'rebuild index', output: 'completed' },
          { name: '启动数据库服务', status: 'success', input: 'start service', output: 'started' },
          { name: '数据验证', status: 'success', input: 'verify data', output: 'passed' }
        ];
      } else if (taskType === 'verify') {
        steps = [
          { name: '权限校验', status: 'success', input: 'check permissions', output: 'granted' },
          { name: '读取备份文件', status: 'success', input: 'read backup', output: 'loaded' },
          { name: '文件大小校验', status: 'success', input: 'check size', output: 'matched' },
          { name: 'MD5校验', status: 'success', input: 'check md5', output: 'matched' },
          { name: '备份头信息检查', status: 'success', input: 'check header', output: 'valid' },
          { name: '表结构验证', status: 'success', input: 'check schema', output: 'complete' },
          { name: '数据行数统计', status: 'success', input: 'count rows', output: 'matched' },
          { name: '生成验证报告', status: 'success', input: 'gen report', output: 'done' }
        ];
      } else {
        steps = [
          { name: '权限校验', status: 'success', input: 'check permissions', output: 'granted' },
          { name: '连接数据库', status: 'success', input: 'connect db', output: 'connected' },
          { name: '锁定表', status: 'success', input: 'lock tables', output: 'locked' },
          { name: '执行备份', status: Math.random() > 0.2 ? 'success' : 'failed', input: 'execute dump', output: '' },
          { name: '压缩文件', status: 'success', input: 'compress', output: 'compressed' },
          { name: '加密存储', status: 'success', input: 'encrypt', output: 'encrypted' },
          { name: '校验完整性', status: 'success', input: 'verify checksum', output: 'verified' },
          { name: '解锁释放', status: 'success', input: 'unlock', output: 'released' }
        ];
      }

      const failedStep = steps.find(s => s.status === 'failed');
      const allSuccess = !failedStep;
      
      if (failedStep) {
        failedStep.output = 'failed';
        const stepIndex = steps.indexOf(failedStep);
        for (let i = stepIndex + 1; i < steps.length; i++) {
          steps[i].status = 'skipped';
          steps[i].output = 'skipped';
        }
      }
      
      const updateStmt = db.prepare(`
        UPDATE tasks 
        SET status = ?, completed_at = CURRENT_TIMESTAMP, 
            duration_seconds = 5, backup_size = ?,
            error_code = ?, error_message = ?
        WHERE id = ?
      `);

      const stepStmt = db.prepare(`
        INSERT INTO task_steps (task_id, step_name, step_order, status, input_data, output_data, started_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      steps.forEach((step, index) => {
        stepStmt.run(taskId, step.name, index + 1, step.status, step.input, step.output);
      });

      if (allSuccess) {
        updateStmt.run('success', Math.floor(Math.random() * 1000000000), null, null, taskId);
      } else {
        const errorCode = 'BACKUP_FAILED';
        const errorMsg = `${failedStep.name}步骤失败：数据传输超时`;
        updateStmt.run('failed', null, errorCode, errorMsg, taskId);
        
        const task = db.prepare('SELECT app_id, env_id FROM tasks WHERE id = ?').get(taskId);
        
        db.prepare(`
          INSERT INTO exceptions (exception_no, task_id, exception_type, severity, error_details, stack_trace, status)
          VALUES (?, ?, 'data_error', 'high', ?, ?, 'investigating')
        `).run(
          `EXC-${Date.now()}`,
          taskId,
          errorMsg,
          `Error: ${failedStep.name} step failed\n    at TaskExecution.execute (/app/lib/task.js:${45 + failedStep.step_order}:23)`
        );

        db.prepare(`
          INSERT INTO alerts (alert_no, alert_type, severity, title, content, task_id, app_id, env_id, status)
          VALUES (?, 'task_failed', 'error', ?, ?, ?, ?, ?, 'active')
        `).run(
          `ALT-${Date.now()}`,
          `任务执行失败`,
          errorMsg,
          taskId,
          task?.app_id,
          task?.env_id
        );
      }

      resolve(allSuccess);
    }, 3000);
  });
};

router.get('/', checkPermission('task', 'read'), (req, res) => {
  const { 
    app_id, env_id, strategy_id, task_type, status, 
    operator_id, start_date, end_date, keyword, 
    page = 1, pageSize = 20 
  } = req.query;
  
  let query = `
    SELECT t.*, a.app_code, a.app_name, e.env_name, bs.strategy_name, 
           u.real_name as operator_name, co.change_no
    FROM tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN backup_strategies bs ON t.strategy_id = bs.id
    LEFT JOIN users u ON t.operator_id = u.id
    LEFT JOIN change_orders co ON t.change_order_id = co.id
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
  if (strategy_id) {
    query += ' AND t.strategy_id = ?';
    params.push(strategy_id);
  }
  if (task_type) {
    query += ' AND t.task_type = ?';
    params.push(task_type);
  }
  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }
  if (operator_id) {
    query += ' AND t.operator_id = ?';
    params.push(operator_id);
  }
  if (start_date) {
    query += ' AND t.created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND t.created_at <= ?';
    params.push(end_date);
  }
  if (keyword) {
    query += ' AND (t.task_no LIKE ? OR a.app_name LIKE ? OR e.env_name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const totalResult = db.prepare(query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as count FROM')).get(...params);
  const total = totalResult ? totalResult.count : 0;
  
  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const tasks = db.prepare(query).all(...params);

  res.json({
    list: tasks,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/', checkPermission('task', 'create'), preventDuplicateTask, validateTaskExecution, async (req, res) => {
  const { task_type, strategy_id, change_order_id, priority, parameters } = req.body;

  const strategy = req.strategy;
  
  const taskNo = `TASK-${Date.now()}`;
  
  const result = db.prepare(`
    INSERT INTO tasks (
      task_no, task_type, app_id, env_id, strategy_id, change_order_id,
      status, priority, rule_version, permission_checked, 
      previous_node_check_passed, materials_verified, original_request,
      parameters, operator_id
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, 1, 1, 1, ?, ?, ?)
  `).run(
    taskNo,
    task_type,
    strategy?.app_id || null,
    strategy?.env_id || null,
    strategy_id,
    change_order_id || null,
    priority || 'normal',
    strategy?.rule_version || 'v1.0',
    JSON.stringify(req.body),
    parameters ? JSON.stringify(parameters) : null,
    req.user.id
  );

  const taskId = result.lastInsertRowid;

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('task_execute', ?, ?, 'create', 'task', ?, ?, ?)
  `).run(req.user.id, req.user.username, taskId, taskNo, `创建任务: ${taskNo}`);

  db.prepare("UPDATE tasks SET status = 'running', started_at = CURRENT_TIMESTAMP WHERE id = ?").run(taskId);

  res.json({
    id: taskId,
    task_no: taskNo,
    message: '任务已提交，正在执行',
    status: 'running'
  });

  if (strategy) {
    await simulateTaskExecution(taskId, strategy, task_type, req.body.source_task_id);
  }
});

router.get('/:id', checkPermission('task', 'read'), (req, res) => {
  const task = db.prepare(`
    SELECT t.*, a.app_code, a.app_name, e.env_name, bs.strategy_name, 
           u.real_name as operator_name, co.change_no
    FROM tasks t
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN environments e ON t.env_id = e.id
    LEFT JOIN backup_strategies bs ON t.strategy_id = bs.id
    LEFT JOIN users u ON t.operator_id = u.id
    LEFT JOIN change_orders co ON t.change_order_id = co.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const steps = db.prepare('SELECT * FROM task_steps WHERE task_id = ? ORDER BY step_order').all(req.params.id);
  const exceptions = db.prepare('SELECT * FROM exceptions WHERE task_id = ?').all(req.params.id);
  const attachments = db.prepare('SELECT * FROM attachments WHERE task_id = ?').all(req.params.id);

  res.json({
    ...task,
    steps,
    exceptions,
    attachments
  });
});

router.post('/:id/cancel', checkPermission('task', 'cancel'), (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  if (!['pending', 'running'].includes(task.status)) {
    return res.status(400).json({ error: '只能取消待执行或执行中的任务' });
  }

  db.prepare(`
    UPDATE tasks 
    SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('task_execute', ?, ?, 'cancel', 'task', ?, ?, ?)
  `).run(req.user.id, req.user.username, req.params.id, task.task_no, `取消任务: ${task.task_no}`);

  res.json({ message: '任务已取消' });
});

router.post('/:id/retry', checkPermission('task', 'execute'), validateTaskExecution, async (req, res) => {
  const { id } = req.params;
  const originalTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (!originalTask) {
    return res.status(404).json({ error: '原任务不存在' });
  }

  if (originalTask.status !== 'failed') {
    return res.status(400).json({ error: '只能重试失败的任务' });
  }

  const taskNo = `TASK-${Date.now()}-R${originalTask.retry_count + 1}`;
  
  const result = db.prepare(`
    INSERT INTO tasks (
      task_no, task_type, app_id, env_id, strategy_id, change_order_id,
      status, priority, rule_version, permission_checked, 
      previous_node_check_passed, materials_verified, original_request,
      parameters, operator_id, retry_count, parent_task_id
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, 1, 1, 1, ?, ?, ?, ?, ?)
  `).run(
    taskNo,
    originalTask.task_type,
    originalTask.app_id,
    originalTask.env_id,
    originalTask.strategy_id,
    originalTask.change_order_id,
    originalTask.priority,
    originalTask.rule_version,
    originalTask.original_request,
    originalTask.parameters,
    req.user.id,
    originalTask.retry_count + 1,
    originalTask.id
  );

  const taskId = result.lastInsertRowid;

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('task_execute', ?, ?, 'retry', 'task', ?, ?, ?)
  `).run(req.user.id, req.user.username, taskId, taskNo, `重试任务: ${taskNo}，原任务: ${originalTask.task_no}`);

  db.prepare("UPDATE tasks SET status = 'running', started_at = CURRENT_TIMESTAMP WHERE id = ?").run(taskId);

  res.json({
    id: taskId,
    task_no: taskNo,
    message: '重试任务已提交，正在执行',
    status: 'running'
  });

  const strategy = db.prepare('SELECT * FROM backup_strategies WHERE id = ?').get(originalTask.strategy_id);
  if (strategy) {
    await simulateTaskExecution(taskId, strategy, originalTask.task_type);
  }
});

export default router;
