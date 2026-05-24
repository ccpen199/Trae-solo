const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/member/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' });
  }
  const member = db.prepare('SELECT * FROM members WHERE phone = ?').get(phone);
  if (!member) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }
  if (!bcrypt.compareSync(password, member.password)) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }
  if (member.status !== 'active') {
    return res.status(403).json({ error: '账号已被禁用' });
  }
  const level = db.prepare('SELECT * FROM member_levels WHERE id = ?').get(member.level_id);
  const token = generateToken({ id: member.id, role: 'member' }, 'member');
  const { password: _, ...memberWithoutPwd } = member;
  res.json({ token, member: { ...memberWithoutPwd, level } });
});

router.post('/member/register', (req, res) => {
  const { phone, password, name } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' });
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: '手机号格式不正确' });
  }
  const exists = db.prepare('SELECT id FROM members WHERE phone = ?').get(phone);
  if (exists) {
    return res.status(400).json({ error: '该手机号已注册' });
  }
  const hashedPwd = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO members (phone, password, name) VALUES (?, ?, ?)').run(phone, hashedPwd, name || '');
  
  db.prepare('INSERT INTO member_coupons (member_id, coupon_id) VALUES (?, 1)').run(result.lastInsertRowid);
  
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
  const level = db.prepare('SELECT * FROM member_levels WHERE id = ?').get(member.level_id);
  const token = generateToken({ id: member.id, role: 'member' }, 'member');
  const { password: _, ...memberWithoutPwd } = member;
  res.json({ token, member: { ...memberWithoutPwd, level } });
});

router.post('/staff/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  if (user.status !== 'active') {
    return res.status(403).json({ error: '账号已被禁用' });
  }
  const station = user.station_id ? db.prepare('SELECT * FROM stations WHERE id = ?').get(user.station_id) : null;
  const token = generateToken({ id: user.id, role: user.role }, 'staff');
  const { password: _, ...userWithoutPwd } = user;
  res.json({ token, user: { ...userWithoutPwd, station } });
});

router.get('/me', authenticate, (req, res) => {
  if (req.user.type === 'member') {
    const member = db.prepare('SELECT m.*, l.name as level_name, l.discount_rate, l.point_multiplier FROM members m LEFT JOIN member_levels l ON m.level_id = l.id WHERE m.id = ?').get(req.user.id);
    if (!member) return res.status(404).json({ error: '用户不存在' });
    const { password, ...memberWithoutPwd } = member;
    res.json({ type: 'member', data: memberWithoutPwd });
  } else {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    const station = user.station_id ? db.prepare('SELECT * FROM stations WHERE id = ?').get(user.station_id) : null;
    const { password, ...userWithoutPwd } = user;
    res.json({ type: 'staff', data: { ...userWithoutPwd, station } });
  }
});

module.exports = router;
