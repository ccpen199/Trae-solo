export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

export function successResponse<T>(data: T, message: string = 'success'): ApiResponse<T> {
  return {
    code: 200,
    message,
    data,
    timestamp: Date.now()
  }
}

export function errorResponse(message: string, code: number = 400): ApiResponse<null> {
  return {
    code,
    message,
    data: null,
    timestamp: Date.now()
  }
}
