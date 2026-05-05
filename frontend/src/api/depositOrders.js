import request from '@/utils/request'

export const getDepositOrderList = (params) => {
  return request({
    url: '/deposit-orders',
    method: 'GET',
    params
  })
}

export const getDepositOrderDetail = (id) => {
  return request({
    url: `/deposit-orders/${id}`,
    method: 'GET'
  })
}

export const approveDepositOrder = (id, data) => {
  return request({
    url: `/deposit-orders/${id}/approve`,
    method: 'POST',
    data
  })
}

export const rejectDepositOrder = (id, data) => {
  return request({
    url: `/deposit-orders/${id}/reject`,
    method: 'POST',
    data
  })
}

export const cancelDepositOrder = (id, data) => {
  return request({
    url: `/deposit-orders/${id}/cancel`,
    method: 'PUT',
    data
  })
}
