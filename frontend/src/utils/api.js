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
  (error) => Promise.reject(error)
);

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

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  getCurrent: () => api.get('/auth/current')
};

export const bidsApi = {
  getList: (params) => api.get('/bids', { params }),
  getDetail: (id) => api.get(`/bids/${id}`),
  create: (data) => api.post('/bids', data),
  update: (id, data) => api.put(`/bids/${id}`, data),
  upload: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/bids/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  parse: (id, data) => api.post(`/bids/${id}/parse`, data),
  match: (id, data) => api.post(`/bids/${id}/match`, data),
  generate: (id, data) => api.post(`/bids/${id}/generate`, data),
  review: (id, data) => api.post(`/bids/${id}/review`, data),
  export: (id) => api.post(`/bids/${id}/export`)
};

export const ledgerApi = {
  getList: (params) => api.get('/ledger', { params }),
  getDetail: (id) => api.get(`/ledger/${id}`),
  getStats: (params) => api.get('/ledger/stats/summary', { params })
};

export const qualificationsApi = {
  getList: (params) => api.get('/qualifications', { params }),
  getDetail: (id) => api.get(`/qualifications/${id}`),
  create: (data) => api.post('/qualifications', data),
  update: (id, data) => api.put(`/qualifications/${id}`, data)
};

export const exceptionsApi = {
  getList: (params) => api.get('/exceptions', { params }),
  getDetail: (id) => api.get(`/exceptions/${id}`),
  resolve: (id, data) => api.put(`/exceptions/${id}/resolve`, data),
  getStats: () => api.get('/exceptions/stats/summary')
};

export const usersApi = {
  getList: () => api.get('/users'),
  getRoles: () => api.get('/users/roles')
};

export default api;
