const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  body?: any;
}

async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${url}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

export const api = {
  auth: {
    login: (phone: string, password: string) =>
      request('/auth/login', { method: 'POST', body: { phone, password } }),
    register: (data: any) =>
      request('/auth/register', { method: 'POST', body: data }),
    getProfile: () => request('/auth/profile'),
    updateProfile: (data: any) =>
      request('/auth/profile', { method: 'PUT', body: data }),
    recharge: (amount: number, payment_method?: string) =>
      request('/auth/recharge', { method: 'POST', body: { amount, payment_method } }),
  },

  stations: {
    list: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/stations${query}`);
    },
    detail: (id: number) => request(`/stations/${id}`),
    getGuns: (id: number) => request(`/stations/${id}/guns`),
    create: (data: any) => request('/stations', { method: 'POST', body: data }),
    update: (id: number, data: any) =>
      request(`/stations/${id}`, { method: 'PUT', body: data }),
  },

  charging: {
    reserve: (data: any) =>
      request('/charging/reserve', { method: 'POST', body: data }),
    cancelReservation: (id: number) =>
      request(`/charging/reserve/${id}/cancel`, { method: 'POST' }),
    start: (data: any) =>
      request('/charging/start', { method: 'POST', body: data }),
    stop: (id: number, stop_reason?: string) =>
      request(`/charging/${id}/stop`, { method: 'POST', body: { stop_reason } }),
    pay: (id: number, payment_method?: string) =>
      request(`/charging/${id}/pay`, { method: 'POST', body: { payment_method } }),
    orders: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/charging/orders${query}`);
    },
    orderDetail: (id: number) => request(`/charging/orders/${id}`),
    reservations: () => request('/charging/reservations'),
    transactions: () => request('/charging/transactions'),
  },

  operations: {
    chargers: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/operations/chargers${query}`);
    },
    guns: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/operations/guns${query}`);
    },
    restartCharger: (id: number) =>
      request(`/operations/chargers/${id}/restart`, { method: 'POST' }),
    setGunStatus: (id: number, status: string) =>
      request(`/operations/guns/${id}/set-status`, { method: 'POST', body: { status } }),
    firmware: () => request('/operations/firmware'),
    createFirmware: (data: any) =>
      request('/operations/firmware', { method: 'POST', body: data }),
    upgradeCharger: (id: number, firmware_id: number) =>
      request(`/operations/chargers/${id}/upgrade`, { method: 'POST', body: { firmware_id } }),
    alarms: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/operations/alarms${query}`);
    },
    acknowledgeAlarm: (id: number) =>
      request(`/operations/alarms/${id}/acknowledge`, { method: 'POST' }),
    resolveAlarm: (id: number) =>
      request(`/operations/alarms/${id}/resolve`, { method: 'POST' }),
    workOrders: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/operations/work-orders${query}`);
    },
    createWorkOrder: (data: any) =>
      request('/operations/work-orders', { method: 'POST', body: data }),
    updateWorkOrder: (id: number, data: any) =>
      request(`/operations/work-orders/${id}`, { method: 'PUT', body: data }),
    inspections: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/operations/inspections${query}`);
    },
    createInspection: (data: any) =>
      request('/operations/inspections', { method: 'POST', body: data }),
  },

  analytics: {
    overview: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/analytics/overview${query}`);
    },
    revenue: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/analytics/revenue${query}`);
    },
    utilization: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/analytics/utilization${query}`);
    },
    stations: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/analytics/stations${query}`);
    },
    users: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/analytics/users${query}`);
    },
    queueLoss: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/analytics/queue-loss${query}`);
    },
    generateDailyStats: (date?: string) =>
      request('/analytics/generate-daily-stats', { method: 'POST', body: { date } }),
    exportOrders: (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/analytics/export/orders${query}`);
    },
  },

  health: () => request('/health'),
};

export default api;
