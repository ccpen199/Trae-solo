const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { success, error } = require('../utils/response');
const { getDB } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const verificationCodes = new Map();

router.post('/send-code', [
  body('phone').isMobilePhone('zh-CN').withMessage('手机号格式不正确')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(error(errors.array()[0].msg));
  }

  const { phone } = req.body;
  const code = Math.random().toString().slice(2, 8);
  verificationCodes.set(phone, { code, expire: Date.now() + 5 * 60 * 1000 });
  
  console.log(`📱 验证码 ${phone}: ${code}`);
  
  setTimeout(() => {
    if (verificationCodes.get(phone)?.code === code) {
      verificationCodes.delete(phone);
    }
  }, 5 * 60 * 1000);

  res.json(success({ sent: true, code }, `验证码已发送: ${code}`));
});

router.post('/register', [
  body('nickname').isLength({ min: 2, max: 20 }).withMessage('昵称长度需在2-20个字符之间'),
  body('phone').isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('password').isLength({ min: 6, max: 20 }).withMessage('密码长度需在6-20个字符之间'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('验证码格式不正确')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(error(errors.array()[0].msg));
  }

  const { nickname, phone, password, code } = req.body;

  const savedCode = verificationCodes.get(phone);
  if (!savedCode || savedCode.code !== code) {
    return res.status(400).json(error('验证码错误'));
  }
  if (Date.now() > savedCode.expire) {
    verificationCodes.delete(phone);
    return res.status(400).json(error('验证码已过期'));
  }

  const db = getDB();
  
  try {
    db.get('SELECT id FROM users WHERE phone = ?', [phone], async (err, existingUser) => {
      if (err) {
        console.error('Register error:', err);
        return res.status(500).json(error('注册失败，请稍后重试'));
      }

      if (existingUser) {
        return res.status(400).json(error('该手机号已注册'));
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      db.run(
        'INSERT INTO users (nickname, phone, password) VALUES (?, ?, ?)',
        [nickname, phone, hashedPassword],
        function(err) {
          if (err) {
            console.error('Register error:', err);
            return res.status(500).json(error('注册失败，请稍后重试'));
          }

          verificationCodes.delete(phone);

          const userId = this.lastID;
          const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
          db.get('SELECT id, nickname, phone, avatar, is_vip FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) {
              console.error('Get user error:', err);
              return res.status(500).json(error('注册失败，请稍后重试'));
            }
            res.json(success({ user, token }, '注册成功'));
          });
        }
      );
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json(error('注册失败，请稍后重试'));
  }
});

router.post('/login', [
  body('phone').isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('password').isLength({ min: 6, max: 20 }).withMessage('密码长度需在6-20个字符之间')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(error(errors.array()[0].msg));
  }

  const { phone, password } = req.body;
  const db = getDB();

  try {
    db.get('SELECT * FROM users WHERE phone = ?', [phone], async (err, user) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json(error('登录失败，请稍后重试'));
      }

      if (!user) {
        return res.status(400).json(error('手机号或密码错误'));
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json(error('手机号或密码错误'));
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const { password: _, ...userInfo } = user;

      res.json(success({ user: userInfo, token }, '登录成功'));
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json(error('登录失败，请稍后重试'));
  }
});

router.get('/profile', authMiddleware, (req, res) => {
  res.json(success(req.user));
});

router.put('/profile', authMiddleware, (req, res) => {
  const { nickname, avatar } = req.body;
  const db = getDB();

  try {
    if (nickname && (nickname.length < 2 || nickname.length > 20)) {
      return res.status(400).json(error('昵称长度需在2-20个字符之间'));
    }

    const updates = [];
    const params = [];
    
    if (nickname) {
      updates.push('nickname = ?');
      params.push(nickname);
    }
    if (avatar) {
      updates.push('avatar = ?');
      params.push(avatar);
    }
    
    if (updates.length > 0) {
      params.push(req.user.id);
      db.run(`UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params, (err) => {
        if (err) {
          console.error('Update profile error:', err);
          return res.status(500).json(error('更新失败，请稍后重试'));
        }
        db.get('SELECT id, nickname, phone, avatar, is_vip, vip_expire_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
          if (err) {
            console.error('Get user error:', err);
            return res.status(500).json(error('更新失败，请稍后重试'));
          }
          res.json(success({ user }, '更新成功'));
        });
      });
    } else {
      res.json(success({ user: req.user }, '无需更新'));
    }
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json(error('更新失败，请稍后重试'));
  }
});

module.exports = router;
