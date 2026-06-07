import axios from 'axios';
import { useUserStore } from '../store/user';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

api.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const store = useUserStore.getState();
      if (!store.token) {
        store.login('local-demo-admin', {
          id: 1,
          username: 'admin',
          name: '演示管理员',
          type: 'admin',
          phone: '13800138000'
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
