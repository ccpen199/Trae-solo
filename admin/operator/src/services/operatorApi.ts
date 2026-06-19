import request from './api'

export interface Device {
  id: string
  deviceId: string
  name: string
  model: string
  status: 'online' | 'offline' | 'warning'
  project: string
  location: string
  firmwareVersion: string
  lastHeartbeat: string
  temperature?: number
  power?: number
  uvStatus?: boolean
}

export interface DeviceParams {
  targetTemperature?: number
  power?: number
  waterPrice?: number
  uvEnabled?: boolean
}

export interface Firmware {
  id: string
  version: string
  model: string
  size: string
  uploadTime: string
  uploader: string
  description?: string
  md5?: string
}

export interface WorkOrder {
  id: string
  code: string
  title: string
  type: 'repair' | 'maintenance' | 'inspection' | 'other'
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deviceId: string
  deviceName: string
  handler: string
  creator: string
  createTime: string
  updateTime: string
  description?: string
  images?: string[]
  records?: WorkOrderRecord[]
}

export interface WorkOrderRecord {
  id: string
  action: string
  operator: string
  time: string
  remark?: string
  images?: string[]
}

export interface Alarm {
  id: string
  deviceId: string
  deviceName: string
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  time: string
  handled: boolean
}

export interface CommandStatus {
  commandId: string
  deviceId: string
  deviceName: string
  type: 'restart' | 'params' | 'upgrade'
  status: 'pending' | 'sending' | 'sent' | 'executing' | 'success' | 'failed' | 'timeout'
  progress?: number
  message?: string
  createTime: string
}

export interface UpgradeTask {
  taskId: string
  firmwareId: string
  firmwareVersion: string
  totalDevices: number
  successCount: number
  failedCount: number
  inProgressCount: number
  scheduledTime?: string
  status: 'pending' | 'running' | 'completed' | 'cancelled'
  devices: {
    deviceId: string
    deviceName: string
    status: 'pending' | 'downloading' | 'upgrading' | 'success' | 'failed'
    progress: number
    message?: string
  }[]
}

export const operatorApi = {
  login: (data: { username: string; password: string }) =>
    request.post('/auth/login', data),

  getCurrentUser: () => request.get('/auth/profile'),

  getDevices: (params?: Partial<{
    status: Device['status']
    project: string
    model: string
    keyword: string
    page: number
    pageSize: number
  }>) => request.get('/devices', { params }),

  getDeviceDetail: (id: string) => request.get(`/device/${id}`),

  restartDevice: (id: string) => request.post(`/device/${id}/restart`),

  batchRestartDevices: (ids: string[]) =>
    request.post('/devices/batch-restart', { ids }),

  sendDeviceParams: (id: string, params: DeviceParams) =>
    request.post(`/device/${id}/params`, params),

  batchSendParams: (ids: string[], params: DeviceParams) =>
    request.post('/devices/batch-params', { ids, params }),

  getCommandStatus: (commandId: string) =>
    request.get(`/command/${commandId}/status`),

  getCommandList: (params?: { deviceId?: string; type?: string; page?: number; pageSize?: number }) =>
    request.get('/commands', { params }),

  getFirmwares: (params?: { model?: string; page?: number; pageSize?: number }) =>
    request.get('/firmwares', { params }),

  uploadFirmware: (file: File, onProgress?: (p: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/firmware/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress(Math.round((evt.loaded * 100) / evt.total))
        }
      }
    })
  },

  batchUpgradeFirmware: (data: {
    firmwareId: string
    deviceIds: string[]
    scheduledTime?: string
  }) => request.post('/firmware/batch-upgrade', data),

  getUpgradeTask: (taskId: string) => request.get(`/firmware/task/${taskId}`),

  getWorkOrders: (params?: Partial<{
    status: WorkOrder['status']
    priority: WorkOrder['priority']
    type: WorkOrder['type']
    keyword: string
    page: number
    pageSize: number
  }>) => request.get('/work-orders', { params }),

  createWorkOrder: (data: Partial<WorkOrder>) =>
    request.post('/work-orders', data),

  updateWorkOrder: (id: string, data: Partial<WorkOrder>) =>
    request.put(`/work-orders/${id}`, data),

  getWorkOrderDetail: (id: string) =>
    request.get(`/work-orders/${id}`),

  addWorkOrderRecord: (id: string, record: Omit<WorkOrderRecord, 'id' | 'time'>) =>
    request.post(`/work-orders/${id}/records`, record),

  getDashboardStats: () => request.get('/dashboard/stats'),

  getRecentAlarms: (params?: { limit?: number }) =>
    request.get('/alarms/recent', { params }),

  getPendingWorkOrders: (params?: { limit?: number }) =>
    request.get('/work-orders/pending', { params }),

  getDeviceOnlineTrend: (params?: { days?: number }) =>
    request.get('/devices/online-trend', { params }),

  getDeviceStatusDistribution: () =>
    request.get('/devices/status-distribution')
}
