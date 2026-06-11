import request from './request.js'

export const startLearning = (deviceId) => {
  return request.post(`/learning/start`, { deviceId })
}

export const stopLearning = (sessionId) => {
  return request.post(`/learning/stop`, { sessionId })
}

export const getLearningStatus = (sessionId) => {
  return request.get(`/learning/status/${sessionId}`)
}

export const submitRawCode = (data) => {
  return request.post('/learning/submit-code', data)
}

export const cloudMatch = (rawCode) => {
  return request.post('/learning/cloud-match', { rawCode })
}

export const getLearningHistory = (params) => {
  return request.get('/learning/history', { params })
}

export const saveLearnedCode = (data) => {
  return request.post('/learning/save', data)
}
