import { Request, Response } from 'express';
import db from '../config/database';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '请提供用户名和密码' });
      return;
    }

    const user = db.prepare(`
      SELECT id, username, name, role, phone, password
      FROM users WHERE username = ?
    `).get(username) as any;

    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};

export const getCurrentUser = (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未登录' });
    return;
  }

  res.json(req.user);
};
