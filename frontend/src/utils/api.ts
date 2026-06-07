import axios from 'axios';
import { ElMessage } from 'element-plus';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      if (!window.location.pathname.includes('/login')) {
        ElMessage.error('登录已过期，请重新登录');
        window.location.href = '/login';
      }
    } else {
      const msg = error.response?.data?.message || '网络错误，请稍后重试';
      ElMessage.error(msg);
    }
    return Promise.reject(error);
  }
);

export default api;
