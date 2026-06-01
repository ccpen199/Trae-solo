const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await db.get(
      'SELECT u.*, r.name as role_name, r.description as role_description, r.permissions ' +
      'FROM users u JOIN roles r ON u.role_id = r.id ' +
      'WHERE u.username = ? AND u.password = ? AND u.status = "active"',
      [username, password]
    );

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    await db.run(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        roleName: user.role_name,
        roleDescription: user.role_description,
        permissions: JSON.parse(user.permissions)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录服务错误' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await db.run('DELETE FROM sessions WHERE token = ?', [token]);
    }
    res.json({ message: '登出成功' });
  } catch (error) {
    res.status(500).json({ error: '登出服务错误' });
  }
});

module.exports = router;
