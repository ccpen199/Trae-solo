import { get } from './request'

export interface FulfillmentMetrics {
  totalOrders: number
  completedOrders: number
  onTimeRate: number
  avgDeliveryTime: number
  activeDrivers: number
  exceptionCount: number
}

export interface TrendDataItem {
  date: string
  orders: number
  completed: number
  rate: number
}

export interface SupplyDemandItem {
  area: string
  supply: number
  demand: number
  gap: number
}

export interface EarlyWarning {
  id: string
  type: string
  level: string
  message: string
  time: string
}

export function getFulfillmentMetrics() {
  return get<FulfillmentMetrics>('/dashboard/fulfillment')
}

export function getTrendsData() {
  return get<TrendDataItem[]>('/dashboard/trends')
}

export function getSupplyDemand() {
  return get<SupplyDemandItem[]>('/dashboard/supply-demand')
}

export function getEarlyWarnings() {
  return get<EarlyWarning[]>('/dashboard/early-warnings')
}
