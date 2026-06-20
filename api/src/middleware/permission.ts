import { Request, Response, NextFunction } from 'express';
import { AppError } from './error';
import type { UserRole } from '../../../shared/types';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    if (!roles.includes(req.user.role as UserRole)) {
      throw new AppError('权限不足', 403);
    }

    next();
  };
}
