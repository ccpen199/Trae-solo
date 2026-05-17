import axios from 'axios';
import { showToast } from 'vant';
import router from '../router';

const baseURL = 'http://localhost:48292/api';

const request = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fitlife_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.success === false) {
      showToast(data.message || '请求失败');
      return Promise.reject(data);
    }
    return data;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      switch (status) {
        case 401:
          localStorage.removeItem('fitlife_token');
          localStorage.removeItem('fitlife_user');
          showToast('登录已过期，请重新登录');
          router.push('/login');
          break;
        case 403:
          showToast('没有权限访问');
          break;
        case 404:
          showToast('资源不存在');
          break;
        case 500:
          showToast('服务器错误');
          break;
        default:
          showToast(error.response.data?.message || '网络错误');
      }
    } else if (error.code === 'ECONNABORTED') {
      showToast('请求超时，请重试');
    } else {
      showToast('网络连接失败，请检查网络');
    }
    return Promise.reject(error);
  }
);

export default request;
