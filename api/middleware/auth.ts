import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'okodm-secret') as { id: number; username: string; role: string };
    const user = db.prepare('SELECT id, username, role, status FROM users WHERE id = ?').get(decoded.id) as any;
    
    if (!user || user.status !== 'active') {
      res.status(401).json({ success: false, error: '用户不存在或已被禁用' });
      return;
    }
    
    req.user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: '无效的认证令牌' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: '权限不足' });
      return;
    }
    next();
  };
};
