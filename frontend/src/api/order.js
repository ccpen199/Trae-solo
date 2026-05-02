import request from '@/utils/request'

export function getDashboardStats() {
  return request({
    url: '/orders/dashboard',
    method: 'get'
  })
}

export function getTaxTypes() {
  return request({
    url: '/orders/tax-types',
    method: 'get'
  })
}

export function getStatuses() {
  return request({
    url: '/orders/statuses',
    method: 'get'
  })
}

export function getOrderList(params) {
  return request({
    url: '/orders',
    method: 'get',
    params
  })
}

export function getOrderDetail(id) {
  return request({
    url: `/orders/${id}`,
    method: 'get'
  })
}

export function createOrder(data) {
  return request({
    url: '/orders',
    method: 'post',
    data
  })
}

export function submitOrder(id) {
  return request({
    url: `/orders/${id}/submit`,
    method: 'post'
  })
}

export function calculateTax(id, data) {
  return request({
    url: `/orders/${id}/calculate-tax`,
    method: 'post',
    data
  })
}

export function submitDeclaration(id, data) {
  return request({
    url: `/orders/${id}/submit-declaration`,
    method: 'post',
    data
  })
}

export function getReceipt(id, data) {
  return request({
    url: `/orders/${id}/get-receipt`,
    method: 'post',
    data
  })
}

export function performRiskCheck(id) {
  return request({
    url: `/orders/${id}/risk-check`,
    method: 'post'
  })
}

export function riskAction(id, data) {
  return request({
    url: `/orders/${id}/risk-action`,
    method: 'post',
    data
  })
}

export function supplementSubmit(id, data) {
  return request({
    url: `/orders/${id}/supplement-submit`,
    method: 'post',
    data
  })
}

export function cancelOrder(id, cancelReason) {
  return request({
    url: `/orders/${id}/cancel`,
    method: 'post',
    data: { cancelReason }
  })
}

export function getAvailableActions(id) {
  return request({
    url: `/orders/${id}/available-actions`,
    method: 'get'
  })
}
