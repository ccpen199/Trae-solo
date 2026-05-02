import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

export function getUserInfo() {
  return request({
    url: '/auth/info',
    method: 'get'
  })
}

export function updatePassword(data) {
  return request({
    url: '/auth/password',
    method: 'put',
    data
  })
}

export function getCaptcha() {
  return request({
    url: '/auth/captcha',
    method: 'get'
  })
}

export function getUserList(query) {
  return request({
    url: '/user/list',
    method: 'get',
    params: query
  })
}

export function getUserById(id) {
  return request({
    url: `/user/${id}`,
    method: 'get'
  })
}

export function createUser(data) {
  return request({
    url: '/user',
    method: 'post',
    data
  })
}

export function updateUser(data) {
  return request({
    url: '/user',
    method: 'put',
    data
  })
}

export function deleteUser(id) {
  return request({
    url: `/user/${id}`,
    method: 'delete'
  })
}

export function resetPassword(id, data) {
  return request({
    url: `/user/${id}/password/reset`,
    method: 'put',
    data
  })
}

export function updateUserStatus(id, status) {
  return request({
    url: `/user/${id}/status`,
    method: 'put',
    params: { status }
  })
}
