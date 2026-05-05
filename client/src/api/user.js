import request from '../utils/request'

export const getUserList = (params) => {
  return request({
    url: '/users',
    method: 'GET',
    params
  })
}

export const getUserById = (id) => {
  return request({
    url: `/users/${id}`,
    method: 'GET'
  })
}

export const createUser = (data) => {
  return request({
    url: '/users',
    method: 'POST',
    data
  })
}

export const updateUser = (id, data) => {
  return request({
    url: `/users/${id}`,
    method: 'PUT',
    data
  })
}

export const deleteUser = (id) => {
  return request({
    url: `/users/${id}`,
    method: 'DELETE'
  })
}

export const resetPassword = (id, password) => {
  return request({
    url: `/users/${id}/reset-password`,
    method: 'PUT',
    data: { password }
  })
}
