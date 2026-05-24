import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth';
import { logOperation } from '../middleware/operationLog';
import { validateRequiredFields } from '../utils';

const router = express.Router();

router.post(
  '/login',
  logOperation('auth', 'user'),
  (req, res) => {
    const { username, password } = req.body;
    const missing = validateRequiredFields(req.body, ['username', 'password']);
    
    if (missing.length > 0) {
      return res.status(400).json({ error: `缺少必填字段: ${missing.join(', ')}` });
    }

    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as any;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          phone: user.phone
        }
      }
    });
  }
);

router.get(
  '/me',
  authMiddleware(),
  (req: AuthRequest, res) => {
    res.json({
      success: true,
      data: req.user
    });
  }
);

router.post(
  '/change-password',
  authMiddleware(),
  logOperation('auth', 'user'),
  (req: AuthRequest, res) => {
    const { oldPassword, newPassword } = req.body;
    const missing = validateRequiredFields(req.body, ['oldPassword', 'newPassword']);
    
    if (missing.length > 0) {
      return res.status(400).json({ error: `缺少必填字段: ${missing.join(', ')}` });
    }

    const stmt = db.prepare('SELECT password FROM users WHERE id = ?');
    const user = stmt.get(req.user!.id) as any;

    if (!bcrypt.compareSync(oldPassword, user.password)) {
      return res.status(400).json({ error: '原密码错误' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度不能少于6位' });
    }

    const salt = bcrypt.genSaltSync(10);
    const updateStmt = db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(bcrypt.hashSync(newPassword, salt), req.user!.id);

    res.json({ success: true, message: '密码修改成功' });
  }
);

export default router;
