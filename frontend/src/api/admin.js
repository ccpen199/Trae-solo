import request from './request'

export function getAdminOverview() {
  return request({
    url: '/admin/overview',
    method: 'get'
  })
}

export function getHeatPrediction(params) {
  return request({
    url: '/admin/heat-prediction',
    method: 'get',
    params
  })
}

export function getWindowScheduling() {
  return request({
    url: '/admin/window-scheduling',
    method: 'get'
  })
}

export function dispatchWindow(data) {
  return request({
    url: '/admin/window/dispatch',
    method: 'post',
    data
  })
}

export function getServiceItems(params) {
  return request({
    url: '/admin/service-items',
    method: 'get',
    params
  })
}

export function getOperationLogs(params) {
  return request({
    url: '/admin/operation-logs',
    method: 'get',
    params
  })
}

export function generatePrediction(data) {
  return request({
    url: '/admin/predict/generate',
    method: 'post',
    data
  })
}

export function getIdentityStats(userId) {
  return request({
    url: `/admin/identity-stats/${userId}`,
    method: 'get'
  })
}
