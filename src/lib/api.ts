import { Doctor, Institution, Schedule, Appointment, Settlement, DashboardStats, ApiResponse } from '@/types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `请求失败 ${response.status}`);
  }

  return payload.data!;
}

export const api = {
  dashboard: {
    stats: () => request<DashboardStats>('/dashboard/stats'),
  },
  doctors: {
    list: () => request<Doctor[]>('/doctors'),
    get: (id: number) => request<Doctor>(`/doctors/${id}`),
    create: (data: Partial<Doctor>) => request<Doctor>('/doctors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Doctor>) => request<Doctor>(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/doctors/${id}`, { method: 'DELETE' }),
  },
  institutions: {
    list: () => request<Institution[]>('/institutions'),
    get: (id: number) => request<Institution>(`/institutions/${id}`),
    create: (data: Partial<Institution>) => request<Institution>('/institutions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Institution>) => request<Institution>(`/institutions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  schedules: {
    list: (params?: { startDate?: string; endDate?: string }) => {
      const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      return request<Schedule[]>(`/schedules${query}`);
    },
    get: (id: number) => request<Schedule>(`/schedules/${id}`),
    create: (data: Partial<Schedule>) => request<Schedule>('/schedules', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Schedule>) => request<Schedule>(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    validate: (data: Partial<Schedule>) => request<{ valid: boolean; conflicts: any[] }>('/schedules/validate', { method: 'POST', body: JSON.stringify(data) }),
  },
  appointments: {
    list: () => request<Appointment[]>('/appointments'),
    get: (id: number) => request<Appointment>(`/appointments/${id}`),
    create: (data: Partial<Appointment>) => request<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Appointment>) => request<Appointment>(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    slots: (scheduleId: number) => request<any[]>(`/appointments/slots/${scheduleId}`),
  },
  settlements: {
    list: (params?: { period?: string }) => {
      const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      return request<Settlement[]>(`/settlements${query}`);
    },
    calculate: (data: { period: string }) => request<Settlement[]>('/settlements/calculate', { method: 'POST', body: JSON.stringify(data) }),
    export: (period: string) => `${API_BASE}/settlements/export?period=${period}`,
  },
  health: () => request('/health'),
};
