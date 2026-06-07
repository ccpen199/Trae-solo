import { get, post, put, del } from './http'

export interface WorkOrderParams {
  page?: number
  pageSize?: number
  status?: string
  keyword?: string
}

export interface AlertParams {
  page?: number
  pageSize?: number
  status?: string
  level?: string
  keyword?: string
}

export interface FirmwareParams {
  page?: number
  pageSize?: number
}

export function getDashboardStatsApi() {
  return get('/admin/dashboard')
}

export function getWorkOrderListApi(params?: WorkOrderParams) {
  return get('/admin/work-orders', params)
}

export function getWorkOrderDetailApi(id: number) {
  return get(`/admin/work-orders/${id}`)
}

export function createWorkOrderApi(data: any) {
  return post('/admin/work-orders', data)
}

export function updateWorkOrderApi(id: number, data: any) {
  return put(`/admin/work-orders/${id}`, data)
}

export function assignWorkOrderApi(id: number, technicianId: number) {
  return post(`/admin/work-orders/${id}/assign`, { handlerId: technicianId })
}

export function getAlertListApi(params?: AlertParams) {
  return get('/admin/alerts', params)
}

export function handleAlertApi(id: number, data: { status: string; remark?: string }) {
  return put(`/admin/alerts/${id}/handle`, data)
}

export function getFirmwareListApi(params?: FirmwareParams) {
  return get('/admin/firmware', params)
}

export function uploadFirmwareApi(data: FormData) {
  return post('/admin/firmware/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function pushFirmwareApi(id: number, deviceIds: number[]) {
  return post(`/admin/firmware/${id}/push`, { deviceIds })
}

export function getBrandConfigApi() {
  return get('/admin/brand-config')
}

export function updateBrandConfigApi(data: any) {
  return put('/admin/brand-config', data)
}

export function getTechnicianListApi() {
  return get('/admin/technicians')
}
