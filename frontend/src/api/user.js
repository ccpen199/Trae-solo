import request from '@/utils/request';

export function login(data) {
  return request({
    url: '/users/login',
    method: 'post',
    data,
  });
}

export function getUserList(params) {
  return request({
    url: '/users',
    method: 'get',
    params,
  });
}

export function getUserById(id) {
  return request({
    url: `/users/${id}`,
    method: 'get',
  });
}

export function createUser(data) {
  return request({
    url: '/users',
    method: 'post',
    data,
  });
}

export function updateUser(id, data) {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data,
  });
}

export function getRegulators() {
  return request({
    url: '/users/regulators',
    method: 'get',
  });
}

export function getRoleStats() {
  return request({
    url: '/users/stats/roles',
    method: 'get',
  });
}
