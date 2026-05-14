const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json(error('用户名和密码不能为空'));
    }

    const db = getDb();
    const user = await db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json(error('用户名或密码错误'));
    }

    if (user.status !== 1) {
      return res.status(403).json(error('账户已被禁用'));
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json(error('用户名或密码错误'));
    }

    const token = generateToken(user);

    logger.info(`用户登录成功: ${username}`);

    res.json(success({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role
      }
    }, '登录成功'));
  } catch (err) {
    logger.error('登录错误:', err);
    res.status(500).json(error('登录失败'));
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body || {};

    if (!username || !password) {
      return res.status(400).json(error('用户名和密码不能为空'));
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json(error('用户名长度应为 3-20 个字符'));
    }

    if (password.length < 6) {
      return res.status(400).json(error('密码长度至少 6 个字符'));
    }

    const db = getDb();
    const existing = await db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    
    if (existing) {
      return res.status(400).json(error('用户名已存在'));
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await db.prepare(`
      INSERT INTO users (username, password, nickname, role, status)
      VALUES (?, ?, ?, 'user', 1)
    `).run(username, hashedPassword, nickname || username);

    const user = await db.prepare('SELECT id, username, nickname, avatar, role FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(user);

    logger.info(`用户注册成功: ${username}`);

    res.json(success({ token, user }, '注册成功'));
  } catch (err) {
    logger.error('注册错误:', err);
    res.status(500).json(error('注册失败'));
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json(success(req.user, '获取成功'));
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar } = req.body || {};
    const db = getDb();

    await db.prepare(`
      UPDATE users SET nickname = COALESCE(?, nickname), avatar = COALESCE(?, avatar), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nickname || null, avatar || null, req.user.id);

    const user = await db.prepare('SELECT id, username, nickname, avatar, role FROM users WHERE id = ?').get(req.user.id);
    res.json(success(user, '更新成功'));
  } catch (err) {
    logger.error('更新资料错误:', err);
    res.status(500).json(error('更新失败'));
  }
});

module.exports = router;
