import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    const message = error.response?.data?.message || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any, avatarFile?: File) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
      }
    });
    if (avatarFile) formData.append('avatar', avatarFile);
    return api.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  changePassword: (data: any) => api.put('/auth/password', data)
};

export const diaryApi = {
  getList: (params?: any) => api.get('/diaries', { params }),
  getMine: () => api.get('/diaries/mine'),
  getById: (id: string) => api.get(`/diaries/${id}`),
  create: (formData: FormData) =>
    api.post('/diaries', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, formData: FormData) =>
    api.put(`/diaries/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  toggleLike: (id: string) => api.post(`/diaries/${id}/like`),
  addComment: (id: string, content: string) => api.post(`/diaries/${id}/comments`, { content }),
  addBudgetItem: (id: string, item: any) => api.post(`/diaries/${id}/budget-items`, item)
};

export const designerApi = {
  apply: (formData: FormData) =>
    api.post('/designers/apply', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProfile: (formData: FormData) =>
    api.put('/designers/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getList: (params?: any) => api.get('/designers', { params }),
  getById: (id: string) => api.get(`/designers/${id}`),
  matchForDiary: (diaryId: string) => api.get(`/designers/match/${diaryId}`),
  review: (id: string, rating: number, review?: string) =>
    api.post(`/designers/${id}/review`, { rating, review })
};

export const aiApi = {
  analyzeImage: (imageFile: File) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/ai/analyze-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  analyzeDiary: (diaryId: string) => api.post(`/ai/analyze-diary/${diaryId}`),
  getInspirationGraph: (params?: any) => api.get('/ai/inspiration-graph', { params })
};

export const transactionApi = {
  create: (data: any) => api.post('/transactions', data),
  getList: (params?: any) => api.get('/transactions', { params }),
  getById: (id: string) => api.get(`/transactions/${id}`),
  payDeposit: (id: string) => api.post(`/transactions/${id}/pay-deposit`),
  requestStage: (id: string, data: any) => api.post(`/transactions/${id}/request-stage`, data),
  confirmStage: (id: string, formData: FormData) =>
    api.post(`/transactions/${id}/confirm-stage`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  raiseDispute: (id: string, reason: string) => api.post(`/transactions/${id}/dispute`, { reason })
};

export const moderationApi = {
  checkContent: (content: string, contentType = 'comment') =>
    api.post('/moderation/check-content', { content, contentType }),
  submitReport: (formData: FormData) =>
    api.post('/moderation/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyReports: () => api.get('/moderation/reports'),
  getModerationReports: (params?: any) => api.get('/moderation/reports/moderation', { params }),
  processReport: (id: string, data: any) => api.put(`/moderation/reports/${id}/process`, data),
  getFilterStats: () => api.get('/moderation/filter-stats')
};

export default api;
