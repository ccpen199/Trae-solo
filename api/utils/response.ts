import { Response } from 'express';
import type { ApiResponse } from '../../shared/types';

export function successResponse<T>(res: Response, data?: T, message?: string): Response<ApiResponse<T>> {
  return res.json({
    success: true,
    data,
    message,
    code: 200,
    timestamp: new Date().toISOString(),
  });
}

export function errorResponse<T = never>(
  res: Response,
  error: string,
  code: number = 500,
  message?: string
): Response<ApiResponse<T>> {
  return res.status(code).json({
    success: false,
    error,
    message,
    code,
    timestamp: new Date().toISOString(),
  });
}

export function paginatedResponse<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  message?: string
): Response<ApiResponse<{ items: T[]; total: number; page: number; pageSize: number; totalPages: number }>> {
  const totalPages = Math.ceil(total / pageSize);
  return successResponse(
    res,
    {
      items,
      total,
      page,
      pageSize,
      totalPages,
    },
    message
  );
}
