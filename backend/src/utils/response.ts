export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
  timestamp: string;
}

export function success<T>(data?: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

export function error(message: string, code: number = 500): ApiResponse {
  return {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
  };
}

export function pagination<T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number
): ApiResponse<{ list: T[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const totalPages = Math.ceil(total / pageSize);
  return {
    success: true,
    data: {
      list,
      total,
      page,
      pageSize,
      totalPages,
    },
    timestamp: new Date().toISOString(),
  };
}
