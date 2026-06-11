import request from './request.js'

export const getDevices = (params) => {
  return request.get('/devices', { params })
}

export const getDevice = (id) => {
  return request.get(`/devices/${id}`)
}

export const createDevice = (data) => {
  return request.post('/devices', data)
}

export const updateDevice = (id, data) => {
  return request.put(`/devices/${id}`, data)
}

export const deleteDevice = (id) => {
  return request.delete(`/devices/${id}`)
}

export const sendIRCommand = (deviceId, command, params = {}) => {
  return request.post('/ir/send', { deviceId, command, params })
}

export const getDeviceCommands = (deviceId) => {
  return request.get(`/devices/${deviceId}/commands`)
}

export const learnCommand = (deviceId, commandName, rawCodeData) => {
  return request.post('/ir/learn', { deviceId, commandName, rawCodeData })
}

export const matchIRCode = (rawCode) => {
  return request.get(`/ir/match`, { params: { rawCode } })
}

export const getDeviceStatus = (deviceId) => {
  return request.get(`/devices/${deviceId}/status`)
}

export const getCommandLogs = (params = {}) => {
  return request.get('/devices', { params: { ...params, includeLogs: true } })
}
