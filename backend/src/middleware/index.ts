import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types';

export function responseFormatter(_req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);
  res.json = function (data: unknown): Response {
    const response: ApiResponse<typeof data> = {
      success: !res.locals.error,
      data: res.locals.error ? undefined : data,
      error: res.locals.error,
      timestamp: new Date()
    };
    return originalJson(response);
  };
  next();
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.locals.error = {
    code: 'INTERNAL_ERROR',
    message: err.message || '服务器内部错误'
  };
  res.status(500).json(null);
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.locals.error = {
    code: 'NOT_FOUND',
    message: '请求的资源不存在'
  };
  res.status(404).json(null);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => unknown
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = fn(req, res, next);
    if (result && typeof (result as Promise<unknown>).catch === 'function') {
      (result as Promise<unknown>).catch(next);
    }
  };
}

export function getAuthUserId(_req: Request): string {
  return _req.headers['x-user-id'] as string || Array.from(require('../data/database').db.users.keys())[0];
}
