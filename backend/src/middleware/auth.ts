import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: string;
        employeeId?: string;
      };
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: '令牌无效或已过期' });
  }

  req.user = decoded;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: '未授权' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: '需要管理员权限' });
  }

  next();
}

export function requireAdminOrSelf(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: '未授权' });
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  const employeeId = req.params.id || req.body.employeeId;
  if (req.user.employeeId === employeeId) {
    return next();
  }

  return res.status(403).json({ error: '权限不足' });
}
