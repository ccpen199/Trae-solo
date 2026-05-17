const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../utils/db');
const { success, error } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

router.post('/login/phone', [
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  body('code').isLength({ min: 4, max: 6 }).withMessage('验证码格式不正确')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(error('参数验证失败', errors.array()));
  }

  const { phone, code } = req.body;
  
  if (code !== '123456') {
    return res.status(400).json(error('验证码错误'));
  }

  try {
    const db = getDB();
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    const now = Date.now();
    
    if (!user) {
      const userId = uuidv4();
      db.prepare(`
        INSERT INTO users (id, phone, nickname, vip_type, used_space, created_at, updated_at)
        VALUES (?, ?, ?, 0, 0, ?, ?)
      `).run(userId, phone, `用户${phone.slice(-4)}`, now, now);
      
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    const token = generateToken(user.id);
    res.json(success({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        vipType: user.vip_type,
        vipExpireAt: user.vip_expire_at,
        usedSpace: user.used_space
      }
    }, '登录成功'));
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json(error('登录失败'));
  }
});

router.post('/login/password', [
  body('account').notEmpty().withMessage('账号不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(error('参数验证失败', errors.array()));
  }

  const { account, password } = req.body;

  try {
    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE phone = ? OR email = ?').get(account, account);
    
    if (!user) {
      return res.status(400).json(error('用户不存在'));
    }

    if (!user.password) {
      return res.status(400).json(error('请使用验证码登录'));
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json(error('密码错误'));
    }

    const token = generateToken(user.id);
    res.json(success({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        vipType: user.vip_type,
        vipExpireAt: user.vip_expire_at,
        usedSpace: user.used_space
      }
    }, '登录成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('登录失败'));
  }
});

router.post('/login/platform', [
  body('platform').notEmpty().withMessage('平台不能为空'),
  body('platformId').notEmpty().withMessage('平台ID不能为空')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(error('参数验证失败', errors.array()));
  }

  const { platform, platformId, nickname, avatar } = req.body;
  const validPlatforms = ['wechat', 'qq', 'netease', 'enterprise', 'dingtalk', 'huawei', 'apple'];
  
  if (!validPlatforms.includes(platform)) {
    return res.status(400).json(error('不支持的登录平台'));
  }

  try {
    const db = getDB();
    const loginMethod = db.prepare('SELECT * FROM login_methods WHERE platform = ? AND platform_id = ?').get(platform, platformId);
    
    const now = Date.now();
    let userId;

    if (loginMethod) {
      userId = loginMethod.user_id;
    } else {
      userId = uuidv4();
      db.prepare(`
        INSERT INTO users (id, nickname, avatar, vip_type, used_space, created_at, updated_at)
        VALUES (?, ?, ?, 0, 0, ?, ?)
      `).run(userId, nickname || '云笔记用户', avatar || '', now, now);
      
      db.prepare(`
        INSERT INTO login_methods (user_id, platform, platform_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run(userId, platform, platformId, now);
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const token = generateToken(user.id);

    res.json(success({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        vipType: user.vip_type,
        vipExpireAt: user.vip_expire_at,
        usedSpace: user.used_space
      }
    }, '登录成功'));
  } catch (err) {
    console.error('Platform login error:', err);
    res.status(500).json(error('登录失败，请重试'));
  }
});

router.post('/bind-phone', requireAuth, [
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  body('code').isLength({ min: 4, max: 6 }).withMessage('验证码格式不正确')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(error('参数验证失败', errors.array()));
  }

  const { phone, code } = req.body;
  
  if (code !== '123456') {
    return res.status(400).json(error('验证码错误'));
  }

  try {
    const db = getDB();
    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ? AND id != ?').get(phone, req.user.id);
    
    if (existingUser) {
      return res.status(400).json(error('该手机号已被绑定'));
    }

    db.prepare('UPDATE users SET phone = ?, updated_at = ? WHERE id = ?').run(phone, Date.now(), req.user.id);
    
    const user = db.prepare('SELECT id, phone, email, nickname, avatar, vip_type, vip_expire_at, used_space FROM users WHERE id = ?').get(req.user.id);
    
    res.json(success({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        vipType: user.vip_type,
        vipExpireAt: user.vip_expire_at,
        usedSpace: user.used_space
      }
    }, '绑定成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('绑定失败'));
  }
});

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const user = db.prepare('SELECT id, phone, email, nickname, avatar, vip_type, vip_expire_at, used_space FROM users WHERE id = ?').get(req.user.id);
    
    const maxSpace = user.vip_type > 0 ? parseInt(process.env.MAX_VIP_SPACE) : parseInt(process.env.MAX_FREE_SPACE);
    
    res.json(success({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        vipType: user.vip_type,
        vipExpireAt: user.vip_expire_at,
        usedSpace: user.used_space,
        maxSpace
      }
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取用户信息失败'));
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  const { nickname, avatar } = req.body;
  
  try {
    const db = getDB();
    db.prepare('UPDATE users SET nickname = ?, avatar = ?, updated_at = ? WHERE id = ?').run(
      nickname || req.user.nickname,
      avatar || req.user.avatar,
      Date.now(),
      req.user.id
    );
    
    const user = db.prepare('SELECT id, phone, email, nickname, avatar, vip_type, vip_expire_at, used_space FROM users WHERE id = ?').get(req.user.id);
    
    res.json(success({ user }, '更新成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('更新失败'));
  }
});

module.exports = router;
