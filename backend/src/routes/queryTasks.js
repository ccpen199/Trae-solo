const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../models/database');
const { checkPermission, logOperation } = require('../middleware/auth');

function logWorkflow(taskId, action, actor, reason, prevStatus, newStatus) {
  const stmt = db.prepare(`
    INSERT INTO task_workflow_logs (id, task_id, action, actor, reason, previous_status, new_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    `wl-${uuidv4().substr(0, 8)}`,
    taskId,
    action,
    actor,
    reason,
    prevStatus,
    newStatus
  );
}

router.get('/', checkPermission('task:view'), (req, res) => {
  const { status, owner, priority } = req.query;
  let sql = `
    SELECT qt.*, ds.name as data_source_name 
    FROM query_tasks qt 
    LEFT JOIN data_sources ds ON qt.data_source_id = ds.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND qt.status = ?';
    params.push(status);
  }
  if (owner) {
    sql += ' AND qt.owner = ?';
    params.push(owner);
  }
  if (priority) {
    sql += ' AND qt.priority = ?';
    params.push(priority);
  }
  sql += ' ORDER BY qt.created_at DESC';
  
  const stmt = db.prepare(sql);
  const tasks = stmt.all(...params);
  
  res.json({ data: tasks });
});

router.get('/dashboard/stats', checkPermission('task:view'), (req, res) => {
  const stats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM query_tasks
    GROUP BY status
  `).all();
  
  const todayStats = db.prepare(`
    SELECT 
      COUNT(*) as today_created,
      SUM(CASE WHEN status = 'executed' THEN 1 ELSE 0 END) as today_executed,
      SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as today_reviewed
    FROM query_tasks
    WHERE DATE(created_at) = DATE('now')
  `).get();
  
  const exceptionStats = db.prepare(`
    SELECT 
      exception_type,
      handling_result,
      COUNT(*) as count
    FROM exception_handlings
    WHERE DATE(created_at) >= DATE('now', '-7 days')
    GROUP BY exception_type, handling_result
  `).all();
  
  res.json({ 
    data: {
      byStatus: stats,
      today: todayStats,
      exceptions: exceptionStats
    } 
  });
});

router.get('/:id', checkPermission('task:view'), (req, res) => {
  const stmt = db.prepare(`
    SELECT qt.*, ds.name as data_source_name 
    FROM query_tasks qt 
    LEFT JOIN data_sources ds ON qt.data_source_id = ds.id 
    WHERE qt.id = ?
  `);
  const task = stmt.get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  res.json({ data: task });
});

router.get('/:id/workflow', checkPermission('task:view'), (req, res) => {
  const stmt = db.prepare(`
    SELECT * FROM task_workflow_logs 
    WHERE task_id = ? 
    ORDER BY created_at ASC
  `);
  const logs = stmt.all(req.params.id);
  
  res.json({ data: logs });
});

router.post('/', checkPermission('task:create'), (req, res) => {
  const { task_name, data_source_id, query_sql, description, priority, assignee, due_date } = req.body;
  
  if (!task_name) {
    return res.status(400).json({ error: '任务名称不能为空' });
  }
  
  const id = `task-${uuidv4().substr(0, 8)}`;
  const stmt = db.prepare(`
    INSERT INTO query_tasks (id, task_name, data_source_id, query_sql, description, owner, priority, assignee, due_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id, 
    task_name, 
    data_source_id, 
    query_sql, 
    description, 
    req.user.id, 
    priority || 'normal', 
    assignee, 
    due_date,
    req.user.id
  );
  
  logWorkflow(id, 'create', req.user.id, '创建任务', null, 'draft');
  logOperation(req, 'create', 'query_task', id);
  res.json({ data: { id } });
});

