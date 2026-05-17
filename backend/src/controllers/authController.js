const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDB } = require('../models/db');

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateInviteCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationCode(req, res) {
  try {
    const { phone, type = 'login' } = req.body;
    
    if (!phone || !/^\d{11}$/.test(phone)) {
      return res.status(400).json({ success: false, message: '请输入有效的手机号' });
    }

    const db = getDB();
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    db.prepare(`
      INSERT INTO verification_codes (phone, code, type, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(phone, code, type, expiresAt.toISOString());

    console.log(`📱 验证码: ${phone} -> ${code}`);

    res.json({ success: true, message: '验证码已发送', code: process.env.NODE_ENV === 'development' ? code : undefined });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ success: false, message: '发送验证码失败' });
  }
}

async function register(req, res) {
  try {
    const { phone, code, inviteCode, password } = req.body;

    if (!phone || !/^\d{11}$/.test(phone)) {
      return res.status(400).json({ success: false, message: '请输入有效的手机号' });
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: '请输入6位验证码' });
    }

    const db = getDB();

    const verification = db.prepare(`
      SELECT * FROM verification_codes 
      WHERE phone = ? AND code = ? AND type = 'login' AND used = 0
      ORDER BY created_at DESC LIMIT 1
    `).get(phone, code);

    if (!verification) {
      return res.status(400).json({ success: false, message: '验证码错误或已过期' });
    }

    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: '验证码已过期' });
    }

    db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(verification.id);

    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      const token = jwt.sign({ userId: existingUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const baby = db.prepare('SELECT * FROM babies WHERE user_id = ?').get(existingUser.id);
      return res.json({
        success: true,
        message: '登录成功',
        token,
        user: existingUser,
        hasBabyInfo: !!baby
      });
    }

    const hashedPassword = password ? bcrypt.hashSync(password, 10) : null;
    const userInviteCode = generateInviteCode();

    const result = db.prepare(`
      INSERT INTO users (phone, password, nickname, invite_code, invited_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(phone, hashedPassword, `用户${phone.slice(-4)}`, userInviteCode, inviteCode || null);

    const userId = result.lastInsertRowid;
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const user = db.prepare('SELECT id, phone, nickname, avatar, role FROM users WHERE id = ?').get(userId);

    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user,
      hasBabyInfo: false
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ success: false, message: '注册失败', error: error.message });
  }
}

async function login(req, res) {
  try {
    const { phone, code, password } = req.body;

    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

    if (!user) {
      return res.status(400).json({ success: false, message: '用户不存在，请先注册' });
    }

    if (code) {
      const verification = db.prepare(`
        SELECT * FROM verification_codes 
        WHERE phone = ? AND code = ? AND type = 'login' AND used = 0
        ORDER BY created_at DESC LIMIT 1
      `).get(phone, code);

      if (!verification || new Date(verification.expires_at) < new Date()) {
        return res.status(400).json({ success: false, message: '验证码错误或已过期' });
      }

      db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(verification.id);
    } else if (password) {
      if (!user.password || !bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ success: false, message: '密码错误' });
      }
    } else {
      return res.status(400).json({ success: false, message: '请提供验证码或密码' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const baby = db.prepare('SELECT * FROM babies WHERE user_id = ?').get(user.id);

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role
      },
      hasBabyInfo: !!baby
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败', error: error.message });
  }
}

async function getCurrentUser(req, res) {
  try {
    const db = getDB();
    const baby = db.prepare('SELECT * FROM babies WHERE user_id = ?').get(req.user.id);
    const book = baby ? db.prepare('SELECT * FROM growth_books WHERE baby_id = ?').get(baby.id) : null;

    res.json({
      success: true,
      user: req.user,
      baby,
      book,
      hasBabyInfo: !!baby
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
}

module.exports = { sendVerificationCode, register, login, getCurrentUser };
