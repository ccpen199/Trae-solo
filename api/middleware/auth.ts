/**
 * Authentication middleware - JWT verification
 */
import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: number;
  phone: string;
  name: string;
  role: string;
}

declare module 'express' {
  interface Request {
    user?: AuthUser;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'may-89051-secret-key-change-in-production';

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未授权访问' });
    return;
  }
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ success: false, error: 'token 无效或已过期' });
  }
}
