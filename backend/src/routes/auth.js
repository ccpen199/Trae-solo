const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: '请填写完整信息' });
  }

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const nickname = username;

    const result = db.prepare('INSERT INTO users (username, email, password, nickname) VALUES (?, ?, ?, ?)').run(username, email, hashedPassword, nickname);
    const userId = result.lastInsertRowid;

    db.prepare('INSERT INTO beauty_preferences (user_id) VALUES (?)').run(userId);

    const token = jwt.sign({ id: userId, username }, process.env.JWT_SECRET || 'may4864_beauty_camera_secret_key_2024', { expiresIn: '7d' });

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: userId, username, email, nickname }
    });
  } catch (error) {
    res.status(500).json({ message: '注册失败', error: error.message });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '请填写用户名和密码' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'may4864_beauty_camera_secret_key_2024', { expiresIn: '7d' });

    delete user.password;
    res.json({ message: '登录成功', token, user });
  } catch (error) {
    res.status(500).json({ message: '登录失败', error: error.message });
  }
});

router.get('/profile', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, nickname, avatar, bio, followers_count, following_count, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: '获取用户信息失败', error: error.message });
  }
});

router.put('/profile', authMiddleware, (req, res) => {
  const { nickname, bio, avatar } = req.body;
  const updates = [];
  const params = [];

  if (nickname !== undefined) {
    updates.push('nickname = ?');
    params.push(nickname);
  }
  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio);
  }
  if (avatar !== undefined) {
    updates.push('avatar = ?');
    params.push(avatar);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: '没有需要更新的内容' });
  }

  try {
    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

module.exports = router;