router.post('/:id/submit', checkPermission('task:create'), (req, res) => {
  const { reason } = req.body;
  
  const task = db.prepare('SELECT * FROM query_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  if (task.status !== 'draft') {
    return res.status(400).json({ error: '只有草稿状态可以提交' });
  }
  
  db.prepare(`
    UPDATE query_tasks 
    SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  logWorkflow(req.params.id, 'submit', req.user.id, reason || '提交审核', task.status, 'submitted');
  logOperation(req, 'submit', 'query_task', req.params.id);
  res.json({ data: { success: true } });
});

router.post('/:id/execute', checkPermission('task:execute'), (req, res) => {
  const task = db.prepare('SELECT * FROM query_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  if (!['submitted', 'reviewed'].includes(task.status)) {
    return res.status(400).json({ error: '任务状态不允许执行' });
  }
  
  const hasFieldAmbiguity = task.query_sql && task.query_sql.includes('ambiguous');
  const hasSqlError = task.query_sql && !task.query_sql.toUpperCase().includes('SELECT');
  const hasDataOverride = task.query_sql && task.query_sql.includes('sensitive');
  
  let handlingResult = 'manual_review';
  let exceptionType = null;
  let exceptionDetail = null;
  
  if (hasFieldAmbiguity) {
    exceptionType = 'field_ambiguity';
    exceptionDetail = 'SQL中存在字段歧义，需要人工确认口径';
    handlingResult = 'auto_block';
  } else if (hasSqlError) {
    exceptionType = 'sql_error';
    exceptionDetail = 'SQL语法错误，缺少SELECT语句';
    handlingResult = 'auto_block';
  } else if (hasDataOverride) {
    exceptionType = 'data_override';
    exceptionDetail = '查询涉及敏感数据，需要权限审批';
    handlingResult = 'manual_review';
  } else {
    handlingResult = 'continue_observe';
  }
  
  const resultId = `result-${uuidv4().substr(0, 8)}`;
  const recordCount = Math.floor(Math.random() * 10000) + 1000;
  const anomalyCount = Math.floor(recordCount * 0.05);
  
  db.prepare(`
    INSERT INTO result_tables (id, task_id, table_name, record_count, anomaly_count, execution_time, status, data_preview, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    resultId,
    req.params.id,
    `result_${req.params.id}`,
    recordCount,
    anomalyCount,
    Math.floor(Math.random() * 5000) + 1000,
    handlingResult === 'auto_block' ? 'blocked' : 'completed',
    JSON.stringify([
      { id: 1, field: 'GMV', value: 12345.67, status: 'normal' },
      { id: 2, field: 'DAU', value: 98765, status: 'normal' }
    ]),
    req.user.id
  );
  
  if (anomalyCount > 0) {
    const anomalyStmt = db.prepare(`
      INSERT INTO anomaly_records (id, result_table_id, anomaly_type, field_name, anomaly_value, expected_value, description, severity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    anomalyStmt.run(
      `anomaly-${uuidv4().substr(0, 8)}`,
      resultId,
      'outlier',
      'GMV',
      '999999.99',
      '50000.00',
      'GMV数值异常偏高，超过3倍标准差',
      'high'
    );
    anomalyStmt.run(
      `anomaly-${uuidv4().substr(0, 8)}`,
      resultId,
      'missing',
      'order_count',
      null,
      '>= 100',
      '订单计数字段存在空值',
      'medium'
    );
  }
  
  if (exceptionType) {
    db.prepare(`
      INSERT INTO exception_handlings (id, task_id, exception_type, exception_detail, handling_result, handler)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `ex-${uuidv4().substr(0, 8)}`,
      req.params.id,
      exceptionType,
      exceptionDetail,
      handlingResult,
      handlingResult === 'auto_block' ? 'system' : req.user.id
    );
  }
  
  db.prepare(`
    UPDATE query_tasks 
    SET status = ?, result_table_id = ?, executed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    handlingResult === 'auto_block' ? 'blocked' : 'executed',
    resultId,
    req.params.id
  );
  
  logWorkflow(req.params.id, 'execute', req.user.id, `执行任务${exceptionType ? `，发现异常: ${exceptionDetail}` : ''}`, task.status, handlingResult === 'auto_block' ? 'blocked' : 'executed');
  logOperation(req, 'execute', 'query_task', req.params.id);
  
  res.json({ 
    data: { 
      success: true, 
      result_id: resultId,
      exception: exceptionType ? { type: exceptionType, detail: exceptionDetail, handling_result: handlingResult } : null
    } 
  });
});

router.post('/:id/review', checkPermission('task:review'), (req, res) => {
  const { action, comments } = req.body;
  
  const task = db.prepare('SELECT * FROM query_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  if (!['submitted', 'executed'].includes(task.status)) {
    return res.status(400).json({ error: '任务状态不允许复核' });
  }
  
  if (action === 'approve') {
    db.prepare(`
      UPDATE query_tasks 
      SET status = 'reviewed', reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
    logWorkflow(req.params.id, 'review', req.user.id, comments || '审核通过', task.status, 'reviewed');
  } else if (action === 'reject') {
    db.prepare(`
      UPDATE query_tasks 
      SET status = 'draft', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
    logWorkflow(req.params.id, 'reject', req.user.id, comments || '审核退回，请补正', task.status, 'draft');
  } else {
    return res.status(400).json({ error: '无效的审核操作' });
  }
  
  logOperation(req, 'review', 'query_task', req.params.id);
  res.json({ data: { success: true } });
});

router.post('/:id/close', checkPermission('task:review'), (req, res) => {
  const { reason } = req.body;
  
  const task = db.prepare('SELECT * FROM query_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  db.prepare(`
    UPDATE query_tasks 
    SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  logWorkflow(req.params.id, 'close', req.user.id, reason || '任务关闭', task.status, 'closed');
  logOperation(req, 'close', 'query_task', req.params.id);
  res.json({ data: { success: true } });
});

router.get('/:id/result', checkPermission('task:view'), (req, res) => {
  const result = db.prepare('SELECT * FROM result_tables WHERE task_id = ?').get(req.params.id);
  if (!result) {
    return res.status(404).json({ error: '结果不存在' });
  }
  
  const anomalies = db.prepare('SELECT * FROM anomaly_records WHERE result_table_id = ?').all(result.id);
  result.anomalies = anomalies;
  result.data_preview = result.data_preview ? JSON.parse(result.data_preview) : [];
  
  res.json({ data: result });
});

module.exports = { router, logWorkflow };
