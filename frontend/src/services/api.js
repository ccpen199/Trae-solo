import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:56882/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error.response?.data || error);
  }
);

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
};

export const clientsAPI = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
};

export const mattersAPI = {
  getAll: () => api.get('/matters'),
  getById: (id) => api.get(`/matters/${id}`),
  create: (data) => api.post('/matters', data),
  update: (id, data) => api.put(`/matters/${id}`, data),
};

export const timeEntriesAPI = {
  getAll: (params) => api.get('/time-entries', { params }),
  getById: (id) => api.get(`/time-entries/${id}`),
  create: (data) => api.post('/time-entries', data),
  update: (id, data) => api.put(`/time-entries/${id}`, data),
  review: (id, data) => api.put(`/time-entries/${id}/review`, data),
  delete: (id) => api.delete(`/time-entries/${id}`),
};

export const ratesAPI = {
  getAll: () => api.get('/rates'),
  create: (data) => api.post('/rates', data),
  getByUser: (userId) => api.get(`/rates/user/${userId}`),
};

export const invoicesAPI = {
  getAll: () => api.get('/invoices'),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  updateStatus: (id, status) => api.put(`/invoices/${id}/status`, { status }),
  recordPayment: (data) => api.post('/payments', data),
  reopen: (id) => api.post(`/invoices/${id}/reopen`),
};

export const reportsAPI = {
  getBudget: () => api.get('/reports/budget'),
  getTimeSummary: (params) => api.get('/reports/time-summary', { params }),
  getRevenue: (params) => api.get('/reports/revenue', { params }),
};

export default api;
