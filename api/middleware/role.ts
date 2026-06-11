import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from './auth.js';

export function roleMiddleware(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: '未授权访问',
        data: null,
        timestamp: Date.now(),
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        code: 403,
        message: '权限不足',
        data: null,
        timestamp: Date.now(),
      });
      return;
    }

    next();
  };
}
