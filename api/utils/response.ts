import type { Response } from 'express'
import type { ApiResponse, PagedResponse } from '../types/index.js'

export const success = <T = any>(res: Response, data: T, message: string = 'success'): Response<ApiResponse<T>> => {
  return res.status(200).json({
    code: 0,
    message,
    data,
    timestamp: Date.now(),
  })
}

export const error = (res: Response, message: string, code: number = 400): Response<ApiResponse<null>> => {
  return res.status(code).json({
    code,
    message,
    data: null,
    timestamp: Date.now(),
  })
}

export const paged = <T = any>(
  res: Response,
  list: T[],
  total: number,
  page: number,
  pageSize: number,
  message: string = 'success'
): Response<ApiResponse<PagedResponse<T>>> => {
  return res.status(200).json({
    code: 0,
    message,
    data: {
      list,
      total,
      page,
      pageSize,
    },
    timestamp: Date.now(),
  })
}

export const created = <T = any>(res: Response, data: T, message: string = 'created'): Response<ApiResponse<T>> => {
  return res.status(201).json({
    code: 0,
    message,
    data,
    timestamp: Date.now(),
  })
}

export const noContent = (res: Response, message: string = 'success'): Response<ApiResponse<null>> => {
  return res.status(204).json({
    code: 0,
    message,
    data: null,
    timestamp: Date.now(),
  })
}

export const unauthorized = (res: Response, message: string = '未授权'): Response<ApiResponse<null>> => {
  return error(res, message, 401)
}

export const forbidden = (res: Response, message: string = '权限不足'): Response<ApiResponse<null>> => {
  return error(res, message, 403)
}

export const notFound = (res: Response, message: string = '资源不存在'): Response<ApiResponse<null>> => {
  return error(res, message, 404)
}

export const conflict = (res: Response, message: string = '资源冲突'): Response<ApiResponse<null>> => {
  return error(res, message, 409)
}

export const serverError = (res: Response, message: string = '服务器内部错误'): Response<ApiResponse<null>> => {
  return error(res, message, 500)
}

export default {
  success,
  error,
  paged,
  created,
  noContent,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
}
