import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth';
import { message } from 'antd';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      const authStore = useAuthStore.getState();
      if (authStore.isAuthenticated) {
        message.error('登录已过期，请重新登录');
        authStore.logout();
      }
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      message.error('权限不足，无法访问该资源');
      return Promise.reject(error);
    }

    if (error.response?.status === 404) {
      message.error('请求的资源不存在');
      return Promise.reject(error);
    }

    if (error.response?.status === 500) {
      message.error('服务器内部错误，请稍后重试');
      return Promise.reject(error);
    }

    const errorMessage =
      (error.response?.data as any)?.message ||
      error.message ||
      '请求失败，请稍后重试';
    if (![401, 403, 404, 500].includes(error.response?.status || 0)) {
      message.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export const get = <T>(url: string, params?: object): Promise<T> => {
  return api.get<T>(url, { params }).then((res) => res.data);
};

export const post = <T>(url: string, data?: object): Promise<T> => {
  return api.post<T>(url, data).then((res) => res.data);
};

export const put = <T>(url: string, data?: object): Promise<T> => {
  return api.put<T>(url, data).then((res) => res.data);
};

export const del = <T>(url: string): Promise<T> => {
  return api.delete<T>(url).then((res) => res.data);
};

export const patch = <T>(url: string, data?: object): Promise<T> => {
  return api.patch<T>(url, data).then((res) => res.data);
};
