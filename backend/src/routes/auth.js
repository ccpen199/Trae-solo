const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();
require('dotenv').config();

router.post('/register', (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, password, nickname, avatar)
      VALUES (?, ?, ?, ?)
    `).run(username, hashedPassword, nickname || username, null);

    const userId = result.lastInsertRowid;
    
    const starterItems = ['木柴', '石头', '水', '泥土', '种子'];
    starterItems.forEach(itemName => {
      const item = db.prepare('SELECT id FROM game_items WHERE name = ?').get(itemName);
      if (item) {
        db.prepare('INSERT INTO user_items (user_id, item_id, count) VALUES (?, ?, ?)').run(userId, item.id, 10);
      }
    });

    const token = jwt.sign(
      { id: userId, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const user = db.prepare('SELECT id, username, nickname, avatar, coins, level, exp FROM users WHERE id = ?').get(userId);
    
    res.status(201).json({
      message: '注册成功',
      token,
      user
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: '登录成功',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/profile', require('../middleware/auth'), (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, nickname, avatar, coins, level, exp FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
