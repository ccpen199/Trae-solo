import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { message } from 'antd';

interface ApiResp<T = any> {
  code: number;
  message: string;
  data?: T;
}

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

instance.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = localStorage.getItem('admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (res) => {
    const data = res.data as ApiResp;
    if (data && typeof data === 'object' && 'code' in data) {
      if (data.code === 0) {
        return Promise.resolve(data);
      }
      if (data.code === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        if (!location.pathname.includes('/login')) {
          message.warning('登录已过期，请重新登录');
          setTimeout(() => location.href = '/login', 800);
        }
        return Promise.reject(data);
      }
      message.error(data.message || '操作失败');
      return Promise.reject(data);
    }
    return Promise.resolve(res);
  },
  (err) => {
    const info = err.response?.data?.message || err.message || '网络错误';
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      if (!location.pathname.includes('/login')) {
        setTimeout(() => location.href = '/login', 500);
      }
    } else {
      message.error(info);
    }
    return Promise.reject(err);
  }
);

export const http = {
  get: async <T = any>(url: string, params?: any) => {
    const r = await instance.get<any, ApiResp<T>>(url, { params });
    return r.data as T;
  },
  post: async <T = any>(url: string, data?: any) => {
    const r = await instance.post<any, ApiResp<T>>(url, data);
    return r.data as T;
  },
  put: async <T = any>(url: string, data?: any) => {
    const r = await instance.put<any, ApiResp<T>>(url, data);
    return r.data as T;
  },
  delete: async <T = any>(url: string) => {
    const r = await instance.delete<any, ApiResp<T>>(url);
    return r.data as T;
  }
};

export default instance;
