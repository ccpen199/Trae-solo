import { type Request, type Response, type NextFunction } from 'express';

export function responseMiddleware(req: Request, res: Response, next: NextFunction) {
  res.success = function <T>(data: T, message = '操作成功') {
    return this.json({
      code: 200,
      message,
      data,
      timestamp: Date.now(),
    });
  };

  res.error = function (message: string, code = 500) {
    return this.status(code).json({
      code,
      message,
      data: null,
      timestamp: Date.now(),
    });
  };

  res.page = function <T>(list: T[], total: number, page: number, pageSize: number, message = '操作成功') {
    return this.json({
      code: 200,
      message,
      data: {
        list,
        total,
        page,
        pageSize,
      },
      timestamp: Date.now(),
    });
  };

  next();
}

declare global {
  namespace Express {
    interface Response {
      success<T>(data: T, message?: string): Response;
      error(message: string, code?: number): Response;
      page<T>(list: T[], total: number, page: number, pageSize: number, message?: string): Response;
    }
  }
}
