import { get, post, put, del } from '../client'
import type {
  ViolationReport,
  ViolationReportRequest,
  PagedResponse,
  PaginationParams
} from '../../types'

export const getViolationList = (
  params?: PaginationParams & { status?: string }
): Promise<PagedResponse<ViolationReport>> => {
  return get<PagedResponse<ViolationReport>>('/violation/list', params)
}

export const getViolationDetail = (id: number): Promise<ViolationReport> => {
  return get<ViolationReport>(`/violation/${id}`)
}

export const createViolation = (
  data: ViolationReportRequest
): Promise<ViolationReport> => {
  return post<ViolationReport>('/violation', data)
}

export const updateViolation = (
  id: number,
  data: Partial<ViolationReportRequest>
): Promise<ViolationReport> => {
  return put<ViolationReport>(`/violation/${id}`, data)
}

export const deleteViolation = (id: number): Promise<void> => {
  return del<void>(`/violation/${id}`)
}

export const getMyViolations = (
  params?: PaginationParams & { status?: string }
): Promise<PagedResponse<ViolationReport>> => {
  return get<PagedResponse<ViolationReport>>('/violation/my', params)
}

export const getViolationTypes = (): Promise<Array<{ code: string; name: string; description?: string }>> => {
  return get<Array<{ code: string; name: string; description?: string }>>('/violation/types')
}

export default {
  getViolationList,
  getViolationDetail,
  createViolation,
  updateViolation,
  deleteViolation,
  getMyViolations,
  getViolationTypes
}
