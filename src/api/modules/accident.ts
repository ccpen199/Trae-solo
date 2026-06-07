import { get, post, put } from '../client'
import type {
  AccidentRecord,
  AccidentReportRequest,
  PagedResponse,
  PaginationParams
} from '../../types'

export const getAccidentList = (
  params?: PaginationParams & { status?: string }
): Promise<PagedResponse<AccidentRecord>> => {
  return get<PagedResponse<AccidentRecord>>('/accident/list', params)
}

export const getAccidentDetail = (id: number): Promise<AccidentRecord> => {
  return get<AccidentRecord>(`/accident/${id}`)
}

export const createAccident = (
  data: AccidentReportRequest
): Promise<AccidentRecord> => {
  return post<AccidentRecord>('/accident', data)
}

export const updateAccident = (
  id: number,
  data: Partial<AccidentReportRequest>
): Promise<AccidentRecord> => {
  return put<AccidentRecord>(`/accident/${id}`, data)
}

export const getMyAccidents = (
  params?: PaginationParams & { status?: string }
): Promise<PagedResponse<AccidentRecord>> => {
  return get<PagedResponse<AccidentRecord>>('/accident/my', params)
}

export const submitNegotiation = (
  id: number,
  data: { agreement: string; signature: string }
): Promise<AccidentRecord> => {
  return post<AccidentRecord>(`/accident/${id}/negotiate`, data)
}

export const determineLiability = (
  id: number,
  data: { liability: string; officerId?: number }
): Promise<AccidentRecord> => {
  return post<AccidentRecord>(`/accident/${id}/determine`, data)
}

export const completeAccident = (id: number): Promise<AccidentRecord> => {
  return post<AccidentRecord>(`/accident/${id}/complete`)
}

export default {
  getAccidentList,
  getAccidentDetail,
  createAccident,
  updateAccident,
  getMyAccidents,
  submitNegotiation,
  determineLiability,
  completeAccident
}
