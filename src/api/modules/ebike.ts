import { get, post, put, del } from '../client'
import type {
  EbikeRegistration,
  EbikeRegistrationRequest,
  PagedResponse,
  PaginationParams
} from '../../types'

export const getEbikeList = (
  params?: PaginationParams & { status?: string }
): Promise<PagedResponse<EbikeRegistration>> => {
  return get<PagedResponse<EbikeRegistration>>('/ebike/list', params)
}

export const getEbikeDetail = (id: number): Promise<EbikeRegistration> => {
  return get<EbikeRegistration>(`/ebike/${id}`)
}

export const createEbike = (
  data: EbikeRegistrationRequest
): Promise<EbikeRegistration> => {
  return post<EbikeRegistration>('/ebike', data)
}

export const updateEbike = (
  id: number,
  data: Partial<EbikeRegistrationRequest>
): Promise<EbikeRegistration> => {
  return put<EbikeRegistration>(`/ebike/${id}`, data)
}

export const deleteEbike = (id: number): Promise<void> => {
  return del<void>(`/ebike/${id}`)
}

export const getMyEbikes = (
  params?: PaginationParams & { status?: string }
): Promise<PagedResponse<EbikeRegistration>> => {
  return get<PagedResponse<EbikeRegistration>>('/ebike/my', params)
}

export const getEbikeByPlateNumber = (
  plateNumber: string
): Promise<EbikeRegistration | null> => {
  return get<EbikeRegistration | null>('/ebike/plate', { plateNumber })
}

export const verifyFrameNumber = (frameNumber: string): Promise<boolean> => {
  return get<boolean>('/ebike/verify-frame', { frameNumber })
}

export default {
  getEbikeList,
  getEbikeDetail,
  createEbike,
  updateEbike,
  deleteEbike,
  getMyEbikes,
  getEbikeByPlateNumber,
  verifyFrameNumber
}
