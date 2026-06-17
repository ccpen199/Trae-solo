import { get, post, put } from './request'

export interface DriverStats {
  totalOrders: number
  completedOrders: number
  totalEarnings: number
  rating: number
  totalDistance: number
}

export interface Vehicle {
  id: string
  plateNumber: string
  vehicleTypeId: string
  capacity: string
  verified: boolean
  images?: string[]
}

export interface Waybill {
  id: string
  orderId: string
  orderNo: string
  status: string
  pickupInfo: unknown
  deliveryInfo: unknown
  cargoInfo: unknown
  driverSignature?: string
  receiverSignature?: string
  createdAt: string
}

export interface BidData {
  orderId: string
  price: number
  remark?: string
}

export const getOrders = (params?: { lat?: number; lng?: number; vehicleTypeId?: string; page?: number; pageSize?: number }) => {
  return get<{ list: unknown[]; total: number }>('/driver/orders', params)
}

export const getBiddingList = (params?: { status?: string; page?: number; pageSize?: number }) => {
  return get<{ list: unknown[]; total: number }>('/driver/bidding', params)
}

export const placeBid = (data: BidData) => {
  return post<unknown>('/driver/bidding', data)
}

export const getMyTasks = (params?: { status?: string; page?: number; pageSize?: number }) => {
  return get<{ list: unknown[]; total: number }>('/driver/tasks', params)
}

export const getWaybill = (id: string) => {
  return get<Waybill>(`/driver/waybill/${id}`)
}

export const signWaybill = (id: string, signature: string) => {
  return put<Waybill>(`/driver/waybill/${id}/sign`, { signature })
}

export const getVehicles = () => {
  return get<Vehicle[]>('/driver/vehicles')
}

export const getDriverStats = () => {
  return get<DriverStats>('/driver/stats')
}
