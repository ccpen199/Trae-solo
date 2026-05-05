const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { logOperation } = require('../services/logService');

const router = express.Router();

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

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (user.status !== 1) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(user.role_id);
    const dept = user.department_id 
      ? db.prepare('SELECT * FROM departments WHERE id = ?').get(user.department_id)
      : null;

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    logOperation({
      user: { id: user.id, name: user.name },
      module: '认证',
      action: '登录',
      targetType: 'user',
      targetId: user.id,
      detail: '用户登录系统',
      ip: req.ip
    });

    const userInfo = {
      id: user.id,
      username: user.username,
      name: user.name,
      employeeId: user.employee_id,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      roleId: user.role_id,
      role: role ? { id: role.id, name: role.name, code: role.code } : null,
      department: dept ? { id: dept.id, name: dept.name, code: dept.code } : null
    };

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: userInfo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

router.post('/logout', authMiddleware, (req, res) => {
  try {
    logOperation({
      user: req.user,
      module: '认证',
      action: '登出',
      targetType: 'user',
      targetId: req.user.id,
      detail: '用户登出系统',
      ip: req.ip
    });

    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: '登出失败'
    });
  }
});

router.get('/info', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(user.role_id);
    const dept = user.department_id 
      ? db.prepare('SELECT * FROM departments WHERE id = ?').get(user.department_id)
      : null;

    const userInfo = {
      id: user.id,
      username: user.username,
      name: user.name,
      employeeId: user.employee_id,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      roleId: user.role_id,
      role: role ? { id: role.id, name: role.name, code: role.code } : null,
      department: dept ? { id: dept.id, name: dept.name, code: dept.code } : null
    };

    res.json({
      success: true,
      data: userInfo
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

module.exports = router;
