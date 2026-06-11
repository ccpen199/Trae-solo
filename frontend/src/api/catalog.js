import request from './request.js'

export const getDeviceTypes = () => {
  return request.get('/device-types')
}

export const getBrands = (params) => {
  return request.get('/brands', { params })
}

export const getIRCodeModels = (params) => {
  return request.get('/ir-code-models', { params })
}
