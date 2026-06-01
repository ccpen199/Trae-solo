const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database/init');

const router = express.Router();

router.post('/login', [
  body('phone').isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('password').notEmpty().withMessage('密码不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { phone, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

    if (!user) {
      return res.status(401).json({ success: false, message: '手机号或密码错误' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: '手机号或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'loan_platform_secret_key_2024',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, phone: user.phone, name: user.name }
      },
      message: '登录成功'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/register', [
  body('phone').isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { phone, password } = req.body;

  try {
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);

    if (existing) {
      return res.status(400).json({ success: false, message: '该手机号已注册' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const result = db.prepare('INSERT INTO users (phone, password) VALUES (?, ?)').run(phone, hashedPassword);
    const userId = result.lastInsertRowid;

    const token = jwt.sign(
      { id: userId, phone },
      process.env.JWT_SECRET || 'loan_platform_secret_key_2024',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: { token, user: { id: userId, phone } },
      message: '注册成功'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

router.get('/profile', require('../middleware/auth').authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, phone, name, id_card FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
