import type { ApiResponse } from '../../shared/types.js';

export function success<T>(data: T, message: string = 'success'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    timestamp: Date.now(),
  };
}

export function error(message: string, code: number = -1): ApiResponse<null> {
  return {
    code,
    message,
    data: null,
    timestamp: Date.now(),
  };
}
