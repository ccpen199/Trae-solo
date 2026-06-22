import { Response } from 'express';
import type { ApiResponse } from '../types';

export function success<T = any>(
  res: Response,
  data?: T,
  message: string = 'success',
  pagination?: { total: number; page: number; pageSize: number }
): Response<ApiResponse<T>> {
  const resp: ApiResponse<T> = {
    code: 0,
    message,
    data,
  };
  if (pagination) {
    resp.total = pagination.total;
    resp.page = pagination.page;
    resp.pageSize = pagination.pageSize;
  }
  return res.json(resp);
}

export function fail(
  res: Response,
  message: string = 'error',
  code: number = 1,
  statusCode: number = 200
): Response<ApiResponse> {
  return res.status(statusCode).json({
    code,
    message,
  });
}
