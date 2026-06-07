import { get } from '../client'
import type { MonthlyStats, StatsSummary } from '../../types'

export const getSummary = (): Promise<StatsSummary> => {
  return get<StatsSummary>('/stats/summary')
}

export const getMonthlyStats = (
  params?: { year?: number; month?: number }
): Promise<MonthlyStats[]> => {
  return get<MonthlyStats[]>('/stats/monthly', params)
}

export const getPermitStats = (
  params?: { startDate?: string; endDate?: string }
): Promise<{
  total: number
  approved: number
  rejected: number
  pending: number
  avgProcessTime: number
}> => {
  return get('/stats/permit', params)
}

export const getViolationStats = (
  params?: { startDate?: string; endDate?: string }
): Promise<{
  total: number
  valid: number
  invalid: number
  pending: number
  byType: Array<{ type: string; count: number }>
}> => {
  return get('/stats/violation', params)
}

export const getAccidentStats = (
  params?: { startDate?: string; endDate?: string }
): Promise<{
  total: number
  negotiating: number
  determined: number
  completed: number
  avgProcessTime: number
}> => {
  return get('/stats/accident', params)
}

export const getEbikeStats = (
  params?: { startDate?: string; endDate?: string }
): Promise<{
  total: number
  approved: number
  rejected: number
  pending: number
  byBrand: Array<{ brand: string; count: number }>
}> => {
  return get('/stats/ebike', params)
}

export const getAppointmentStats = (
  params?: { startDate?: string; endDate?: string }
): Promise<{
  total: number
  completed: number
  cancelled: number
  noShow: number
  avgRating: number
  satisfactionRate: number
  byWindow: Array<{ windowId: number; windowName: string; count: number }>
}> => {
  return get('/stats/appointment', params)
}

export const getTrendData = (
  type: 'permit' | 'violation' | 'accident' | 'ebike' | 'appointment',
  period: 'day' | 'week' | 'month' | 'year'
): Promise<Array<{ date: string; count: number }>> => {
  return get('/stats/trend', { type, period })
}

export default {
  getSummary,
  getMonthlyStats,
  getPermitStats,
  getViolationStats,
  getAccidentStats,
  getEbikeStats,
  getAppointmentStats,
  getTrendData
}
