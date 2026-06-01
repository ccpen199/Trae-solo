const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireRole('admin'), (req, res) => {
  const { role } = req.query;
  
  let query = 'SELECT id, username, name, role, created_at FROM users';
  const params = [];

  if (role) {
    query += ' WHERE role = ?';
    params.push(role);
  }

  query += ' ORDER BY created_at DESC';

  const users = db.prepare(query).all(...params);
  res.json({ users });
});

router.get('/students', authenticateToken, requireRole('admin', 'invigilator'), (req, res) => {
  const students = db.prepare(`
    SELECT id, username, name, created_at 
    FROM users 
    WHERE role = 'student'
    ORDER BY name
  `).all();

  res.json({ students });
});

router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  const { username, password, name, role } = req.body;

  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  if (!['admin', 'invigilator', 'student'].includes(role)) {
    return res.status(400).json({ error: '无效的角色类型' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const result = db.prepare(`
    INSERT INTO users (username, password, name, role)
    VALUES (?, ?, ?, ?)
  `).run(username, hashedPassword, name, role);

  res.json({ id: result.lastInsertRowid, message: '用户创建成功' });
});

router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const { name, role, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  let query = 'UPDATE users SET name = ?, role = ?';
  const params = [name, role];

  if (password) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    query += ', password = ?';
    params.push(hashedPassword);
  }

  query += ' WHERE id = ?';
  params.push(req.params.id);

  db.prepare(query).run(...params);

  res.json({ message: '用户更新成功' });
});

router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  if (user.username === 'admin') {
    return res.status(400).json({ error: '不能删除管理员账户' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

  res.json({ message: '用户删除成功' });
});

module.exports = router;
