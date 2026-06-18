import request from './request'

export const getStationList = (params: any) => {
  return request.get('/stations', { params })
}

export const getStationDetail = (id: string) => {
  return request.get(`/stations/${id}`)
}

export const getNearbyStations = (params: {
  longitude: number
  latitude: number
  radius?: number
}) => {
  return request.get('/stations/nearby', { params })
}
