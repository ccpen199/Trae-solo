import request from '@/utils/request'

export const getOrderList = (params) => {
  return request({
    url: '/orders',
    method: 'GET',
    params
  })
}

export const getPendingShipmentOrders = (params) => {
  return request({
    url: '/orders/pending-shipment',
    method: 'GET',
    params
  })
}

export const getOrderDetail = (id) => {
  return request({
    url: `/orders/${id}`,
    method: 'GET'
  })
}

export const createOrder = (data) => {
  return request({
    url: '/orders',
    method: 'POST',
    data
  })
}

export const shipOrder = (id, data) => {
  return request({
    url: `/orders/${id}/ship`,
    method: 'POST',
    data
  })
}

export const updateFollowStatus = (id, data) => {
  return request({
    url: `/orders/${id}/follow-status`,
    method: 'PUT',
    data
  })
}

export const cancelOrder = (id, data) => {
  return request({
    url: `/orders/${id}/cancel`,
    method: 'PUT',
    data
  })
}
