import { get, post } from './request'
import type { Order, PageResult } from '@/types'

interface OrderQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  startTime?: string
  endTime?: string
  stationId?: string
}

export function getOrderList(params: OrderQuery) {
  return get<PageResult<Order>>('/admin/orders', { params })
}

export function getOrderDetail(id: string) {
  return get<Order>(`/admin/orders/${id}`)
}

export function getOrderStatistics(params?: { startTime?: string; endTime?: string }) {
  return get('/admin/orders/statistics', { params })
}
