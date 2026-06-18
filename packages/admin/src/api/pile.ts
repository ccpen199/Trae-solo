import { get, post, put, del } from './request'
import type { Pile, PageResult } from '@/types'

interface PileQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  stationId?: string
  type?: string
}

export function getPileList(params: PileQuery) {
  return get<PageResult<Pile>>('/admin/piles', { params })
}

export function getPileDetail(id: string) {
  return get<Pile>(`/admin/piles/${id}`)
}

export function createPile(data: Partial<Pile>) {
  return post<Pile>('/admin/piles', data)
}

export function updatePile(id: string, data: Partial<Pile>) {
  return put<Pile>(`/admin/piles/${id}`, data)
}

export function deletePile(id: string) {
  return del<void>(`/admin/piles/${id}`)
}

export function getPileStatus() {
  return get('/admin/piles/status/overview')
}
