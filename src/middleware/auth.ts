import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { config } from '../config';
import { UserRole } from '../config/constants';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export type UserRoleType = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface JwtPayload {
  userId: string;
  organizationId: string;
  username: string;
  role: UserRoleType;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token已过期');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Token无效');
    }
    throw new UnauthorizedError('认证失败');
  }
}

export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('缺少认证Token');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        organizationId: payload.organizationId,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('用户不存在或已禁用');
    }

    req.user = {
      userId: user.id,
      organizationId: user.organizationId,
      username: user.username,
      role: user.role as UserRoleType,
    };

    logger.debug('用户认证成功', {
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: UserRoleType[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('用户未认证');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('权限不足');
    }

    next();
  };
}

export const requireAdmin = requireRole(UserRole.ADMIN as UserRoleType);
export const requireTeacher = requireRole(UserRole.TEACHER as UserRoleType, UserRole.ADMIN as UserRoleType);
export const requireStudent = requireRole(
  UserRole.STUDENT as UserRoleType,
  UserRole.PARENT as UserRoleType,
  UserRole.TEACHER as UserRoleType,
  UserRole.ADMIN as UserRoleType
);
export const requireParent = requireRole(UserRole.PARENT as UserRoleType, UserRole.ADMIN as UserRoleType);

export function getOrganizationId(req: AuthRequest): string {
  if (!req.user) {
    throw new UnauthorizedError('用户未认证');
  }
  return req.user.organizationId;
}

export function getUserId(req: AuthRequest): string {
  if (!req.user) {
    throw new UnauthorizedError('用户未认证');
  }
  return req.user.userId;
}

export function getUserRole(req: AuthRequest): UserRoleType {
  if (!req.user) {
    throw new UnauthorizedError('用户未认证');
  }
  return req.user.role;
}

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  authenticate,
  requireRole,
  requireAdmin,
  requireTeacher,
  requireStudent,
  requireParent,
  getOrganizationId,
  getUserId,
  getUserRole,
};
