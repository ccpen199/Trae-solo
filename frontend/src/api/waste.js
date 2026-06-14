import request from '@/utils/request'

export const getWasteList = (params) => {
  return request({
    url: '/wastes',
    method: 'get',
    params
  })
}

export const getWasteDetail = (id) => {
  return request({
    url: `/wastes/${id}`,
    method: 'get'
  })
}

export const createWaste = (data) => {
  return request({
    url: '/wastes',
    method: 'post',
    data
  })
}

export const updateWaste = (id, data) => {
  return request({
    url: `/wastes/${id}`,
    method: 'put',
    data
  })
}

export const deleteWaste = (id) => {
  return request({
    url: `/wastes/${id}`,
    method: 'delete'
  })
}

export const submitReview = (id) => {
  return request({
    url: `/wastes/${id}/review`,
    method: 'post'
  })
}

export const estimatePrice = (data) => {
  return request({
    url: '/wastes/estimate',
    method: 'post',
    data
  })
}
