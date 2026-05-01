import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const contentApi = {
  getList: (params?: any) => api.get('/contents', { params }),
  getById: (id: string) => api.get(`/contents/${id}`),
  create: (data: any) => api.post('/contents', data),
  update: (id: string, data: any) => api.put(`/contents/${id}`, data),
  delete: (id: string) => api.delete(`/contents/${id}`),
  updateStatus: (id: string, status: string) =>
    api.put(`/contents/${id}/status`, { status }),
  getVersions: (id: string) => api.get(`/contents/${id}/versions`),
  compareVersions: (id: string, v1: number, v2: number) =>
    api.get(`/contents/${id}/compare/${v1}/${v2}`),
  getCategories: () => api.get('/contents/categories'),
};

export const mediaApi = {
  getList: (params?: any) => api.get('/media', { params }),
  getById: (id: string) => api.get(`/media/${id}`),
  getUrl: (id: string) => api.get(`/media/${id}/url`),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: string) => api.delete(`/media/${id}`),
};

export const workflowApi = {
  start: (contentId: string) => api.post('/workflow/start', { contentId }),
  getActive: (contentId: string) => api.get(`/workflow/active/${contentId}`),
  getHistory: (contentId: string) => api.get(`/workflow/history/${contentId}`),
  getPending: () => api.get('/workflow/pending'),
  processReview: (stepId: string, data: any) =>
    api.put(`/workflow/review/${stepId}`, data),
  getReviewHistory: (contentId: string) =>
    api.get(`/workflow/reviews/${contentId}`),
};

export const distributionApi = {
  getList: (params?: any) => api.get('/distribution', { params }),
  create: (data: any) => api.post('/distribution', data),
  schedule: (data: any) => api.post('/distribution/schedule', data),
  getByContent: (contentId: string) => api.get(`/distribution/content/${contentId}`),
  getStats: (contentId: string) => api.get(`/distribution/stats/${contentId}`),
  retry: (id: string, reason?: string) =>
    api.put(`/distribution/${id}/retry`, { reason }),
};

export const analyticsApi = {
  getDashboard: (days?: number) =>
    api.get('/analytics/dashboard', { params: { days } }),
  getContentMetrics: (contentId: string, params?: any) =>
    api.get(`/analytics/content/${contentId}`, { params }),
  getReport: (params?: any) => api.get('/analytics/report', { params }),
};

export const auditApi = {
  getLogs: (params?: any) => api.get('/audit/logs', { params }),
  getLogById: (id: string) => api.get(`/audit/logs/${id}`),
  getContentAudit: (contentId: string) =>
    api.get(`/audit/logs/content/${contentId}`),
  getMyActivity: (params?: any) => api.get('/audit/logs/my-activity', { params }),
  getSensitiveWords: (params?: any) =>
    api.get('/audit/sensitive-words', { params }),
  checkSensitive: (data: any) => api.post('/audit/check-sensitive', data),
  getStatistics: (params?: any) =>
    api.get('/audit/statistics', { params }),
};

export const userApi = {
  getList: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (data: any) => api.put('/users/change-password', data),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};
