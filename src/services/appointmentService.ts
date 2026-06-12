import apiClient from './apiClient';
import type { ServiceItem, Store, Staff, Appointment, Schedule } from '@/types/appointment';
import type { ServiceTrace } from '@/types/appointment';

export const appointmentService = {
  getServices: (): Promise<ServiceItem[]> => {
    return apiClient.get('/services');
  },

  getServiceById: (id: string): Promise<ServiceItem> => {
    return apiClient.get(`/services/${id}`);
  },

  getStores: (): Promise<Store[]> => {
    return apiClient.get('/stores');
  },

  getStoreById: (id: string): Promise<Store> => {
    return apiClient.get(`/stores/${id}`);
  },

  getStoreStaff: (storeId: string): Promise<Staff[]> => {
    return apiClient.get(`/stores/${storeId}/staff`);
  },

  getStoreAvailability: (storeId: string, date: string) => {
    return apiClient.get(`/stores/${storeId}/availability`, { params: { date } });
  },

  createAppointment: (data: Omit<Appointment, 'id' | 'orderNo' | 'createdAt' | 'serviceTraces'>): Promise<Appointment> => {
    return apiClient.post('/appointments', data);
  },

  getAppointments: (): Promise<Appointment[]> => {
    return apiClient.get('/appointments');
  },

  getAppointmentById: (id: string): Promise<Appointment> => {
    return apiClient.get(`/appointments/${id}`);
  },

  cancelAppointment: (id: string): Promise<Appointment> => {
    return apiClient.put(`/appointments/${id}/cancel`);
  },

  getSchedules: (storeId: string, startDate: string, endDate: string): Promise<Schedule[]> => {
    return apiClient.get('/store/schedules', { params: { storeId, startDate, endDate } });
  },

  createSchedule: (data: Omit<Schedule, 'id'>): Promise<Schedule> => {
    return apiClient.post('/store/schedules', data);
  },

  updateSchedule: (id: string, data: Partial<Schedule>): Promise<Schedule> => {
    return apiClient.put(`/store/schedules/${id}`, data);
  },

  getStoreServices: (storeId: string): Promise<Appointment[]> => {
    return apiClient.get('/store/services', { params: { storeId } });
  },

  updateServiceStep: (appointmentId: string, data: { stepId: string; notes?: string; beforePhotos?: string[]; afterPhotos?: string[] }): Promise<ServiceTrace> => {
    return apiClient.put(`/store/services/${appointmentId}/step`, data);
  },

  uploadServicePhotos: (appointmentId: string, photos: string[]): Promise<{ success: boolean }> => {
    return apiClient.post(`/store/services/${appointmentId}/photos`, { photos });
  },
};
