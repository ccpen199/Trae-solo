import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { fail } from '../utils/response';
import type { JwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'may-89306-secret-key-change-in-production';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(roles?: Array<'worker' | 'enterprise' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      fail(res, '未登录或登录已过期', 401, 401);
      return;
    }
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
      fail(res, '登录凭证无效，请重新登录', 401, 401);
      return;
    }
    if (roles && !roles.includes(payload.role)) {
      fail(res, '无权限访问该资源', 403, 403);
      return;
    }
    req.user = payload;
    next();
  };
}
