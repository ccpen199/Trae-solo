import request from '@/utils/request'

export function getOrders(params) {
  return request.get('/orders', { params })
}

export function getOrderDetail(id) {
  return request.get(`/orders/${id}`)
}

export function createOrder(data) {
  return request.post('/orders', data)
}

export function submitCollect(id, data) {
  return request.post(`/orders/${id}/submit-collect`, data)
}

export function parseIndex(id, data) {
  return request.post(`/orders/${id}/parse-index`, data)
}

export function queryAnalyze(id, data) {
  return request.post(`/orders/${id}/query-analyze`, data)
}

export function alertHandle(id, data) {
  return request.post(`/orders/${id}/alert-handle`, data)
}

export function archiveOrder(id, data) {
  return request.post(`/orders/${id}/archive`, data)
}

export function getStatistics() {
  return request.get('/orders/statistics/summary')
}
