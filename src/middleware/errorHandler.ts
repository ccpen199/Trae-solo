import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { exceptionService, ExceptionType } from '../services';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问', code: string = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '无权限执行此操作', code: string = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在', code: string = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '资源冲突', code: string = 'CONFLICT') {
    super(message, 409, code);
  }
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  const code = err.code || 'INTERNAL_ERROR';

  logger.error(`[${req.method}] ${req.path} - ${statusCode} - ${message}`);
  logger.error(err.stack);

  if (statusCode >= 500 || !err.isOperational) {
    (async () => {
      try {
        await exceptionService.createException({
          exceptionType: statusCode >= 500 ? 'SYSTEM_ERROR' : 'BUSINESS_ERROR',
          message,
          stackTrace: err.stack,
          context: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: req.body,
            headers: req.headers
          }
        });
      } catch (logErr) {
        logger.error('Failed to log exception:', logErr);
      }
    })();
  }

  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        statusCode,
        stack: err.stack
      }
    });
  } else {
    if (err.isOperational) {
      res.status(statusCode).json({
        success: false,
        error: {
          code,
          message
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误，请稍后重试'
        }
      });
    }
  }
};

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
