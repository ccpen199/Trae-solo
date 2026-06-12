import type { ApiResponse } from '@/types/api';

export function successResponse<T>(data: T, message = 'success'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
  };
}

export function errorResponse(message: string, code = 1): ApiResponse<null> {
  return {
    code,
    message,
    data: null,
  };
}

export function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
