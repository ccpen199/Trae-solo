import { get, post, put, del } from './http'

export interface DeviceQueryParams {
  page?: number
  pageSize?: number
  status?: string
  type?: string
  keyword?: string
}

export interface StartWashParams {
  program: string
  duration: number
}

export function getDeviceListApi(params?: DeviceQueryParams) {
  return get('/devices', params)
}

export function getDeviceDetailApi(id: number) {
  return get(`/devices/${id}`)
}

export function getDeviceByCodeApi(code: string) {
  return get('/devices/code', { code })
}

export function startWashApi(deviceId: number, data: StartWashParams) {
  return post(`/devices/${deviceId}/start`, data)
}

export function pauseWashApi(deviceId: number) {
  return post(`/devices/${deviceId}/pause`)
}

export function continueWashApi(deviceId: number) {
  return post(`/devices/${deviceId}/continue`)
}

export function getDeviceStatusApi(deviceId: number) {
  return get(`/devices/${deviceId}/status`)
}

export function createDeviceApi(data: any) {
  return post('/devices', data)
}

export function updateDeviceApi(id: number, data: any) {
  return put(`/devices/${id}`, data)
}

export function deleteDeviceApi(id: number) {
  return del(`/devices/${id}`)
}

export function getDeviceStatsApi() {
  return get('/devices/stats')
}

export function getDeviceHeatmapApi() {
  return get('/devices/heatmap')
}
