// Axios HTTP 实例：统一 baseURL、请求/响应拦截器

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

class HttpClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = typeof window !== 'undefined'
          ? window.localStorage.getItem('user-store')
            ? (() => {
                try {
                  const raw = window.localStorage.getItem('user-store');
                  const parsed = raw ? JSON.parse(raw) : {};
                  return parsed.state?.token || null;
                } catch {
                  return null;
                }
              })()
            : null
          : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const payload = response.data as Partial<ApiResponse<unknown>>;
        if (typeof payload === 'object' && payload !== null && 'code' in payload) {
          if (payload.code === 0) {
            return {
              ...response,
              data: payload as ApiResponse<unknown>,
            } as AxiosResponse;
          }
          const err = new Error(payload.message || '请求失败');
          (err as unknown as { code?: number; raw?: unknown }).code = payload.code;
          (err as unknown as { code?: number; raw?: unknown }).raw = payload.data;
          return Promise.reject(err);
        }
        return response;
      },
      (error: AxiosError<ApiResponse<unknown>>) => {
        const data = error.response?.data;
        const message = data?.message || error.message || '网络异常';
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
        }
        const wrapped = new Error(message);
        (wrapped as unknown as { status?: number }).status = error.response?.status;
        return Promise.reject(wrapped);
      },
    );
  }

  private unwrap<T>(res: AxiosResponse<ApiResponse<T>>): AxiosResponse<T> {
    return {
      ...res,
      data: (res.data as ApiResponse<T>).data,
    } as AxiosResponse<T>;
  }

  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<ApiResponse<T>>(url, config).then((r) => this.unwrap<T>(r));
  }

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<ApiResponse<T>>(url, data, config).then((r) => this.unwrap<T>(r));
  }

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<ApiResponse<T>>(url, data, config).then((r) => this.unwrap<T>(r));
  }

  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch<ApiResponse<T>>(url, data, config).then((r) => this.unwrap<T>(r));
  }

  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<ApiResponse<T>>(url, config).then((r) => this.unwrap<T>(r));
  }

  raw(): AxiosInstance {
    return this.instance;
  }
}

export const http = new HttpClient();
export default http;
