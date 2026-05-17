const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, run, query } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度3-20'),
  body('email').isEmail().withMessage('邮箱格式不正确'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('phone').optional().isMobilePhone().withMessage('手机号格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { username, email, password, phone, nickname } = req.body;

    const existingUser = await queryOne(
      'SELECT id FROM users WHERE username = ? OR email = ? OR phone = ?',
      [username, email, phone || '']
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱或手机号已存在'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (username, email, phone, password, nickname, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, phone || null, hashedPassword, nickname || username, `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`]
    );

    const token = jwt.sign({ userId: result.lastID }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const user = await queryOne('SELECT id, username, nickname, avatar, level, is_vip FROM users WHERE id = ?', [result.lastID]);

    res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请重试'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { account, password } = req.body;

    const user = await queryOne(
      'SELECT * FROM users WHERE username = ? OR email = ? OR phone = ?',
      [account, account, account]
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: '账号已被封禁'
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userInfo } = user;

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: userInfo
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请重试'
    });
  }
});

router.post('/third-party-login', async (req, res) => {
  try {
    const { platform, thirdPartyId, userInfo } = req.body;
    const platforms = ['bilibili', 'qq', 'wechat', 'weibo'];

    if (!platforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: '不支持的第三方平台'
      });
    }

    let user = await queryOne(
      'SELECT * FROM users WHERE third_party_id = ? AND third_party_platform = ?',
      [thirdPartyId, platform]
    );

    if (!user) {
      const username = `${platform}_${thirdPartyId.slice(0, 8)}`;
      const result = await run(
        'INSERT INTO users (username, nickname, avatar, third_party_id, third_party_platform, password) VALUES (?, ?, ?, ?, ?, ?)',
        [username, userInfo?.nickname || username, userInfo?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`, thirdPartyId, platform, 'THIRD_PARTY_' + Date.now()]
      );
      user = await queryOne('SELECT * FROM users WHERE id = ?', [result.lastID]);
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: userData
      }
    });
  } catch (error) {
    console.error('第三方登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请重试'
    });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, phone, newPassword } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: '请提供邮箱或手机号'
      });
    }

    const user = await queryOne(
      'SELECT id FROM users WHERE email = ? OR phone = ?',
      [email || '', phone || '']
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户不存在'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    res.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      success: false,
      message: '重置密码失败，请重试'
    });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await queryOne(
      'SELECT id, username, email, phone, nickname, avatar, bio, gender, birthday, location, level, exp, coins, fish_dried, is_vip, vip_expire, is_anchor, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar, bio, gender, birthday, location } = req.body;
    
    await run(
      'UPDATE users SET nickname = ?, avatar = ?, bio = ?, gender = ?, birthday = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nickname, avatar, bio, gender, birthday, location, req.user.id]
    );

    const user = await queryOne(
      'SELECT id, username, nickname, avatar, bio, gender, birthday, location, level, is_vip FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: '更新成功',
      data: user
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败，请重试'
    });
  }
});

module.exports = router;
