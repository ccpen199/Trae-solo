import { get, post } from './request'
import type { Driver } from './driver'

export interface Order {
  id: string
  orderNo: string
  customerName: string
  customerPhone: string
  pickupAddress: string
  deliveryAddress: string
  goodsDesc: string
  weight: number
  status: 'pending' | 'assigned' | 'picking' | 'delivering' | 'completed' | 'cancelled'
  driverId?: string
  driverName?: string
  estimatedTime?: string
  createdAt: string
}

export interface OrderListParams {
  page?: number
  pageSize?: number
  status?: string
  keyword?: string
}

export interface OrderListResponse {
  list: Order[]
  total: number
  page: number
  pageSize: number
}

export function getOrders(params?: OrderListParams) {
  return get<OrderListResponse>('/orders', { params })
}

export function getOrderById(id: string) {
  return get<Order>(`/orders/${id}`)
}

export function createOrder(data: Partial<Order>) {
  return post<Order>('/orders', data)
}

export function assignOrder(id: string, driverId: string) {
  return post<Order>(`/orders/${id}/assign`, { driverId })
}

export function autoDispatchOrder(id: string) {
  return post<Order>(`/orders/${id}/auto-dispatch`)
}

export function autoDispatch() {
  return post<{ success: number; failed: number; message: string }>('/auto-dispatch')
}

export function getPendingOrders(params?: { page?: number; pageSize?: number }) {
  return get<OrderListResponse>('/orders/pending', { params })
}

export function getAvailableDrivers(orderId?: string) {
  return get<Driver[]>('/drivers/available', { params: { orderId } })
}
