import axios from 'axios';
import type { ApiResponse } from '@/types';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Request-Id'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response) => {
    const data: ApiResponse = response.data;
    if (data.code === 0 || data.code === 200) {
      return data.data;
    }
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default request;
