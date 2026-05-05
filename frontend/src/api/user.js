import request from './request'

export function getUsers(params) {
  return request.get('/admin/users', { params })
}

export function getUser(id) {
  return request.get(`/admin/users/${id}`)
}

export function createUser(data, roleCode) {
  return request.post('/admin/users', data, { params: { roleCode } })
}

export function updateUser(id, data) {
  return request.put(`/admin/users/${id}`, data)
}

export function deleteUser(id) {
  return request.delete(`/admin/users/${id}`)
}

export function updateUserStatus(id, status) {
  return request.put(`/admin/users/${id}/status`, null, { params: { status } })
}

export function assignRoles(id, roleCodes) {
  return request.put(`/admin/users/${id}/roles`, roleCodes)
}

export function getAllRoles() {
  return request.get('/admin/roles/all')
}

export function getRoles(params) {
  return request.get('/admin/roles', { params })
}

export function getRole(id) {
  return request.get(`/admin/roles/${id}`)
}

export function createRole(data) {
  return request.post('/admin/roles', data)
}

export function updateRole(id, data) {
  return request.put(`/admin/roles/${id}`, data)
}

export function deleteRole(id) {
  return request.delete(`/admin/roles/${id}`)
}

export function getAllPermissions() {
  return request.get('/admin/roles/permissions/all')
}

export function assignPermissions(id, permissionIds) {
  return request.put(`/admin/roles/${id}/permissions`, permissionIds)
}
