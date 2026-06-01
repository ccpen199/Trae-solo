import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  username: string;
  real_name: string;
  role: string;
  security_level: number;
}

export interface Clue {
  id: number;
  clue_no: string;
  source_channel: string;
  title: string;
  description: string;
  involved_persons: string;
  location: string;
  occur_time: string;
  security_level: number;
  category: string;
  status: string;
  attachments: string;
  creator_id: number;
  creator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ClueDetail {
  clue: Clue;
  review?: any;
  dispatch?: any;
  feedback?: any;
}

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

export const clueApi = {
  getList: (params?: any) => api.get('/clues', { params }),
  getDetail: (id: number) => api.get(`/clues/${id}`),
  create: (data: any) => api.post('/clues', data),
  checkDuplicate: (params: any) => api.get('/clues/check-duplicate', { params }),
  review: (id: number, data: any) => api.post(`/clues/${id}/review`, data),
  dispatch: (id: number, data: any) => api.post(`/clues/${id}/dispatch`, data),
  feedback: (id: number, data: any) => api.post(`/clues/${id}/feedback`, data),
  getHistory: (id: number) => api.get(`/clues/${id}/history`)
};

export const statsApi = {
  getSummary: () => api.get('/stats/summary'),
  getByCategory: () => api.get('/stats/by-category'),
  getByStatus: () => api.get('/stats/by-status'),
  getBySource: () => api.get('/stats/by-source'),
  getTimeline: (days?: number) => api.get('/stats/timeline', { params: { days } }),
  getOverdueList: () => api.get('/stats/overdue-list'),
  getLogs: (params?: any) => api.get('/stats/logs', { params })
};

export default api;
