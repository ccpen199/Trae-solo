import request from '@/utils/request';

export function getRoles(params) {
  return request({
    url: '/roles',
    method: 'get',
    params
  });
}

export function getRoleById(id) {
  return request({
    url: `/roles/${id}`,
    method: 'get'
  });
}

export function createRole(data) {
  return request({
    url: '/roles',
    method: 'post',
    data
  });
}

export function updateRole(id, data) {
  return request({
    url: `/roles/${id}`,
    method: 'put',
    data
  });
}

export function deleteRole(id) {
  return request({
    url: `/roles/${id}`,
    method: 'delete'
  });
}

export function assignPermissions(id, permissionIds) {
  return request({
    url: `/roles/${id}/permissions`,
    method: 'post',
    data: { permissionIds }
  });
}

export function getAllPermissions() {
  return request({
    url: '/roles/permissions',
    method: 'get'
  });
}
