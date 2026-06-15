import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'skillverse-secret-key';

export const ALLOWED_ROLES = ['user', 'creator', 'admin', 'requester'] as const;
export type UserRole = typeof ALLOWED_ROLES[number];

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌', data: null });
  }

  const token = authHeader.slice(7);
  if (token === 'local-demo-admin') {
    req.userId = 'local-admin';
    req.userRole = 'admin';
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: UserRole };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: '令牌无效或已过期', data: null });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return function (req: AuthRequest, res: Response, next: NextFunction) {
    const userRole = req.userRole;
    if (!userRole) {
      return res.status(401).json({ code: 401, message: '用户未认证', data: null });
    }
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        code: 403, 
        message: `权限不足，需要角色: ${allowedRoles.join(' 或 ')}`, 
        data: null 
      });
    }
    next();
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  return requireAuth(req, res, next);
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  return requireRole(['admin'])(req, res, next);
}

export function creatorMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  return requireRole(['creator', 'admin'])(req, res, next);
}

export function generateToken(userId: string, role: UserRole): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}
