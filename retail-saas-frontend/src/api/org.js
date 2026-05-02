import request from '@/utils/request'

export function getOrgTree() {
  return request({
    url: '/org/tree',
    method: 'get'
  })
}

export function getOrgPage(query) {
  return request({
    url: '/org/page',
    method: 'get',
    params: query
  })
}

export function getOrgById(id) {
  return request({
    url: `/org/${id}`,
    method: 'get'
  })
}

export function createOrg(data) {
  return request({
    url: '/org',
    method: 'post',
    data
  })
}

export function updateOrg(data) {
  return request({
    url: '/org',
    method: 'put',
    data
  })
}

export function deleteOrg(id) {
  return request({
    url: `/org/${id}`,
    method: 'delete'
  })
}

export function getOrgByType(orgType) {
  return request({
    url: '/org/type',
    method: 'get',
    params: { orgType }
  })
}

export function getOrgStores() {
  return request({
    url: '/org/type/STORE',
    method: 'get'
  })
}

export function getOrgRegions() {
  return request({
    url: '/org/type/REGION',
    method: 'get'
  })
}
