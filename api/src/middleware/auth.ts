import type { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response.js';
import { userRepo, reviewerRepo } from '../repositories/userRepo.js';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return error(res, '未登录，请先登录', 1, 401);
  }

  try {
    const parts = token.split('_');
    if (parts.length >= 3 && parts[0] === 'mock' && parts[1] === 'token') {
      const userId = parseInt(parts[2]);
      const user = userRepo.findById(userId);
      if (user) {
        (req as any).userId = user.id;
        (req as any).user = user;
        return next();
      }
    }
  } catch (e) {
    // invalid token
  }

  return error(res, '登录已失效，请重新登录', 1, 401);
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return error(res, '未登录', 1, 401);
    }
    if (!roles.includes(user.role)) {
      return error(res, '权限不足', 1, 403);
    }

    if (user.role === 'reviewer') {
      const reviewer = reviewerRepo.findByUserId(user.id);
      if (reviewer) {
        (req as any).reviewerId = reviewer.id;
        (req as any).reviewer = reviewer;
      }
    }

    next();
  };
};

export const requireBrand = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) {
    return error(res, '未登录', 1, 401);
  }
  if (user.role !== 'brand' && user.role !== 'admin') {
    return error(res, '权限不足', 1, 403);
  }

  next();
};
