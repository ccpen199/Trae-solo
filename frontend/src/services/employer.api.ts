import { get, post, put } from './request'
import type { Order } from '../types'

export interface PublishLaborData {
  title: string
  description: string
  skillIds: string[]
  startTime: string
  address: string
  lat: number
  lng: number
  budget: number
  workerCount: number
}

export interface PublishVehicleData {
  title: string
  description: string
  vehicleTypeId: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  deliveryAddress: string
  deliveryLat: number
  deliveryLng: number
  weight: number
  volume: number
  needLoading: boolean
  needUnloading: boolean
  scheduledAt: string
  budget: number
}

export interface PublishMovingData {
  title: string
  description: string
  fromAddress: string
  fromLat: number
  fromLng: number
  toAddress: string
  toLat: number
  toLng: number
  hasElevator: boolean
  floorFrom: number
  floorTo: number
  items: string[]
  vehicleTypeId: string
  needWorkers: number
  scheduledAt: string
  budget: number
}

export interface ReviewData {
  orderId: string
  rating: number
  comment?: string
}

export const getOrders = (params?: { status?: string; page?: number; pageSize?: number }) => {
  return get<{ list: Order[]; total: number }>('/employer/orders', params)
}

export const getOrderDetail = (id: string) => {
  return get<Order>(`/employer/orders/${id}`)
}

export const publishLabor = (data: PublishLaborData) => {
  return post<Order>('/employer/publish/labor', data)
}

export const publishVehicle = (data: PublishVehicleData) => {
  return post<Order>('/employer/publish/vehicle', data)
}

export const publishMoving = (data: PublishMovingData) => {
  return post<Order>('/employer/publish/moving', data)
}

export const getNearbyWorkers = (params: { lat: number; lng: number; skillId?: string; radius?: number }) => {
  return get<{ list: unknown[] }>('/employer/nearby/workers', params)
}

export const getNearbyDrivers = (params: { lat: number; lng: number; vehicleTypeId?: string; radius?: number }) => {
  return get<{ list: unknown[] }>('/employer/nearby/drivers', params)
}

export const confirmOrder = (id: string) => {
  return put<Order>(`/employer/orders/${id}/confirm`)
}

export const submitReview = (data: ReviewData) => {
  return post<unknown>('/employer/reviews', data)
}
