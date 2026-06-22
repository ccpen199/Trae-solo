import axios from 'axios';
import type { ApiResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

const DEFAULT_USER_ID_KEY = 'default_user_id';

export function getDefaultUserId(): string {
  let id = localStorage.getItem(DEFAULT_USER_ID_KEY);
  if (id && id !== 'default') return id;
  return '';
}

export function setDefaultUserId(id: string): void {
  localStorage.setItem(DEFAULT_USER_ID_KEY, id);
}

api.interceptors.request.use((config) => {
  const userId = getDefaultUserId();
  if (userId && userId !== 'default') {
    config.headers['X-User-Id'] = userId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse<unknown>;
    if (data && !data.success && data.error) {
      throw new Error(data.error.message || '请求失败');
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.error?.message || error.message || '网络错误';
    return Promise.reject(new Error(message));
  }
);

export default api;
