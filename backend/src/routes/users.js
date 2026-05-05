const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authMiddleware, generateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, password, phone, nickname } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  
  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }
    
    if (phone) {
      const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
      if (existingPhone) {
        return res.status(400).json({ success: false, message: '手机号已被注册' });
      }
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const result = db.prepare(
      'INSERT INTO users (username, password, phone, nickname, avatar) VALUES (?, ?, ?, ?, ?)'
    ).run(username, hashedPassword, phone || null, nickname || username, null);
    
    const user = db.prepare(
      'SELECT id, username, phone, nickname, avatar, role, is_member, is_verified, city FROM users WHERE id = ?'
    ).get(result.lastInsertRowid);
    
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      message: '注册成功',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ success: false, message: '注册失败，请稍后重试' });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    
    const token = generateToken(user.id);
    
    const userInfo = {
      id: user.id,
      username: user.username,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      is_member: user.is_member,
      is_verified: user.is_verified,
      city: user.city
    };
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userInfo,
        token
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败，请稍后重试' });
  }
});

router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

router.put('/profile', authMiddleware, (req, res) => {
  const { nickname, avatar, city } = req.body;
  
  try {
    const updateFields = [];
    const values = [];
    
    if (nickname !== undefined) {
      updateFields.push('nickname = ?');
      values.push(nickname);
    }
    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      values.push(avatar);
    }
    if (city !== undefined) {
      updateFields.push('city = ?');
      values.push(city);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: '没有要更新的字段' });
    }
    
    values.push(req.user.id);
    
    db.prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);
    
    const updatedUser = db.prepare(
      'SELECT id, username, phone, nickname, avatar, role, is_member, is_verified, city FROM users WHERE id = ?'
    ).get(req.user.id);
    
    res.json({
      success: true,
      message: '更新成功',
      data: updatedUser
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ success: false, message: '更新失败，请稍后重试' });
  }
});

router.put('/password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: '原密码和新密码不能为空' });
  }
  
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    
    if (!bcrypt.compareSync(oldPassword, user.password)) {
      return res.status(400).json({ success: false, message: '原密码错误' });
    }
    
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.user.id);
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ success: false, message: '修改失败，请稍后重试' });
  }
});

router.post('/agreement', (req, res) => {
  const { agreed } = req.body;
  
  if (agreed === false) {
    return res.json({
      success: true,
      data: { shouldExit: true }
    });
  }
  
  res.json({
    success: true,
    data: { shouldExit: false }
  });
});

router.get('/member/info', authMiddleware, (req, res) => {
  const isMember = req.user.is_member;
  
  res.json({
    success: true,
    data: {
      is_member: isMember,
      member_since: isMember ? '2024-01-01' : null,
      member_expire: isMember ? '2025-01-01' : null,
      member_discount: 0.95,
      member_points: isMember ? 1280 : 0
    }
  });
});

module.exports = router;
