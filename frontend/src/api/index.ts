import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => client.get<any, T>(url, config),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => client.post<any, T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => client.put<any, T>(url, data, config),
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => client.delete<any, T>(url, config),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => client.patch<any, T>(url, data, config),
};

export default api;
