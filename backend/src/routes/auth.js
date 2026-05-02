const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken, getUserFromToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }
    
    const users = query(
      'SELECT * FROM users WHERE username = ? AND status = 1',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    const user = users[0];
    
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    const token = generateToken(user);
    
    const userWithRoles = await getUserFromToken(token);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: userWithRoles.id,
          username: userWithRoles.username,
          name: userWithRoles.name,
          email: userWithRoles.email,
          phone: userWithRoles.phone,
          department: userWithRoles.department,
          roles: userWithRoles.roles,
          permissions: userWithRoles.permissions
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        roles: user.roles,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

module.exports = router;
