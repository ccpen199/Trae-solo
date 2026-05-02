import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { ApiResponse } from '@/types';

const API_BASE_URL = '/api/v1';

let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('token');
  }
  return authToken;
};

export const clearAuthToken = (): void => {
  authToken = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;
    if (data.success === false) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const messageText = error.response?.data?.message || error.message;

    if (status === 401) {
      clearAuthToken();
      message.error('登录已过期，请重新登录');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (status === 403) {
      message.error('权限不足');
      return Promise.reject(error);
    }

    if (status === 404) {
      message.error('资源不存在');
      return Promise.reject(error);
    }

    if (status === 400) {
      message.error(messageText || '请求参数错误');
      return Promise.reject(error);
    }

    if (status === 500) {
      message.error('服务器错误，请稍后重试');
      return Promise.reject(error);
    }

    if (!status) {
      message.error('网络错误，请检查网络连接');
      return Promise.reject(error);
    }

    message.error(messageText || '请求失败');
    return Promise.reject(error);
  }
);

export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.get<ApiResponse<T>>(url, config);
  return response.data.data as T;
};

export const apiPost = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.post<ApiResponse<T>>(url, data, config);
  return response.data.data as T;
};

export const apiPut = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.put<ApiResponse<T>>(url, data, config);
  return response.data.data as T;
};

export const apiDelete = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.delete<ApiResponse<T>>(url, config);
  return response.data.data as T;
};

export default api;
