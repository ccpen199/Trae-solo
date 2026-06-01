import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/init.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码为必填项' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, permission_granted, description, ip_address)
    VALUES ('login', ?, ?, 'login', 'auth', ?, ?, ?)
  `).run(
    user?.id || null,
    username,
    user ? 1 : 0,
    `用户登录尝试: ${username}`,
    req.ip
  );

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (user.status !== 'active') {
    return res.status(401).json({ error: '用户已被禁用' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      email: user.email,
      role: user.role
    }
  });
});

router.post('/logout', (req, res) => {
  res.json({ message: '登出成功' });
});

export default router;
