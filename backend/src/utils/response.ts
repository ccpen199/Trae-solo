export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  code?: number
  timestamp: string
}

export function successResponse<T>(data?: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    code: 200,
    timestamp: new Date().toISOString(),
  }
}

export function errorResponse(message: string, code?: number): ApiResponse {
  return {
    success: false,
    message,
    code: code || 500,
    timestamp: new Date().toISOString(),
  }
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  message?: string
): ApiResponse<{
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  return {
    success: true,
    data: {
      items: data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
    message,
    code: 200,
    timestamp: new Date().toISOString(),
  }
}
