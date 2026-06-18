import { get, post, put } from '../api';
import type { 
  PaginatedResponse, Store, Appointment, 
  ServiceRecord, Review 
} from '../../../shared/types';

export async function getStores(params?: { region?: string }) {
  return get<Store[]>('/field/stores', params);
}

export async function getAppointments(params?: { page?: number; pageSize?: number; status?: string }) {
  return get<PaginatedResponse<Appointment>>('/field/appointments', params);
}

export async function createAppointment(data: Omit<Appointment, 'id' | 'createdAt'>) {
  return post<{ created: boolean; id: number }>('/field/appointments', data);
}

export async function updateAppointment(id: number, data: { status?: string }) {
  return put<{ updated: boolean }>(`/field/appointments/${id}`, data);
}

export async function getServiceRecords(params?: { page?: number; pageSize?: number }) {
  return get<ServiceRecord[]>('/field/services', params);
}

export async function createServiceRecord(data: Omit<ServiceRecord, 'id' | 'onChain' | 'txHash' | 'createdAt'>) {
  return post<{ created: boolean; txHash: string }>('/field/services', data);
}

export async function getReviews(params?: { page?: number; pageSize?: number }) {
  return get<Review[]>('/field/reviews', params);
}
