import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse } from '@shared/types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const client: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
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

client.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    if (response.data.code !== 0) {
      return Promise.reject(new Error(response.data.message || '请求失败'));
    }
    return response;
  },
  async (error) => {
    const config = error.config as AxiosRequestConfig & { retryCount?: number };
    
    if (config.url?.includes('/remote-record') && 
        error.response?.status === 503 && 
        (config.retryCount || 0) < 3) {
      config.retryCount = (config.retryCount || 0) + 1;
      await delay(2000 * config.retryCount);
      return client(config);
    }
    
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/auth';
    }
    
    return Promise.reject(error);
  }
);

const request = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    client.get<ApiResponse<T>>(url, config).then((response) => response.data),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    client.post<ApiResponse<T>>(url, data, config).then((response) => response.data),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    client.patch<ApiResponse<T>>(url, data, config).then((response) => response.data),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    client.put<ApiResponse<T>>(url, data, config).then((response) => response.data),
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    client.delete<ApiResponse<T>>(url, config).then((response) => response.data),
};

export default request;
