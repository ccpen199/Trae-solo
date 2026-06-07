import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
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
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('permissions');
        localStorage.removeItem('workbenchPath');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

export const userApi = {
  getList: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  verifyIdCard: (id, data) => api.post(`/users/${id}/verify-idcard`, data),
  getWallet: (id) => api.get(`/users/${id}/wallet`),
  recharge: (id, data) => api.post(`/users/${id}/wallet/recharge`, data),
};

export const providerApi = {
  getList: (params) => api.get('/providers', { params }),
  create: (data) => api.post('/providers', data),
  getById: (id) => api.get(`/providers/${id}`),
  audit: (id, data) => api.put(`/providers/${id}/audit`, data),
};

export const productApi = {
  getList: (params) => api.get('/products', { params }),
  create: (data) => api.post('/products', data),
  getById: (id) => api.get(`/products/${id}`),
  update: (id, data) => api.put(`/products/${id}`, data),
};

export const orderApi = {
  getList: (params) => api.get('/orders', { params }),
  create: (data) => api.post('/orders', data),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
  fulfill: (id) => api.post(`/orders/${id}/fulfill`),
};

export const riskApi = {
  getEvents: (params) => api.get('/risk-events/events', { params }),
  createEvent: (data) => api.post('/risk-events/events', data),
  handleEvent: (id, data) => api.put(`/risk-events/events/${id}/handle`, data),
};

export const gatewayApi = {
  route: (data) => api.post('/gateway/route', data),
  getProviders: (category) => api.get(`/gateway/providers/${category}`),
};

export const fulfillmentApi = {
  dispatch: (orderId) => api.post(`/fulfillment/dispatch/${orderId}`),
  getStatus: (orderId) => api.get(`/fulfillment/status/${orderId}`),
};

export const arbitrationApi = {
  getList: (params) => api.get('/arbitrations', { params }),
  create: (data) => api.post('/arbitrations', data),
  resolve: (id, data) => api.put(`/arbitrations/${id}`, data),
};

export const feeApi = {
  getList: (params) => api.get('/fee-config', { params }),
  create: (data) => api.post('/fee-config', data),
  update: (id, data) => api.put(`/fee-config/${id}`, data),
};

export const reportApi = {
  gmv: (params) => api.get('/reports/gmv', { params }),
  repurchase: (params) => api.get('/reports/repurchase', { params }),
  complaints: (params) => api.get('/reports/complaints', { params }),
};

export default api;
