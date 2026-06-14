import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: any) => {
    return response.data;
  },
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const httpGet = <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
  api.get(url, config) as any;

export const httpPost = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
  api.post(url, data, config) as any;

export const httpPut = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
  api.put(url, data, config) as any;

export const httpDelete = <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
  api.delete(url, config) as any;

export default api;
