import { get, post, put, del } from './request'
import type { Station, PageResult, ApiResponse } from '@/types'

interface StationQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  operatorId?: string
}

export function getStationList(params: StationQuery) {
  return get<PageResult<Station>>('/admin/stations', { params })
}

export function getStationDetail(id: string) {
  return get<Station>(`/admin/stations/${id}`)
}

export function createStation(data: Partial<Station>) {
  return post<Station>('/admin/stations', data)
}

export function updateStation(id: string, data: Partial<Station>) {
  return put<Station>(`/admin/stations/${id}`, data)
}

export function deleteStation(id: string) {
  return del<void>(`/admin/stations/${id}`)
}
