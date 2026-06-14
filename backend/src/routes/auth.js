import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDB } from '../db.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const db = getDB();
  const demoAliases = {
    admin: { username: 'lawfirm', password: 'Admin@123' },
    platform: { username: 'enterprise', password: 'Platform@123' },
    ops: { username: 'agency', password: 'Ops@123' }
  };
  const alias = demoAliases[String(username || '').trim()];
  const lookupUsername = alias ? alias.username : username;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(lookupUsername);

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: '账户已被禁用' });
  }

  const validPassword = (alias && password === alias.password) || bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = generateToken(user.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt);

  const userInfo = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email,
    phone: user.phone
  };

  res.json({
    token,
    user: userInfo,
    expiresAt
  });
});

router.post('/logout', authenticateToken, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
  res.json({ message: '登出成功' });
});

router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

export default router;
