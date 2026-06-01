const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();
  const { status, department_id } = req.query;
  
  let sql = `
    SELECT rt.*, d.name as department_name, u.name as assignee_name
    FROM rectification_tasks rt
    JOIN departments d ON rt.department_id = d.id
    LEFT JOIN users u ON rt.assignee_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND rt.status = ?';
    params.push(status);
  }
  if (department_id) {
    sql += ' AND rt.department_id = ?';
    params.push(department_id);
  }
  
  sql += ' ORDER BY rt.created_at DESC';
  
  const tasks = db.prepare(sql).all(...params);
  res.json(tasks);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const taskId = req.params.id;
  
  const task = db.prepare(`
    SELECT rt.*, d.name as department_name, 
           ua.name as assignee_name, ur.name as reviewed_by_name
    FROM rectification_tasks rt
    JOIN departments d ON rt.department_id = d.id
    LEFT JOIN users ua ON rt.assignee_id = ua.id
    LEFT JOIN users ur ON rt.reviewed_by = ur.id
    WHERE rt.id = ?
  `).get(taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json(task);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { department_id, issue_description, corrective_measures, assignee_id, due_date } = req.body;
  
  const taskCode = `TASK-${Date.now()}`;
  
  const result = db.prepare(`
    INSERT INTO rectification_tasks 
    (task_code, department_id, issue_description, corrective_measures, assignee_id, due_date, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(taskCode, department_id, issue_description, corrective_measures, assignee_id, due_date);
  
  res.json({ success: true, id: result.lastInsertRowid, task_code: taskCode });
});

router.post('/:id/start', (req, res) => {
  const db = getDb();
  const taskId = req.params.id;
  
  const result = db.prepare(`
    UPDATE rectification_tasks 
    SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(taskId);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json({ success: true });
});

router.post('/:id/submit', (req, res) => {
  const db = getDb();
  const taskId = req.params.id;
  
  const result = db.prepare(`
    UPDATE rectification_tasks 
    SET status = 'for_review', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(taskId);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json({ success: true });
});

router.post('/:id/review', (req, res) => {
  const db = getDb();
  const taskId = req.params.id;
  const { review_result, passed } = req.body;
  
  const status = passed ? 'completed' : 'rejected';
  
  const result = db.prepare(`
    UPDATE rectification_tasks 
    SET review_result = ?, status = ?, reviewed_by = 2, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(review_result, status, taskId);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json({ success: true });
});

router.post('/:id/close', (req, res) => {
  const db = getDb();
  const taskId = req.params.id;
  
  const task = db.prepare(`
    SELECT status, review_result FROM rectification_tasks WHERE id = ?
  `).get(taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  if (!task.review_result) {
    return res.status(400).json({ error: '未复查不能关闭任务' });
  }
  
  const result = db.prepare(`
    UPDATE rectification_tasks 
    SET status = 'closed', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(taskId);
  
  res.json({ success: true });
});

module.exports = router;
