import request from '@/utils/request'

export const getTransferList = (params) => {
  return request({
    url: '/transfers',
    method: 'get',
    params
  })
}

export const getTransferDetail = (id) => {
  return request({
    url: `/transfers/${id}`,
    method: 'get'
  })
}

export const createTransfer = (data) => {
  return request({
    url: '/transfers',
    method: 'post',
    data
  })
}

export const updateTransfer = (id, data) => {
  return request({
    url: `/transfers/${id}`,
    method: 'put',
    data
  })
}

export const submitTransfer = (id) => {
  return request({
    url: `/transfers/${id}/submit`,
    method: 'post'
  })
}

export const approveTransfer = (id, data) => {
  return request({
    url: `/transfers/${id}/approve`,
    method: 'post',
    data
  })
}

export const rejectTransfer = (id, data) => {
  return request({
    url: `/transfers/${id}/reject`,
    method: 'post',
    data
  })
}

export const completeTransfer = (id) => {
  return request({
    url: `/transfers/${id}/complete`,
    method: 'post'
  })
}
