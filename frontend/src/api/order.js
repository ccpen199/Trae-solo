import request from '@/utils/request'

export const getOrderList = (params) => {
  return request({
    url: '/orders',
    method: 'get',
    params
  })
}

export const getOrderDetail = (id) => {
  return request({
    url: `/orders/${id}`,
    method: 'get'
  })
}

export const createOrder = (data) => {
  return request({
    url: '/orders',
    method: 'post',
    data
  })
}

export const updateOrderStatus = (id, status) => {
  return request({
    url: `/orders/${id}/status`,
    method: 'put',
    data: { status }
  })
}

export const uploadWeighTicket = (id, data) => {
  return request({
    url: `/orders/${id}/weigh-ticket`,
    method: 'post',
    data
  })
}

export const signContract = (id, data) => {
  return request({
    url: `/orders/${id}/contract`,
    method: 'post',
    data
  })
}

export const confirmOrder = (id) => {
  return request({
    url: `/orders/${id}/confirm`,
    method: 'post'
  })
}
