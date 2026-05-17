import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true
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
    const res = response.data;
    if (res.success) {
      return res;
    } else {
      console.error('API Error:', res.message);
      return Promise.reject(new Error(res.message || '请求失败'));
    }
  },
  error => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          console.error('权限不足:', data?.message);
          break;
        case 404:
          console.error('资源不存在');
          break;
        case 500:
          console.error('服务器错误');
          break;
        default:
          console.error('请求错误:', data?.message || error.message);
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('请求超时');
    } else {
      console.error('网络错误:', error.message);
    }
    return Promise.reject(error);
  }
);

export default request;
