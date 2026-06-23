const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  return data;
}

function get(path: string) {
  return request(path, { method: 'GET' });
}

function post(path: string, body?: any) {
  return request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
}

function put(path: string, body?: any) {
  return request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
}

function del(path: string) {
  return request(path, { method: 'DELETE' });
}

export const auth = {
  login: (phone: string, code: string) => post('/auth/login', { phone, code }),
  sendCode: (phone: string) => post('/auth/send-code', { phone }),
  realname: (name: string, idCard: string) => post('/auth/realname', { name, idCard }),
  bindUnion: (districtId: string, grassrootsId: string) => post('/auth/bind-union', { districtId, grassrootsId }),
  getMe: () => get('/auth/me'),
};

export const org = {
  getTree: () => get('/org/tree'),
  getDistricts: () => get('/org/districts'),
  getGrassroots: (districtId: string) => get(`/org/grassroots?districtId=${districtId}`),
};

export const activities = {
  getList: (params?: Record<string, any>) => get(`/activities?${new URLSearchParams(params || {}).toString()}`),
  getDetail: (id: string) => get(`/activities/${id}`),
  register: (id: string) => post(`/activities/${id}/register`),
  getTicket: (id: string) => get(`/activities/${id}/ticket`),
  verify: (code: string) => post(`/activities/verify`, { code }),
};

export const mall = {
  getProducts: (params?: Record<string, any>) => get(`/mall/products?${new URLSearchParams(params || {}).toString()}`),
  getProduct: (id: string) => get(`/mall/products/${id}`),
  placeOrder: (data: { productId: string; quantity: number }) => post('/mall/orders', data),
  getOrders: (params?: Record<string, any>) => get(`/mall/orders?${new URLSearchParams(params || {}).toString()}`),
  redeem: (data: { code: string }) => post('/mall/redeem', data),
};

export const legal = {
  takeQueue: () => post('/legal/queue'),
  getQueueStatus: () => get('/legal/queue/status'),
  getTemplates: (params?: Record<string, any>) => get(`/legal/templates?${new URLSearchParams(params || {}).toString()}`),
  getTemplate: (id: string) => get(`/legal/templates/${id}`),
};

export const aid = {
  apply: (data: any) => post('/aid/applications', data),
  getApplications: (params?: Record<string, any>) => get(`/aid/applications?${new URLSearchParams(params || {}).toString()}`),
  getApplication: (id: string) => get(`/aid/applications/${id}`),
  updateStatus: (id: string, data: any) => put(`/aid/applications/${id}/status`, data),
};

export const psy = {
  getScales: () => get('/psy/scales'),
  getScale: (id: string) => get(`/psy/scales/${id}`),
  submitScale: (data: any) => post('/psy/submit', data),
  getReport: (id: string) => get(`/psy/reports/${id}`),
  getCounselors: () => get('/psy/counselors'),
  bookAppointment: (data: any) => post('/psy/appointments', data),
};

export const push = {
  getTags: () => get('/push/tags'),
  preview: (data: any) => post('/push/preview', data),
  send: (data: any) => post('/push/send', data),
};

export const dashboard = {
  getOverview: () => get('/dashboard/overview'),
  getTrends: (params?: Record<string, any>) => get(`/dashboard/trends?${new URLSearchParams(params || {}).toString()}`),
  getDistribution: () => get('/dashboard/distribution'),
  getRealtime: () => get('/dashboard/realtime'),
};
