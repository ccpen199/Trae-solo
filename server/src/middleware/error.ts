import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  const errorResponse: ApiResponse = {
    success: false,
    message: '服务器内部错误',
    error: err.message || 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(errorResponse);
}

export function notFoundHandler(req: Request, res: Response) {
  const errorResponse: ApiResponse = {
    success: false,
    message: '请求的资源不存在',
    error: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(errorResponse);
}

export function validationErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err.array && err.mapped) {
    const errors = err.array().map((e: any) => ({
      field: e.path,
      message: e.msg,
    }));

    const errorResponse: ApiResponse = {
      success: false,
      message: '参数验证失败',
      error: 'VALIDATION_ERROR',
      data: { errors },
      timestamp: new Date().toISOString(),
    };

    return res.status(400).json(errorResponse);
  }

  next(err);
}
