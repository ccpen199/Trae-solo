import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const BadRequestError = (message: string = '请求参数错误', details?: unknown) =>
  new AppError(message, 400, 'BAD_REQUEST', details);

export const UnauthorizedError = (message: string = '未认证') =>
  new AppError(message, 401, 'UNAUTHORIZED');

export const ForbiddenError = (message: string = '权限不足') =>
  new AppError(message, 403, 'FORBIDDEN');

export const NotFoundError = (message: string = '资源不存在') =>
  new AppError(message, 404, 'NOT_FOUND');

export const ConflictError = (message: string = '资源冲突') =>
  new AppError(message, 409, 'CONFLICT');

export const ValidationError = (message: string = '数据验证失败', details?: unknown) =>
  new AppError(message, 422, 'VALIDATION_ERROR', details);

export const TooManyRequestsError = (message: string = '请求过于频繁') =>
  new AppError(message, 429, 'TOO_MANY_REQUESTS');

export const InternalServerError = (message: string = '服务器内部错误', details?: unknown) =>
  new AppError(message, 500, 'INTERNAL_SERVER_ERROR', details);

export const ServiceUnavailableError = (message: string = '服务暂不可用') =>
  new AppError(message, 503, 'SERVICE_UNAVAILABLE');

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    logger.warn(`AppError [${error.code}] ${req.method} ${req.path}: ${error.message}`);
    if (error.details) {
      logger.warn('Error details:', error.details);
    }

    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  if (error.name === 'ValidationError') {
    logger.warn(`ValidationError ${req.method} ${req.path}: ${error.message}`);
    return res.status(400).json({
      success: false,
      message: '请求验证失败',
      code: 'VALIDATION_ERROR',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  if (error.name === 'CastError') {
    logger.warn(`CastError ${req.method} ${req.path}: ${error.message}`);
    return res.status(400).json({
      success: false,
      message: '请求参数格式错误',
      code: 'INVALID_PARAMETER',
      timestamp: new Date().toISOString(),
    });
  }

  if ((error as { code?: number }).code === 11000) {
    logger.warn(`DuplicateKeyError ${req.method} ${req.path}: ${error.message}`);
    return res.status(409).json({
      success: false,
      message: '数据重复，已存在相同记录',
      code: 'DUPLICATE_KEY',
      timestamp: new Date().toISOString(),
    });
  }

  if (error.name === 'SyntaxError') {
    logger.warn(`SyntaxError ${req.method} ${req.path}: ${error.message}`);
    return res.status(400).json({
      success: false,
      message: '请求体格式错误',
      code: 'INVALID_JSON',
      timestamp: new Date().toISOString(),
    });
  }

  logger.error(`UnexpectedError ${req.method} ${req.path}:`, error);
  const stack = process.env.NODE_ENV === 'development' ? error.stack : undefined;

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误',
    code: 'INTERNAL_ERROR',
    stack,
    timestamp: new Date().toISOString(),
  });
};

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: `路由 ${req.method} ${req.path} 不存在`,
    code: 'ROUTE_NOT_FOUND',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
};

export const asyncHandler = <T>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
