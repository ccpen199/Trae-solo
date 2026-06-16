import axios from 'axios';

const baseURL = (import.meta as any).env.VITE_API_URL || '/api';

const request = axios.create({ baseURL, timeout: 15000 });

request.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

request.interceptors.response.use(r => r.data, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    if (location.pathname !== '/login') location.href = '/login';
  }
  return Promise.reject(err.response?.data || { message: err.message });
});

export const api = {
  auth: {
    login: (d: any) => request.post('/auth/login', d),
    me: () => request.get('/auth/me')
  },
  dashboard: {
    overview: () => request.get('/dashboard/overview'),
    brandQuality: () => request.get('/dashboard/brand-quality'),
    brandQualityDetail: (id: number) => request.get(`/dashboard/brand-quality/${id}`),
    ordersTrend: () => request.get('/dashboard/orders-trend'),
    networkTopology: () => request.get('/dashboard/network-topology'),
    apiUsage: () => request.get('/dashboard/api-usage'),
    realtimeMap: () => request.get('/dashboard/realtime-map'),
    auditLogs: (p: any = {}) => request.get('/dashboard/audit-logs', { params: p })
  },
  brands: {
    list: (p: any = {}) => request.get('/brands', { params: p }),
    all: () => request.get('/brands/all'),
    detail: (id: number) => request.get(`/brands/${id}`),
    toggle: (id: number) => request.post(`/brands/${id}/toggle-api`)
  },
  couriers: {
    list: (p: any = {}) => request.get('/couriers', { params: p }),
    pool: () => request.get('/couriers/pool'),
    workbench: () => request.get('/couriers/me/workbench'),
    detail: (id: number) => request.get(`/couriers/${id}`),
    patchStatus: (id: number, s: string) => request.patch(`/couriers/${id}/status`, { work_status: s })
  },
  orders: {
    list: (p: any = {}) => request.get('/orders', { params: p }),
    stats: () => request.get('/orders/stats/summary'),
    detail: (id: number) => request.get(`/orders/${id}`),
    tracking: (no: string) => request.get(`/orders/tracking/${no}`),
    create: (d: any) => request.post('/orders', d),
    patchStatus: (id: number, d: any) => request.patch(`/orders/${id}/status`, d),
    appointment: (id: number, t: string) => request.post(`/orders/${id}/appointment`, { appointment_time: t }),
    verifyFace: (id: number, data: string) => request.post(`/orders/${id}/verify-face`, { face_data: data }),
    syncEcommerce: (d: any) => request.post('/orders/sync-ecommerce', d),
    reviewAddress: (id: number, data: any) => request.post(`/orders/${id}/review-address`, data)
  },
  price: {
    compare: (d: any) => request.post('/price/compare', d),
    history: (p: any = {}) => request.get('/price/history', { params: p })
  },
  notifications: {
    list: (p: any = {}) => request.get('/notifications', { params: p }),
    readAll: () => request.patch('/notifications/all/read'),
    readOne: (id: number) => request.patch(`/notifications/${id}/read`),
    unread: () => request.get('/notifications/unread-count')
  },
  complaints: {
    list: (p: any = {}) => request.get('/complaints', { params: p }),
    create: (d: any) => request.post('/complaints', d),
    patchStatus: (id: number, d: any) => request.patch(`/complaints/${id}/status`, d),
    detail: (id: number) => request.get(`/complaints/${id}`)
  },
  branches: {
    list: (p: any = {}) => request.get('/branches', { params: p }),
    throughput: () => request.get('/branches/throughput-stats')
  },
  open: {
    brands: (key?: string) => request.get('/open/brands', key ? { headers: { 'X-App-Key': key } } : {}),
    tracking: (no: string, key?: string) => request.get(`/open/orders/${no}/tracking`, key ? { headers: { 'X-App-Key': key } } : {}),
    brandQuality: (key?: string) => request.get('/open/brand-quality', key ? { headers: { 'X-App-Key': key } } : {})
  }
};
