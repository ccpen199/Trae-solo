import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined' && token !== 'local-demo-admin-token') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.state) {
            parsed.state.token = null;
            parsed.state.user = null;
            parsed.state.isAuthenticated = false;
            localStorage.setItem('auth-storage', JSON.stringify(parsed));
          }
        } catch {}
      }
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default request;
