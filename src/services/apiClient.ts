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
    if (error.response?.data) {
      const errData = error.response.data as ApiResponse;
      if (errData.message) {
        return Promise.reject(new Error(errData.message));
      }
    }
    if (error.message) {
      return Promise.reject(error);
    }
    return Promise.reject(new Error('网络请求失败，请检查网络连接'));
  }
);

export default apiClient;
