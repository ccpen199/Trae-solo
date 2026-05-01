import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from './config';
import { UnauthorizedError, ForbiddenError, AppError } from './errors';
import { logger } from './logger';
import { getDatabase } from './database';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    roleId: number;
    roleCode: string;
    permissions: string[];
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`${req.method} ${req.path} - Error:`, err);

  if (err instanceof AppError) {
    const response = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
      timestamp: new Date().toISOString(),
    };
    res.status(err.statusCode).json(response);
    return;
  }

  const response = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    },
    timestamp: new Date().toISOString(),
  };
  res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const response = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '资源不存在',
    },
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(response);
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('缺少认证令牌');
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret) as any;
    req.user = {
      userId: payload.userId,
      username: payload.username,
      roleId: payload.roleId,
      roleCode: payload.roleCode,
      permissions: payload.permissions || [],
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('令牌已过期', 'TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('无效的令牌', 'INVALID_TOKEN');
    }
    throw new UnauthorizedError('认证失败');
  }
}

export function permissionMiddleware(requiredPermissions: string[]) {
  return asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('用户未认证');
    }

    const userPermissions = req.user.permissions || [];

    const hasAllPermissions = requiredPermissions.every((p) =>
      userPermissions.includes(p)
    );

    if (!hasAllPermissions) {
      throw new ForbiddenError('缺少必要的权限');
    }

    next();
  });
}

export function roleMiddleware(allowedRoles: string[]) {
  return asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('用户未认证');
    }

    if (!allowedRoles.includes(req.user.roleCode)) {
      throw new ForbiddenError('无权限访问');
    }

    next();
  });
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(
      `${req.method} ${req.path} - Status: ${res.statusCode} - Duration: ${duration}ms - IP: ${req.ip}`
    );
  });

  next();
}
