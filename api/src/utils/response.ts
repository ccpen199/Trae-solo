import type { ApiResponse } from '@shared/types';

export function success<T>(data: T, message: string = '操作成功'): ApiResponse<T> {
  return {
    code: 0,
    success: true,
    data,
    message,
  };
}

export function error<T = never>(message: string, codeOrError?: number | string): ApiResponse<T> {
  let code = 400;
  let errorDetail: string | undefined;
  
  if (typeof codeOrError === 'number') {
    code = codeOrError;
  } else if (typeof codeOrError === 'string') {
    errorDetail = codeOrError;
  }
  
  return {
    code,
    success: false,
    message,
    error: errorDetail,
  };
}

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  message: string = '获取成功'
): ApiResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  return {
    code: 0,
    success: true,
    message,
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
