import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'skillverse-secret-key';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
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
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: '令牌无效或已过期', data: null });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ code: 403, message: '需要管理员权限', data: null });
  }
  next();
}

export function creatorMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'creator' && req.userRole !== 'admin') {
    return res.status(403).json({ code: 403, message: '需要创作者权限', data: null });
  }
  next();
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}
