import type { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';

export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json(error(`路由不存在: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Server error:', err);
  
  if (err.message.includes('UNIQUE constraint')) {
    res.status(400).json(error('数据已存在，请勿重复添加'));
    return;
  }
  
  if (err.message.includes('FOREIGN KEY constraint')) {
    res.status(400).json(error('关联数据不存在，请检查输入'));
    return;
  }
  
  res.status(500).json(error('服务器内部错误', err.message));
}
