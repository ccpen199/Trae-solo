import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export class AppError extends Error {
  statusCode: number;
  code: number;

  constructor(message: string, statusCode: number = 500, code?: number) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
  }

  res.status(500).json({
    code: 500,
    message: config.nodeEnv === 'development' ? err.message : '服务器内部错误',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在',
  });
};
