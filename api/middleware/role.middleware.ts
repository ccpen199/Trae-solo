import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../shared/types.js';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
      });
    }

    next();
  };
}

export function requireEmployer(req: Request, res: Response, next: NextFunction) {
  return requireRole('employer', 'admin')(req, res, next);
}

export function requireProvider(req: Request, res: Response, next: NextFunction) {
  return requireRole('provider', 'admin')(req, res, next);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('admin')(req, res, next);
}
