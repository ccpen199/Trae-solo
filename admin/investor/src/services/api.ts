import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

const service: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('investor_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;
    if (res.code !== 200 && res.code !== 0) {
      message.error(res.message || '请求失败');
      if (res.code === 401) {
        localStorage.removeItem('investor_token');
        window.location.href = '/login';
      }
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res.data !== undefined ? res.data : res;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('investor_token');
          window.location.href = '/login';
          break;
        case 403:
          message.error('没有权限访问该资源');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(error.response.data?.message || '请求失败');
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error('请求配置错误');
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export const request = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    service.get(url, config),
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    service.post(url, data, config),
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    service.put(url, data, config),
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    service.delete(url, config),
};

export default service;
