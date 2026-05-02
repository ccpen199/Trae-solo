import { ApiResponse, PaginatedResponse } from '../types';

export function success<T>(data?: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    code: 200,
    timestamp: new Date().toISOString(),
  };
}

export function error(message: string, code?: number, error?: string): ApiResponse {
  return {
    success: false,
    message,
    error,
    code: code || 500,
    timestamp: new Date().toISOString(),
  };
}

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize);
  return {
    success: true,
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages,
    },
    code: 200,
    timestamp: new Date().toISOString(),
  };
}

export function badRequest(message: string, errorMsg?: string): ApiResponse {
  return error(message, 400, errorMsg);
}

export function unauthorized(message: string = '未授权访问'): ApiResponse {
  return error(message, 401, 'Unauthorized');
}

export function forbidden(message: string = '无权限操作'): ApiResponse {
  return error(message, 403, 'Forbidden');
}

export function notFound(message: string = '资源不存在'): ApiResponse {
  return error(message, 404, 'Not Found');
}

export function conflict(message: string, errorMsg?: string): ApiResponse {
  return error(message, 409, errorMsg);
}
