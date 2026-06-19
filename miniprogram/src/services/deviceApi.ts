import { get, post } from './api'
import type { DeviceInfo } from '../store'

export interface ScanStartParams {
  deviceCode: string
  temperature: 'cold' | 'warm' | 'hot'
}

export interface BluetoothStartParams {
  mac: string
  temperature: 'cold' | 'warm' | 'hot'
}

export interface StopWateringParams {
  transactionId: string
}

export interface BindDeviceParams {
  deviceCode: string
  name?: string
}

export interface StartWateringResponse {
  transactionId: string
  deviceId: string
  deviceName: string
  pricePerLiter: number
}

export interface DeviceStatusResponse {
  isActive: boolean
  volume: number
  amount: number
  currentTemp: number
}

export const deviceApi = {
  getMyDevices: () => get<DeviceInfo[]>('/api/v1/device/my-devices'),

  getNearbyDevices: (params?: { lat?: number; lng?: number; radius?: number }) =>
    get<DeviceInfo[]>('/api/v1/device/nearby', params),

  bindDevice: (params: BindDeviceParams) =>
    post<DeviceInfo>('/api/v1/device/bind', params),

  unbindDevice: (deviceId: string) =>
    post('/api/v1/device/unbind', { deviceId }),

  scanStart: (params: ScanStartParams) =>
    post<StartWateringResponse>('/api/v1/device/scan-start', params),

  bluetoothStart: (params: BluetoothStartParams) =>
    post<StartWateringResponse>('/api/v1/device/bluetooth-start', params),

  stopWatering: (params: StopWateringParams) =>
    post('/api/v1/device/stop', params),

  getDeviceStatus: (deviceId: string) =>
    get<DeviceStatusResponse>(`/api/v1/device/status/${deviceId}`),

  getDeviceDetail: (deviceId: string) =>
    get<DeviceInfo>(`/api/v1/device/${deviceId}`)
}

export const userApi = {
  login: (params: { code: string; nickname?: string; avatar?: string }) =>
    post<{ token: string; user: any }>('/api/v1/auth/login', params),

  getMe: () => get<any>('/api/v1/user/me'),

  getBalance: () =>
    get<{ balance: number; frozen: number }>('/api/v1/user/balance'),

  setBalanceWarning: (amount: number) =>
    post('/api/v1/user/balance-warning', { amount })
}
