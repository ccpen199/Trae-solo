import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    alert(error.response?.data?.error || '请求失败，请稍后重试');
    return Promise.reject(error);
  }
);

export default api;
