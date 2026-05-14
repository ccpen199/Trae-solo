const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { query, queryOne, execute } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pdd-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, phone: user.phone, nickname: user.nickname },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.json({ success: false, message: '请输入手机号', data: null });
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.json({ success: false, message: '手机号格式不正确', data: null });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = dayjs().add(5, 'minute').format('YYYY-MM-DD HH:mm:ss');
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    await execute('DELETE FROM verification_codes WHERE phone = ?', [phone]);
    await execute(
      'INSERT INTO verification_codes (phone, code, expires_at, created_at) VALUES (?, ?, ?, ?)',
      [phone, code, expiresAt, now]
    );

    console.log(`验证码: ${phone} -> ${code}`);

    res.json({
      success: true,
      message: '验证码已发送',
      data: { code: process.env.NODE_ENV === 'development' ? code : undefined }
    });
  } catch (err) {
    console.error('发送验证码失败:', err);
    res.json({ success: false, message: '发送验证码失败', data: null });
  }
});

router.post('/login-phone', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.json({ success: false, message: '请输入手机号和验证码', data: null });
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.json({ success: false, message: '手机号格式不正确', data: null });
    }

    const verificationCode = await queryOne(
      'SELECT * FROM verification_codes WHERE phone = ? ORDER BY id DESC LIMIT 1',
      [phone]
    );

    if (!verificationCode) {
      return res.json({ success: false, message: '请先获取验证码', data: null });
    }

    if (verificationCode.code !== code) {
      return res.json({ success: false, message: '验证码错误', data: null });
    }

    if (dayjs(verificationCode.expires_at).isBefore(dayjs())) {
      return res.json({ success: false, message: '验证码已过期', data: null });
    }

    let user = await queryOne('SELECT * FROM users WHERE phone = ?', [phone]);

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    if (!user) {
      const userId = uuidv4();
      await execute(
        'INSERT INTO users (id, phone, nickname, avatar, login_type, balance, coupons, vip, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, phone, `用户${phone.slice(-4)}`, 'https://picsum.photos/100/100?random=' + Math.random(), 'phone', 0, 0, 0, now, now]
      );
      user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    }

    await execute('DELETE FROM verification_codes WHERE phone = ?', [phone]);

    const token = generateToken(user);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          balance: user.balance,
          coupons: user.coupons,
          vip: user.vip
        }
      }
    });
  } catch (err) {
    console.error('手机号登录失败:', err);
    res.json({ success: false, message: '登录失败', data: null });
  }
});

router.post('/login-wechat', async (req, res) => {
  try {
    const { openId, nickname, avatar } = req.body;

    if (!openId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    let user = await queryOne('SELECT * FROM users WHERE open_id = ?', [openId]);

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    if (!user) {
      const userId = uuidv4();
      await execute(
        'INSERT INTO users (id, open_id, nickname, avatar, login_type, balance, coupons, vip, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, openId, nickname || '微信用户', avatar || 'https://picsum.photos/100/100?random=' + Math.random(), 'wechat', 0, 0, 0, now, now]
      );
      user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          balance: user.balance,
          coupons: user.coupons,
          vip: user.vip
        }
      }
    });
  } catch (err) {
    console.error('微信登录失败:', err);
    res.json({ success: false, message: '登录失败', data: null });
  }
});

router.post('/login-qq', async (req, res) => {
  try {
    const { openId, nickname, avatar } = req.body;

    if (!openId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    let user = await queryOne('SELECT * FROM users WHERE open_id = ?', [openId]);

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    if (!user) {
      const userId = uuidv4();
      await execute(
        'INSERT INTO users (id, open_id, nickname, avatar, login_type, balance, coupons, vip, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, openId, nickname || 'QQ用户', avatar || 'https://picsum.photos/100/100?random=' + Math.random(), 'qq', 0, 0, 0, now, now]
      );
      user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          balance: user.balance,
          coupons: user.coupons,
          vip: user.vip
        }
      }
    });
  } catch (err) {
    console.error('QQ登录失败:', err);
    res.json({ success: false, message: '登录失败', data: null });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在', data: null });
    }

    res.json({
      success: true,
      message: '获取成功',
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        balance: user.balance,
        coupons: user.coupons,
        vip: user.vip
      }
    });
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.json({ success: false, message: '获取用户信息失败', data: null });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  res.json({ success: true, message: '退出成功', data: null });
});

module.exports = router;
