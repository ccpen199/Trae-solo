import axios from 'axios';

const loopbackHosts = new Set(['localhost', '127.0.0.1']);

const resolveApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL || '/api';
  if (configured === '/api' || typeof window === 'undefined') return configured;

  try {
    const url = new URL(configured);
    if (loopbackHosts.has(url.hostname) && loopbackHosts.has(window.location.hostname)) {
      url.hostname = window.location.hostname;
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return configured;
  }
};

const oauthHeader = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

const encodeFormData = (data) => {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && !config.url?.includes('/oauth/token')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await api.post('/oauth/token',
            encodeFormData({
              grant_type: 'refresh_token',
              client_id: 'platform-admin',
              client_secret: 'platform-secret-2024',
              refresh_token: refreshToken
            }),
            { headers: oauthHeader }
          );
          const { access_token, refresh_token } = response.data;
          localStorage.setItem('accessToken', access_token);
          localStorage.setItem('refreshToken', refresh_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (e) {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
