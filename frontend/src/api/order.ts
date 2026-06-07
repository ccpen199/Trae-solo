import { get, post } from './http'

export interface OrderQueryParams {
  page?: number
  pageSize?: number
  status?: string
}

export function getOrderListApi(params?: OrderQueryParams) {
  return get('/orders', params)
}

export function getOrderDetailApi(id: number) {
  return get(`/orders/${id}`)
}

export function createOrderApi(data: {
  deviceId: number
  program: string
  duration: number
  amount: number
}) {
  return post('/orders', data)
}

export function getOrderEnergyDataApi(orderId: number) {
  return get(`/orders/${orderId}/energy`)
}

export function getOrderStatsApi(params?: any) {
  return get('/orders/stats', params)
}

export function getSettlementReportsApi(params?: any) {
  return get('/orders/settlement', params)
}

export function getEnergySplitApi(params?: any) {
  return get('/orders/energy-split', params)
}
