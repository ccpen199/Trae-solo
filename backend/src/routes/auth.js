const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runAsync, getAsync } = require('../utils/db');
const { successResponse, errorResponse, handleError } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, email, nickname } = req.body;

    if (!username || !password) {
      return res.status(400).json(errorResponse('用户名和密码不能为空'));
    }

    const existingUser = await getAsync('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json(errorResponse('用户名已存在'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await runAsync(
      'INSERT INTO users (username, password, email, nickname) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email || null, nickname || username]
    );

    const token = jwt.sign({ userId: result.lastID }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const user = await getAsync('SELECT id, username, email, nickname, avatar FROM users WHERE id = ?', [result.lastID]);

    res.json(successResponse({ user, token }, '注册成功'));
  } catch (error) {
    handleError(res, error, '注册失败');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json(errorResponse('用户名和密码不能为空'));
    }

    const user = await getAsync('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json(errorResponse('用户名或密码错误'));
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json(errorResponse('用户名或密码错误'));
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;

    res.json(successResponse({ user: userWithoutPassword, token }, '登录成功'));
  } catch (error) {
    handleError(res, error, '登录失败');
  }
});

router.get('/profile', requireAuth, async (req, res) => {
  try {
    res.json(successResponse({ user: req.user }));
  } catch (error) {
    handleError(res, error, '获取用户信息失败');
  }
});

router.post('/logout', requireAuth, (req, res) => {
  res.json(successResponse(null, '退出登录成功'));
});

module.exports = router;
