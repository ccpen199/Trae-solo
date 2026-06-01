import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
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
  getMe: () => api.get('/auth/me')
};

export const clientApi = {
  list: () => api.get('/clients'),
  get: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data)
};

export const projectApi = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  dashboard: (id) => api.get(`/projects/${id}/dashboard`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data)
};

export const positionApi = {
  list: (params) => api.get('/positions', { params }),
  get: (id) => api.get(`/positions/${id}`),
  create: (data) => api.post('/positions', data),
  update: (id, data) => api.put(`/positions/${id}`, data),
  updateStatus: (id, status) => api.patch(`/positions/${id}/status`, { status })
};

export const candidateApi = {
  list: () => api.get('/candidates'),
  get: (id) => api.get(`/candidates/${id}`),
  create: (data) => api.post('/candidates', data),
  getFunnel: (params) => api.get('/candidates/applications/funnel', { params }),
  getApplications: (positionId) => api.get(`/candidates/applications/${positionId}`),
  createApplication: (data) => api.post('/candidates/applications', data),
  updateStage: (id, data) => api.post(`/candidates/applications/${id}/stage`, data),
  eliminate: (id, data) => api.post(`/candidates/applications/${id}/eliminate`, data)
};

export const slaApi = {
  getMetrics: (params) => api.get('/sla/metrics', { params }),
  getWarnings: () => api.get('/sla/warnings'),
  getRecords: (params) => api.get('/sla/records', { params }),
  createConfig: (data) => api.post('/sla/configs', data),
  updateDelayReason: (id, reason) => api.patch(`/sla/records/${id}/delay`, { delay_reason: reason })
};

export default api;
