import { Response } from 'express'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

function convertToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) {
    return obj.map(item => convertToSnakeCase(item))
  }
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: Record<string, any> = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const snakeKey = toSnakeCase(key)
        result[snakeKey] = convertToSnakeCase(obj[key])
      }
    }
    return result
  }
  return obj
}

export function success<T>(res: Response, data: T, message = 'success'): Response {
  return res.json({
    code: 0,
    message,
    data: convertToSnakeCase(data),
    timestamp: Date.now()
  })
}

export function error(res: Response, message: string, code = 500, statusCode = 200): Response {
  return res.status(statusCode).json({
    code,
    message,
    data: null,
    timestamp: Date.now()
  })
}

export function notFound(res: Response, message = '资源不存在'): Response {
  return error(res, message, 404, 404)
}

export function badRequest(res: Response, message = '请求参数错误'): Response {
  return error(res, message, 400, 400)
}

export function unauthorized(res: Response, message = '未授权访问'): Response {
  return error(res, message, 401, 401)
}

export function forbidden(res: Response, message = '禁止访问'): Response {
  return error(res, message, 403, 403)
}
