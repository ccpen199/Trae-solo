const express = require('express');
const router = express.Router();
const db = require('../database');
const { hashPassword, verifyPassword, generateToken, buildSuccessResponse, buildErrorResponse } = require('../utils');
const { authMiddleware } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json(
      buildErrorResponse(new Error('缺少参数'), '用户名和密码不能为空')
    );
  }
  
  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json(buildErrorResponse(err, '登录失败'));
      }
      
      if (!user || !verifyPassword(password, user.password)) {
        return res.status(401).json(
          buildErrorResponse(new Error('认证失败'), '用户名或密码错误')
        );
      }
      
      const token = generateToken(user);
      
      res.json(buildSuccessResponse({
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.real_name,
          role: user.role,
          email: user.email,
          phone: user.phone,
          identityVerified: user.identity_verified === 1
        }
      }, '登录成功'));
    }
  );
});

router.post('/register', (req, res) => {
  const { username, password, realName, email, phone } = req.body;
  
  if (!username || !password) {
    return res.status(400).json(
      buildErrorResponse(new Error('缺少参数'), '用户名和密码不能为空')
    );
  }
  
  const hashedPassword = hashPassword(password);
  const userId = require('uuid').v4();
  
  db.run(
    `INSERT INTO users (id, username, password, real_name, email, phone, role, identity_verified)
     VALUES (?, ?, ?, ?, ?, ?, 'user', 0)`,
    [userId, username, hashedPassword, realName, email, phone],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json(
            buildErrorResponse(new Error('用户名已存在'), '该用户名已被注册')
          );
        }
        return res.status(500).json(buildErrorResponse(err, '注册失败'));
      }
      
      res.json(buildSuccessResponse({
        userId,
        username,
        realName
      }, '注册成功'));
    }
  );
});

router.get('/me', authMiddleware, (req, res) => {
  db.get(
    'SELECT * FROM users WHERE id = ?',
    [req.user.userId],
    (err, user) => {
      if (err) {
        return res.status(500).json(buildErrorResponse(err, '获取用户信息失败'));
      }
      
      if (!user) {
        return res.status(404).json(
          buildErrorResponse(new Error('用户不存在'), '用户不存在')
        );
      }
      
      res.json(buildSuccessResponse({
        id: user.id,
        username: user.username,
        realName: user.real_name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        identityVerified: user.identity_verified === 1,
        createdAt: user.created_at
      }, '获取成功'));
    }
  );
});

router.post('/verify-identity', authMiddleware, (req, res) => {
  const { idCard, realName } = req.body;
  
  if (!idCard || !realName) {
    return res.status(400).json(
      buildErrorResponse(new Error('缺少参数'), '身份证号和真实姓名不能为空')
    );
  }
  
  const isVerified = idCard.length >= 15 && realName.length >= 2;
  
  if (!isVerified) {
    return res.status(400).json(
      buildErrorResponse(new Error('认证失败'), '身份认证失败，请检查信息是否正确')
    );
  }
  
  db.run(
    `UPDATE users SET identity_verified = 1, real_name = ? WHERE id = ?`,
    [realName, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json(buildErrorResponse(err, '身份认证失败'));
      }
      
      res.json(buildSuccessResponse({
        identityVerified: true,
        realName
      }, '身份认证成功'));
    }
  );
});

module.exports = router;
