import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  (error) => {
    const response = error.response;
    
    if (response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export async function request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  try {
    const response = await instance.request<ApiResponse<T>>(config);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: ApiResponse<T> } };
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }
    return {
      success: false,
      message: '网络错误，请稍后重试',
    } as ApiResponse<T>;
  }
}

export function get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
  return request<T>({
    method: 'GET',
    url,
    params,
  });
}

export function post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  return request<T>({
    method: 'POST',
    url,
    data,
  });
}

export function put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  return request<T>({
    method: 'PUT',
    url,
    data,
  });
}

export function del<T>(url: string): Promise<ApiResponse<T>> {
  return request<T>({
    method: 'DELETE',
    url,
  });
}
