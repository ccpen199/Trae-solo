const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'token无效' });
    }
    req.userId = decoded.userId;
    next();
  });
}

router.get('/profile', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT id, phone, nickname, avatar, created_at FROM users WHERE id = ?').get(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

router.put('/profile', authenticate, (req, res) => {
  const { nickname, avatar } = req.body;
  
  try {
    db.prepare('UPDATE users SET nickname = ?, avatar = ?, updated_at = ? WHERE id = ?').run(nickname, avatar || '', new Date().toISOString(), req.userId);
    const user = db.prepare('SELECT id, phone, nickname, avatar, created_at FROM users WHERE id = ?').get(req.userId);
    res.json({ success: true, message: '更新成功', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

router.put('/password', authenticate, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: '请输入密码' });
  }

  try {
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (!user.password) {
      bcrypt.hash(newPassword, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({ success: false, message: '设置密码失败' });
        }
        try {
          db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(hash, new Date().toISOString(), req.userId);
          res.json({ success: true, message: '设置密码成功' });
        } catch (e) {
          res.status(500).json({ success: false, message: '设置密码失败' });
        }
      });
      return;
    }

    bcrypt.compare(oldPassword, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(400).json({ success: false, message: '原密码错误' });
      }

      bcrypt.hash(newPassword, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({ success: false, message: '修改密码失败' });
        }
        try {
          db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(hash, new Date().toISOString(), req.userId);
          res.json({ success: true, message: '修改密码成功' });
        } catch (e) {
          res.status(500).json({ success: false, message: '修改密码失败' });
        }
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

module.exports = router;
