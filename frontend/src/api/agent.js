import request from './request'

export function createAuthorization(data) {
  return request({
    url: '/agent/authorize',
    method: 'post',
    data
  })
}

export function getPrincipalAuths(userId) {
  return request({
    url: `/agent/principal/${userId}`,
    method: 'get'
  })
}

export function getAgentAuths(userId) {
  return request({
    url: `/agent/agent/${userId}`,
    method: 'get'
  })
}

export function createOperation(data) {
  return request({
    url: '/agent/operation',
    method: 'post',
    data
  })
}

export function getOperations(authId, params) {
  return request({
    url: `/agent/operations/${authId}`,
    method: 'get',
    params
  })
}

export function confirmOperation(data) {
  return request({
    url: '/agent/confirm',
    method: 'post',
    data
  })
}

export function revokeAuth(data) {
  return request({
    url: '/agent/revoke',
    method: 'post',
    data
  })
}
