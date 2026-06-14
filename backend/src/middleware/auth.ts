import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    is_admin: number;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'resume_workbench_secret_key_2024') as any;
    const user = db.prepare('SELECT id, email, name, is_admin FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    req.user = user as any;
    next();
  } catch (err) {
    return res.status(401).json({ error: '认证令牌无效' });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.is_admin !== 1) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}
