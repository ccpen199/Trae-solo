import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  code?: number;
}

export function success<T>(res: Response, data: T, message = '操作成功'): Response {
  return res.json({
    success: true,
    data,
    message,
  });
}

export function error(res: Response, message: string, statusCode = 400): Response {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

export function unauthorized(res: Response, message = '未授权访问'): Response {
  return res.status(401).json({
    success: false,
    message,
  });
}

export function forbidden(res: Response, message = '权限不足'): Response {
  return res.status(403).json({
    success: false,
    message,
  });
}

export function notFound(res: Response, message = '资源不存在'): Response {
  return res.status(404).json({
    success: false,
    message,
  });
}
