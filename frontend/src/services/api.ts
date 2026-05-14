import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';

const TIMEOUT = 10000;
const RETRY_COUNT = 1;

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: TIMEOUT,
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
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (!originalRequest._retry && RETRY_COUNT > 0) {
      originalRequest._retry = true;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export const handleApiError = (error: any): string => {
  if (error.response) {
    return error.response.data?.message || '请求失败';
  } else if (error.request) {
    return '网络连接失败，请检查网络';
  }
  return error.message || '未知错误';
};

export default api;
