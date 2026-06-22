import { Request, Response, NextFunction } from 'express';
import { serverError } from '../utils/response.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[${new Date().toISOString()}] Error:`, {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  if (err.name === 'ValidationError') {
    return serverError(res, err.message, 400);
  }

  if (err.name === 'UnauthorizedError') {
    return serverError(res, '未授权访问', 401);
  }

  if (err.name === 'ForbiddenError') {
    return serverError(res, '禁止访问', 403);
  }

  if (err.name === 'NotFoundError') {
    return serverError(res, err.message || '资源不存在', 404);
  }

  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      code: 500,
      message: err.message,
      stack: err.stack,
    });
  }

  return serverError(res, '服务器内部错误', 500);
};

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '禁止访问') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(message = '参数验证失败') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}
