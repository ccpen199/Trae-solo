const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let verificationCodeStore = new Map();
const CODE_LIMITS = new Map();

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationCode = async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 11 || !/^\d{11}$/.test(phone)) {
    return res.status(400).json({ success: false, message: '手机号格式不正确，请输入11位手机号' });
  }

  const now = Date.now();
  const lastSend = CODE_LIMITS.get(phone);
  if (lastSend && now - lastSend < 60000) {
    const remaining = Math.ceil((60000 - (now - lastSend)) / 1000);
    return res.status(429).json({ success: false, message: `发送太频繁，请${remaining}秒后再试` });
  }

  const code = generateCode();
  const expireAt = new Date(now + 5 * 60 * 1000);

  verificationCodeStore.set(phone, { code, expireAt: expireAt.getTime() });
  CODE_LIMITS.set(phone, now);

  console.log(`[DEBUG] 验证码: ${code}, 过期时间: ${expireAt.toLocaleString()}`);

  res.json({
    success: true,
    message: '验证码已发送',
    debug: process.env.NODE_ENV !== 'production' ? { code, expireIn: 300 } : undefined
  });
};

const loginWithCode = async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || phone.length !== 11) {
    return res.status(400).json({ success: false, message: '手机号格式不正确' });
  }
  if (!code) {
    return res.status(400).json({ success: false, message: '请输入验证码' });
  }

  const stored = verificationCodeStore.get(phone);
  if (!stored) {
    return res.status(400).json({ success: false, message: '验证码不存在，请先获取验证码' });
  }

  const now = Date.now();
  if (stored.expireAt < now) {
    verificationCodeStore.delete(phone);
    return res.status(400).json({ success: false, message: '验证码已过期，请重新获取' });
  }

  if (stored.code !== code) {
    return res.status(400).json({ success: false, message: '验证码不正确' });
  }

  verificationCodeStore.delete(phone);

  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO users (id, phone, nickname)
      VALUES (?, ?, ?)
    `).run(id, phone, `用户${phone.slice(-4)}`);
    
    db.prepare(`
      INSERT INTO user_assets (id, user_id, balance, coupon_count, points)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), id, 100.00, 3, 100);
    
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  const token = jwt.sign(
    { id: user.id, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar
      }
    }
  });
};

const loginWithPassword = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || phone.length !== 11) {
    return res.status(400).json({ success: false, message: '手机号格式不正确' });
  }
  if (!password) {
    return res.status(400).json({ success: false, message: '请输入密码' });
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user || !user.password) {
    return res.status(400).json({ success: false, message: '用户不存在或未设置密码，请使用验证码登录' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(400).json({ success: false, message: '密码不正确' });
  }

  const token = jwt.sign(
    { id: user.id, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar
      }
    }
  });
};

const thirdPartyLogin = async (req, res) => {
  const { thirdType, thirdId, nickname, avatar } = req.body;
  if (!thirdType || !thirdId) {
    return res.status(400).json({ success: false, message: '第三方登录信息不完整' });
  }

  let user = db.prepare('SELECT * FROM users WHERE third_party_type = ? AND third_party_id = ?').get(thirdType, thirdId);
  
  if (!user) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO users (id, nickname, avatar, third_party_type, third_party_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, nickname || '第三方用户', avatar || '', thirdType, thirdId);
    
    db.prepare(`
      INSERT INTO user_assets (id, user_id, balance, coupon_count, points)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), id, 50.00, 1, 50);
    
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  const token = jwt.sign(
    { id: user.id, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar
      }
    }
  });
};

const getProfile = async (req, res) => {
  const user = db.prepare('SELECT id, phone, nickname, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  const assets = db.prepare('SELECT balance, coupon_count, points FROM user_assets WHERE user_id = ?').get(req.user.id);
  
  res.json({
    success: true,
    data: {
      ...user,
      assets: assets || { balance: 0, coupon_count: 0, points: 0 }
    }
  });
};

module.exports = {
  sendVerificationCode,
  loginWithCode,
  loginWithPassword,
  thirdPartyLogin,
  getProfile
};