const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getOne } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: '手机号和密码不能为空'
      });
    }

    const existingUser = await getOne('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该手机号已注册'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await runQuery(
      'INSERT INTO users (id, phone, password, nickname) VALUES (?, ?, ?, ?)',
      [userId, phone, hashedPassword, `用户${phone.slice(-4)}`]
    );

    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'zouxin-wenda-secret-key-2024',
      { expiresIn: '7d' }
    );

    const user = await getOne('SELECT id, phone, nickname, gender, province, age, alipay_account, balance, score FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      data: {
        token,
        user
      },
      message: '注册成功'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请重试'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: '手机号和密码不能为空'
      });
    }

    const user = await getOne('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '手机号或密码错误'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: '手机号或密码错误'
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'zouxin-wenda-secret-key-2024',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请重试'
    });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, gender, province, age } = req.body;
    const userId = req.user.id;

    await runQuery(
      'UPDATE users SET nickname = ?, gender = ?, province = ?, age = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nickname || req.user.nickname, gender, province, age || null, userId]
    );

    const updatedUser = await getOne('SELECT id, phone, nickname, gender, province, age, alipay_account, balance, score, total_answers, daily_answers FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      data: updatedUser,
      message: '信息更新成功'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: '更新失败，请重试'
    });
  }
});

router.put('/alipay', authMiddleware, async (req, res) => {
  try {
    const { alipay_account, alipay_name } = req.body;
    const userId = req.user.id;

    if (!alipay_account || !alipay_name) {
      return res.status(400).json({
        success: false,
        message: '支付宝账号和真实姓名不能为空'
      });
    }

    await runQuery(
      'UPDATE users SET alipay_account = ?, alipay_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [alipay_account, alipay_name, userId]
    );

    const updatedUser = await getOne('SELECT id, phone, nickname, gender, province, age, alipay_account, alipay_name, balance, score FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      data: updatedUser,
      message: '支付宝绑定成功'
    });
  } catch (error) {
    console.error('Bind alipay error:', error);
    res.status(500).json({
      success: false,
      message: '绑定失败，请重试'
    });
  }
});

module.exports = router;
