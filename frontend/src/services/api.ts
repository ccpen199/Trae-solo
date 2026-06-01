import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getProfile: () => api.get('/auth/profile'),
  getUsers: () => api.get('/auth/users'),
};

export const taskAPI = {
  getTasks: (params?: any) => api.get('/tasks', { params }),
  getTask: (id: string) => api.get(`/tasks/${id}`),
  createTask: (data: any) => api.post('/tasks', data),
  initDemoData: () => api.post('/tasks/init-demo-data'),
  assignTask: (id: string, handler_id: string, reason?: string) =>
    api.put(`/tasks/${id}/assign`, { handler_id, reason }),
  updateStatus: (id: string, status: string) =>
    api.put(`/tasks/${id}/status`, { status }),
  updateOverdue: (id: string, is_overdue: boolean, overdue_reason?: string) =>
    api.put(`/tasks/${id}/overdue`, { is_overdue, overdue_reason }),
  getTransferLogs: (id: string) => api.get(`/tasks/${id}/transfer-logs`),
  getStatistics: () => api.get('/tasks/statistics/summary'),
};

export const photoAPI = {
  getPhotos: (taskId: string) => api.get(`/photos/${taskId}`),
  uploadPhotos: (taskId: string, formData: FormData) =>
    api.post(`/photos/${taskId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  retakePhoto: (taskId: string, photoId: string, formData: FormData) =>
    api.post(`/photos/${taskId}/retake/${photoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  checkRequired: (taskId: string) => api.get(`/photos/${taskId}/required-check`),
  deletePhoto: (photoId: string) => api.delete(`/photos/${photoId}`),
};

export const lossAPI = {
  getParts: () => api.get('/loss/parts'),
  getPrice: (partCode: string) => api.get(`/loss/price/${partCode}`),
  getLossItems: (taskId: string, version?: number) =>
    api.get(`/loss/${taskId}`, { params: { version } }),
  getVersions: (taskId: string) => api.get(`/loss/${taskId}/versions`),
  createLossItems: (taskId: string, items: any[]) =>
    api.post(`/loss/${taskId}`, { items }),
  updateLossItem: (itemId: string, data: any) =>
    api.put(`/loss/${itemId}`, data),
  deleteLossItem: (itemId: string) => api.delete(`/loss/${itemId}`),
};

export const reviewAPI = {
  getReviewData: (taskId: string) => api.get(`/review/${taskId}`),
  submitReview: (taskId: string, data: any) =>
    api.post(`/review/${taskId}`, data),
  getReviewLogs: (taskId: string) => api.get(`/review/${taskId}/logs`),
  getQueueStats: () => api.get('/review/statistics/queue'),
};

export default api;
