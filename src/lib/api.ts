import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/login')) {
      localStorage.removeItem('vms_token');
      localStorage.removeItem('vms_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
