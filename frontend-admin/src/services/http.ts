import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/store/authStore';

const http: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use(
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

http.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message: msg, data } = response.data;
    if (code === 200 || code === 201) {
      return data;
    }
    message.error(msg || '请求失败');
    return Promise.reject(new Error(msg || '请求失败'));
  },
  (error) => {
    const { response } = error;
    if (response?.status === 401) {
      useAuthStore.getState().logout();
      message.error('登录已过期，请重新登录');
      window.location.href = '/login';
    } else if (response?.status === 403) {
      message.error('没有权限执行此操作');
    } else if (response?.status >= 500) {
      message.error('服务器错误，请稍后重试');
    } else {
      message.error(error.message || '网络错误');
    }
    return Promise.reject(error);
  }
);

export const get = <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return http.get(url, config);
};

export const post = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  return http.post(url, data, config);
};

export const put = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  return http.put(url, data, config);
};

export const del = <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return http.delete(url, config);
};

export default http;
