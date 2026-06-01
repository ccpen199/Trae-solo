const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, type, app_id, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT t.*, u.name as assignee_name, app.name as app_name, env.name as env_name
    FROM execution_tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN applications app ON t.app_id = app.id
    LEFT JOIN environments env ON t.env_id = env.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }
  if (app_id) {
    query += ' AND t.app_id = ?';
    params.push(app_id);
  }
  
  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const tasks = db.prepare(query).all(...params);
  
  const countQuery = 'SELECT COUNT(*) as total FROM execution_tasks WHERE 1=1';
  const total = db.prepare(countQuery).get().total;
  
  res.json({
    list: tasks,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, app.name as app_name, env.name as env_name
    FROM execution_tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN applications app ON t.app_id = app.id
    LEFT JOIN environments env ON t.env_id = env.id
    WHERE t.id = ?
  `).get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  res.json(task);
});

router.post('/', (req, res) => {
  const { app_id, env_id, type, name, params, assignee_id } = req.body;
  
  if (!type || !name) {
    return res.status(400).json({ error: '任务类型和名称不能为空' });
  }
  
  const existingTask = db.prepare(`
    SELECT * FROM execution_tasks 
    WHERE app_id = ? AND env_id = ? AND type = ? AND name = ? AND status IN ('pending', 'running')
  `).get(app_id, env_id, type, name);
  
  if (existingTask) {
    return res.status(400).json({ 
      error: '存在相同的待执行任务，请避免重复提交',
      existing_task_id: existingTask.task_id,
      field: 'duplicate'
    });
  }
  
  const taskId = 'task-' + Date.now() + '-' + uuidv4().slice(0, 4);
  
  const result = db.prepare(`
    INSERT INTO execution_tasks (task_id, app_id, env_id, type, name, params, status, assignee_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, 1)
  `).run(taskId, app_id || null, env_id || null, type, name, params ? JSON.stringify(params) : null, assignee_id || null);
  
  db.prepare(`
    INSERT INTO audit_logs (log_id, user_id, action, resource_type, resource_id, new_value, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    `audit-${Date.now()}`,
    1,
    'create',
    'task',
    result.lastInsertRowid,
    JSON.stringify({ task_id: taskId, name, type }),
    req.ip
  );
  
  res.json({
    id: result.lastInsertRowid,
    task_id: taskId,
    name,
    type,
    status: 'pending'
  });
});

