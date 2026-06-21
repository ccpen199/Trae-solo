import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface ApiError {
  code: number;
  message: string;
  details?: unknown;
}

class ApiClient {
  private instance: AxiosInstance;
  private baseURL = '/api';

  constructor() {
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const res = response.data;
        if (res.code === 0 || res.code === 200) {
          return response;
        }
        return Promise.reject({
          code: res.code,
          message: res.message || '请求失败',
          details: res.data,
        } as ApiError);
      },
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.message || this.getErrorMessage(status);

          if (status === 401) {
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }

          return Promise.reject({
            code: status,
            message,
            details: error.response.data,
          } as ApiError);
        }

        if (error.request) {
          return Promise.reject({
            code: 0,
            message: '网络连接失败，请检查网络',
            details: null,
          } as ApiError);
        }

        return Promise.reject({
          code: -1,
          message: error.message || '请求出错',
          details: null,
        } as ApiError);
      },
    );
  }

  private getErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: '请求参数错误',
      401: '登录已过期，请重新登录',
      403: '没有权限访问',
      404: '请求的资源不存在',
      405: '请求方法不允许',
      408: '请求超时',
      422: '请求数据验证失败',
      429: '请求过于频繁，请稍后再试',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务暂时不可用',
      504: '网关超时',
    };
    return messages[status] || `请求失败 (${status})`;
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  async upload<T = unknown>(url: string, file: File, formData?: Record<string, string>, onProgress?: (progress: number) => void): Promise<T> {
    const data = new FormData();
    data.append('file', file);
    if (formData) {
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
    }

    const response = await this.instance.post<ApiResponse<T>>(url, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data.data;
  }
}

export const api = new ApiClient();

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}
