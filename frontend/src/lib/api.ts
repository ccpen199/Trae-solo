import axios, { type AxiosRequestConfig } from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

const api = {
  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return axiosInstance.get<T>(url, config) as unknown as Promise<T>;
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return axiosInstance.post<T>(url, data, config) as unknown as Promise<T>;
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return axiosInstance.put<T>(url, data, config) as unknown as Promise<T>;
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return axiosInstance.delete<T>(url, config) as unknown as Promise<T>;
  },
};

export default api;
