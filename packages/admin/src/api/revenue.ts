import { get } from './request'

export function getRevenueOverview(params?: { startTime?: string; endTime?: string }) {
  return get('/admin/revenue/overview', { params })
}

export function getRevenueTrend(params?: { startTime?: string; endTime?: string; type?: string }) {
  return get('/admin/revenue/trend', { params })
}

export function getRevenueByStation(params?: { startTime?: string; endTime?: string }) {
  return get('/admin/revenue/by-station', { params })
}
