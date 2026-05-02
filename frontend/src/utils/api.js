import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  getMe: () => api.get('/api/auth/me'),
  verifyIdentity: (data) => api.post('/api/auth/verify-identity', data)
};

export const contractApi = {
  upload: (formData, onUploadProgress) => 
    api.post('/api/contracts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    }),
  list: (params) => api.get('/api/contracts/list', { params }),
  get: (id) => api.get(`/api/contracts/${id}`),
  download: (id) => api.get(`/api/contracts/${id}/download`, { responseType: 'blob' }),
  getActivityLog: (id) => api.get(`/api/contracts/${id}/activity-log`)
};

export const signingApi = {
  verifyIdentity: (data) => api.post('/api/signing/verify-identity', data),
  sign: (data) => api.post('/api/signing/sign', data),
  getPending: () => api.get('/api/signing/my-pending')
};

export const legalApi = {
  listContracts: (params) => api.get('/api/legal/contracts', { params }),
  getTrajectory: (id) => api.get(`/api/legal/contracts/${id}/trajectory`),
  exportEvidence: (id, data) => api.post(`/api/legal/contracts/${id}/export-evidence`, data),
  audit: (id) => api.get(`/api/legal/contracts/${id}/audit`),
  getStatistics: () => api.get('/api/legal/statistics')
};

export const sealApi = {
  list: () => api.get('/api/seals/my-seals'),
  create: (data) => api.post('/api/seals/create', data),
  get: (id) => api.get(`/api/seals/${id}`),
  getImage: (id) => `/api/seals/${id}/image`,
  deactivate: (id) => api.post(`/api/seals/${id}/deactivate`),
  verifyAccess: (data) => api.post('/api/seals/verify-access', data)
};

export default api;
