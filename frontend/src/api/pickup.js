import request from './index'

export const generatePickupCode = (parcelId, lockerId) => {
  return request.post('/pickup/generate-code', { parcel_id: parcelId, locker_id: lockerId })
}

export const verifyPickupCode = (code, trackingNo) => {
  return request.post('/pickup/verify', { code, tracking_no: trackingNo })
}

export const biometricAuth = (trackingNo, biometricData) => {
  return request.post('/pickup/verify', { tracking_no: trackingNo, biometric_data: biometricData })
}

export const transferToStation = (trackingNo, stationId) => {
  return request.post('/pickup/transfer-station', { tracking_no: trackingNo, station_id: stationId })
}

export const getPickupHistory = (params) => {
  return request.get('/pickup/history', { params })
}

export const getPickupStatus = (trackingNo) => {
  return request.get(`/pickup/${trackingNo}`)
}

export const authorizePickup = (trackingNo, authorizedUser) => {
  return request.post('/pickup/authorize', { tracking_no: trackingNo, authorized_user: authorizedUser })
}
