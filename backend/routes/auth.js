
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { checkRateLimit, logAudit } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', 
  checkRateLimit('register', 3, 60),
  logAudit('user_register'),
  async (req, res) => {
    try {
      const { username, phone, password, role, wechat_id } = req.body;

      if (!username || !phone || !password) {
        return res.status(400).json({ error: '用户名、手机号和密码必填' });
      }

      const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ?').get(username, phone);
      if (existingUser) {
        return res.status(400).json({ error: '用户名或手机号已存在' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = db.prepare(`
        INSERT INTO users (username, phone, password, role, wechat_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(username, phone, hashedPassword, role || 'jobseeker', wechat_id || null);

      const token = jwt.sign(
        { id: result.lastInsertRowid, username, role: role || 'jobseeker' },
        process.env.JWT_SECRET || 'referral_platform_secret_key_2024',
        { expiresIn: '7d' }
      );

      const user = db.prepare('SELECT id, username, phone, role, wechat_id, avatar, current_company_id FROM users WHERE id = ?').get(result.lastInsertRowid);

      res.json({ user, token });
    } catch (err) {
      console.error('注册失败:', err);
      res.status(500).json({ error: '注册失败' });
    }
  }
);

router.post('/login',
  checkRateLimit('login', 5, 15),
  logAudit('user_login'),
  async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码必填' });
      }

      const user = db.prepare('SELECT * FROM users WHERE username = ? OR phone = ?').get(username, username);
      if (!user) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'referral_platform_secret_key_2024',
        { expiresIn: '7d' }
      );

      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (err) {
      console.error('登录失败:', err);
      res.status(500).json({ error: '登录失败' });
    }
  }
);

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', authenticateToken, logAudit('user_logout'), (req, res) => {
  res.json({ message: '登出成功' });
});

module.exports = router;
