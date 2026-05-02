import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  getRoles: () => api.get('/auth/roles')
};

export const orderApi = {
  create: (data) => api.post('/orders', data),
  list: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  uploadImage: (orderId, formData) => api.post(`/orders/${orderId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addLayer: (orderId, data) => api.post(`/orders/${orderId}/layers`, data),
  updateLayer: (orderId, layerId, data) => api.put(`/orders/${orderId}/layers/${layerId}`, data),
  applyTemplate: (orderId, data) => api.post(`/orders/${orderId}/templates`, data),
  reviewTemplate: (orderId, data) => api.post(`/orders/${orderId}/review`, data),
  exportImage: (orderId, data) => api.post(`/orders/${orderId}/export`, data),
  getTodoCount: () => api.get('/orders/todos'),
  getStatuses: () => api.get('/orders/statuses'),
  getStatistics: () => api.get('/orders/statistics')
};

export const templateApi = {
  list: (params) => api.get('/templates', { params }),
  getById: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  lock: (id) => api.post(`/templates/${id}/lock`),
  unlock: (id) => api.post(`/templates/${id}/unlock`),
  getCategories: () => api.get('/templates/categories')
};

export const reverseApi = {
  create: (data) => api.post('/reverse', data),
  list: (params) => api.get('/reverse', { params }),
  updateStatus: (id, data) => api.put(`/reverse/${id}/status`, data),
  validate: (orderId) => api.get(`/reverse/validate/${orderId}`),
  getTypes: () => api.get('/reverse/types'),
  getTransitions: (params) => api.get('/reverse/transitions', { params })
};

export default api;
