import axios from 'axios';

const API_BASE = 'http://127.0.0.1:54817/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error.response?.data?.error || error.message);
    return Promise.reject(error);
  }
);

export const userAPI = {
  register: (data) => api.post('/user/register', data),
  login: (data) => api.post('/user/login', data),
  getProfile: (phone) => api.get('/user/profile', { params: { phone } }),
  updateProfile: (data) => api.put('/user/profile', data),
};

export const companyAPI = {
  list: () => api.get('/company/list'),
  get: (id) => api.get(`/company/${id}`),
  create: (data) => api.post('/company', data),
  update: (id, data) => api.put(`/company/${id}`, data),
};

export const orderAPI = {
  create: (data) => api.post('/order', data),
  get: (id) => api.get(`/order/${id}`),
  getByUser: (userId) => api.get(`/order/user/${userId}`),
  updateStatus: (id, status) => api.put(`/order/${id}/status`, { status }),
  delete: (id) => api.delete(`/order/${id}`),
};

export const trackingAPI = {
  get: (trackingNo) => api.get(`/tracking/${trackingNo}`),
  addNode: (trackingNo, data) => api.post(`/tracking/${trackingNo}`, data),
  predict: (trackingNo) => api.get(`/tracking/${trackingNo}/predict`),
};

export const priceAPI = {
  quote: (data) => api.post('/price/quote', data),
  compare: (params) => api.get('/price/compare', { params }),
};

export const pickupAPI = {
  parse: (smsContent) => api.post('/pickup/parse', { sms_content: smsContent }),
  getByPhone: (phone) => api.get(`/pickup/phone/${phone}`),
  bind: (data) => api.post('/pickup/bind', data),
};

export const urgentAPI = {
  createOrder: (data) => api.post('/urgent/order', data),
  getStatus: (id) => api.get(`/urgent/${id}/status`),
  dispatchCourier: (id, courierId) => api.post(`/urgent/${id}/courier/dispatch`, { courier_id: courierId }),
  getAvailableCouriers: () => api.get('/urgent/couriers/available'),
  estimateFee: (data) => api.post('/urgent/fee/estimate', data),
};

export const intlAPI = {
  createOrder: (data) => api.post('/intl/order', data),
  uploadCustomsDoc: (id, formData) => api.post(`/intl/${id}/customs`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getDocTemplate: (docType) => api.get('/intl/doc/template', { params: { doc_type: docType } }),
  createTicket: (orderId, data) => api.post(`/intl/${orderId || 0}/ticket`, data),
  getTickets: (userId) => api.get(`/intl/tickets/${userId}`),
};

export const exceptionAPI = {
  getByOrder: (orderId) => api.get(`/exception/order/${orderId}`),
  autoAnalyze: (orderId) => api.post('/exception/auto-analyze', { order_id: orderId }),
  create: (data) => api.post('/exception', data),
  resolve: (id, status) => api.put(`/exception/${id}/resolve`, { handling_status: status }),
};

export const addressAPI = {
  getByUser: (userId) => api.get(`/address/user/${userId}`),
  create: (data) => api.post('/address', data),
  update: (id, data) => api.put(`/address/${id}`, data),
  delete: (id) => api.delete(`/address/${id}`),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
