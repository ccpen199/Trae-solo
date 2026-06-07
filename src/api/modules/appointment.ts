import { get, post, put, del } from '../client'
import type {
  Appointment,
  AppointmentRequest,
  ServiceWindow,
  Schedule,
  PagedResponse,
  PaginationParams
} from '../../types'

export const getAppointmentList = (
  params?: PaginationParams & { status?: string; businessType?: string }
): Promise<PagedResponse<Appointment>> => {
  return get<PagedResponse<Appointment>>('/appointment/list', params)
}

export const getAppointmentDetail = (id: number): Promise<Appointment> => {
  return get<Appointment>(`/appointment/${id}`)
}

export const createAppointment = (
  data: AppointmentRequest
): Promise<Appointment> => {
  return post<Appointment>('/appointment', data)
}

export const updateAppointment = (
  id: number,
  data: Partial<AppointmentRequest>
): Promise<Appointment> => {
  return put<Appointment>(`/appointment/${id}`, data)
}

export const cancelAppointment = (id: number): Promise<void> => {
  return del<void>(`/appointment/${id}`)
}

export const getMyAppointments = (
  params?: PaginationParams & { status?: string }
): Promise<PagedResponse<Appointment>> => {
  return get<PagedResponse<Appointment>>('/appointment/my', params)
}

export const getServiceWindows = (
  params?: { district?: string; businessType?: string }
): Promise<ServiceWindow[]> => {
  return get<ServiceWindow[]>('/appointment/windows', params)
}

export const getSchedule = (
  windowId: number,
  date: string
): Promise<Schedule> => {
  return get<Schedule>(`/appointment/schedule/${windowId}`, { date })
}

export const getAvailableSlots = (
  windowId: number,
  date: string
): Promise<string[]> => {
  return get<string[]>(`/appointment/available-slots/${windowId}`, { date })
}

export const rateAppointment = (
  id: number,
  data: { rating: number; comment?: string }
): Promise<Appointment> => {
  return post<Appointment>(`/appointment/${id}/rate`, data)
}

export default {
  getAppointmentList,
  getAppointmentDetail,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getMyAppointments,
  getServiceWindows,
  getSchedule,
  getAvailableSlots,
  rateAppointment
}
