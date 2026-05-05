import axios from 'axios';
import { useAuthStore } from '../store';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  sendCode: (phone) => api.post('/auth/send-code', { phone }),
  login: (phone, code) => api.post('/auth/login', { phone, code }),
  logout: () => api.post('/auth/logout'),
};

export const userApi = {
  getProfile: () => api.get('/user/profile'),
  verify: (realName, idCard) => api.post('/user/verify', { realName, idCard }),
  payDeposit: (amount) => api.post('/user/deposit', { amount }),
  authCredit: () => api.post('/user/credit-auth'),
  getOnboardingStatus: () => api.get('/user/onboarding-status'),
  getOrders: (status) => api.get('/user/orders', { params: { status } }),
};

export const bikeApi = {
  getNearby: (latitude, longitude, radius) => 
    api.get('/bike/nearby', { params: { latitude, longitude, radius } }),
  getByCode: (bikeCode) => api.get(`/bike/${bikeCode}`),
  getByPlate: (plateNumber) => api.get(`/bike/plate/${plateNumber}`),
  ring: (bikeId) => api.post(`/bike/${bikeId}/ring`),
  getPricing: () => api.get('/bike/pricing/rule'),
};

export const orderApi = {
  create: (bikeId, startLatitude, startLongitude) => 
    api.post('/order/create', { bikeId, startLatitude, startLongitude }),
  getActive: () => api.get('/order/active'),
  end: (orderId, endLatitude, endLongitude) => 
    api.post('/order/end', { orderId, endLatitude, endLongitude }),
  pay: (orderId, paymentMethod) => 
    api.post('/order/pay', { orderId, paymentMethod }),
  autoEnd: (orderId, reason) => 
    api.post('/order/auto-end', { orderId, reason }),
};

export const reportApi = {
  getFaultTypes: () => api.get('/report/fault-types'),
  submitFault: (data) => api.post('/report/fault', data),
  getReportTypes: () => api.get('/report/report-types'),
  submitReport: (data) => api.post('/report/report', data),
  getMyReports: () => api.get('/report/my-reports'),
  getHelpInfo: () => api.get('/report/help-info'),
};

export default api;
