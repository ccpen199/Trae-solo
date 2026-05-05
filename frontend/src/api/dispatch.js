import request from '@/utils/request'

export function getDispatchList(params) {
  return request({
    url: '/dispatch',
    method: 'get',
    params
  })
}

export function getDispatchDetail(id) {
  return request({
    url: `/dispatch/${id}`,
    method: 'get'
  })
}

export function createDispatch(data) {
  return request({
    url: '/dispatch',
    method: 'post',
    data
  })
}

export function readDispatch(id) {
  return request({
    url: `/dispatch/${id}/read`,
    method: 'put'
  })
}

export function confirmDispatch(id, data) {
  return request({
    url: `/dispatch/${id}/confirm`,
    method: 'put',
    data
  })
}

export function getPendingInstructions() {
  return request({
    url: '/dispatch/driver/pending',
    method: 'get'
  })
}

export const getPendingDispatches = getPendingInstructions
export const markAsRead = readDispatch
