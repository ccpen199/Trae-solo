import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
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
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = unknown> {
  code?: number;
  success?: boolean;
  message?: string;
  error?: string;
  data: T;
}

export const apiRequest = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.get(url, config),
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.post(url, data, config),
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.put(url, data, config),
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.delete(url, config),
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.patch(url, data, config),
};

export default api;
