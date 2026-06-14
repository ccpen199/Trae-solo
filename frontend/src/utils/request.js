import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000
});

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  response => {
    const data = response.data;
    if (data.code === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return data;
  },
  error => {
    console.error('Request error:', error);
    return { code: 500, message: error.message || '请求失败' };
  }
);

export default request;
