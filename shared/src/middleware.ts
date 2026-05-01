import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from './config';
import { UnauthorizedError, ForbiddenError, AppError } from './errors';
import { JwtPayload, ApiResponse } from './types';
import { query } from './database';
import { logger } from './logger';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`${req.method} ${req.path} - Error:`, err);

  if (err instanceof AppError) {
    const response: ApiResponse = {
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

  const response: ApiResponse = {
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
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '资源不存在',
    },
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(response);
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler {
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
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = payload;
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

export function permissionMiddleware(requiredPermissions: string[]): RequestHandler {
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

export function roleMiddleware(allowedRoles: string[]): RequestHandler {
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

export function validateRequestBody(schema: {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
}): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const body = req.body || {};

    for (const [key, rules] of Object.entries(schema)) {
      const value = body[key];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`字段 '${key}' 是必填项`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rules.type) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== rules.type) {
            errors.push(`字段 '${key}' 类型错误，期望 '${rules.type}'，实际 '${actualType}'`);
            continue;
          }
        }

        if (typeof value === 'string') {
          if (rules.minLength !== undefined && value.length < rules.minLength) {
            errors.push(`字段 '${key}' 长度不能小于 ${rules.minLength}`);
          }
          if (rules.maxLength !== undefined && value.length > rules.maxLength) {
            errors.push(`字段 '${key}' 长度不能大于 ${rules.maxLength}`);
          }
          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(`字段 '${key}' 格式不正确`);
          }
        }

        if (typeof value === 'number') {
          if (rules.min !== undefined && value < rules.min) {
            errors.push(`字段 '${key}' 不能小于 ${rules.min}`);
          }
          if (rules.max !== undefined && value > rules.max) {
            errors.push(`字段 '${key}' 不能大于 ${rules.max}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数验证失败',
          details: errors,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    next();
  };
}
