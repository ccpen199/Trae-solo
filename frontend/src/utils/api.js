import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
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
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
};

export const familyApi = {
  list: () => api.get('/family-profiles'),
  get: (id) => api.get(`/family-profiles/${id}`),
  create: (data) => api.post('/family-profiles', data),
  update: (id, data) => api.put(`/family-profiles/${id}`, data),
  delete: (id) => api.delete(`/family-profiles/${id}`),
};

export const assessmentApi = {
  list: () => api.get('/assessments'),
  create: (data) => api.post('/assessments', data),
  update: (id, data) => api.put(`/assessments/${id}`, data),
};

export const planApi = {
  list: () => api.get('/consultation-plans'),
  create: (data) => api.post('/consultation-plans', data),
  update: (id, data) => api.put(`/consultation-plans/${id}`, data),
};

export const followUpApi = {
  list: () => api.get('/follow-up-records'),
  create: (data) => api.post('/follow-up-records', data),
};

export const reportApi = {
  summary: () => api.get('/reports/summary'),
  workload: () => api.get('/reports/workload'),
  renewals: () => api.get('/reports/renewals'),
  satisfaction: () => api.get('/reports/satisfaction'),
};

export const userApi = {
  list: () => api.get('/users'),
};

export default api;
