import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'garbage-classification-secret-key-2024';

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    username: string;
    role: string;
    cityId: string;
    district: string | null;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      role: string;
      cityId: string;
      district: string | null;
    };
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      res.status(403).json({ error: '权限不足' });
      return;
    }
    next();
  };
}
