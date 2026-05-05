const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const { validateLogin, validateRegistration } = require('../utils/validation');
const { ensureAuthenticated, isAdmin, ROLES } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const validation = validateLogin({ username, password });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join('; ')
      });
    }
    
    const user = await userModel.findByUsername(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    if (!userModel.verifyPassword(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    const userSession = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    
    req.session.user = userSession;
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userSession,
        redirectTo: user.role === ROLES.ADMIN ? '/admin' : '/user'
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword, age, gender } = req.body;
    
    const validation = validateRegistration({ 
      username, password, confirmPassword, age, gender 
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join('; ')
      });
    }
    
    const existingUser = await userModel.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    const newUser = await userModel.createUser({
      username,
      password,
      age: age || null,
      gender: gender || null,
      role: 'user'
    });
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role
        }
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

router.post('/logout', ensureAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '退出登录失败'
      });
    }
    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: '已成功退出登录'
    });
  });
});

router.post('/delete-account', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const deleted = await userModel.deleteUser(userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('销毁会话失败:', err);
      }
      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: '账号已成功注销'
      });
    });
    
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: '注销账号失败'
    });
  }
});

router.get('/me', ensureAuthenticated, async (req, res) => {
  try {
    const user = await userModel.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

router.get('/check-auth', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      success: true,
      authenticated: true,
      user: req.session.user,
      isAdmin: isAdmin(req)
    });
  } else {
    res.json({
      success: true,
      authenticated: false
    });
  }
});

module.exports = router;
