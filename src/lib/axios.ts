import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('wenlv_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload?.data?.list && !payload.data.items) {
      payload.data.items = payload.data.list;
      payload.data.totalPages = Math.max(
        1,
        Math.ceil((payload.data.total || 0) / (payload.data.pageSize || 10))
      );
    }
    console.log(`[API] ${response.status} ${response.config.url}`, payload);
    return payload;
  },
  (error) => {
    console.error('[API] Error:', error.message, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('wenlv_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      '请求失败';
    const enhancedError = new Error(message) as Error & {
      response?: any;
      code?: number;
      status?: number;
    };
    enhancedError.response = error.response;
    enhancedError.code = error.response?.data?.code;
    enhancedError.status = error.response?.status;
    return Promise.reject(enhancedError);
  },
);

export default api;

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PageParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}
