import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (url.includes('/auth/login')) {
        return Promise.reject(error);
      }
      if (!isRefreshing) {
        isRefreshing = true;
        const event = new CustomEvent('auth:unauthorized', {
          detail: { message: error.response.data?.error || '登录状态已失效，请重新登录' }
        });
        window.dispatchEvent(event);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => { isRefreshing = false; }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any> {
  data: T;
  code?: number;
  message?: string;
}

export default apiClient;
