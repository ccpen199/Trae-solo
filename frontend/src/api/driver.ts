import { get, post } from './request'

export interface Driver {
  id: string
  name: string
  phone: string
  idCard: string
  vehicleNo: string
  vehicleType: string
  status: 'active' | 'inactive' | 'offline'
  creditScore: number
  totalOrders: number
  createdAt: string
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
