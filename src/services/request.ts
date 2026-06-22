import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { ApiResponse } from '@/types';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const request: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem('lc_auth');
      if (raw) {
        const auth = JSON.parse(raw);
        if (auth.token) {
          config.headers.Authorization = `Bearer ${auth.token}`;
        }
      }
    } catch {}
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    const { code, message: msg, data } = response.data;

    if (code === 200) {
      return data;
    }

    if (code === 401) {
      localStorage.removeItem('lc_auth');
      window.location.href = '/login';
      return Promise.reject(new Error('未授权，请重新登录'));
    }

    message.error(msg || '请求失败');
    return Promise.reject(new Error(msg || '请求失败'));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lc_auth');
      window.location.href = '/login';
    } else {
      message.error(error.message || '网络错误');
    }
    return Promise.reject(error);
  }
);

export function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.get(url, config);
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return request.post(url, data, config);
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return request.put(url, data, config);
}

export function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.delete(url, config);
}

export function postForm<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return request.post(url, data, {
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
