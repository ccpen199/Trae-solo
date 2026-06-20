import { get, post } from './request'

export interface Order {
  id: string
  order_no: string
  cargo_volume?: number
  cargo_weight: number
  loading_requirement?: string
  time_window_start?: string
  time_window_end?: string
  customer_name: string
  customer_phone: string
  customer_credit_score?: number
  pickup_address: string
  delivery_address: string
  pickup_lng?: number
  pickup_lat?: number
  delivery_lng?: number
  delivery_lat?: number
  status: 'pending' | 'assigned' | 'accepted' | 'in_transit' | 'completed' | 'cancelled'
  assigned_driver_id?: string
  driver_name?: string
  estimated_time?: string
  created_at: string
  finished_at?: string
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
  return post<Order>(`/orders/${id}/assign`, { driver_id: driverId })
}

export function autoDispatchOrder(id: string) {
  return post<Order>(`/orders/${id}/auto-dispatch`)
}

export function autoDispatch() {
  return post<{ success: number; failed: number; message: string }>('/orders/auto-dispatch')
}

export function getPendingOrders(params?: { page?: number; pageSize?: number }) {
  return get<OrderListResponse>('/orders/pending', { params })
}
