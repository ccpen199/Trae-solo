import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'xiamen-service-hub-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

export interface AuthPayload {
  userId: string;
  userType: 'personal' | 'enterprise' | 'government';
  roles: string[];
  authLevel: number;
  verified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(requiredRole?: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: '认证令牌无效或已过期',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    req.user = payload;

    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const hasRole = roles.some(role => payload.roles.includes(role));
      
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: '权限不足，无法访问该资源',
          code: 403,
          timestamp: new Date().toISOString(),
        });
      }
    }

    next();
  };
}

export function authLevelMiddleware(minLevel: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.authLevel < minLevel) {
      return res.status(403).json({
        success: false,
        message: '认证等级不足，需要更高等级的身份验证',
        code: 403,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}
