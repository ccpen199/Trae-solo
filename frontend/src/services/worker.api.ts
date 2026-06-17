import { get, post, put } from './request'

export interface WorkerStats {
  totalOrders: number
  completedOrders: number
  totalEarnings: number
  rating: number
}

export interface WorkerSkill {
  id: string
  name: string
  level: number
  verified: boolean
}

export const getRecommendOrders = (params?: { lat?: number; lng?: number; page?: number; pageSize?: number }) => {
  return get<{ list: unknown[]; total: number }>('/worker/orders/recommend', params)
}

export const getMyTasks = (params?: { status?: string; page?: number; pageSize?: number }) => {
  return get<{ list: unknown[]; total: number }>('/worker/tasks', params)
}

export const acceptOrder = (orderId: string) => {
  return post<unknown>(`/worker/orders/${orderId}/accept`)
}

export const completeOrder = (orderId: string) => {
  return put<unknown>(`/worker/orders/${orderId}/complete`)
}

export const getWorkerStats = () => {
  return get<WorkerStats>('/worker/stats')
}

export const getSkills = () => {
  return get<WorkerSkill[]>('/worker/skills')
}
