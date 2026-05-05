import request from '@/utils/request';

export function getOrganizations(params) {
  return request({
    url: '/organizations',
    method: 'get',
    params
  });
}

export function getOrganizationById(id) {
  return request({
    url: `/organizations/${id}`,
    method: 'get'
  });
}

export function createOrganization(data) {
  return request({
    url: '/organizations',
    method: 'post',
    data
  });
}

export function updateOrganization(id, data) {
  return request({
    url: `/organizations/${id}`,
    method: 'put',
    data
  });
}

export function deleteOrganization(id) {
  return request({
    url: `/organizations/${id}`,
    method: 'delete'
  });
}
