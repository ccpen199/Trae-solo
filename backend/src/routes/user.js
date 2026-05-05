const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

const generateCode = () => {
  return Math.random().toString().slice(2, 8);
};

router.post('/send-code', (req, res) => {
  const { phone } = req.body;
  
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return res.status(400).json({ code: 400, message: '请输入正确的手机号' });
  }
  
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  
  db.prepare('DELETE FROM verification_codes WHERE phone = ?').run(phone);
  db.prepare('INSERT INTO verification_codes (phone, code, expires_at) VALUES (?, ?, ?)')
    .run(phone, code, expiresAt.toISOString());
  
  console.log(`验证码: ${phone} -> ${code}`);
  
  res.json({ code: 0, message: '验证码已发送', data: { code } });
});

router.post('/login', (req, res) => {
  const { phone, code, loginType } = req.body;
  
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return res.status(400).json({ code: 400, message: '请输入正确的手机号' });
  }
  
  if (loginType === 'wechat') {
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    if (!user) {
      const result = db.prepare('INSERT INTO users (phone, nickname) VALUES (?, ?)')
        .run(phone, `用户${phone.slice(-4)}`);
      user = {
        id: result.lastInsertRowid,
        phone,
        nickname: `用户${phone.slice(-4)}`,
        is_vip: 0,
        points: 0
      };
    }
    
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          is_vip: user.is_vip,
          points: user.points
        }
      }
    });
  }
  
  const verification = db.prepare(
    'SELECT * FROM verification_codes WHERE phone = ? AND code = ? AND expires_at > datetime("now")'
  ).get(phone, code);
  
  if (!verification) {
    return res.status(400).json({ code: 400, message: '验证码错误或已过期' });
  }
  
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  
  if (!user) {
    const result = db.prepare('INSERT INTO users (phone, nickname) VALUES (?, ?)')
      .run(phone, `用户${phone.slice(-4)}`);
    user = {
      id: result.lastInsertRowid,
      phone,
      nickname: `用户${phone.slice(-4)}`,
      is_vip: 0,
      points: 0
    };
  }
  
  const token = jwt.sign(
    { id: user.id, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  db.prepare('DELETE FROM verification_codes WHERE phone = ?').run(phone);
  
  res.json({
    code: 0,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        is_vip: user.is_vip,
        points: user.points
      }
    }
  });
});

router.get('/info', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }
  
  res.json({
    code: 0,
    data: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      is_vip: user.is_vip,
      vip_expire_at: user.vip_expire_at,
      points: user.points
    }
  });
});

router.put('/info', authMiddleware, (req, res) => {
  const { nickname, avatar } = req.body;
  
  const updates = [];
  const values = [];
  
  if (nickname) {
    updates.push('nickname = ?');
    values.push(nickname);
  }
  if (avatar) {
    updates.push('avatar = ?');
    values.push(avatar);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ code: 400, message: '没有要更新的内容' });
  }
  
  updates.push('updated_at = datetime("now")');
  values.push(req.user.id);
  
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  
  res.json({ code: 0, message: '更新成功' });
});

router.post('/become-vip', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }
  
  const vipExpireAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  
  db.prepare('UPDATE users SET is_vip = 1, vip_expire_at = ?, updated_at = datetime("now") WHERE id = ?')
    .run(vipExpireAt.toISOString(), req.user.id);
  
  res.json({ code: 0, message: '开通会员成功', data: { vip_expire_at: vipExpireAt.toISOString() } });
});

module.exports = router;
