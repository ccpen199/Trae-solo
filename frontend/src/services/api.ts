import axios from 'axios';
import { ERROR_CODE_MAP } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data.code === 0) {
      return data;
    }
    const specificMsg = ERROR_CODE_MAP[data.code];
    return Promise.reject(new Error(specificMsg || data.message || '请求失败'));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const data = error.response?.data;
    if (data && data.code && ERROR_CODE_MAP[data.code]) {
      return Promise.reject(new Error(ERROR_CODE_MAP[data.code]));
    }
    const msg = data?.message || error.message || '网络错误';
    return Promise.reject(new Error(msg));
  },
);

export default api;
