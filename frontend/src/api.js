import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;

export const storesAPI = {
  getAll: () => api.get('/stores'),
  get: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  delete: (id) => api.delete(`/stores/${id}`)
};

export const vehiclesAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  getAvailable: (params) => api.get('/vehicles/available', { params }),
  get: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  updateStatus: (id, status) => api.put(`/vehicles/${id}/status`, { status }),
  delete: (id) => api.delete(`/vehicles/${id}`)
};

export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`)
};

export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  pickup: (id, data) => api.post(`/orders/${id}/pickup`, data),
  return: (id, data) => api.post(`/orders/${id}/return`, data),
  delete: (id) => api.delete(`/orders/${id}`)
};

export const maintenancesAPI = {
  getAll: (params) => api.get('/maintenances', { params }),
  get: (id) => api.get(`/maintenances/${id}`),
  create: (data) => api.post('/maintenances', data),
  start: (id) => api.put(`/maintenances/${id}/start`),
  complete: (id, data) => api.put(`/maintenances/${id}/complete`, data),
  update: (id, data) => api.put(`/maintenances/${id}`, data),
  delete: (id) => api.delete(`/maintenances/${id}`)
};

export const violationsAPI = {
  getAll: (params) => api.get('/violations', { params }),
  get: (id) => api.get(`/violations/${id}`),
  create: (data) => api.post('/violations', data),
  process: (id, data) => api.put(`/violations/${id}/process`, data),
  update: (id, data) => api.put(`/violations/${id}`, data),
  delete: (id) => api.delete(`/violations/${id}`)
};

export const inspectionsAPI = {
  getAll: (params) => api.get('/inspections', { params }),
  get: (id) => api.get(`/inspections/${id}`),
  create: (data) => api.post('/inspections', data),
  complete: (id, data) => api.put(`/inspections/${id}/complete`, data),
  delete: (id) => api.delete(`/inspections/${id}`)
};

export const financialAPI = {
  getAll: (params) => api.get('/financial', { params }),
  getSummary: (params) => api.get('/financial/summary', { params }),
  get: (id) => api.get(`/financial/${id}`),
  create: (data) => api.post('/financial', data),
  pay: (id, data) => api.put(`/financial/${id}/pay`, data),
  delete: (id) => api.delete(`/financial/${id}`)
};

export const statsAPI = {
  get: () => api.get('/stats')
};
