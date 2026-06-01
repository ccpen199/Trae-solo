import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';
import type {
  Application,
  Environment,
  AppVersion,
  SecretKey,
  ScanTask,
  Vulnerability,
  Alert,
  ChangeOrder,
} from '../types';

const API_BASE_URL = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_BASE_URL || 'http://127.0.0.1:53391';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
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

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.get(url, config),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.post(url, data, config),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.put(url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.delete(url, config),
};

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
};

export const applicationApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/applications', { params }),
  create: (data: Partial<Application>) =>
    api.post('/api/applications', data),
  get: (id: number) => api.get(`/api/applications/${id}`),
  update: (id: number, data: Partial<Application>) =>
    api.put(`/api/applications/${id}`, data),
  delete: (id: number) => api.delete(`/api/applications/${id}`),
  getTimeline: (id: number) => api.get(`/api/applications/${id}/timeline`),
  getEnvironments: (id: number) => api.get(`/api/applications/${id}/environments`),
  createEnvironment: (id: number, data: Partial<Environment>) =>
    api.post(`/api/applications/${id}/environments`, data),
  getVersions: (id: number) => api.get(`/api/applications/${id}/versions`),
  createVersion: (id: number, data: Partial<AppVersion>) =>
    api.post(`/api/applications/${id}/versions`, data),
  getSecrets: (id: number) => api.get(`/api/applications/${id}/secrets`),
  createSecret: (id: number, data: Partial<SecretKey>) =>
    api.post(`/api/applications/${id}/secrets`, data),
};

export const environmentApi = {
  update: (id: number, data: Partial<Environment>) =>
    api.put(`/api/environments/${id}`, data),
  delete: (id: number) => api.delete(`/api/environments/${id}`),
};

export const secretApi = {
  update: (id: number, data: Partial<SecretKey>) =>
    api.put(`/api/secrets/${id}`, data),
  delete: (id: number) => api.delete(`/api/secrets/${id}`),
};

export const taskApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/tasks', { params }),
  create: (data: Partial<ScanTask>) =>
    api.post('/api/tasks', data),
  get: (id: number) => api.get(`/api/tasks/${id}`),
  execute: (id: number) => api.post(`/api/tasks/${id}/execute`),
  getVulnerabilities: (id: number) => api.get(`/api/tasks/${id}/vulnerabilities`),
};

export const vulnerabilityApi = {
  update: (id: number, data: Partial<Vulnerability>) =>
    api.put(`/api/vulnerabilities/${id}`, data),
};

export const alertApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/alerts', { params }),
  get: (id: number) => api.get(`/api/alerts/${id}`),
  update: (id: number, data: Partial<Alert>) =>
    api.put(`/api/alerts/${id}`, data),
  batchProcess: (data: { ids: number[]; action: string; remark?: string }) =>
    api.post('/api/alerts/batch-process', data),
};

export const changeApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/changes', { params }),
  create: (data: Partial<ChangeOrder>) =>
    api.post('/api/changes', data),
  get: (id: number) => api.get(`/api/changes/${id}`),
  update: (id: number, data: Partial<ChangeOrder>) =>
    api.put(`/api/changes/${id}`, data),
  approve: (id: number) => api.post(`/api/changes/${id}/approve`),
  reject: (id: number) => api.post(`/api/changes/${id}/reject`),
  execute: (id: number) => api.post(`/api/changes/${id}/execute`),
  rollback: (id: number) => api.post(`/api/changes/${id}/rollback`),
};

export const logApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/logs', { params }),
};

export const auditApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/audit', { params }),
};

export const statsApi = {
  dashboard: () => api.get('/api/stats/dashboard'),
};
