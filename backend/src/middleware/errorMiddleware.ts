import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`找不到路由 ${req.originalUrl}`, 404);
  next(error);
};

export const errorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || '服务器内部错误';

  if (error.name === 'CastError') {
    message = `资源未找到，无效的ID格式`;
    statusCode = 400;
  }

  if (error.code === 11000) {
    const fields = Object.keys(error.keyPattern).join(', ');
    message = `字段 ${fields} 重复，请使用其他值`;
    statusCode = 400;
  }

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((val: any) => val.message);
    message = errors.join(', ');
    statusCode = 400;
  }

  if (error.name === 'JsonWebTokenError') {
    message = 'Token无效';
    statusCode = 401;
  }

  if (error.name === 'TokenExpiredError') {
    message = 'Token已过期';
    statusCode = 401;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ 错误:', error);
    res.status(statusCode).json({
      success: false,
      message,
      stack: error.stack,
      error
    });
  } else {
    res.status(statusCode).json({
      success: false,
      message
    });
  }
};
