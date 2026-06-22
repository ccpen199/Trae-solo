import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse } from '@shared/types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    if (response.data.code !== 0) {
      return Promise.reject(new Error(response.data.message || '请求失败'));
    }
    return response as unknown as Promise<AxiosResponse<ApiResponse<unknown>>>;
  },
  async (error) => {
    const config = error.config as AxiosRequestConfig & { retryCount?: number };
    
    if (config.url?.includes('/remote-record') && 
        error.response?.status === 503 && 
        (config.retryCount || 0) < 3) {
      config.retryCount = (config.retryCount || 0) + 1;
      await delay(2000 * config.retryCount);
      return request(config);
    }
    
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/auth';
    }
    
    return Promise.reject(error);
  }
);

export default request;
