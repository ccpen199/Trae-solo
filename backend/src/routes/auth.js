const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { getAsync, runAsync } = require('../utils/db');
const { success, error } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const registerSchema = Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({
    'string.pattern.base': '手机号格式不正确'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '密码至少6位'
  }),
  nickname: Joi.string().optional()
});

const loginSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().min(6).required()
});

router.post('/register', async (req, res) => {
  try {
    const { error: validationError } = registerSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json(error(validationError.details[0].message));
    }

    const { phone, password, nickname } = req.body;

    const existingUser = await getAsync('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existingUser) {
      return res.status(400).json(error('该手机号已注册'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await runAsync(
      'INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)',
      [phone, hashedPassword, nickname || `用户${phone.slice(-4)}`]
    );

    const token = jwt.sign(
      { id: result.lastID, phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json(success({
      token,
      user: { id: result.lastID, phone, nickname: nickname || `用户${phone.slice(-4)}` }
    }, '注册成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('注册失败'));
  }
});

router.post('/login', async (req, res) => {
  try {
    const { error: validationError } = loginSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json(error(validationError.details[0].message));
    }

    const { phone, password } = req.body;

    const user = await getAsync('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user) {
      return res.status(400).json(error('用户不存在'));
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json(error('密码错误'));
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password;
    res.json(success({ token, user }, '登录成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('登录失败'));
  }
});

router.post('/third-party/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { openid, accessToken, userInfo } = req.body;

    if (!['wechat', 'qq', 'weibo'].includes(platform)) {
      return res.status(400).json(error('不支持的平台'));
    }

    let auth = await getAsync(
      'SELECT * FROM third_party_auth WHERE platform = ? AND openid = ?',
      [platform, openid]
    );

    let userId;
    if (auth) {
      userId = auth.user_id;
      await runAsync(
        'UPDATE third_party_auth SET access_token = ? WHERE id = ?',
        [accessToken, auth.id]
      );
    } else {
      const nickname = userInfo?.nickname || `${platform}_${Date.now()}`;
      const avatar = userInfo?.avatar || '';
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const userResult = await runAsync(
        'INSERT INTO users (nickname, avatar, password) VALUES (?, ?, ?)',
        [nickname, avatar, hashedPassword]
      );
      userId = userResult.lastID;

      await runAsync(
        'INSERT INTO third_party_auth (user_id, platform, openid, access_token) VALUES (?, ?, ?, ?)',
        [userId, platform, openid, accessToken]
      );
    }

    const user = await getAsync('SELECT * FROM users WHERE id = ?', [userId]);
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password;
    res.json(success({ token, user }, '登录成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('第三方登录失败'));
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { error: validationError } = resetPasswordSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json(error(validationError.details[0].message));
    }

    const { phone, password } = req.body;

    const user = await getAsync('SELECT id FROM users WHERE phone = ?', [phone]);
    if (!user) {
      return res.status(400).json(error('用户不存在'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    res.json(success(null, '密码重置成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('密码重置失败'));
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await getAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);
    delete user?.password;
    res.json(success(user));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取用户信息失败'));
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar, gender, birthday, signature } = req.body;
    await runAsync(
      'UPDATE users SET nickname = ?, avatar = ?, gender = ?, birthday = ?, signature = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nickname, avatar, gender, birthday, signature, req.user.id]
    );

    const user = await getAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);
    delete user?.password;
    res.json(success(user, '更新成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('更新失败'));
  }
});

module.exports = router;