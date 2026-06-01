import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const leadersAPI = {
  list: (params) => api.get('/leaders', { params }),
  get: (id) => api.get(`/leaders/${id}`),
  create: (data) => api.post('/leaders', data),
  update: (id, data) => api.put(`/leaders/${id}`, data),
  delete: (id) => api.delete(`/leaders/${id}`)
};

export const activitiesAPI = {
  list: (params) => api.get('/activities', { params }),
  get: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  delete: (id) => api.delete(`/activities/${id}`)
};

export const ordersAPI = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  pickupList: (params) => api.get('/orders/pickup/list', { params }),
  confirmPickup: (id, data) => api.put(`/orders/${id}/pickup`, data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status })
};

export const commissionsAPI = {
  list: (params) => api.get('/commissions', { params }),
  summary: (params) => api.get('/commissions/summary', { params }),
  approve: (id, data) => api.post(`/commissions/${id}/approve`, data),
  adjust: (id, data) => api.post(`/commissions/${id}/adjust`, data),
  pay: (id) => api.post(`/commissions/${id}/pay`)
};

export const afterSalesAPI = {
  list: (params) => api.get('/aftersales', { params }),
  create: (data) => api.post('/aftersales', data),
  handle: (id, data) => api.put(`/aftersales/${id}/handle`, data)
};

export default api;
