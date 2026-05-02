import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '../constants/enums';
import { PermissionDeniedError, AppError } from '../errors/AppError';

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new PermissionDeniedError('未提供认证令牌');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new PermissionDeniedError('令牌已过期'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new PermissionDeniedError('无效的令牌'));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      next(new PermissionDeniedError('认证失败'));
    }
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new PermissionDeniedError('需要登录'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new PermissionDeniedError(`需要以下角色之一: ${roles.join(', ')}`));
    }

    next();
  };
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = decoded;
    }

    next();
  } catch {
    next();
  }
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    }
  );
};
