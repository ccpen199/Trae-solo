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
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  profile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

export const courseApi = {
  list: (params?: any) => api.get('/courses', { params }),
  detail: (id: number) => api.get(`/courses/${id}`),
  create: (data: any) => api.post('/courses', data),
  update: (id: number, data: any) => api.put(`/courses/${id}`, data),
  submitReview: (id: number) => api.post(`/courses/${id}/submit-review`),
};

export const materialApi = {
  list: (params?: any) => api.get('/materials', { params }),
  detail: (id: number) => api.get(`/materials/${id}`),
  create: (data: any) => api.post('/materials', data),
  update: (id: number, data: any) => api.put(`/materials/${id}`, data),
  authorize: (id: number, data: any) => api.post(`/materials/${id}/authorize`),
  expiringSoon: (days?: number) => api.get('/materials/expiring-soon', { params: { days } }),
};

export const lecturerApi = {
  list: (params?: any) => api.get('/lecturers', { params }),
  detail: (id: number) => api.get(`/lecturers/${id}`),
  create: (data: any) => api.post('/lecturers', data),
  update: (id: number, data: any) => api.put(`/lecturers/${id}`, data),
};

export const publicationApi = {
  list: (params?: any) => api.get('/publication', { params }),
  check: (courseId: number) => api.post(`/publication/check/${courseId}`),
  review: (courseId: number, data: any) => api.post(`/publication/review/${courseId}`),
  publish: (courseId: number) => api.post(`/publication/publish/${courseId}`),
};

export const piracyApi = {
  list: (params?: any) => api.get('/piracy', { params }),
  detail: (id: number) => api.get(`/piracy/${id}`),
  create: (data: any) => api.post('/piracy', data),
  update: (id: number, data: any) => api.put(`/piracy/${id}`, data),
  batchUpdate: (data: any) => api.post('/piracy/batch-update', data),
};

export const enforcementApi = {
  list: (params?: any) => api.get('/enforcement', { params }),
  detail: (id: number) => api.get(`/enforcement/${id}`),
  create: (data: any) => api.post('/enforcement', data),
  updateStatus: (id: number, data: any) => api.put(`/enforcement/${id}/status`, data),
  addAttachment: (id: number, data: any) => api.post(`/enforcement/${id}/attachments`, data),
};

export const reportApi = {
  overview: () => api.get('/reports/overview'),
  highRiskCourses: () => api.get('/reports/high-risk-courses'),
  piracyTrend: (days?: number) => api.get('/reports/piracy-trend', { params: { days } }),
  infringementStatistics: () => api.get('/reports/infringement-statistics'),
  processingEfficiency: () => api.get('/reports/processing-efficiency'),
  lossEstimation: () => api.get('/reports/loss-estimation'),
  authorizationExpiry: (days?: number) => api.get('/reports/authorization-expiry', { params: { days } }),
};

export const auditApi = {
  list: (params?: any) => api.get('/audit', { params }),
};

export default api;
