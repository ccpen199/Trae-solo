import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../lib/logger';
import AppError from '../errors/AppError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = err;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || ['field'];
      error = new AppError(
        `${target.join(', ')} 已存在`,
        400,
        'DUPLICATE_ENTRY'
      );
    } else if (err.code === 'P2025') {
      error = new AppError(
        '资源不存在',
        404,
        'NOT_FOUND'
      );
    } else if (err.code === 'P2003') {
      error = new AppError(
        '关联数据不存在',
        400,
        'FOREIGN_KEY_VIOLATION'
      );
    } else {
      logger.error('Prisma error', {
        code: err.code,
        message: err.message,
        meta: err.meta,
      });
      error = new AppError(
        '数据库操作失败',
        500,
        'DATABASE_ERROR'
      );
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    error = new AppError(
      '数据验证失败',
      400,
      'VALIDATION_ERROR'
    );
  }

  if (!(error instanceof AppError)) {
    logger.error('Unexpected error', {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
    error = new AppError(
      '服务器内部错误',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }

  const appError = error as AppError;

  const response: {
    status: string;
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  } = {
    status: appError.status,
    message: appError.message,
  };

  if (appError.code) {
    response.code = appError.code;
  }

  if (appError.details) {
    response.details = appError.details;
  }

  if (req.path.startsWith('/api/')) {
    res.status(appError.statusCode).json(response);
  } else {
    res.status(appError.statusCode).render('error', {
      message: appError.message,
      statusCode: appError.statusCode,
    });
  }
};

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const error = new AppError(
    `未找到 ${req.originalUrl}`,
    404,
    'NOT_FOUND'
  );
  next(error);
};

export const asyncHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) => {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
