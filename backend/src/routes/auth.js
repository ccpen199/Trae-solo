const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getQuery, runQuery } = require('../database/schema');
const { authMiddleware } = require('../engines/permissionEngine');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campus-edu-secret-key-2024';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const user = await getQuery('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({ error: '用户已被禁用，请联系管理员' });
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    let profile = null;
    
    if (user.role === 'student') {
      profile = await getQuery(
        `SELECT sp.*, c.class_name, c.class_code, c.grade
         FROM student_profiles sp
         LEFT JOIN classes c ON sp.class_id = c.id
         WHERE sp.user_id = ?`,
        [user.id]
      );
    } else if (user.role === 'teacher' || user.role === 'homeroom_teacher') {
      profile = await getQuery(
        `SELECT * FROM teacher_profiles WHERE user_id = ?`,
        [user.id]
      );
    }
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        status: user.status
      },
      profile
    });
    
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role = 'student' } = req.body;
    
    if (!username || !password || !name) {
      return res.status(400).json({ error: '用户名、密码和姓名不能为空' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' });
    }
    
    const existingUser = await getQuery('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await runQuery(
      `INSERT INTO users (username, password, role, name, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [username, hashedPassword, role, name]
    );
    
    res.json({
      success: true,
      userId: result.lastID,
      message: '注册成功'
    });
    
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/me', authMiddleware(), (req, res) => {
  res.json({
    user: req.user
  });
});

router.post('/change-password', authMiddleware(), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '旧密码和新密码不能为空' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度至少6位' });
    }
    
    const user = await getQuery('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    
    if (!isOldPasswordValid) {
      return res.status(400).json({ error: '旧密码错误' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await runQuery(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, req.user.id]
    );
    
    res.json({ success: true, message: '密码修改成功' });
    
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/logout', authMiddleware(), (req, res) => {
  res.json({ success: true, message: '已登出' });
});

module.exports = router;
