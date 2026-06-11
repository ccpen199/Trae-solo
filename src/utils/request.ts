import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { storage } from './storage';
import { message } from './message';
import { ApiResponse } from '../../shared/types';

const baseURL = '/api';

const request: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface BusinessError extends Error {
  isBusinessError?: boolean;
  code?: number;
  serverMessage?: string;
}

interface ServerErrorResponse {
  code?: number;
  message?: string;
  data?: unknown;
  timestamp?: number;
}

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const res = response.data;
    if (res.code === 200) {
      return res as unknown as AxiosResponse;
    }
    const errMsg = res.message || '请求失败';
    const err = new Error(errMsg) as BusinessError;
    err.isBusinessError = true;
    err.code = res.code;
    err.serverMessage = errMsg;
    return Promise.reject(err);
  },
  (error) => {
    const businessErr = new Error() as BusinessError;

    if (error.response) {
      const { status, data } = error.response;
      const serverMsg = (data as ServerErrorResponse)?.message || '';
      businessErr.serverMessage = serverMsg;

      switch (status) {
        case 400:
          businessErr.message = serverMsg || '请求参数错误';
          break;
        case 401:
          businessErr.message = serverMsg || '账号或密码错误';
          if (!error.config?.url?.includes('/auth/')) {
            storage.clearToken();
            storage.clearUser();
            window.location.href = '/login';
          }
          break;
        case 403:
          businessErr.message = serverMsg || '角色不匹配或无权限访问';
          break;
        case 404:
          businessErr.message = serverMsg || '请求的资源不存在';
          break;
        case 500:
          businessErr.message = '服务器异常，请稍后重试';
          break;
        default:
          businessErr.message = serverMsg || '请求失败';
      }
      businessErr.code = status;
    } else if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
      businessErr.message = '请求超时，请检查网络后重试';
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      businessErr.message = '网络连接失败，请检查网络或联系管理员';
    } else {
      businessErr.message = error.message || '未知错误';
    }

    return Promise.reject(businessErr);
  }
);

export const http = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    request.get<unknown, T>(url, config),
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    request.post<unknown, T>(url, data, config),
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    request.put<unknown, T>(url, data, config),
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    request.delete<unknown, T>(url, config),
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    request.patch<unknown, T>(url, data, config),
};

export default request;
