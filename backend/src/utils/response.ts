import { Response } from 'express'
import { ApiResponse } from '../types'

export function success<T>(res: Response, data?: T, message = '操作成功', total?: number): Response<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    code: 200,
    message,
  }
  if (data !== undefined) {
    response.data = data
  }
  if (total !== undefined) {
    response.total = total
  }
  return res.json(response)
}

export function error(res: Response, message = '操作失败', code = 500): Response<ApiResponse> {
  return res.status(code).json({
    success: false,
    code,
    message,
  })
}

export function pagination<T>(
  res: Response,
  list: T[],
  total: number,
  page: number,
  pageSize: number
): Response<ApiResponse<{ list: T[]; total: number; page: number; pageSize: number }>> {
  return success(res, { list, total, page, pageSize })
}
