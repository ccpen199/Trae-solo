const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, saveDB, generateId } = require('../database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const router = express.Router();

router.post('/login', (req, res) => {
  const { phone, email, password, code, type } = req.body;

  if (type === 'sms') {
    let user = db.users.find(u => u.phone === phone);
    if (!user) {
      user = {
        id: generateId('users'),
        phone,
        email: null,
        username: `用户${phone.slice(-4)}`,
        password: null,
        avatar: null,
        points: 0,
        is_vip: 0,
        created_at: new Date().toISOString()
      };
      db.users.push(user);
      saveDB();
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...user, password: undefined } });
  } else if (type === 'password') {
    const loginValue = phone || email || req.body.username;
    let user = db.users.find(u => u.phone === loginValue || u.email === loginValue || u.username === loginValue);
    if (!user) return res.status(401).json({ error: '用户不存在' });
    if (user.password && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { ...user, password: undefined } });
    } else if (!user.password) {
      user.password = bcrypt.hashSync(password, 10);
      saveDB();
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { ...user, password: undefined } });
    } else {
      res.status(401).json({ error: '密码错误' });
    }
  } else if (type === 'thirdparty') {
    const { provider, openid } = req.body;
    let user = db.users.find(u => u.phone === openid);
    if (!user) {
      user = {
        id: generateId('users'),
        phone: openid,
        email: null,
        username: `${provider}用户`,
        password: null,
        avatar: null,
        points: 0,
        is_vip: 0,
        created_at: new Date().toISOString()
      };
      db.users.push(user);
      saveDB();
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...user, password: undefined } });
  }
});

router.post('/register', (req, res) => {
  const { phone, email, password, username } = req.body;
  const user = {
    id: generateId('users'),
    phone,
    email: email || null,
    username: username || `用户${Date.now()}`,
    password: bcrypt.hashSync(password, 10),
    avatar: null,
    points: 0,
    is_vip: 0,
    created_at: new Date().toISOString()
  };
  db.users.push(user);
  saveDB();
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { ...user, password: undefined } });
});

router.post('/reset-password', (req, res) => {
  const { phone, email, newPassword } = req.body;
  const user = db.users.find(u => u.phone === phone || u.email === email);
  if (user) {
    user.password = bcrypt.hashSync(newPassword, 10);
    saveDB();
    res.json({ message: '密码重置成功' });
  } else {
    res.status(400).json({ error: '用户不存在' });
  }
});

router.post('/send-code', (req, res) => {
  res.json({ message: '验证码已发送（模拟）', code: '123456' });
});

module.exports = router;
