import { ApiResponse } from '../types';

export const successResponse = <T>(data: T, message = '操作成功'): ApiResponse<T> => ({
  success: true,
  data,
  message,
});

export const errorResponse = (message: string, error?: string): ApiResponse<null> => ({
  success: false,
  message,
  error,
});

export const notFoundResponse = (resource: string): ApiResponse<null> => ({
  success: false,
  message: `${resource}不存在`,
  error: 'NOT_FOUND',
});

export const unauthorizedResponse = (message = '未授权访问'): ApiResponse<null> => ({
  success: false,
  message,
  error: 'UNAUTHORIZED',
});

export const badRequestResponse = (message: string): ApiResponse<null> => ({
  success: false,
  message,
  error: 'BAD_REQUEST',
});

export const serverErrorResponse = (message = '服务器内部错误'): ApiResponse<null> => ({
  success: false,
  message,
  error: 'INTERNAL_ERROR',
});
