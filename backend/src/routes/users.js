const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/me', (req, res) => {
  res.json(req.user);
});

router.get('/', requireRole('admin', 'psychologist'), (req, res) => {
  const { role, grade, class: cls } = req.query;
  let query = 'SELECT id, username, name, role, grade, class, created_at FROM users WHERE 1=1';
  const params = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  if (grade) {
    query += ' AND grade = ?';
    params.push(grade);
  }

  if (cls) {
    query += ' AND class = ?';
    params.push(cls);
  }

  query += ' ORDER BY role, grade, class, name';

  const users = db.prepare(query).all(...params);
  res.json(users);
});

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, name, role, grade, class, created_at FROM users WHERE id = ?').get(req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  if (req.user.role === 'teacher' && user.role === 'student') {
    if (user.grade !== req.user.grade || user.class !== req.user.class) {
      return res.status(403).json({ error: '权限不足' });
    }
  }

  res.json(user);
});

router.post('/', requireRole('admin'), [
  body('username').notEmpty(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty(),
  body('role').isIn(['admin', 'psychologist', 'teacher', 'student'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password, name, role, grade, class: cls } = req.body;

  const existing = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get(username);
  if (existing.count > 0) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hash = bcrypt.hashSync(password, 10);

  const result = db.prepare(`
    INSERT INTO users (username, password, name, role, grade, class)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    username,
    hash,
    name,
    role,
    grade || null,
    cls || null
  );

  const user = db.prepare('SELECT id, username, name, role, grade, class, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

router.put('/:id', requireRole('admin'), [
  body('role').optional().isIn(['admin', 'psychologist', 'teacher', 'student'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const { name, role, grade, class: cls, password } = req.body;

  let hash = undefined;
  if (password) {
    hash = bcrypt.hashSync(password, 10);
  }

  db.prepare(`
    UPDATE users 
    SET name = COALESCE(?, name),
        role = COALESCE(?, role),
        grade = COALESCE(?, grade),
        class = COALESCE(?, class),
        password = COALESCE(?, password)
    WHERE id = ?
  `).run(
    name,
    role,
    grade,
    cls,
    hash,
    req.params.id
  );

  const updated = db.prepare('SELECT id, username, name, role, grade, class, created_at FROM users WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  if (req.params.id == req.user.id) {
    return res.status(400).json({ error: '不能删除自己' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.get('/students/list', requireRole('admin', 'psychologist', 'teacher'), (req, res) => {
  const { grade, class: cls } = req.query;
  let query = `
    SELECT id, name, grade, class
    FROM users 
    WHERE role = 'student'
  `;
  const params = [];

  if (grade) {
    query += ' AND grade = ?';
    params.push(grade);
  }

  if (cls) {
    query += ' AND class = ?';
    params.push(cls);
  }

  if (req.user.role === 'teacher') {
    query += ' AND grade = ? AND class = ?';
    params.push(req.user.grade, req.user.class);
  }

  query += ' ORDER BY grade, class, name';

  const students = db.prepare(query).all(...params);
  res.json(students);
});

module.exports = router;
