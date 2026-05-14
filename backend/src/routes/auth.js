const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { success, error, serverError } = require('../utils/response');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'product-bar-jwt-secret-key-2024';

router.post('/register', (req, res) => {
  try {
    const { username, password, email, nickname } = req.body;

    if (!username || !password) {
      return error(res, '用户名和密码不能为空');
    }

    if (username.length < 3 || username.length > 20) {
      return error(res, '用户名长度必须在3-20个字符之间');
    }

    if (password.length < 6) {
      return error(res, '密码长度至少6个字符');
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return error(res, '用户名已存在');
    }

    if (email) {
      const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingEmail) {
        return error(res, '邮箱已被使用');
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, password, email, nickname, role, status)
      VALUES (?, ?, ?, ?, 'user', 'active')
    `).run(username, hashedPassword, email || null, nickname || username);

    const user = db.prepare(`
      SELECT id, username, email, nickname, avatar, role, status, created_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return success(res, { user, token }, '注册成功');
  } catch (err) {
    console.error('注册错误:', err);
    return serverError(res, '注册失败，请稍后重试');
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, '用户名和密码不能为空');
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return error(res, '用户名或密码错误');
    }

    if (user.status === 'blocked') {
      return error(res, '账号已被禁用，请联系客服');
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return error(res, '用户名或密码错误');
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      created_at: user.created_at
    };

    return success(res, { user: safeUser, token }, '登录成功');
  } catch (err) {
    console.error('登录错误:', err);
    return serverError(res, '登录失败，请稍后重试');
  }
});

router.get('/me', authMiddleware, (req, res) => {
  try {
    return success(res, req.user, '获取用户信息成功');
  } catch (err) {
    console.error('获取用户信息错误:', err);
    return serverError(res, '获取用户信息失败');
  }
});

router.put('/me', authMiddleware, (req, res) => {
  try {
    const { nickname, avatar, email } = req.body;

    const updates = [];
    const values = [];

    if (nickname !== undefined) {
      updates.push('nickname = ?');
      values.push(nickname);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }
    if (email !== undefined) {
      const existingEmail = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
      if (existingEmail) {
        return error(res, '邮箱已被使用');
      }
      updates.push('email = ?');
      values.push(email);
    }

    if (updates.length === 0) {
      return success(res, req.user, '无需更新');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedUser = db.prepare(`
      SELECT id, username, email, nickname, avatar, role, status, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    return success(res, updatedUser, '更新成功');
  } catch (err) {
    console.error('更新用户信息错误:', err);
    return serverError(res, '更新失败，请稍后重试');
  }
});

router.put('/password', authMiddleware, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return error(res, '请输入原密码和新密码');
    }

    if (newPassword.length < 6) {
      return error(res, '新密码长度至少6个字符');
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const isPasswordValid = bcrypt.compareSync(oldPassword, user.password);
    if (!isPasswordValid) {
      return error(res, '原密码错误');
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, req.user.id);

    return success(res, null, '密码修改成功');
  } catch (err) {
    console.error('修改密码错误:', err);
    return serverError(res, '修改密码失败，请稍后重试');
  }
});

module.exports = router;
