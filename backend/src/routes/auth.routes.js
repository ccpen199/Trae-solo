const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken, authMiddleware } = require('../middleware/auth.middleware');

const ROLE_DISPLAY = {
  admin: '系统管理员',
  finance: '财务',
  tax_advisor: '税务顾问',
  enterprise_manager: '企业负责人'
};

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: '用户已被禁用，请联系管理员' 
      });
    }
    
    const passwordMatch = bcrypt.compareSync(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.real_name,
          role: user.role,
          roleDisplay: ROLE_DISPLAY[user.role] || user.role,
          email: user.email,
          phone: user.phone,
          department: user.department
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '登录失败',
      error: error.message 
    });
  }
});

router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: '已登出'
  });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        username: req.user.username,
        realName: req.user.realName,
        role: req.user.role,
        roleDisplay: ROLE_DISPLAY[req.user.role] || req.user.role
      }
    }
  });
});

router.get('/users', authMiddleware, (req, res) => {
  try {
    const { role, keyword } = req.query;
    
    let sql = `
      SELECT id, username, real_name, role, email, phone, department, status, created_at
      FROM users WHERE 1=1
    `;
    const params = [];
    
    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    
    if (keyword) {
      sql += ' AND (username LIKE ? OR real_name LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const users = db.prepare(sql).all(...params);
    
    res.json({
      success: true,
      data: users.map(u => ({
        id: u.id,
        username: u.username,
        realName: u.real_name,
        role: u.role,
        roleDisplay: ROLE_DISPLAY[u.role] || u.role,
        email: u.email,
        phone: u.phone,
        department: u.department,
        status: u.status,
        createdAt: u.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '获取用户列表失败',
      error: error.message 
    });
  }
});

module.exports = router;
