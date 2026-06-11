import request from './request.js'

export const androidIRSend = (deviceId, irCode) => {
  return request.post('/bridge/android/ir-send', { deviceId, irCode })
}

export const androidIRLearn = (deviceId) => {
  return request.post('/bridge/android/ir-learn', { deviceId })
}

export const androidGetStatus = () => {
  return request.get('/bridge/android/status')
}

export const airPlaySend = (deviceId, command) => {
  return request.post('/bridge/airplay/send', { deviceId, command })
}

export const airPlayGetDevices = () => {
  return request.get('/bridge/airplay/devices')
}

export const airPlayGetStatus = (deviceId) => {
  return request.get(`/bridge/airplay/status/${deviceId}`)
}

export const getBridgeStatus = () => {
  return request.get('/bridge/status')
}
