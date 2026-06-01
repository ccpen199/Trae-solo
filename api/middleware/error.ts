import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);
  
  res.status(500).json({
    code: 500,
    message: error.message || '服务器内部错误',
    data: null,
    timestamp: Date.now()
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null,
    timestamp: Date.now()
  });
};
