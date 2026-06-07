import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../utils/database';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'construction_platform_jwt_secret_key_2024') as any;
    
    const user = db.prepare('SELECT id, username, role, status FROM users WHERE id = ?').get(decoded.userId) as any;
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: '用户账号已被禁用' });
    }

    req.user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch (err) {
    return res.status(403).json({ error: '认证令牌无效或已过期' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足，需要角色: ' + roles.join(', ') });
    }
    next();
  };
}
