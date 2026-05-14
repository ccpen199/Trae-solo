const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

module.exports = function(db) {
  router.post('/register', (req, res) => {
    try {
      const { username, password, nickname } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          code: 400,
          message: '用户名和密码不能为空',
          data: null
        });
      }
      
      const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (existingUser) {
        return res.status(400).json({
          code: 400,
          message: '用户名已存在',
          data: null
        });
      }
      
      const hash = bcrypt.hashSync(password, 10);
      const result = db.prepare(`
        INSERT INTO users (username, password, nickname, avatar)
        VALUES (?, ?, ?, ?)
      `).run(username, hash, nickname || username, `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`);
      
      const user = db.prepare('SELECT id, username, nickname, avatar FROM users WHERE id = ?').get(result.lastInsertRowid);
      
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'may-991-jwt-secret-key-2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      res.json({
        code: 200,
        message: '注册成功',
        data: { user, token }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.post('/login', (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          code: 400,
          message: '用户名和密码不能为空',
          data: null
        });
      }
      
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({
          code: 400,
          message: '用户名或密码错误',
          data: null
        });
      }
      
      if (user.status !== 1) {
        return res.status(400).json({
          code: 400,
          message: '账号已被禁用',
          data: null
        });
      }
      
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'may-991-jwt-secret-key-2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      const userInfo = {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        email: user.email
      };
      
      res.json({
        code: 200,
        message: '登录成功',
        data: { user: userInfo, token }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.get('/profile', verifyToken, (req, res) => {
    try {
      const user = db.prepare('SELECT id, username, nickname, avatar, phone, email, created_at FROM users WHERE id = ?').get(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          code: 404,
          message: '用户不存在',
          data: null
        });
      }
      
      const stats = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM orders WHERE user_id = ? AND status >= 0) as orderCount,
          (SELECT COUNT(*) FROM favorites WHERE user_id = ?) as favoriteCount,
          (SELECT COUNT(*) FROM carts WHERE user_id = ?) as cartCount
      `).get(req.user.id, req.user.id, req.user.id);
      
      res.json({
        code: 200,
        message: '获取成功',
        data: { ...user, ...stats }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.put('/profile', verifyToken, (req, res) => {
    try {
      const { nickname, phone, email } = req.body;
      
      const updates = [];
      const values = [];
      
      if (nickname !== undefined) {
        updates.push('nickname = ?');
        values.push(nickname);
      }
      if (phone !== undefined) {
        updates.push('phone = ?');
        values.push(phone);
      }
      if (email !== undefined) {
        updates.push('email = ?');
        values.push(email);
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.user.id);
      
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      
      const user = db.prepare('SELECT id, username, nickname, avatar, phone, email FROM users WHERE id = ?').get(req.user.id);
      
      res.json({
        code: 200,
        message: '更新成功',
        data: user
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  return router;
};
