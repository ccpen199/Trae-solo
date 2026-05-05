import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
  timestamp: string;
}

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('erp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response;
    if (data.success) {
      return response;
    } else {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message || '请求失败'));
    }
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        window.location.href = '/login';
        message.error('登录已过期，请重新登录');
      } else if (status === 403) {
        message.error('没有权限访问');
      } else if (status === 404) {
        message.error('请求的资源不存在');
      } else if (status >= 500) {
        message.error('服务器错误');
      } else if (data?.message) {
        message.error(data.message);
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await request.get<ApiResponse<T>>(url, config);
  return response.data.data as T;
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await request.post<ApiResponse<T>>(url, data, config);
  return response.data.data as T;
}

export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await request.put<ApiResponse<T>>(url, data, config);
  return response.data.data as T;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await request.delete<ApiResponse<T>>(url, config);
  return response.data.data as T;
}

export default request;
