import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    const userResult = await query(
      'SELECT u.*, r.name as role_name, r.permissions FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const user = userResult.rows[0];

    if (user.status !== 1) {
      return res.status(403).json({ success: false, message: '账户已被禁用' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    await query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.real_name,
          email: user.email,
          phone: user.phone,
          roleName: user.role_name,
          permissions: JSON.parse(user.permissions || '[]')
        }
      },
      message: '登录成功'
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userResult = await query(
      'SELECT u.id, u.username, u.real_name, u.email, u.phone, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      data: userResult.rows[0]
    });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '原密码和新密码不能为空' });
    }

    const userResult = await query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    const isOldPasswordValid = await bcrypt.compare(oldPassword, userResult.rows[0].password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ success: false, message: '原密码错误' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    console.error('修改密码错误:', err);
    res.status(500).json({ success: false, message: '修改密码失败' });
  }
});

router.post('/logout', authMiddleware, (req, res) => {
  res.json({ success: true, message: '已退出登录' });
});

export default router;
