const express = require('express');
const router = express.Router();
const { generateCode, generateToken, authenticate, success, error, query, queryOne, execute } = require('../utils');

router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.json(error('手机号不能为空'));
    
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    await execute('DELETE FROM sms_codes WHERE phone = ?', [phone]);
    await execute('INSERT INTO sms_codes (phone, code, expires_at) VALUES (?, ?, ?)', [phone, code, expiresAt.toISOString()]);
    
    console.log(`发送验证码 ${code} 到 ${phone}`);
    res.json(success({ phone, expiresIn: 300 }, '验证码已发送'));
  } catch (e) {
    res.json(error('发送失败'));
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.json(error('参数错误'));
    
    // 开发环境：支持固定验证码 123456
    const isDevCode = code === '123456';
    
    if (!isDevCode) {
      const smsCode = await queryOne('SELECT * FROM sms_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1', [phone]);
      if (!smsCode) return res.json(error('验证码不存在'));
      
      const now = new Date();
      if (new Date(smsCode.expires_at) < now) return res.json(error('验证码已过期'));
      if (smsCode.code !== code) return res.json(error('验证码错误'));
    }
    
    let user = await queryOne('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user) {
      const result = await execute('INSERT INTO users (phone, nickname) VALUES (?, ?)', [phone, `用户${phone.slice(-4)}`]);
      user = await queryOne('SELECT * FROM users WHERE id = ?', [result.lastID]);
    }
    
    await execute('DELETE FROM sms_codes WHERE phone = ?', [phone]);
    const token = generateToken(user.id);
    
    res.json(success({ token, user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar, role: user.role } }, '登录成功'));
  } catch (e) {
    console.error('Login error:', e);
    res.json(error('登录失败'));
  }
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (!user) return res.json(error('用户不存在'));
    res.json(success({ id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar, role: user.role }));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    await execute('UPDATE users SET nickname = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [nickname, avatar, req.userId]);
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.userId]);
    res.json(success({ id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar, role: user.role }, '更新成功'));
  } catch (e) {
    res.json(error('更新失败'));
  }
});

module.exports = router;