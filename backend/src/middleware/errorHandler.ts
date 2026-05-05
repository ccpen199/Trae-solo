import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, message: string, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';
  }

  static badRequest(message: string, code: string = 'BAD_REQUEST'): ApiError {
    return new ApiError(400, message, code);
  }

  static unauthorized(message: string = '未授权访问', code: string = 'UNAUTHORIZED'): ApiError {
    return new ApiError(401, message, code);
  }

  static forbidden(message: string = '权限不足', code: string = 'FORBIDDEN'): ApiError {
    return new ApiError(403, message, code);
  }

  static notFound(message: string = '资源不存在', code: string = 'NOT_FOUND'): ApiError {
    return new ApiError(404, message, code);
  }

  static tooManyRequests(message: string = '请求过于频繁', code: string = 'TOO_MANY_REQUESTS'): ApiError {
    return new ApiError(429, message, code);
  }

  static internal(message: string = '服务器内部错误', code: string = 'INTERNAL_ERROR'): ApiError {
    return new ApiError(500, message, code);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('错误:', {
    method: req.method,
    path: req.path,
    message: err.message,
    stack: err.stack
  });

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误'
    }
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
