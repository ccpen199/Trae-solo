const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const config = require('../config');
const AuthMiddleware = require('../middleware/auth');
const AuditService = require('../services/auditService');

const router = express.Router();

const getUserByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?');

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const user = getUserByUsernameStmt.get(username);
    
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    if (user.status !== 'active') {
      return res.status(401).json({ error: '用户已被禁用' });
    }
    
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    
    if (!isPasswordValid) {
      AuditService.log('user', user.id, 'login_failed', user.id, user.role, 
        { reason: 'invalid_password' }, 'failed');
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const token = AuthMiddleware.generateToken(user.id, user.role);
    
    AuditService.log('user', user.id, 'login', user.id, user.role, {}, 'success');
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

router.get('/me', AuthMiddleware.authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', AuthMiddleware.authenticate, (req, res) => {
  AuditService.log('user', req.user.id, 'logout', req.user.id, req.user.role, {}, 'success');
  res.json({ message: '已登出' });
});

router.get('/roles', AuthMiddleware.authenticate, (req, res) => {
  const roleNames = {
    [config.roles.POLICYHOLDER]: '投保人',
    [config.roles.AGENT]: '代理人',
    [config.roles.UNDERWRITER]: '核保员',
    [config.roles.CLAIM_ADJUSTER]: '理赔员',
    [config.roles.ADMIN]: '管理员'
  };
  
  res.json({
    currentRole: req.user.role,
    currentRoleName: roleNames[req.user.role] || req.user.role,
    allRoles: roleNames
  });
});

module.exports = router;
