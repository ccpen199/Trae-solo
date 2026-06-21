import request from './request'

export function getUserInfo(id) {
  return request({
    url: `/users/${id}`,
    method: 'get'
  })
}

export function toggleElderMode(data) {
  return request({
    url: '/users/elder-mode/toggle',
    method: 'post',
    data
  })
}

export function getElderConfig() {
  return request({
    url: '/users/elder-mode/config',
    method: 'get'
  })
}

export function createAppointment(data) {
  return request({
    url: '/users/appointments',
    method: 'post',
    data
  })
}

export function getAppointments(userId, params) {
  return request({
    url: `/users/appointments/${userId}`,
    method: 'get',
    params
  })
}
