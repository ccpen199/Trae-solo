import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
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
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

export const applicationApi = {
  getDashboardStats: () => api.get('/applications/dashboard-stats'),
  getApplications: () => api.get('/applications'),
  getApplication: (id) => api.get(`/applications/${id}`),
  createApplication: (data) => api.post('/applications', data),
  updateApplication: (id, data) => api.put(`/applications/${id}`, data),
  submitApplication: (id) => api.post(`/applications/${id}/submit`),
  assignApplication: (id, data) => api.post(`/applications/${id}/assign`, data),
  managerReview: (id, data) => api.post(`/applications/${id}/manager-review`, data),
  riskReview: (id, data) => api.post(`/applications/${id}/risk-review`, data),
  finalApproval: (id, data) => api.post(`/applications/${id}/final-approval`, data),
  confirmContract: (id) => api.post(`/applications/${id}/confirm-contract`),
  makePayment: (id, data) => api.post(`/applications/${id}/make-payment`, data),
};

export const usersApi = {
  getUsers: (role) => api.get('/users', { params: { role } }),
};

export const auditApi = {
  getLogs: (params) => api.get('/audit-logs', { params }),
};

export default api;
