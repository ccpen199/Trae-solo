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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const idempotentKey = config.headers['X-Idempotent-Key'];
    if (!idempotentKey && config.method === 'post') {
      config.headers['X-Idempotent-Key'] = `idempotent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      if (error.response.status === 409) {
        return Promise.reject(new Error('请求正在处理中，请稍后重试'));
      }
      
      if (error.response.status === 429) {
        return Promise.reject(new Error('请求次数过多，请稍后重试'));
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  getUsers: (params) => api.get('/auth/users', { params })
};

export const billsAPI = {
  getSummary: (params) => api.get('/bills/summary', { params }),
  getList: (params) => api.get('/bills', { params }),
  getById: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
  performAction: (id, action, comment) => api.post(`/bills/${id}/action`, { action, comment }),
  getHistory: (id) => api.get(`/bills/${id}/history`),
  getDifferences: (id) => api.get(`/bills/${id}/differences`)
};

export const endorsementsAPI = {
  getList: (params) => api.get('/endorsements', { params }),
  getById: (id) => api.get(`/endorsements/${id}`),
  create: (data) => api.post('/endorsements', data),
  approve: (id, comment) => api.post(`/endorsements/${id}/approve`, { comment }),
  reject: (id, comment) => api.post(`/endorsements/${id}/reject`, { comment }),
  requestInfo: (id, comment) => api.post(`/endorsements/${id}/request-info`, { comment }),
  reassign: (id, comment) => api.post(`/endorsements/${id}/reassign`, { comment })
};

export const discountsAPI = {
  getList: (params) => api.get('/discounts', { params }),
  getById: (id) => api.get(`/discounts/${id}`),
  create: (data) => api.post('/discounts', data),
  calculate: (data) => api.post('/discounts/calculate', data),
  approve: (id, comment) => api.post(`/discounts/${id}/approve`, { comment }),
  reject: (id, comment) => api.post(`/discounts/${id}/reject`, { comment })
};

export const maturitiesAPI = {
  getList: (params) => api.get('/maturities', { params }),
  getUpcoming: (days) => api.get('/maturities/upcoming', { params: { days } }),
  generate: () => api.post('/maturities/generate'),
  lock: (id) => api.post(`/maturities/${id}/lock`),
  unlock: (id) => api.post(`/maturities/${id}/unlock`),
  process: (id, comment) => api.post(`/maturities/${id}/process`, { comment }),
  send: (id) => api.post(`/maturities/${id}/send`)
};

export const differencesAPI = {
  getList: (params) => api.get('/differences', { params }),
  getById: (id) => api.get(`/differences/${id}`),
  getDashboard: () => api.get('/differences/summary/dashboard'),
  resolve: (id, comment) => api.post(`/differences/${id}/resolve`, { resolutionComment: comment }),
  close: (id, comment) => api.post(`/differences/${id}/close`, { resolutionComment: comment }),
  reassign: (id, newOperatorId, comment) => api.post(`/differences/${id}/reassign`, { newOperatorId, comment })
};

export default api;
