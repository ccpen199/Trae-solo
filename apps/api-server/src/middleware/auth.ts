import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gx-rs-platform-secret-2024';
const DEMO_TOKEN_PREFIX = 'demo-access-token-';
const DEMO_ADMIN_PREFIX = 'demo-admin-token-';

export interface AuthPayload {
  userId: string;
  role: 'user' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: 'user' | 'admin';
      isDemo?: boolean;
    }
  }
}

function parseDemoToken(token: string): AuthPayload | null {
  if (token.startsWith(DEMO_TOKEN_PREFIX)) {
    return { userId: 'GX20240001001', role: 'user' };
  }
  if (token.startsWith(DEMO_ADMIN_PREFIX)) {
    return { userId: 'GX-ADMIN-001', role: 'admin' };
  }
  return null;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ code: 401, message: '未提供认证令牌' });
    return;
  }

  const token = authHeader.substring(7);

  const demoPayload = parseDemoToken(token);
  if (demoPayload) {
    req.userId = demoPayload.userId;
    req.userRole = demoPayload.role;
    req.isDemo = true;
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    res.status(401).json({ code: 401, message: '令牌无效或已过期' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ code: 403, message: '权限不足' });
      return;
    }
    next();
  };
}
