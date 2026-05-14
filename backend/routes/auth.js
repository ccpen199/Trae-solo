const express = require('express');
const jwt = require('jsonwebtoken');
const { runQuery, getQuery } = require('../database');

const router = express.Router();

router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.json({
        success: false,
        message: '请输入有效的手机号'
      });
    }

    const code = Math.random().toString().slice(2, 8);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await runQuery(
      'INSERT INTO verification_codes (phone, code, expires_at) VALUES (?, ?, ?)',
      [phone, code, expiresAt]
    );

    console.log(`📱 验证码: ${phone} → ${code}`);

    res.json({
      success: true,
      message: '验证码已发送',
      data: { code }
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.json({
      success: false,
      message: '发送验证码失败'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, code, douyinToken } = req.body;

    if (douyinToken) {
      return handleDouyinLogin(req, res, douyinToken);
    }

    if (!phone || !code) {
      return res.json({
        success: false,
        message: '请输入手机号和验证码'
      });
    }

    const verification = await getQuery(
      'SELECT * FROM verification_codes WHERE phone = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1',
      [phone, code]
    );

    if (!verification) {
      return res.json({
        success: false,
        message: '验证码错误'
      });
    }

    if (new Date(verification.expires_at) < new Date()) {
      return res.json({
        success: false,
        message: '验证码已过期'
      });
    }

    await runQuery('UPDATE verification_codes SET used = 1 WHERE id = ?', [verification.id]);

    let user = await getQuery('SELECT * FROM users WHERE phone = ?', [phone]);

    if (!user) {
      const result = await runQuery(
        'INSERT INTO users (phone, nickname, avatar) VALUES (?, ?, ?)',
        [phone, `多闪用户${phone.slice(-4)}`, `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`]
      );
      user = await getQuery('SELECT * FROM users WHERE id = ?', [result.lastID]);
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

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
          bio: user.bio
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.json({
      success: false,
      message: '登录失败'
    });
  }
});

async function handleDouyinLogin(req, res, token) {
  try {
    const douyinId = `douyin_${Math.random().toString(36).slice(2, 10)}`;
    
    let user = await getQuery('SELECT * FROM users WHERE douyin_id = ?', [douyinId]);

    if (!user) {
      const result = await runQuery(
        'INSERT INTO users (douyin_id, nickname, avatar) VALUES (?, ?, ?)',
        [douyinId, '抖音用户', `https://api.dicebear.com/7.x/avataaars/svg?seed=${douyinId}`]
      );
      user = await getQuery('SELECT * FROM users WHERE id = ?', [result.lastID]);
    }

    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: '抖音授权登录成功',
      data: {
        token: jwtToken,
        user: {
          id: user.id,
          douyinId: user.douyin_id,
          nickname: user.nickname,
          avatar: user.avatar,
          bio: user.bio
        }
      }
    });
  } catch (error) {
    console.error('抖音登录失败:', error);
    res.json({
      success: false,
      message: '抖音授权失败，请使用手机号登录'
    });
  }
}

router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: '已退出登录'
  });
});

module.exports = router;
