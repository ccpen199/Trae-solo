import request from './index'

export const trackParcels = (trackingNos) => {
  return request.get('/parcels/track', { params: { numbers: trackingNos.join(',') } })
}

export const getParcelDetail = (trackingNo) => {
  return request.get(`/parcels/${trackingNo}`)
}

export const getParcelChain = (trackingNo) => {
  return request.get(`/parcels/${trackingNo}/chain`)
}

export const getMyParcels = (params) => {
  return request.get('/parcels', { params })
}

export const getFamilyParcels = (params) => {
  return request.get('/parcels/family', { params })
}

export const getAnomalyParcels = (params) => {
  return request.get('/parcels/anomalies', { params })
}

export const recheckAnomaly = (trackingNo) => {
  return request.post(`/parcels/${trackingNo}/trigger-query`)
}

export const getParcelStats = () => {
  return request.get('/parcels/stats')
}

export const verifyChain = (trackingNo) => {
  return request.get(`/parcels/${trackingNo}/trace`)
}
