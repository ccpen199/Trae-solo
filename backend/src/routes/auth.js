const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
      email: user.email
    }
  });
});

router.get('/me', authenticate, (req, res) => {
  const user = req.user;
  
  let extraInfo = {};
  
  if (user.role === 'guardian') {
    const guardians = db.prepare(`
      SELECT g.*, s.name as student_name, s.student_no, c.name as class_name
      FROM guardians g
      JOIN students s ON g.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE g.user_id = ?
    `).all(user.id);
    extraInfo.guardianships = guardians;
  } else if (user.role === 'teacher') {
    const classes = db.prepare(`
      SELECT DISTINCT c.id, c.name, g.name as grade_name, ct.subject
      FROM class_teachers ct
      JOIN classes c ON ct.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      WHERE ct.teacher_id = ?
    `).all(user.id);
    const isHeadTeacher = db.prepare('SELECT 1 FROM classes WHERE head_teacher_id = ?').get(user.id);
    extraInfo.classes = classes;
    extraInfo.isHeadTeacher = !!isHeadTeacher;
  } else if (user.role === 'admin') {
    const school = db.prepare('SELECT * FROM schools WHERE id = ?').get(user.school_id);
    extraInfo.school = school;
  }

  res.json({
    ...user,
    ...extraInfo
  });
});

router.post('/logout', authenticate, (req, res) => {
  res.json({ message: '登出成功' });
});

module.exports = router;
