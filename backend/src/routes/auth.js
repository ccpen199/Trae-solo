const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'state-grid-secret-key-2024',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  });
});

router.post('/register', (req, res) => {
  const { username, password, phone, real_name } = req.body;

  if (!username || !password || !phone) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (username, password, phone, real_name, points) VALUES (?, ?, ?, ?, 0)',
    [username, hashedPassword, phone, real_name || ''],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: '用户名或手机号已存在' });
        }
        return res.status(500).json({ error: '注册失败' });
      }

      const token = jwt.sign(
        { id: this.lastID, username },
        process.env.JWT_SECRET || 'state-grid-secret-key-2024',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: { id: this.lastID, username, phone, real_name, points: 0 }
      });
    }
  );
});

router.get('/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, username, phone, email, real_name, avatar, points, user_type, province, city, district, address, risk_level, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: '服务器错误' });
      }
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json(user);
    }
  );
});

router.put('/profile', authenticateToken, (req, res) => {
  const { phone, email, real_name, province, city, district, address } = req.body;

  db.run(
    'UPDATE users SET phone = ?, email = ?, real_name = ?, province = ?, city = ?, district = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [phone, email, real_name, province, city, district, address, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: '更新失败' });
      }
      res.json({ message: '更新成功' });
    }
  );
});

module.exports = router;
