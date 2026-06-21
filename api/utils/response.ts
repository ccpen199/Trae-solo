import { type Response } from 'express'

export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

export interface PageData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function success<T>(res: Response, data: T, msg = 'success', code = 0): Response<ApiResponse<T>> {
  return res.status(200).json({ code, msg, data })
}

export function fail(res: Response, msg: string, code = 400, statusCode = 400): Response<ApiResponse<null>> {
  return res.status(statusCode).json({ code, msg, data: null })
}

export function unauthorized(res: Response, msg = '未登录或登录已过期'): Response<ApiResponse<null>> {
  return fail(res, msg, 401, 401)
}

export function forbidden(res: Response, msg = '无权限访问'): Response<ApiResponse<null>> {
  return fail(res, msg, 403, 403)
}

export function notFound(res: Response, msg = '资源不存在'): Response<ApiResponse<null>> {
  return fail(res, msg, 404, 404)
}

export function serverError(res: Response, msg = '服务器内部错误'): Response<ApiResponse<null>> {
  return fail(res, msg, 500, 500)
}