router.put('/:id/status', (req, res) => {
  const { status, result: taskResult } = req.body;
  
  const validStatuses = ['pending', 'running', 'completed', 'failed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }
  
  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  let updateQuery = 'UPDATE execution_tasks SET status = ?';
  const updateParams = [status];
  
  if (status === 'running') {
    updateQuery += ', started_at = CURRENT_TIMESTAMP';
  }
  if (status === 'completed' || status === 'failed') {
    updateQuery += ', completed_at = CURRENT_TIMESTAMP';
  }
  if (taskResult) {
    updateQuery += ', result = ?';
    updateParams.push(JSON.stringify(taskResult));
  }
  
  updateQuery += ' WHERE id = ?';
  updateParams.push(req.params.id);
  
  db.prepare(updateQuery).run(...updateParams);
  
  db.prepare(`
    INSERT INTO audit_logs (log_id, user_id, action, resource_type, resource_id, old_value, new_value, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `audit-${Date.now()}`,
    1,
    'update_status',
    'task',
    req.params.id,
    JSON.stringify({ status: task.status }),
    JSON.stringify({ status }),
    req.ip
  );
  
  res.json({ message: '状态更新成功' });
});

router.delete('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (task.status === 'running') {
    return res.status(400).json({ error: '运行中的任务不能删除' });
  }
  
  db.prepare('DELETE FROM execution_tasks WHERE id = ?').run(req.params.id);
  
  res.json({ message: '删除成功' });
});

router.post('/batch-action', (req, res) => {
  const { ids, action, params } = req.body;
  
  if (!ids || !ids.length || !action) {
    return res.status(400).json({ error: '参数不完整' });
  }
  
  const placeholders = ids.map(() => '?').join(',');
  
  if (action === 'cancel') {
    db.prepare(`
      UPDATE execution_tasks 
      SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP 
      WHERE id IN (${placeholders}) AND status IN ('pending', 'running')
    `).run(...ids);
  } else if (action === 'assign') {
    db.prepare(`
      UPDATE execution_tasks SET assignee_id = ? WHERE id IN (${placeholders})
    `).run(params.assignee_id, ...ids);
  }
  
  res.json({ message: '批量操作成功' });
});

router.get('/:id/logs', (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM task_logs 
    WHERE task_id = ? 
    ORDER BY created_at ASC, id ASC
  `).all(req.params.id);
  
  res.json(logs);
});

function addTaskLog(taskId, level, message) {
  db.prepare(`
    INSERT INTO task_logs (task_id, level, message)
    VALUES (?, ?, ?)
  `).run(taskId, level, message);
}

router.post('/:id/execute', async (req, res) => {
  const taskId = req.params.id;
  const task = db.prepare('SELECT * FROM execution_tasks WHERE id = ?').get(taskId);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (task.status === 'running') {
    return res.status(400).json({ error: '任务正在执行中' });
  }
  
  db.prepare(`
    UPDATE execution_tasks 
    SET status = 'running', started_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(taskId);
  
  addTaskLog(taskId, 'info', '🚀 任务开始执行');
  addTaskLog(taskId, 'info', `任务类型: ${task.type}`);
  addTaskLog(taskId, 'info', `任务名称: ${task.name}`);
  
  res.json({ message: '任务已启动' });
  
  setTimeout(() => simulateTaskExecution(taskId, task.type), 100);
});

function simulateTaskExecution(taskId, taskType) {
  const steps = getExecutionSteps(taskType);
  let stepIndex = 0;
  
  const executeStep = () => {
    if (stepIndex >= steps.length) {
      addTaskLog(taskId, 'success', '✅ 任务执行完成');
      db.prepare(`
        UPDATE execution_tasks 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
            result = ? 
        WHERE id = ?
      `).run(JSON.stringify({ success: true, completed_at: new Date().toISOString() }), taskId);
      return;
    }
    
    const step = steps[stepIndex];
    addTaskLog(taskId, step.level || 'info', step.message);
    
    if (step.delay) {
      stepIndex++;
      setTimeout(executeStep, step.delay);
    } else {
      stepIndex++;
      executeStep();
    }
  };
  
  executeStep();
}

function getExecutionSteps(type) {
  const commonSteps = [
    { message: '📋 验证任务参数...', delay: 500 },
    { message: '✅ 参数验证通过', level: 'success' },
    { message: '🔍 检查依赖服务状态...', delay: 800 },
    { message: '✅ 依赖服务正常', level: 'success' },
  ];
  
  const typeSteps = {
    deploy: [
      { message: '📦 拉取最新代码...', delay: 1000 },
      { message: '✅ 代码拉取完成', level: 'success' },
      { message: '🔨 编译构建中...', delay: 1500 },
      { message: '✅ 构建完成', level: 'success' },
      { message: '⚙️  执行单元测试...', delay: 800 },
      { message: '✅ 测试通过 (128/128)', level: 'success' },
      { message: '🚀 部署到目标环境...', delay: 1200 },
      { message: '✅ 部署完成', level: 'success' },
      { message: '🔄 健康检查...', delay: 600 },
      { message: '✅ 服务健康状态正常', level: 'success' },
    ],
    config: [
      { message: '📝 读取配置模板...', delay: 400 },
      { message: '✅ 配置模板加载完成', level: 'success' },
      { message: '🔧 替换环境变量...', delay: 300 },
      { message: '✅ 变量替换完成', level: 'success' },
      { message: '🔍 配置语法校验...', delay: 500 },
      { message: '✅ 配置语法正确', level: 'success' },
      { message: '💾 写入配置文件...', delay: 400 },
      { message: '✅ 配置写入完成', level: 'success' },
      { message: '🔄 重新加载配置...', delay: 600 },
      { message: '✅ 配置已生效', level: 'success' },
    ],
    rollback: [
      { message: '⏪ 准备回滚操作...', delay: 500 },
      { message: '✅ 回滚目标版本确认', level: 'success' },
      { message: '📦 拉取历史版本...', delay: 1000 },
      { message: '✅ 历史版本拉取完成', level: 'success' },
      { message: '🚫 停止当前服务...', delay: 800 },
      { message: '✅ 服务已停止', level: 'success' },
      { message: '🔄 切换到历史版本...', delay: 600 },
      { message: '✅ 版本切换完成', level: 'success' },
      { message: '▶️  重启服务...', delay: 800 },
      { message: '✅ 服务重启成功', level: 'success' },
      { message: '🔍 验证回滚结果...', delay: 500 },
      { message: '✅ 回滚验证通过', level: 'success' },
    ],
    restart: [
      { message: '⏹️  正在停止服务...', delay: 1000 },
      { message: '✅ 服务已停止', level: 'success' },
      { message: '⏳ 等待端口释放...', delay: 800 },
      { message: '✅ 端口已释放', level: 'success' },
      { message: '▶️  正在启动服务...', delay: 1200 },
      { message: '✅ 服务启动中', level: 'success' },
      { message: '🔍 等待服务就绪...', delay: 1000 },
      { message: '✅ 服务已就绪', level: 'success' },
      { message: '🔬 功能验证...', delay: 600 },
      { message: '✅ 重启验证通过', level: 'success' },
    ],
  };
  
  return [...commonSteps, ...(typeSteps[type] || typeSteps.deploy)];
}

module.exports = router;
