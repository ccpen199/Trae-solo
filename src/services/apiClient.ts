import axios from 'axios';
import type { ApiResponse } from '@/types/api';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;
    if (data.code === 0) {
      return data.data;
    }
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
