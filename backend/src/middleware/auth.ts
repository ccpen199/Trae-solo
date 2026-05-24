import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import db from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'health_sport_platform_secret_2024';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    name: string;
  };
}

export function authMiddleware(roles?: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const userStmt = db.prepare('SELECT id, username, role, name FROM users WHERE id = ?');
      const user = userStmt.get(decoded.userId) as any;
      
      if (!user) {
        return res.status(401).json({ error: '用户不存在' });
      }

      if (roles && !roles.includes(user.role)) {
        return res.status(403).json({ error: '权限不足' });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: '认证令牌无效' });
    }
  };
}

export function generateToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
