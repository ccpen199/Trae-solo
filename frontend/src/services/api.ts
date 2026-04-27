import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

const API_BASE_URL = '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const data = response.data;
    if (data.success) {
      return response;
    } else {
      return Promise.reject(new Error(data.message || '请求失败'));
    }
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.get(url, config).then((res) => res.data);
  },
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.post(url, data, config).then((res) => res.data);
  },
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.put(url, data, config).then((res) => res.data);
  },
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.delete(url, config).then((res) => res.data);
  },
};

export default api;
