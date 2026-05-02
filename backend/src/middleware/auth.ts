import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'express-delivery-secret-key-2024';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'courier' | 'admin' | 'customer_service';
  phone?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const user = db.prepare(`
      SELECT id, username, name, role, phone FROM users WHERE id = ?
    `).get(decoded.userId) as AuthUser | undefined;

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: '令牌无效或已过期' });
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '无权限执行此操作' });
    }

    next();
  };
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}
