import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../../shared/types';
import { useAuthStore } from '../store/auth';

const API_BASE_URL = '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const response = await api.request<ApiResponse<T>>(config);
  return response.data;
}

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
  return request<T>({ method: 'GET', url, params });
}

export async function post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  return request<T>({ method: 'POST', url, data });
}

export async function put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  return request<T>({ method: 'PUT', url, data });
}

export async function del<T>(url: string): Promise<ApiResponse<T>> {
  return request<T>({ method: 'DELETE', url });
}

export * from './modules/auth';
export * from './modules/dashboard';
export * from './modules/people';
export * from './modules/goods';
export * from './modules/field';
export * from './modules/compliance';
export * from './modules/training';
export * from './modules/analytics';
