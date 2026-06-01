const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度为3-20个字符'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
  body('nickname').optional().isLength({ max: 20 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password, nickname } = req.body;

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)').run(
      username,
      hashedPassword,
      nickname || username
    );

    const token = jwt.sign(
      { userId: result.lastInsertRowid, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const user = db.prepare('SELECT id, username, nickname, avatar, bio, gender FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userInfo } = user;
    res.json({ token, user: userInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '登录失败' });
  }
});

router.get('/profile', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, nickname, avatar, bio, gender, created_at FROM users WHERE id = ?').get(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

router.put('/profile', authMiddleware, (req, res) => {
  const { nickname, avatar, bio, gender } = req.body;
  const fields = [];
  const values = [];

  if (nickname !== undefined) {
    fields.push('nickname = ?');
    values.push(nickname);
  }
  if (avatar !== undefined) {
    fields.push('avatar = ?');
    values.push(avatar);
  }
  if (bio !== undefined) {
    fields.push('bio = ?');
    values.push(bio);
  }
  if (gender !== undefined) {
    fields.push('gender = ?');
    values.push(gender);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: '没有提供要更新的字段' });
  }

  values.push(req.user.userId);

  db.prepare(`UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
  const user = db.prepare('SELECT id, username, nickname, avatar, bio, gender FROM users WHERE id = ?').get(req.user.userId);
  res.json(user);
});

module.exports = router;
