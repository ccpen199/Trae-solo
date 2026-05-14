const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../models/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const sanitizeUser = (user) => {
  const { password, provider_id, ...sanitized } = user;
  return sanitized;
};

router.post('/register', [
  body('real_name').notEmpty().withMessage('真实姓名不能为空'),
  body('school').notEmpty().withMessage('学校不能为空'),
  body('student_id').notEmpty().withMessage('学号不能为空'),
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('code').notEmpty().withMessage('验证码不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { real_name, school, student_id, phone, password } = req.body;

  try {
    const existingUser = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.status(400).json({ error: '该手机号已被注册' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const insertUser = db.prepare(`
      INSERT INTO users (real_name, school, student_id, phone, password, provider, profile_complete)
      VALUES (?, ?, ?, ?, ?, 'local', 1)
    `);

    const result = insertUser.run(real_name, school, student_id, phone, hashedPassword);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

router.post('/login', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password').notEmpty().withMessage('密码不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { phone, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

    if (!user) {
      return res.status(400).json({ error: '手机号或密码错误' });
    }

    if (user.provider !== 'local') {
      return res.status(400).json({ error: '请使用第三方登录' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: '手机号或密码错误' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

router.post('/login-phone', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('code').notEmpty().withMessage('验证码不能为空')
], (req, res) => {
  const { phone, code } = req.body;

  try {
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

    if (!user) {
      return res.status(400).json({ error: '该手机号未注册，请先注册', needRegister: true });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('验证码登录失败:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

router.post('/third-party-login', [
  body('provider').isIn(['wechat', 'qq', 'weibo']).withMessage('不支持的登录方式'),
  body('provider_id').notEmpty().withMessage('第三方ID不能为空')
], (req, res) => {
  const { provider, provider_id } = req.body;

  try {
    let user = db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?').get(provider, provider_id);

    if (!user) {
      const insertUser = db.prepare(`
        INSERT INTO users (real_name, school, student_id, phone, provider, provider_id, profile_complete)
        VALUES ('', '', '', ?, ?, ?, 0)
      `);
      
      const providerPhone = `${provider}_${provider_id}`;
      const result = insertUser.run(providerPhone, provider, provider_id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

      const token = generateToken(user.id);

      return res.json({
        token,
        user: sanitizeUser(user),
        needComplete: true
      });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: sanitizeUser(user),
      needComplete: user.profile_complete === 0
    });
  } catch (error) {
    console.error('第三方登录失败:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

router.post('/complete-profile', authenticate, [
  body('real_name').notEmpty().withMessage('真实姓名不能为空'),
  body('school').notEmpty().withMessage('学校不能为空'),
  body('student_id').notEmpty().withMessage('学号不能为空'),
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { real_name, school, student_id, phone } = req.body;

  try {
    const updateUser = db.prepare(`
      UPDATE users 
      SET real_name = ?, school = ?, student_id = ?, phone = ?, profile_complete = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateUser.run(real_name, school, student_id, phone, req.user.id);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    res.json({
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('完善资料失败:', error);
    res.status(500).json({ error: '完善资料失败，请稍后重试' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({
    user: sanitizeUser(req.user)
  });
});

router.put('/me', authenticate, (req, res) => {
  const { real_name, school, student_id, avatar, signature } = req.body;

  try {
    const updateUser = db.prepare(`
      UPDATE users 
      SET real_name = COALESCE(?, real_name),
          school = COALESCE(?, school),
          student_id = COALESCE(?, student_id),
          avatar = COALESCE(?, avatar),
          signature = COALESCE(?, signature),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateUser.run(real_name, school, student_id, avatar, signature, req.user.id);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    res.json({
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('更新资料失败:', error);
    res.status(500).json({ error: '更新资料失败，请稍后重试' });
  }
});

router.get('/users/:id', authenticate, (req, res) => {
  const { id } = req.params;

  try {
    const user = db.prepare(`
      SELECT id, real_name, school, avatar, signature, created_at
      FROM users WHERE id = ?
    `).get(id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

router.post('/send-code', (req, res) => {
  res.json({ message: '验证码发送成功（模拟）' });
});

module.exports = router;
