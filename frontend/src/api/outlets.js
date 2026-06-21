import request from './request'

export function getOutlets(params) {
  return request({
    url: '/outlets',
    method: 'get',
    params
  })
}

export function getOutletDetail(id) {
  return request({
    url: `/outlets/${id}`,
    method: 'get'
  })
}

export function getNearbyOutlets(data) {
  return request({
    url: '/outlets/nearby',
    method: 'post',
    data
  })
}

export function matchService(data) {
  return request({
    url: '/outlets/match-service',
    method: 'post',
    data
  })
}

export function getWaitTime(id) {
  return request({
    url: `/outlets/${id}/wait-time`,
    method: 'get'
  })
}

export function getARNavigation(params) {
  return request({
    url: '/outlets/ar/navigation',
    method: 'get',
    params
  })
}
