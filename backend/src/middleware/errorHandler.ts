import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: ValidationError[];
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  errors?: ValidationError[];

  constructor(statusCode: number, message: string, errors?: ValidationError[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'AppError';
  }
}

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: '数据已存在',
        field: prismaError.meta?.target,
      });
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: '资源不存在',
      });
    }
  }

  return res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
  });
};
