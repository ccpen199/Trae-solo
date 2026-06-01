import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:54875/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('planet_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('planet_token');
      localStorage.removeItem('planet_user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendCode: (phone: string) => api.post('/auth/send-code', { phone }),
  login: (phone: string, code: string) => api.post('/auth/login', { phone, code }),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile')
};

export const planetAPI = {
  getHome: () => api.get('/planet/home'),
  getForce: () => api.get('/planet/force'),
  checkin: () => api.post('/planet/force/checkin'),
  completeTask: (data: any) => api.post('/planet/force/task', data),
  getDiamond: () => api.get('/planet/diamond'),
  claimDiamond: () => api.post('/planet/diamond/claim'),
  getWallet: () => api.get('/planet/wallet'),
  transfer: (data: any) => api.post('/planet/wallet/transfer', data),
  getPassport: () => api.get('/planet/passport'),
  updatePassport: (data: any) => api.post('/planet/passport/update', data),
  getTasks: () => api.get('/planet/tasks')
};

export default api;
