import axios, { InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/store/auth';

const api = axios.create({ baseURL: '/api/v1', timeout: 60000 });
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (res) => {
    if (res.data.code !== undefined && res.data.code !== 0) {
      if (res.data.code === 401) useAuthStore.getState().logout();
      message.error(res.data.message || '请求失败');
      return Promise.reject(res.data);
    }
    return res.data;
  },
  (err) => { message.error(err.message || '网络异常'); return Promise.reject(err); },
);
export default api;
