import request from '@/utils/request'

export function getVehicleList(params) {
  return request({
    url: '/vehicles',
    method: 'get',
    params
  })
}

export function getVehicleDetail(id) {
  return request({
    url: `/vehicles/${id}`,
    method: 'get'
  })
}

export function createVehicle(data) {
  return request({
    url: '/vehicles',
    method: 'post',
    data
  })
}

export function updateVehicle(id, data) {
  return request({
    url: `/vehicles/${id}`,
    method: 'put',
    data
  })
}

export function deleteVehicle(id) {
  return request({
    url: `/vehicles/${id}`,
    method: 'delete'
  })
}

export function getIdleVehicles() {
  return request({
    url: '/vehicles/idle/list',
    method: 'get'
  })
}

export function getRealtimeVehicles() {
  return request({
    url: '/gps/vehicles/realtime',
    method: 'get'
  })
}

export function getVehicleTrack(vehicleId, params) {
  return request({
    url: `/gps/vehicle/${vehicleId}/track`,
    method: 'get',
    params
  })
}
