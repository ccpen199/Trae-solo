import request from './request.js'

export const getCodeVersions = (params) => {
  return request.get('/admin/code-versions', { params })
}

export const createCodeVersion = (data) => {
  return request.post('/admin/code-versions', data)
}

export const pushOTA = (versionId, targetUsers) => {
  return request.post('/admin/ota/push', { versionId, targetUsers })
}

export const getOTAPushStatus = (pushId) => {
  return request.get(`/admin/ota/status/${pushId}`)
}

export const getDeviceBindingGraph = (params) => {
  return request.get('/admin/device-binding-graph', { params })
}

export const getErrorClusters = (params) => {
  return request.get('/admin/error-clusters', { params })
}

export const getErrorDetails = (clusterId) => {
  return request.get(`/admin/errors/${clusterId}`)
}

export const getFeedbackTickets = (params) => {
  return request.get('/admin/feedback', { params })
}

export const updateFeedbackStatus = (ticketId, status, reply) => {
  return request.put(`/admin/feedback/${ticketId}`, { status, reply })
}

export const getHighFrequencyErrors = (params) => {
  return request.get('/admin/high-frequency-errors', { params })
}
