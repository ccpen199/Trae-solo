import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:56824/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const customers = {
  getAll: () => api.get('/customers'),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const drivers = {
  getAll: () => api.get('/drivers'),
  getAvailable: () => api.get('/drivers/available'),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
};

export const vehicles = {
  getAll: () => api.get('/vehicles'),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
};

export const orders = {
  getAll: (status) => api.get('/orders', { params: { status } }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  dispatch: (id, data) => api.post(`/orders/${id}/dispatch`, data),
  action: (id, data) => api.post(`/orders/${id}/action`, data),
  delete: (id) => api.delete(`/orders/${id}`),
};

export const fees = {
  getAll: () => api.get('/fees'),
  create: (data) => api.post('/fees', data),
  customerApprove: (id) => api.put(`/fees/${id}/customer-approve`),
  financeApprove: (id) => api.put(`/fees/${id}/finance-approve`),
  reject: (id) => api.put(`/fees/${id}/reject`),
};

export const exceptions = {
  getAll: () => api.get('/exceptions'),
  create: (data) => api.post('/exceptions', data),
  resolve: (id) => api.put(`/exceptions/${id}/resolve`),
};

export const dashboard = {
  getStats: () => api.get('/dashboard/stats'),
  getDispatchBoard: () => api.get('/dashboard/dispatch-board'),
  getTimeline: () => api.get('/dashboard/timeline'),
};

export default api;
