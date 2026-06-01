import axios from 'axios';
import { showToast, showConfirmDialog } from 'vant';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
});

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

request.interceptors.response.use(
  response => {
    const { code, msg, data } = response.data;
    if (code === 200) {
      return data;
    } else if (code === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      showToast('登录已过期，请重新登录');
      setTimeout(() => {
        window.location.href = '#/login';
      }, 1000);
      return Promise.reject(new Error(msg));
    } else {
      showToast(msg || '请求失败');
      return Promise.reject(new Error(msg));
    }
  },
  error => {
    showToast('网络错误，请稍后重试');
    return Promise.reject(error);
  }
);

export default request;
