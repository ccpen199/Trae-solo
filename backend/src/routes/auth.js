const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { requireAuth } = require('../middleware/auth');

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateAdminToken = (adminId) => {
  return jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

router.post('/send-code', (req, res) => {
  const { phone, email, type } = req.body;
  const db = getDb();
  
  if (!phone && !email) {
    return res.status(400).json({ error: '请提供手机号或邮箱' });
  }

  const code = generateCode();
  const expireTime = new Date(Date.now() + 10 * 60 * 1000);

  if (phone) {
    const existing = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (type === 'register' && existing) {
      return res.status(400).json({ error: '该手机号已被注册' });
    }
    if (type === 'reset' && !existing) {
      return res.status(400).json({ error: '该手机号未注册' });
    }
  }

  if (email) {
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (type === 'register' && existing) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }
    if (type === 'reset' && !existing) {
      return res.status(400).json({ error: '该邮箱未注册' });
    }
  }

  db.prepare(`
    INSERT INTO verification_codes (phone, email, code, type, expire_time)
    VALUES (?, ?, ?, ?, ?)
  `).run(phone || null, email || null, code, type || 'login', expireTime);

  console.log(`验证码: ${code} (${phone || email})`);

  res.json({ success: true, message: '验证码已发送', mockCode: code });
});

router.post('/phone-login', (req, res) => {
  const { phone, code } = req.body;
  const db = getDb();

  if (!phone || !code) {
    return res.status(400).json({ error: '请提供手机号和验证码' });
  }

  const verification = db.prepare(`
    SELECT * FROM verification_codes 
    WHERE phone = ? AND code = ? AND type = 'login' AND used = 0 
    AND expire_time > datetime('now')
    ORDER BY created_at DESC
    LIMIT 1
  `).get(phone, code);

  if (!verification) {
    return res.status(400).json({ error: '验证码无效或已过期' });
  }

  db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(verification.id);

  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  
  if (!user) {
    const result = db.prepare(`
      INSERT INTO users (phone, nickname)
      VALUES (?, ?)
    `).run(phone, `用户${phone.slice(-4)}`);
    
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  if (user.status !== 1) {
    return res.status(400).json({ error: '账号已被禁用' });
  }

  const token = generateToken(user.id);
  
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      is_vip: user.is_vip,
      points: user.points
    }
  });
});

router.post('/register', (req, res) => {
  const { phone, email, password, code, type } = req.body;
  const db = getDb();

  if (!password || !code) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  if (!phone && !email) {
    return res.status(400).json({ error: '请提供手机号或邮箱' });
  }

  const whereClause = phone ? 'phone = ?' : 'email = ?';
  const existing = db.prepare(`SELECT * FROM users WHERE ${whereClause}`).get(phone || email);
  
  if (existing) {
    return res.status(400).json({ error: '该账号已被注册' });
  }

  const verification = db.prepare(`
    SELECT * FROM verification_codes 
    WHERE ${phone ? 'phone = ?' : 'email = ?'} AND code = ? AND type = 'register' AND used = 0 
    AND expire_time > datetime('now')
    ORDER BY created_at DESC
    LIMIT 1
  `).get(phone || email, code);

  if (!verification) {
    return res.status(400).json({ error: '验证码无效或已过期' });
  }

  db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(verification.id);

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (phone, email, password, nickname)
    VALUES (?, ?, ?, ?)
  `).run(
    phone || null,
    email || null,
    hashedPassword,
    phone ? `用户${phone.slice(-4)}` : email.split('@')[0]
  );

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = generateToken(user.id);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      is_vip: user.is_vip,
      points: user.points
    }
  });
});

router.post('/login', (req, res) => {
  const { account, password } = req.body;
  const db = getDb();

  if (!account || !password) {
    return res.status(400).json({ error: '请填写账号和密码' });
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ? OR email = ?').get(account, account);

  if (!user) {
    return res.status(400).json({ error: '账号或密码错误' });
  }

  if (!user.password) {
    return res.status(400).json({ error: '请使用验证码登录' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ error: '账号或密码错误' });
  }

  if (user.status !== 1) {
    return res.status(400).json({ error: '账号已被禁用' });
  }

  const token = generateToken(user.id);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      is_vip: user.is_vip,
      points: user.points
    }
  });
});

router.post('/reset-password', (req, res) => {
  const { phone, email, password, code } = req.body;
  const db = getDb();

  if (!password || !code) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  if (!phone && !email) {
    return res.status(400).json({ error: '请提供手机号或邮箱' });
  }

  const verification = db.prepare(`
    SELECT * FROM verification_codes 
    WHERE ${phone ? 'phone = ?' : 'email = ?'} AND code = ? AND type = 'reset' AND used = 0 
    AND expire_time > datetime('now')
    ORDER BY created_at DESC
    LIMIT 1
  `).get(phone || email, code);

  if (!verification) {
    return res.status(400).json({ error: '验证码无效或已过期' });
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ? OR email = ?').get(phone || email, phone || email);
  
  if (!user) {
    return res.status(400).json({ error: '账号不存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.prepare('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?').run(hashedPassword, user.id);
  db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(verification.id);

  res.json({ success: true, message: '密码重置成功' });
});

router.post('/third-party-login', (req, res) => {
  const { provider, openId, nickname, avatar } = req.body;
  const db = getDb();

  if (!provider || !openId) {
    return res.status(400).json({ error: '无效的第三方授权' });
  }

  let auth = db.prepare('SELECT * FROM third_party_auth WHERE provider = ? AND open_id = ?').get(provider, openId);
  
  let user;
  
  if (auth) {
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(auth.user_id);
  } else {
    const result = db.prepare('INSERT INTO users (nickname, avatar) VALUES (?, ?)').run(
      nickname || `${provider}用户`,
      avatar || null
    );
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    
    db.prepare(`
      INSERT INTO third_party_auth (user_id, provider, open_id, nickname, avatar)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, provider, openId, nickname, avatar);
  }

  if (user.status !== 1) {
    return res.status(400).json({ error: '账号已被禁用' });
  }

  const token = generateToken(user.id);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      is_vip: user.is_vip,
      points: user.points
    }
  });
});

router.get('/me', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  
  res.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      is_vip: user.is_vip,
      points: user.points,
      vip_expire_time: user.vip_expire_time,
      created_at: user.created_at
    }
  });
});

router.put('/me', requireAuth, (req, res) => {
  const { nickname, avatar } = req.body;
  const db = getDb();
  
  db.prepare('UPDATE users SET nickname = ?, avatar = ?, updated_at = datetime("now") WHERE id = ?').run(
    nickname || req.user.nickname,
    avatar || req.user.avatar,
    req.user.id
  );

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  
  res.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      is_vip: user.is_vip,
      points: user.points
    }
  });
});

router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();

  if (!username || !password) {
    return res.status(400).json({ error: '请填写用户名和密码' });
  }

  const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }

  if (admin.status !== 1) {
    return res.status(400).json({ error: '账号已被禁用' });
  }

  const token = generateAdminToken(admin.id);

  res.json({
    success: true,
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      nickname: admin.nickname,
      role: admin.role
    }
  });
});

module.exports = router;
