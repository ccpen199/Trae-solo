const express = require('express');
const { db } = require('../database');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/my-todos', (req, res) => {
  const { status, priority } = req.query;
  let query = `
    SELECT t.*, u.name as assignee_name
    FROM todos t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.assignee_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }

  if (priority) {
    query += ' AND t.priority = ?';
    params.push(priority);
  }

  query += ' ORDER BY CASE t.priority WHEN "urgent" THEN 1 WHEN "high" THEN 2 WHEN "normal" THEN 3 ELSE 4 END, t.due_date';

  const todos = db.prepare(query).all(...params);
  res.json(todos);
});

router.get('/', (req, res) => {
  if (req.user.role === 'student') {
    return res.status(403).json({ error: '权限不足' });
  }

  const { assignee_id, status, priority } = req.query;
  let query = `
    SELECT t.*, u.name as assignee_name
    FROM todos t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (assignee_id) {
    query += ' AND t.assignee_id = ?';
    params.push(assignee_id);
  }

  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }

  if (priority) {
    query += ' AND t.priority = ?';
    params.push(priority);
  }

  if (req.user.role === 'teacher') {
    query += ' AND t.assignee_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY CASE t.priority WHEN "urgent" THEN 1 WHEN "high" THEN 2 WHEN "normal" THEN 3 ELSE 4 END, t.due_date';

  const todos = db.prepare(query).all(...params);
  res.json(todos);
});

router.get('/:id', (req, res) => {
  const todo = db.prepare(`
    SELECT t.*, u.name as assignee_name
    FROM todos t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!todo) {
    return res.status(404).json({ error: '待办事项不存在' });
  }

  if (req.user.role === 'teacher' && todo.assignee_id !== req.user.id) {
    return res.status(403).json({ error: '权限不足' });
  }

  res.json(todo);
});

router.post('/', [
  body('title').notEmpty(),
  body('assignee_id').isInt(),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (req.user.role === 'student') {
    return res.status(403).json({ error: '权限不足' });
  }

  const { type, related_id, assignee_id, title, description, priority, due_date } = req.body;

  const result = db.prepare(`
    INSERT INTO todos (type, related_id, assignee_id, title, description, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    type || 'general',
    related_id || null,
    assignee_id,
    title,
    description || '',
    priority || 'normal',
    due_date || null
  );

  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(todo);
});

router.put('/:id', [
  body('title').optional().notEmpty(),
  body('status').optional().isIn(['pending', 'in_progress', 'done']),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  if (!todo) {
    return res.status(404).json({ error: '待办事项不存在' });
  }

  if (req.user.role === 'teacher' && todo.assignee_id !== req.user.id) {
    return res.status(403).json({ error: '权限不足' });
  }

  const { title, description, status, priority, due_date } = req.body;

  db.prepare(`
    UPDATE todos 
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        due_date = COALESCE(?, due_date)
    WHERE id = ?
  `).run(
    title,
    description,
    status,
    priority,
    due_date,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'psychologist') {
    return res.status(403).json({ error: '权限不足' });
  }

  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  if (!todo) {
    return res.status(404).json({ error: '待办事项不存在' });
  }

  db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.get('/statistics/counts', (req, res) => {
  const counts = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM todos
    WHERE assignee_id = ?
    GROUP BY status
  `).all(req.user.id);

  const result = {
    pending: 0,
    in_progress: 0,
    done: 0,
    total: 0
  };

  counts.forEach(c => {
    result[c.status] = c.count;
    result.total += c.count;
  });

  res.json(result);
});

module.exports = router;
