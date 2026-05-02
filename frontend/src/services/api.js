import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      console.error('API Error:', status, data?.message);
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export const orderApi = {
  getList: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post('/orders', orderData),
  submitLocation: (id, data) => api.post(`/orders/${id}/submit-location`, data),
  planRoute: (id, data) => api.post(`/orders/${id}/plan-route`, data),
  approveRoute: (id, data) => api.post(`/orders/${id}/approve-route`, data),
  rejectRoute: (id, data) => api.post(`/orders/${id}/reject-route`, data),
  startNavigation: (id, data) => api.post(`/orders/${id}/start-navigation`, data),
  submitTrack: (id, data) => api.post(`/orders/${id}/submit-track`, data),
  confirmArrival: (id, data) => api.post(`/orders/${id}/confirm-arrival`, data),
  cancel: (id, data) => api.post(`/orders/${id}/cancel`, data),
  getTimeAxis: (id) => api.get(`/orders/${id}/time-axis`),
  getTracks: (id) => api.get(`/orders/${id}/tracks`),
};

export const reportApi = {
  getOverview: () => api.get('/reports/overview'),
  getByStatus: () => api.get('/reports/by-status'),
  getByDate: (params) => api.get('/reports/by-date', { params }),
  getExceptions: (params) => api.get('/reports/exceptions', { params }),
  getExceptionStats: () => api.get('/reports/exceptions/stats'),
  getDrilldown: (params) => api.get('/reports/drilldown', { params }),
  getOrderDetail: (id) => api.get(`/reports/order-detail/${id}`),
};

export const messageApi = {
  getList: (params) => api.get('/messages', { params }),
  getUnreadCount: () => api.get('/messages/unread-count'),
  markAsRead: (id) => api.post(`/messages/${id}/read`),
  markAllAsRead: () => api.post('/messages/read-all'),
  delete: (id) => api.delete(`/messages/${id}`),
};

export const systemApi = {
  getHealth: () => api.get('/health'),
  getConstants: () => api.get('/constants'),
};

export const geocodeApi = {
  geocode: (address) => api.get('/geocode/geocode', { params: { address } }),
  reverseGeocode: (lat, lng) => api.get('/geocode/reverse-geocode', { params: { lat, lng } }),
  suggest: (keyword, options = {}) => api.get('/geocode/suggest', { params: { keyword, ...options } }),
  batchGeocode: (addresses) => api.post('/geocode/batch-geocode', { addresses }),
  getDistance: (origin, dest) => api.get('/geocode/distance', {
    params: {
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      dest_lat: dest.lat,
      dest_lng: dest.lng,
    },
  }),
};

export default api;
