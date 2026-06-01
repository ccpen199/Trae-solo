const express = require('express');
const db = require('../database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, status, priority, assigneeId, customerId, assessmentId } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (status) {
    whereClause += ' AND rt.status = ?';
    params.push(status);
  }
  
  if (priority) {
    whereClause += ' AND rt.priority = ?';
    params.push(priority);
  }
  
  if (assigneeId) {
    whereClause += ' AND rt.assignee_id = ?';
    params.push(assigneeId);
  }
  
  if (customerId) {
    whereClause += ' AND rt.customer_id = ?';
    params.push(customerId);
  }
  
  if (assessmentId) {
    whereClause += ' AND rt.assessment_id = ?';
    params.push(assessmentId);
  }
  
  const tasks = db.prepare(`
    SELECT rt.*, c.name as customer_name, c.customer_no,
           a.name as assignee_name, creator.name as creator_name,
           ra.risk_score, ra.risk_level
    FROM recovery_tasks rt
    LEFT JOIN customers c ON rt.customer_id = c.id
    LEFT JOIN users a ON rt.assignee_id = a.id
    LEFT JOIN users creator ON rt.created_by = creator.id
    LEFT JOIN risk_assessments ra ON rt.assessment_id = ra.id
    ${whereClause}
    ORDER BY rt.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM recovery_tasks rt ${whereClause}
  `).get(...params).count;
  
  res.json({ list: tasks, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT rt.*, c.name as customer_name, c.customer_no, c.contact_name, c.contact_phone,
           a.name as assignee_name, creator.name as creator_name
    FROM recovery_tasks rt
    LEFT JOIN customers c ON rt.customer_id = c.id
    LEFT JOIN users a ON rt.assignee_id = a.id
    LEFT JOIN users creator ON rt.created_by = creator.id
    WHERE rt.id = ?
  `).get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  const operations = db.prepare(`
    SELECT top.*, u.name as operator_name
    FROM task_operations top
    LEFT JOIN users u ON top.operator_id = u.id
    WHERE top.task_id = ?
    ORDER BY top.operation_time DESC
  `).all(req.params.id);
  
  res.json({ task, operations });
});

router.post('/', roleMiddleware(['admin', 'manager', 'operator']), (req, res) => {
  const { assessment_id, customer_id, task_type, task_title, task_description, assignee_id, priority, due_date } = req.body;
  
  if (!customer_id || !task_type || !task_title) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }
  
  const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(customer_id);
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }
  
  const taskNo = 'TASK' + Date.now();
  
  const result = db.prepare(`
    INSERT INTO recovery_tasks (task_no, assessment_id, customer_id, task_type, task_title, task_description, assignee_id, priority, due_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(taskNo, assessment_id || null, customer_id, task_type, task_title, task_description, assignee_id || null, priority || 'medium', due_date || null, req.user.id);
  
  db.prepare(`
    INSERT INTO task_operations (task_id, operation_type, operator_id, remark, before_status, after_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(result.lastInsertRowid, 'create', req.user.id, '创建挽回任务', null, 'pending');
  
  res.json({ id: result.lastInsertRowid, taskNo, message: '任务创建成功' });
});

router.post('/:id/submit', roleMiddleware(['admin', 'manager', 'operator']), (req, res) => {
  const task = db.prepare('SELECT * FROM recovery_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (task.status !== 'pending') {
    return res.status(400).json({ error: '只能提交待处理的任务' });
  }
  
  const newVersion = task.version + 1;
  
  db.prepare(`
    UPDATE recovery_tasks SET status = 'processing', version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(newVersion, req.params.id);
  
  db.prepare(`
    INSERT INTO task_operations (task_id, operation_type, operator_id, remark, before_status, after_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, 'submit', req.user.id, req.body.remark || '提交执行', 'pending', 'processing');
  
  res.json({ message: '任务已提交执行' });
});

router.post('/:id/execute', roleMiddleware(['admin', 'manager', 'operator']), (req, res) => {
  const { execution_result, execution_remark, recovery_effect, recovered_amount } = req.body;
  
  const task = db.prepare('SELECT * FROM recovery_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (task.status !== 'processing') {
    return res.status(400).json({ error: '只能执行处理中的任务' });
  }
  
  const newVersion = task.version + 1;
  const newStatus = execution_result === 'success' ? 'completed' : 'failed';
  
  db.prepare(`
    UPDATE recovery_tasks 
    SET status = ?, execution_result = ?, execution_time = CURRENT_TIMESTAMP, execution_remark = ?, 
        recovery_effect = ?, recovered_amount = ?, version = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, execution_result, execution_remark, recovery_effect, recovered_amount || 0, newVersion, req.params.id);
  
  db.prepare(`
    INSERT INTO task_operations (task_id, operation_type, operator_id, remark, before_status, after_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, 'execute', req.user.id, execution_remark || `执行结果: ${execution_result}`, 'processing', newStatus);
  
  res.json({ message: '任务执行完成' });
});

router.post('/:id/review', roleMiddleware(['admin', 'manager', 'auditor']), (req, res) => {
  const { result, remark } = req.body;
  
  const task = db.prepare('SELECT * FROM recovery_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (!['completed', 'failed'].includes(task.status)) {
    return res.status(400).json({ error: '只能复核已完成或失败的任务' });
  }
  
  const newVersion = task.version + 1;
  
  db.prepare(`
    UPDATE recovery_tasks SET status = 'completed', version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(newVersion, req.params.id);
  
  db.prepare(`
    INSERT INTO task_operations (task_id, operation_type, operator_id, remark, before_status, after_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, 'review', req.user.id, remark || `复核通过: ${result}`, task.status, 'completed');
  
  res.json({ message: '复核完成' });
});

router.post('/:id/reject', roleMiddleware(['admin', 'manager', 'auditor']), (req, res) => {
  const { remark } = req.body;
  
  const task = db.prepare('SELECT * FROM recovery_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  const newVersion = task.version + 1;
  
  db.prepare(`
    UPDATE recovery_tasks SET status = 'pending', version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(newVersion, req.params.id);
  
  db.prepare(`
    INSERT INTO task_operations (task_id, operation_type, operator_id, remark, before_status, after_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, 'reject', req.user.id, remark || '退回补正', task.status, 'pending');
  
  res.json({ message: '已退回补正' });
});

router.post('/:id/close', roleMiddleware(['admin', 'manager']), (req, res) => {
  const { remark } = req.body;
  
  const task = db.prepare('SELECT * FROM recovery_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  const newVersion = task.version + 1;
  const oldStatus = task.status;
  
  db.prepare(`
    UPDATE recovery_tasks SET status = 'cancelled', version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(newVersion, req.params.id);
  
  db.prepare(`
    INSERT INTO task_operations (task_id, operation_type, operator_id, remark, before_status, after_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, 'close', req.user.id, remark || '关闭任务', oldStatus, 'cancelled');
  
  res.json({ message: '任务已关闭' });
});

router.put('/:id', roleMiddleware(['admin', 'manager', 'operator']), (req, res) => {
  const { task_title, task_description, assignee_id, priority, due_date } = req.body;
  
  const task = db.prepare('SELECT * FROM recovery_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  const newVersion = task.version + 1;
  
  db.prepare(`
    UPDATE recovery_tasks 
    SET task_title = ?, task_description = ?, assignee_id = ?, priority = ?, due_date = ?, version = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(task_title, task_description, assignee_id, priority, due_date, newVersion, req.params.id);
  
  res.json({ message: '更新成功' });
});

module.exports = router;
