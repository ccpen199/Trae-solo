import axios from 'axios';
import { useAuthStore } from './store';

const api = axios.create({
  baseURL: 'http://127.0.0.1:59077/api',
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data.data ?? response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export async function request(method, url, data = null, options = {}) {
  const token = useAuthStore.getState().token;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const config = {
    method,
    url: `http://127.0.0.1:59077/api${url}`,
    headers,
    ...options
  };
  
  if (data !== null) {
    config.body = data instanceof FormData ? data : JSON.stringify(data);
  }
  
  const response = await fetch(config.url, config);
  const result = await response.json();
  
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new Error('未授权');
  }
  
  if (result.code !== 200) {
    throw new Error(result.message || '请求失败');
  }
  
  return result.data;
}

export const http = {
  get: (url, options) => request('GET', url, null, options),
  post: (url, data, options) => request('POST', url, data, options),
  put: (url, data, options) => request('PUT', url, data, options),
  delete: (url, options) => request('DELETE', url, null, options)
};

