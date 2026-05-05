import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const data: ApiResponse = response.data;
    if (data.success) {
      return response;
    }
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${currentPath}`;
      }
    }
    const message = error.response?.data?.message || error.message || '网络错误';
    return Promise.reject(new Error(message));
  }
);

export default api;
