import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    const isRegisterRequest = err.config?.url?.includes('/auth/register');
    const hasToken = !!localStorage.getItem('token');

    if (err.response?.status === 401 && !isLoginRequest && !isRegisterRequest && hasToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    const serverError = err.response?.data;
    if (serverError && (serverError.error || serverError.message)) {
      return Promise.reject(serverError);
    }
    return Promise.reject({ error: err.message || '网络请求失败' });
  }
);

export default api;
