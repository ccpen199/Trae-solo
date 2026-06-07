const express = require('express');
const db = require('../config/database');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, email, phone, company_name } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const hashedPassword = await hashPassword(password);
    
    db.run(
      `INSERT INTO users (username, password, email, phone, company_name) VALUES (?, ?, ?, ?, ?)`,
      [username, hashedPassword, email, phone, company_name],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: '用户名或邮箱已存在' });
          }
          return res.status(500).json({ error: err.message });
        }
        
        const token = generateToken(this.lastID, 'user');
        res.json({ 
          success: true, 
          token, 
          user: { 
            id: this.lastID, 
            username, 
            email, 
            role: 'user' 
          } 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: '用户名或密码错误' });

    const isValid = await comparePassword(password, user.password);
    if (!isValid) return res.status(401).json({ error: '用户名或密码错误' });

    const token = generateToken(user.id, user.role);
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      } 
    });
  });
});

router.get('/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登录' });

  const { verifyToken } = require('../utils/auth');
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: '无效的令牌' });

  db.get(`SELECT id, username, email, phone, company_name, role, created_at FROM users WHERE id = ?`, 
    [decoded.userId], 
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, user });
    }
  );
});

module.exports = router;
