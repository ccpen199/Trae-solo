import { get, post } from './request'

export type CreditLevel = 'S' | 'A' | 'B' | 'C' | 'D'

export interface DriverCredit {
  id: string
  driverId: string
  driverName: string
  score: number
  level: CreditLevel
  totalOrders: number
  completedOrders: number
  onTimeRate: number
  serviceRating: number
  violationCount: number
  complaintCount: number
  lastUpdated: string
}

export interface CreditRankingItem {
  rank: number
  driverId: string
  driverName: string
  score: number
  level: CreditLevel
  onTimeRate: number
  serviceRating: number
  violationCount: number
}

export interface CreditListParams {
  page?: number
  pageSize?: number
  keyword?: string
  level?: string
}

export interface CreditListResponse {
  list: DriverCredit[]
  total: number
  page: number
  pageSize: number
}

export interface CreditScoreFactor {
  name: string
  weight: number
  description: string
}

export interface CreditModel {
  factors: CreditScoreFactor[]
  formula: string
  description: string
}

export function getDriverCredits(params?: CreditListParams) {
  return get<CreditListResponse>('/driver-credits', { params })
}

export function getCreditRanking(limit?: number) {
  return get<CreditRankingItem[]>('/driver-credits/ranking', { params: { limit } })
}

export function getDriverCreditByDriverId(driverId: string) {
  return get<DriverCredit>(`/driver-credits/driver/${driverId}`)
}

export function getCreditModel() {
  return get<CreditModel>('/driver-credits/model')
}

export function recalculateCredit(driverId: string) {
  return post<DriverCredit>(`/driver-credits/${driverId}/recalculate`)
}
