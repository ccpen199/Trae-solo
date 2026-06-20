import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { User } from '../../../shared/types';
import { mockUsers } from '../data/mockData';

export interface AuthRequest extends Request {
  user?: User;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: User['role'];
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'talent-platform-dev-secret-key-change-in-production';

export function generateToken(user: User): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    res.status(401).json({ error: '未提供认证令牌', code: 'NO_TOKEN' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = mockUsers.find(u => u.id === decoded.userId);

    if (!user) {
      res.status(401).json({ error: '用户不存在', code: 'USER_NOT_FOUND' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: '令牌无效或已过期', code: 'INVALID_TOKEN' });
  }
}

export function requireRole(...roles: User['role'][]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: '未认证', code: 'UNAUTHENTICATED' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: '权限不足', code: 'INSUFFICIENT_PERMISSIONS' });
      return;
    }

    next();
  };
}

export default authenticateToken;
