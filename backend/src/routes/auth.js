const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function generateCaptcha() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/send-captcha', (req, res) => {
  const { phone } = req.body;
  
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ success: false, message: '请输入正确的手机号' });
  }

  const code = generateCaptcha();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  try {
    db.prepare('DELETE FROM captchas WHERE phone = ?').run(phone);
    db.prepare('INSERT INTO captchas (phone, code, expires_at) VALUES (?, ?, ?)').run(phone, code, expiresAt);
    res.json({ success: true, message: '验证码已发送', code: code });
  } catch (err) {
    res.status(500).json({ success: false, message: '发送失败' });
  }
});

router.post('/login-captcha', (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ success: false, message: '请输入手机号和验证码' });
  }

  try {
    const captcha = db.prepare('SELECT * FROM captchas WHERE phone = ? AND expires_at > ?').get(phone, new Date().toISOString());

    if (!captcha) {
      return res.status(400).json({ success: false, message: '验证码已过期或不存在' });
    }

    if (captcha.code !== code) {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }

    db.prepare('DELETE FROM captchas WHERE phone = ?').run(phone);

    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

    if (user) {
      const token = generateToken(user.id);
      res.json({ success: true, message: '登录成功', token, user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar } });
    } else {
      db.prepare('INSERT INTO users (phone) VALUES (?)').run(phone);
      user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
      const token = generateToken(user.id);
      res.json({ success: true, message: '登录成功', token, user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar } });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

router.post('/login-password', (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: '请输入手机号和密码' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

    if (!user) {
      return res.status(400).json({ success: false, message: '用户不存在' });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, message: '请使用验证码登录或设置密码' });
    }

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(400).json({ success: false, message: '密码错误' });
      }

      const token = generateToken(user.id);
      res.json({ success: true, message: '登录成功', token, user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar } });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

router.post('/register', (req, res) => {
  const { phone, password, nickname } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: '请输入手机号和密码' });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({ success: false, message: '注册失败' });
    }

    try {
      db.prepare('INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)').run(phone, hash, nickname || '用户');
      const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
      const token = generateToken(user.id);
      res.json({ success: true, message: '注册成功', token, user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar } });
    } catch (err) {
      res.status(400).json({ success: false, message: '用户已存在' });
    }
  });
});

router.post('/third-party-login', (req, res) => {
  const { type, openid, nickname, avatar } = req.body;

  if (!type || !openid) {
    return res.status(400).json({ success: false, message: '参数错误' });
  }

  try {
    const phone = `${type}_${openid}`;
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

    if (user) {
      const token = generateToken(user.id);
      res.json({ success: true, message: '登录成功', token, user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar } });
    } else {
      db.prepare('INSERT INTO users (phone, nickname, avatar) VALUES (?, ?, ?)').run(phone, nickname || '用户', avatar || '');
      user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
      const token = generateToken(user.id);
      res.json({ success: true, message: '登录成功', token, user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar } });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

module.exports = router;
