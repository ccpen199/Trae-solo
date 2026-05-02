import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
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
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  
  logout: () => 
    api.post('/auth/logout'),
  
  getCurrentUser: () => 
    api.get('/auth/me'),
  
  changePassword: (oldPassword, newPassword) => 
    api.post('/auth/change-password', { oldPassword, newPassword }),
};

export const planApi = {
  getAll: (params = {}) => 
    api.get('/plans', { params }),
  
  getById: (planId) => 
    api.get(`/plans/${planId}`),
  
  create: (data) => 
    api.post('/plans', data),
  
  update: (planId, data) => 
    api.put(`/plans/${planId}`, data),
  
  delete: (planId) => 
    api.delete(`/plans/${planId}`),
  
  getPricingHistory: (planId) => 
    api.get(`/plans/${planId}/pricing-history`),
};

export const subscriptionApi = {
  getAll: (params = {}) => 
    api.get('/subscriptions', { params }),
  
  getById: (subscriptionId) => 
    api.get(`/subscriptions/${subscriptionId}`),
  
  subscribe: (planId) => 
    api.post('/subscriptions/subscribe', { planId }),
  
  pay: (subscriptionId, paymentMethod = 'mock') => 
    api.post(`/subscriptions/${subscriptionId}/pay`, { paymentMethod }),
  
  cancel: (subscriptionId, reason) => 
    api.post(`/subscriptions/${subscriptionId}/cancel`, { reason }),
  
  getEntitlements: (subscriptionId) => 
    api.get(`/subscriptions/${subscriptionId}/entitlements`),
};

export const invoiceApi = {
  getAll: (params = {}) => 
    api.get('/invoices', { params }),
  
  getById: (invoiceId) => 
    api.get(`/invoices/${invoiceId}`),
  
  pay: (invoiceId, paymentMethod = 'mock') => 
    api.post(`/invoices/${invoiceId}/pay`, { paymentMethod }),
  
  getReceipt: (invoiceId) => 
    api.get(`/invoices/${invoiceId}/receipt`),
  
  void: (invoiceId, reason) => 
    api.post(`/invoices/${invoiceId}/void`, { reason }),
};

export const notificationApi = {
  getAll: (params = {}) => 
    api.get('/notifications', { params }),
  
  getUnreadCount: () => 
    api.get('/notifications/unread-count'),
  
  markAsRead: (notificationId) => 
    api.post(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () => 
    api.post('/notifications/mark-all-read'),
};

export const analyticsApi = {
  getDashboard: () => 
    api.get('/analytics/dashboard'),
  
  getMRR: (params = {}) => 
    api.get('/analytics/mrr', { params }),
  
  getChurnRate: (params = {}) => 
    api.get('/analytics/churn-rate', { params }),
  
  getChurnRisk: (params = {}) => 
    api.get('/analytics/churn-risk', { params }),
  
  evaluateChurn: () => 
    api.post('/analytics/evaluate-churn'),
  
  getRevenueTrend: (params = {}) => 
    api.get('/analytics/revenue-trend', { params }),
  
  getSubscriptionStats: () => 
    api.get('/analytics/subscription-stats'),
};

export const auditApi = {
  getLogs: (params = {}) => 
    api.get('/audit/logs', { params }),
  
  getLogById: (logId) => 
    api.get(`/audit/logs/${logId}`),
  
  getActions: () => 
    api.get('/audit/actions'),
  
  getResourceTypes: () => 
    api.get('/audit/resource-types'),
  
  getSubscriptionAudit: (subscriptionId, params = {}) => 
    api.get(`/audit/subscription/${subscriptionId}`, { params }),
  
  getUserAudit: (userId, params = {}) => 
    api.get(`/audit/user/${userId}`, { params }),
  
  getInvoiceAudit: (invoiceId) => 
    api.get(`/audit/invoice/${invoiceId}`),
};

export default api;
