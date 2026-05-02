import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pharmacy_token');
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pharmacy_token');
      localStorage.removeItem('pharmacy_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (oldPassword, newPassword) => 
    api.post('/auth/change-password', { oldPassword, newPassword })
};

export const purchaseAPI = {
  getList: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  submit: (id) => api.post(`/purchases/${id}/submit`),
  receive: (id, data) => api.post(`/purchases/${id}/receive`, data),
  complete: (id) => api.post(`/purchases/${id}/complete`)
};

export const inventoryAPI = {
  getBatches: (params) => api.get('/inventory/batches', { params }),
  getBatchById: (id) => api.get(`/inventory/batches/${id}`),
  getAlerts: (params) => api.get('/inventory/alerts', { params }),
  markAlertRead: (id) => api.post(`/inventory/alerts/${id}/read`),
  scanExpiry: () => api.post('/inventory/scan-expiry'),
  searchDrugs: (keyword, params) => api.get('/inventory/drugs/search', { params: { keyword, ...params } }),
  createAdjustment: (data) => api.post('/inventory/adjustment', data)
};

export const prescriptionAPI = {
  getList: (params) => api.get('/prescriptions', { params }),
  getById: (id) => api.get(`/prescriptions/${id}`),
  create: (data) => api.post('/prescriptions', data),
  review: (id, approved, comment) => 
    api.post(`/prescriptions/${id}/review`, { approved, comment }),
  validateDrugs: (id, saleItems) => 
    api.post(`/prescriptions/${id}/validate-drugs`, { saleItems })
};

export const saleAPI = {
  getList: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  approve: (id) => api.post(`/sales/${id}/approve`),
  pay: (id, data) => api.post(`/sales/${id}/pay`, data),
  refund: (id, reason) => api.post(`/sales/${id}/refund`, { reason }),
  initiateRecall: (data) => api.post('/sales/recall/initiate', data),
  getRecallList: (params) => api.get('/sales/recall/list', { params }),
  exportRecall: (batchNo) => api.get(`/sales/recall/export/${batchNo}`)
};

export default api;
