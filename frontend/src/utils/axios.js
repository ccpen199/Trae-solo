import axios from 'axios';
import { Toast } from 'vant';
import router from '@/router';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  response => {
    const { data } = response;
    if (data.code === 0) {
      return data;
    } else {
      Toast(data.message || '请求失败');
      return Promise.reject(new Error(data.message || '请求失败'));
    }
  },
  error => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        Toast('请先登录');
      } else {
        Toast(data?.message || '网络错误');
      }
    } else {
      Toast('网络连接失败');
    }
    return Promise.reject(error);
  }
);

export default request;
