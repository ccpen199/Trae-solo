import request from '@/utils/request'

export function getDriverList(params) {
  return request({
    url: '/drivers',
    method: 'get',
    params
  })
}

export function getDriverDetail(id) {
  return request({
    url: `/drivers/${id}`,
    method: 'get'
  })
}

export function createDriver(data) {
  return request({
    url: '/drivers',
    method: 'post',
    data
  })
}

export function updateDriver(id, data) {
  return request({
    url: `/drivers/${id}`,
    method: 'put',
    data
  })
}

export function deleteDriver(id) {
  return request({
    url: `/drivers/${id}`,
    method: 'delete'
  })
}

export function getIdleDrivers() {
  return request({
    url: '/drivers/idle/list',
    method: 'get'
  })
}
