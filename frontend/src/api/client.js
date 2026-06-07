import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error.response?.data || { error: 'Request failed' });
  }
);

export const venueAPI = {
  list: (params) => api.get('/api/venues', { params }),
  get: (id) => api.get(`/api/venues/${id}`),
  getSeats: (id) => api.get(`/api/venues/${id}/seats`),
  create: (data) => api.post('/api/venues', data),
  addSection: (id, data) => api.post(`/api/venues/${id}/sections`, data),
};

export const eventAPI = {
  list: (params) => api.get('/api/events', { params }),
  get: (id) => api.get(`/api/events/${id}`),
  create: (data) => api.post('/api/events', data),
};

export const sessionAPI = {
  list: (params) => api.get('/api/sessions', { params }),
  get: (id) => api.get(`/api/sessions/${id}`),
  getSeats: (id) => api.get(`/api/sessions/${id}/seats`),
  lockSeats: (id, data) => api.post(`/api/sessions/${id}/lock-seats`, data),
  unlockSeats: (id, data) => api.post(`/api/sessions/${id}/unlock-seats`, data),
  create: (data) => api.post('/api/sessions', data),
  updateStatus: (id, status) => api.post(`/api/sessions/${id}/status`, { status }),
};

export const orderAPI = {
  list: (params) => api.get('/api/orders', { params }),
  get: (id) => api.get(`/api/orders/${id}`),
  create: (data) => api.post('/api/orders', data),
  pay: (id, data) => api.post(`/api/orders/${id}/pay`, data),
  refund: (id) => api.post(`/api/orders/${id}/refund`),
};

export const ticketAPI = {
  list: (params) => api.get('/api/tickets', { params }),
  get: (id) => api.get(`/api/tickets/${id}`),
  verify: (id, data) => api.post(`/api/tickets/${id}/verify`, data),
};

export const userAPI = {
  list: (params) => api.get('/api/users', { params }),
  get: (id) => api.get(`/api/users/${id}`),
  create: (data) => api.post('/api/users', data),
  updatePreferences: (id, tags) => api.patch(`/api/users/${id}/preferences`, { tags }),
};

export const adminAPI = {
  getBoxOffice: (params) => api.get('/api/admin/dashboard/box-office', { params }),
  getAudience: () => api.get('/api/admin/dashboard/audience'),
  getRisk: () => api.get('/api/admin/dashboard/risk'),
  getABTests: () => api.get('/api/admin/marketing/ab-tests'),
  getABTest: (id) => api.get(`/api/admin/marketing/ab-tests/${id}`),
  getInventorySync: () => api.get('/api/admin/inventory/sync'),
  flagUser: (id, data) => api.post(`/api/admin/risk/users/${id}/flag`, data),
};

export default api;
