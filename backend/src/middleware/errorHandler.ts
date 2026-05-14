import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { serverErrorResponse, errorResponse } from '../utils/response';

export const errorHandler: ErrorRequestHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  if (err instanceof Error) {
    if (err.name === 'ZodError') {
      return res.status(400).json(errorResponse('请求参数验证失败', err.message));
    }
    return res.status(500).json(serverErrorResponse(err.message));
  }
  
  return res.status(500).json(serverErrorResponse('服务器内部错误'));
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json(errorResponse('接口不存在', 'NOT_FOUND'));
};
