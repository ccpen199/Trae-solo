import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  sendCode: (phone) => api.post('/auth/send-code', { phone }),
  loginByCode: (phone, code) => api.post('/auth/login/code', { phone, code }),
  loginByPassword: (phone, password) => api.post('/auth/login/password', { phone, password }),
  thirdPartyLogin: (data) => api.post('/auth/login/third-party', data),
  getProfile: () => api.get('/auth/profile')
};

export const locationApi = {
  getCities: (params) => api.get('/location/cities', { params }),
  getDefaultCity: () => api.get('/location/cities/default'),
  getCurrentLocation: () => api.get('/location/current'),
  saveLocation: (data) => api.post('/location/save', data)
};

export const orderApi = {
  getCarTypes: () => api.get('/order/car-types'),
  calculateRoute: (data) => api.post('/order/calculate', data),
  createOrder: (data) => api.post('/order', data),
  getCurrentOrder: () => api.get('/order/current'),
  getOrderHistory: (params) => api.get('/order/history', { params }),
  getOrderById: (id) => api.get(`/order/${id}`),
  updateStatus: (id, status) => api.put(`/order/${id}/status`, { status }),
  simulateDriverArrive: (id) => api.post(`/order/${id}/driver-arrive`),
  simulateTripComplete: (id) => api.post(`/order/${id}/trip-complete`)
};

export const paymentApi = {
  payOrder: (data) => api.post('/payment/pay', data),
  submitRating: (data) => api.post('/payment/rating', data),
  getRating: (orderId) => api.get(`/payment/rating/${orderId}`)
};

export const messageApi = {
  getConversations: () => api.get('/message/conversations'),
  sendMessage: (data) => api.post('/message/send', data),
  getMessages: (params) => api.get('/message', { params }),
  getUnreadCount: () => api.get('/message/unread-count'),
  markAsRead: (data) => api.post('/message/mark-read', data),
  getAnnouncements: (params) => api.get('/message/announcements', { params })
};

export default api;