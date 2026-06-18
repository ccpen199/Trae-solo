import { get, post, put, del } from './request'
import type { Operator, PageResult } from '@/types'

interface OperatorQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
}

export function getOperatorList(params: OperatorQuery) {
  return get<PageResult<Operator>>('/admin/operators', { params })
}

export function getOperatorDetail(id: string) {
  return get<Operator>(`/admin/operators/${id}`)
}

export function createOperator(data: Partial<Operator>) {
  return post<Operator>('/admin/operators', data)
}

export function updateOperator(id: string, data: Partial<Operator>) {
  return put<Operator>(`/admin/operators/${id}`, data)
}

export function deleteOperator(id: string) {
  return del<void>(`/admin/operators/${id}`)
}
