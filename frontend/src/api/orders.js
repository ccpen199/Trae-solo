import request from '@/utils/request'

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

export function updateOrder(id, data) {
  return request({
    url: `/orders/${id}`,
    method: 'put',
    data
  })
}

export function deleteOrder(id) {
  return request({
    url: `/orders/${id}`,
    method: 'delete'
  })
}

export function reviewOrder(id, data) {
  return request({
    url: `/orders/${id}/review`,
    method: 'put',
    data
  })
}

export function assignOrder(id, data) {
  return request({
    url: `/orders/${id}/assign`,
    method: 'put',
    data
  })
}

export function startOrder(id, data) {
  return request({
    url: `/orders/${id}/start`,
    method: 'put',
    data
  })
}

export function cancelOrder(id, data) {
  return request({
    url: `/orders/${id}/cancel`,
    method: 'put',
    data
  })
}

export function getOrderStatistics() {
  return request({
    url: '/orders/statistics/summary',
    method: 'get'
  })
}
