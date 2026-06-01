import axios from 'axios';
import { useAuthStore } from '../store';

const API_BASE_URL = 'http://localhost:45846/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

export const dailyAPI = {
  getToday: () => api.get('/daily/today'),
  like: (id) => api.post(`/daily/${id}/like`),
  share: (id) => api.post(`/daily/${id}/share`)
};

export const focusAPI = {
  start: (data) => api.post('/focus/start', data),
  complete: (id) => api.post(`/focus/${id}/complete`),
  getHistory: () => api.get('/focus/history'),
  getStats: () => api.get('/focus/stats')
};

export const sleepAPI = {
  getSounds: () => api.get('/sleep/sounds'),
  start: (data) => api.post('/sleep/start', data),
  complete: (id) => api.post(`/sleep/${id}/complete`),
  getHistory: () => api.get('/sleep/history')
};

export const breathAPI = {
  getSounds: () => api.get('/breath/sounds'),
  start: (data) => api.post('/breath/start', data),
  getHistory: () => api.get('/breath/history')
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

export default api;
