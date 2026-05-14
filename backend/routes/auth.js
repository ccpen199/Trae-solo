const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { success, error, unauthorized } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'me-tao-secret-key-2026';

router.post('/login', (req, res) => {
  try {
    const { taobao_account, password } = req.body;

    if (!taobao_account || !password) {
      return res.status(400).json(error('请输入淘宝账号和密码'));
    }

    const user = db.prepare('SELECT * FROM users WHERE taobao_account = ?').get(taobao_account);

    if (!user) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const insertStmt = db.prepare(`
        INSERT INTO users (taobao_account, password, nickname)
        VALUES (?, ?, ?)
      `);
      const result = insertStmt.run(taobao_account, hashedPassword, taobao_account);
      
      const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      
      const token = jwt.sign(
        { id: newUser.id, taobao_account: newUser.taobao_account, nickname: newUser.nickname },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json(success({
        token,
        user: {
          id: newUser.id,
          taobao_account: newUser.taobao_account,
          nickname: newUser.nickname,
          avatar: newUser.avatar,
          notification_permission: newUser.notification_permission
        }
      }, '登录成功'));
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(unauthorized('账号或密码错误'));
    }

    const token = jwt.sign(
      { id: user.id, taobao_account: user.taobao_account, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json(success({
      token,
      user: {
        id: user.id,
        taobao_account: user.taobao_account,
        nickname: user.nickname,
        avatar: user.avatar,
        notification_permission: user.notification_permission
      }
    }, '登录成功'));
  } catch (err) {
    console.error('登录失败:', err);
    return res.status(500).json(error('登录失败，请稍后重试'));
  }
});

router.get('/profile', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, taobao_account, nickname, avatar, notification_permission, created_at FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json(error('用户不存在'));
    }

    return res.json(success(user));
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return res.status(500).json(error('获取用户信息失败'));
  }
});

router.put('/notification-permission', authMiddleware, (req, res) => {
  try {
    const { enabled } = req.body;
    const enabledValue = enabled ? 1 : 0;

    db.prepare('UPDATE users SET notification_permission = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(enabledValue, req.user.id);

    const user = db.prepare('SELECT id, notification_permission FROM users WHERE id = ?').get(req.user.id);
    
    return res.json(success(user, '通知权限已更新'));
  } catch (err) {
    console.error('更新通知权限失败:', err);
    return res.status(500).json(error('更新通知权限失败'));
  }
});

router.post('/logout', authMiddleware, (req, res) => {
  try {
    return res.json(success(null, '已退出登录'));
  } catch (err) {
    return res.status(500).json(error('退出失败'));
  }
});

module.exports = router;
