import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  sendSmsCode: (phone, type = 'login') => api.post('/auth/sms/send', { phone, type }),
  smsLogin: (phone, code) => api.post('/auth/sms/login', { phone, code }),
  passwordLogin: (account, password) => api.post('/auth/password/login', { account, password }),
  thirdPartyLogin: (data) => api.post('/auth/third-party/login', data),
  bindPhone: (phone, code) => api.post('/auth/bind-phone', { phone, code }),
  resetPassword: (account, code, newPassword) => api.post('/auth/reset-password', { account, code, newPassword }),
  getCurrentUser: () => api.get('/auth/user'),
  logout: () => api.post('/auth/logout')
};

export const newsApi = {
  getList: () => api.get('/news'),
  getDetail: (id) => api.get(`/news/${id}`),
  like: (id) => api.post(`/news/${id}/like`),
  favorite: (id) => api.post(`/news/${id}/favorite`),
  comment: (id, content) => api.post(`/news/${id}/comment`, { content })
};

export default api;
