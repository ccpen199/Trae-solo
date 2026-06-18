import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { error } from '../utils/response.js';
import type { UserRole } from '../../shared/types.js';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: UserRole;
    username: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(error('未授权访问', 401));
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json(error('Token 无效或已过期', 401));
    return;
  }

  req.user = {
    userId: payload.userId as number,
    role: payload.role as UserRole,
    username: payload.username as string,
  };

  next();
}

export function roleMiddleware(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json(error('权限不足', 403));
      return;
    }
    next();
  };
}
