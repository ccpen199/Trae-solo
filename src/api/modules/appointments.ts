import request from '../request';
import type { Appointment, AppointmentStatus, FollowUpRecord } from '../../types';

export const getAppointments = (params?: any): Promise<Appointment[]> => {
  return request.get('/appointments', { params });
};

export const getAppointment = (id: number): Promise<Appointment> => {
  return request.get(`/appointments/${id}`);
};

export const createAppointment = (data: Partial<Appointment>): Promise<Appointment> => {
  return request.post('/appointments', data);
};

export const updateAppointment = (id: number, data: Partial<Appointment>): Promise<Appointment> => {
  return request.put(`/appointments/${id}`, data);
};

export const updateAppointmentStatus = (
  id: number,
  status: AppointmentStatus,
  reason?: string
): Promise<Appointment> => {
  return request.patch(`/appointments/${id}/status`, { status, reason });
};

export const addFollowUpRecord = (
  id: number,
  content: string
): Promise<FollowUpRecord> => {
  return request.post(`/appointments/${id}/follow-up`, { content });
};
