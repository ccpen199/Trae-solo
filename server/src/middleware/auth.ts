import { Request, Response, NextFunction } from 'express';
import { RoleCode } from '@prisma/client';
import { verifyToken } from '../utils/jwt';
import { unauthorized, forbidden } from '../utils/response';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, '缺少认证令牌');
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return unauthorized(res, '令牌无效或已过期');
  }

  req.userId = payload.userId;
  req.userRole = payload.role;

  next();
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (payload) {
      req.userId = payload.userId;
      req.userRole = payload.role;
    }
  }

  next();
}

export function requireRole(roles: RoleCode[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.userRole as RoleCode | undefined;

    if (!userRole || !roles.includes(userRole)) {
      return forbidden(res, '权限不足');
    }

    next();
  };
}

export function isOwnerOrAdmin(resourceIdParam: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const userRole = req.userRole;
    const resourceId = req.params[resourceIdParam];

    if (!userId) {
      return unauthorized(res);
    }

    if (userRole === RoleCode.ADMIN) {
      return next();
    }

    if (userId === resourceId) {
      return next();
    }

    return forbidden(res, '无权限访问该资源');
  };
}
