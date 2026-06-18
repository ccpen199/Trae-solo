import { get, post } from './request'

interface SettlementQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  startTime?: string
  endTime?: string
}

export function getSettlementList(params: SettlementQuery) {
  return get('/admin/settlements', { params })
}

export function getSettlementDetail(id: string) {
  return get(`/admin/settlements/${id}`)
}

export function getSettlementStatistics(params?: { startTime?: string; endTime?: string }) {
  return get('/admin/settlements/statistics', { params })
}

export function settleBatch(ids: string[]) {
  return post('/admin/settlements/batch-settle', { ids })
}
