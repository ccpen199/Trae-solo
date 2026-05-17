const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const { generateCode, successResponse, errorResponse } = require('../utils');

const router = express.Router();

router.post('/send-code', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, errors.array()[0].msg);
    }

    const { phone } = req.body;
    const code = generateCode();
    const expiresAt = new Date(Date.now() + parseInt(process.env.CODE_EXPIRE_MINUTES || 5) * 60 * 1000);

    db.prepare(`
      INSERT INTO verification_codes (phone, code, expires_at)
      VALUES (?, ?, ?)
    `).run(phone, code, expiresAt.toISOString());

    console.log(`验证码: ${code} (手机号: ${phone})`);

    successResponse(res, { sent: true }, '验证码已发送');
  } catch (error) {
    console.error('发送验证码失败:', error);
    errorResponse(res, '发送验证码失败');
  }
});

router.post('/login-code', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('验证码格式错误')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, errors.array()[0].msg);
    }

    const { phone, code } = req.body;

    const verification = db.prepare(`
      SELECT * FROM verification_codes
      WHERE phone = ? AND code = ? AND used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `).get(phone, code);

    if (!verification) {
      return errorResponse(res, '验证码错误');
    }

    if (new Date(verification.expires_at) < new Date()) {
      return errorResponse(res, '验证码已过期');
    }

    db.prepare(`
      UPDATE verification_codes SET used = 1 WHERE id = ?
    `).run(verification.id);

    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

    if (!user) {
      const result = db.prepare(`
        INSERT INTO users (phone, username) VALUES (?, ?)
      `).run(phone, `用户${phone.slice(-4)}`);
      
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

    const token = jwt.sign({
      id: user.id,
      phone: user.phone
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    successResponse(res, {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        avatar: user.avatar
      }
    }, '登录成功');
  } catch (error) {
    console.error('验证码登录失败:', error);
    errorResponse(res, '登录失败');
  }
});

router.post('/login-password', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, errors.array()[0].msg);
    }

    const { phone, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

    if (!user) {
      return errorResponse(res, '用户不存在');
    }

    if (!user.password) {
      return errorResponse(res, '请使用验证码登录');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return errorResponse(res, '密码错误');
    }

    const token = jwt.sign({
      id: user.id,
      phone: user.phone
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    successResponse(res, {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        avatar: user.avatar
      }
    }, '登录成功');
  } catch (error) {
    console.error('密码登录失败:', error);
    errorResponse(res, '登录失败');
  }
});

router.post('/set-password', authMiddleware, [
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, errors.array()[0].msg);
    }

    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.prepare(`
      UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(hashedPassword, req.user.id);

    successResponse(res, null, '密码设置成功');
  } catch (error) {
    console.error('设置密码失败:', error);
    errorResponse(res, '设置密码失败');
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = db.prepare('SELECT id, phone, username, avatar, bio, created_at FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return errorResponse(res, '用户不存在', 404);
    }

    successResponse(res, user);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    errorResponse(res, '获取用户信息失败');
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, avatar, bio } = req.body;
    
    db.prepare(`
      UPDATE users 
      SET username = COALESCE(?, username),
          avatar = COALESCE(?, avatar),
          bio = COALESCE(?, bio),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(username, avatar, bio, req.user.id);

    successResponse(res, null, '更新成功');
  } catch (error) {
    console.error('更新用户信息失败:', error);
    errorResponse(res, '更新失败');
  }
});

module.exports = router;
