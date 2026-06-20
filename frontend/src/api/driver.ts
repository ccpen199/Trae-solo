import { get, post } from './request'

export interface Driver {
  id: string
  name: string
  phone: string
  id_card: string
  driver_license?: string
  vehicle_type: string
  vehicle_plate: string
  vehicle_inspection_status?: string
  rating?: number
  status: 'available' | 'busy' | 'offline'
  credit_score?: number
  total_orders?: number
  created_at: string
}

export interface DriverListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
}

export interface DriverListResponse {
  list: Driver[]
  total: number
  page: number
  pageSize: number
}

export function getDrivers(params?: DriverListParams) {
  return get<DriverListResponse>('/drivers', { params })
}

export function getDriverById(id: string) {
  return get<Driver>(`/drivers/${id}`)
}

export function createDriver(data: Partial<Driver>) {
  return post<Driver>('/drivers', data)
}

export function getAvailableDrivers(orderId?: string) {
  return get<Driver[]>('/drivers/available', { params: { orderId } })
}
