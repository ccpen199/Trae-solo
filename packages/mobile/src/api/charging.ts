import request from './request'

export const startCharging = (data: {
  stationId: string
  pileNo: string
}) => {
  return request.post('/charging/start', data)
}

export const stopCharging = (orderId: string) => {
  return request.post(`/charging/stop/${orderId}`)
}

export const getChargingStatus = (orderId: string) => {
  return request.get(`/charging/status/${orderId}`)
}

export const getChargingOrderList = (params?: any) => {
  return request.get('/charging/orders', { params })
}
