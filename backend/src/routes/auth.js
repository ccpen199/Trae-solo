const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'game-ranking-system-secret-key-2024';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: '用户已被禁用' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/profile', verifyToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, nickname, role, status, created_at FROM users WHERE id = ?').get(req.user.id);
    
    const activeSeason = db.prepare('SELECT id FROM seasons WHERE status = ?').get('active');
    let userPoints = null;
    
    if (activeSeason) {
      userPoints = db.prepare(`
        SELECT * FROM user_season_points WHERE user_id = ? AND season_id = ?
      `).get(req.user.id, activeSeason.id);
    }

    res.json({
      success: true,
      user,
      seasonPoints: userPoints
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    
    if (existingUser) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const result = db.prepare(`
      INSERT INTO users (username, password, nickname, role, status)
      VALUES (?, ?, ?, 'player', 'active')
    `).run(username, hashedPassword, nickname || username);

    res.json({
      success: true,
      message: '注册成功',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
