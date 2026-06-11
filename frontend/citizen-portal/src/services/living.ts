import request from './request';

export interface ServiceItem {
  id: string;
  category: 'housekeeping' | 'renovation' | 'transport';
  name: string;
  description: string;
  price: number;
  provider: string;
  rating: number;
}

export interface AppointmentParams {
  serviceId: string;
  date: string;
  time: string;
  address?: string;
  remark?: string;
}

export function getServices(category?: string, keyword?: string) {
  return request.get<unknown, ServiceItem[]>('/living/services', {
    params: { category, keyword },
  });
}

export function getServiceDetail(id: string) {
  return request.get(`/living/services/${id}`);
}

export function createAppointment(params: AppointmentParams) {
  return request.post('/living/appointments', params);
}

export function getMyAppointments() {
  return request.get('/living/my-appointments');
}

export function cancelAppointment(id: string) {
  return request.put(`/living/appointments/${id}/cancel`);
}
