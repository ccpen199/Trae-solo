const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'logistics-jwt-secret-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  const user = db.prepare(`
    SELECT u.*, r.code as role_code, r.name as role_name 
    FROM users u 
    LEFT JOIN roles r ON u.role_id = r.id 
    WHERE u.username = ?
  `).get(username);

  if (!user) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  if (user.status !== 1) {
    return res.status(403).json({ message: '用户已被禁用，请联系管理员' });
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  const { password: _, ...userInfo } = user;

  res.json({
    message: '登录成功',
    token,
    user: userInfo
  });
});

router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: '已退出登录' });
});

router.get('/profile', authMiddleware, (req, res) => {
  const { password: _, ...userInfo } = req.user;
  res.json(userInfo);
});

router.put('/profile', authMiddleware, (req, res) => {
  const { real_name, phone, email } = req.body;
  const userId = req.user.id;

  try {
    db.prepare(`
      UPDATE users SET real_name = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(real_name, phone, email, userId);

    const updatedUser = db.prepare(`
      SELECT u.*, r.code as role_code, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?
    `).get(userId);

    const { password: _, ...userInfo } = updatedUser;
    res.json({ message: '资料更新成功', user: userInfo });
  } catch (error) {
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

router.put('/password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: '原密码和新密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(400).json({ message: '原密码错误' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, userId);

  res.json({ message: '密码修改成功' });
});

module.exports = router;
