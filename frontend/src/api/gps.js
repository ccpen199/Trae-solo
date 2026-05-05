import request from '@/utils/request'

export function reportGPS(data) {
  return request({
    url: '/gps/report',
    method: 'post',
    data
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

export function getOrderTrack(orderId) {
  return request({
    url: `/gps/order/${orderId}/track`,
    method: 'get'
  })
}

export function getOrderStatus(orderId) {
  return request({
    url: `/gps/order/${orderId}/status`,
    method: 'get'
  })
}

export function getTrackList(params) {
  if (params?.vehicle_id) {
    return getVehicleTrack(params.vehicle_id, params)
  }
  if (params?.order_no) {
    return request({
      url: '/gps/tracks',
      method: 'get',
      params
    })
  }
  return request({
    url: '/gps/tracks',
    method: 'get',
    params
  })
}
