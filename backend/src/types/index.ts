import { Request } from 'express'

export interface JwtPayload {
  userId: string
  username: string
  roles?: string[]
  permissions?: string[]
}

export interface AuthRequest extends Request {
  user?: JwtPayload
}

export interface ApiResponse<T = unknown> {
  success: boolean
  code: number
  message: string
  data?: T
  total?: number
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
