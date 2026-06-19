import type { Response } from 'express'
import type { PaginationResponse } from '../../../shared/types/index.js'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  total?: number
  page?: number
  pageSize?: number
}

export const successResponse = <T>(res: Response, data?: T, message?: string): Response => {
  return res.status(200).json({
    success: true,
    data,
    message,
  })
}

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): Response => {
  const response: ApiResponse<T[]> & PaginationResponse<T> = {
    success: true,
    data,
    items: data,
    total,
    page,
    pageSize,
  }
  return res.status(200).json(response)
}

export const errorResponse = (res: Response, error: string, statusCode: number = 400): Response => {
  return res.status(statusCode).json({
    success: false,
    error,
  })
}

export const notFoundResponse = (res: Response, message: string = 'Resource not found'): Response => {
  return errorResponse(res, message, 404)
}

export const unauthorizedResponse = (res: Response, message: string = 'Unauthorized'): Response => {
  return errorResponse(res, message, 401)
}

export const forbiddenResponse = (res: Response, message: string = 'Forbidden'): Response => {
  return errorResponse(res, message, 403)
}

export const serverErrorResponse = (res: Response, error: unknown): Response => {
  console.error('Server error:', error)
  return errorResponse(res, 'Internal server error', 500)
}
