import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Response {
      success(data: any): Response;
      error(message: string, code?: number): Response;
    }
  }
}

export function responseWrapper(req: Request, res: Response, next: NextFunction) {
  res.success = (data: any) => {
    return res.json({ code: 0, message: 'ok', data });
  };
  res.error = (message: string, code: number = -1) => {
    return res.json({ code, message, data: null });
  };
  next();
}
