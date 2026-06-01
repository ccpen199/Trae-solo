import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const clientAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
};

export const documentAPI = {
  getAll: (params) => api.get('/documents', { params }),
  create: (data) => api.post('/documents', data),
  updateStatus: (id, status) => api.put(`/documents/${id}/status`, { status }),
  getMissing: () => api.get('/documents/missing'),
  checkMissing: (month) => api.post('/documents/check-missing', { month }),
};

export const accountingAPI = {
  getAll: (params) => api.get('/accounting', { params }),
  create: (data) => api.post('/accounting', data),
  updateStatus: (id, status, reviewNotes) => api.put(`/accounting/${id}/status`, { status, reviewNotes }),
};

export const taxAPI = {
  getAll: (params) => api.get('/tax-declarations', { params }),
  create: (data) => api.post('/tax-declarations', data),
  updateStatus: (id, status, taxAmount, declarationDate, reviewNotes) => api.put(`/tax-declarations/${id}/status`, { status, taxAmount, declarationDate, reviewNotes }),
};

export const reportAPI = {
  getAll: (params) => api.get('/monthly-reports', { params }),
  create: (data) => api.post('/monthly-reports', data),
  update: (id, data) => api.put(`/monthly-reports/${id}`, data),
};

export const renewalAPI = {
  getAll: (params) => api.get('/renewals', { params }),
  create: (data) => api.post('/renewals', data),
  update: (id, data) => api.put(`/renewals/${id}`, data),
};

export const todoAPI = {
  getAll: (params) => api.get('/todos', { params }),
  create: (data) => api.post('/todos', data),
  updateStatus: (id, status) => api.put(`/todos/${id}/status`, { status }),
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
