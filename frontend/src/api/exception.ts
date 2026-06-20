import { get, post, put } from './request'

export type ExceptionType = 'traffic' | 'damage' | 'contact' | 'other'
export type ExceptionLevel = 'low' | 'medium' | 'high'
export type ExceptionStatus = 'pending' | 'processing' | 'resolved'

export interface ExceptionItem {
  id: string
  orderId: string
  orderNo: string
  type: ExceptionType
  level: ExceptionLevel
  description: string
  status: ExceptionStatus
  driverName?: string
  driverId?: string
  createdAt: string
  resolvedAt?: string
  handleRemark?: string
}

export interface AppealItem {
  id: string
  exceptionId: string
  driverId: string
  driverName: string
  content: string
  images?: string[]
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewRemark?: string
}

export interface ExceptionListParams {
  page?: number
  pageSize?: number
  status?: string
  level?: string
  type?: string
  keyword?: string
}

export interface ExceptionListResponse {
  list: ExceptionItem[]
  total: number
  page: number
  pageSize: number
}

export interface AppealListResponse {
  list: AppealItem[]
  total: number
  page: number
  pageSize: number
}

export function getExceptions(params?: ExceptionListParams) {
  return get<ExceptionListResponse>('/exceptions', { params })
}

export function getExceptionById(id: string) {
  return get<ExceptionItem>(`/exceptions/${id}`)
}

export function createException(data: Partial<ExceptionItem>) {
  return post<ExceptionItem>('/exceptions', data)
}

export function updateException(id: string, data: Partial<ExceptionItem>) {
  return put<ExceptionItem>(`/exceptions/${id}`, data)
}

export function resolveException(id: string, remark?: string) {
  return post<ExceptionItem>(`/exceptions/${id}/resolve`, { remark })
}

export function processException(id: string) {
  return post<ExceptionItem>(`/exceptions/${id}/process`)
}

export function getAppeals(params?: { exceptionId?: string; status?: string; page?: number; pageSize?: number }) {
  return get<AppealListResponse>('/exceptions/appeals', { params })
}

export function createAppeal(data: Partial<AppealItem>) {
  return post<AppealItem>('/exceptions/appeals', data)
}

export function reviewAppeal(id: string, status: 'approved' | 'rejected', remark?: string) {
  return post<AppealItem>(`/exceptions/appeals/${id}/review`, { status, remark })
}
