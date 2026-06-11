import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

export function successResponse<T = any>(res: Response, data: T, message = '操作成功') {
  const req = res.req as AuthRequest;
  return res.json({
    code: 200,
    message,
    data,
    requestId: req?.requestId || '',
    timestamp: new Date().toISOString()
  });
}

export function errorResponse(res: Response, message: string, code: number = 500, details?: any) {
  const req = res.req as AuthRequest;
  return res.status(code).json({
    code,
    message,
    details,
    requestId: req?.requestId || '',
    timestamp: new Date().toISOString()
  });
}

export function paginatedResponse<T = any>(
  res: Response,
  list: T[],
  total: number,
  page: number,
  pageSize: number,
  message = '查询成功'
) {
  const req = res.req as AuthRequest;
  const totalPages = Math.ceil(total / pageSize);
  
  return res.json({
    code: 200,
    message,
    data: {
      list,
      total,
      page,
      pageSize,
      totalPages
    },
    requestId: req?.requestId || '',
    timestamp: new Date().toISOString()
  });
}
