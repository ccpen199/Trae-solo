import request from '../utils/request'

export const getRoleList = (params) => {
  return request({
    url: '/roles',
    method: 'GET',
    params
  })
}

export const getAllRoles = () => {
  return request({
    url: '/roles/all',
    method: 'GET'
  })
}

export const getRoleById = (id) => {
  return request({
    url: `/roles/${id}`,
    method: 'GET'
  })
}

export const createRole = (data) => {
  return request({
    url: '/roles',
    method: 'POST',
    data
  })
}

export const updateRole = (id, data) => {
  return request({
    url: `/roles/${id}`,
    method: 'PUT',
    data
  })
}

export const deleteRole = (id) => {
  return request({
    url: `/roles/${id}`,
    method: 'DELETE'
  })
}

export const getPermissionTree = () => {
  return request({
    url: '/permissions/tree',
    method: 'GET'
  })
}
