import type { ApiResponse, PaginatedResponse } from '../../shared/types.js';

export function success<T>(data: T, message = 'success'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    timestamp: Date.now(),
  };
}

export function error(message: string, code = 500): ApiResponse<null> {
  return {
    code,
    message,
    data: null,
    timestamp: Date.now(),
  };
}

export function paginated<T>(list: T[], total: number, page: number, pageSize: number): ApiResponse<PaginatedResponse<T>> {
  return success({
    list,
    total,
    page,
    pageSize,
  });
}
