import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('duoshan_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === 'ECONNABORTED' || !navigator.onLine) {
      showToast('网络连接失败，请检查网络');
    } else if (error.response?.status === 401) {
      localStorage.removeItem('duoshan_token');
      localStorage.removeItem('duoshan_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 404) {
      showToast('资源不存在');
    } else if (error.response?.status >= 500) {
      showToast('服务器错误，请稍后重试');
    }
    
    return Promise.reject(error);
  }
);

let toastTimeout = null;
export function showToast(message, duration = 2000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.remove();
  }, duration);
}

export default request;
