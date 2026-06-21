import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'water-iot-platform-secret-key-2024';

export interface AuthPayload {
  userId: string;
  role: UserRole;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(requiredRoles?: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ code: 401, message: '未提供认证令牌', data: null });
      return;
    }

    const token = authHeader.slice(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      
      if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        res.status(403).json({ code: 403, message: '权限不足', data: null });
        return;
      }
      
      req.auth = decoded;
      next();
    } catch {
      res.status(401).json({ code: 401, message: '认证令牌无效或已过期', data: null });
    }
  };
}
