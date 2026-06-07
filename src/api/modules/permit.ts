import { get, post, put, del } from '../client'
import type {
  PermitApplication,
  PermitApplicationRequest,
  PagedResponse,
  PaginationParams
} from '../../types'

export const getPermitList = (
  params?: PaginationParams & { status?: string }
): Promise<PagedResponse<PermitApplication>> => {
  return get<PagedResponse<PermitApplication>>('/permit/list', params)
}

export const getPermitDetail = (id: number): Promise<PermitApplication> => {
  return get<PermitApplication>(`/permit/${id}`)
}

export const createPermit = (
  data: PermitApplicationRequest
): Promise<PermitApplication> => {
  return post<PermitApplication>('/permit', data)
}

export const updatePermit = (
  id: number,
  data: Partial<PermitApplicationRequest>
): Promise<PermitApplication> => {
  return put<PermitApplication>(`/permit/${id}`, data)
}

export const cancelPermit = (id: number): Promise<void> => {
  return del<void>(`/permit/${id}`)
}

export const getMyPermits = (
  params?: PaginationParams & { status?: string }
): Promise<PagedResponse<PermitApplication>> => {
  return get<PagedResponse<PermitApplication>>('/permit/my', params)
}

export const getValidPermit = (): Promise<PermitApplication | null> => {
  return get<PermitApplication | null>('/permit/valid')
}

export const renewPermit = (id: number): Promise<PermitApplication> => {
  return post<PermitApplication>(`/permit/${id}/renew`)
}

export default {
  getPermitList,
  getPermitDetail,
  createPermit,
  updatePermit,
  cancelPermit,
  getMyPermits,
  getValidPermit,
  renewPermit
}
