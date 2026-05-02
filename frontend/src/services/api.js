import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
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
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  
  getMe: () => 
    api.get('/auth/me'),
  
  logout: () => 
    api.post('/auth/logout'),
  
  getRoles: () => 
    api.get('/auth/roles')
};

export const productApi = {
  getAll: () => 
    api.get('/products'),
  
  getById: (productId) => 
    api.get(`/products/${productId}`),
  
  create: (data) => 
    api.post('/products', data),
  
  update: (productId, data) => 
    api.put(`/products/${productId}`, data),
  
  submit: (productId) => 
    api.post(`/products/${productId}/submit`),
  
  approve: (productId) => 
    api.post(`/products/${productId}/approve`),
  
  calculatePremium: (data) => 
    api.post('/products/calculate-premium', data)
};

export const policyApi = {
  getAll: () => 
    api.get('/policies'),
  
  getPendingUnderwriting: () => 
    api.get('/policies/pending-underwriting'),
  
  getById: (policyId) => 
    api.get(`/policies/${policyId}`),
  
  create: (data) => 
    api.post('/policies', data),
  
  submit: (policyId) => 
    api.post(`/policies/${policyId}/submit`),
  
  underwrite: (policyId, decision, reason) => 
    api.post(`/policies/${policyId}/underwrite`, { decision, reason })
};

export const claimApi = {
  getAll: () => 
    api.get('/claims'),
  
  getPending: () => 
    api.get('/claims/pending'),
  
  getById: (claimId) => 
    api.get(`/claims/${claimId}`),
  
  create: (data) => 
    api.post('/claims', data),
  
  uploadSnapshots: (claimId, snapshots) => 
    api.post(`/claims/${claimId}/upload-snapshots`, { snapshots }),
  
  evaluate: (claimId) => 
    api.post(`/claims/${claimId}/evaluate`),
  
  assign: (claimId, assignedTo) => 
    api.post(`/claims/${claimId}/assign`, { assigned_to: assignedTo }),
  
  escalate: (claimId, reason) => 
    api.post(`/claims/${claimId}/escalate`, { reason }),
  
  approve: (claimId, approvedAmount) => 
    api.post(`/claims/${claimId}/approve`, { approved_amount: approvedAmount }),
  
  pay: (claimId) => 
    api.post(`/claims/${claimId}/pay`),
  
  reject: (claimId, reason) => 
    api.post(`/claims/${claimId}/reject`, { reason })
};

export const notificationApi = {
  getAll: () => 
    api.get('/notifications'),
  
  getUnreadCount: () => 
    api.get('/notifications/unread-count'),
  
  markAsRead: (notificationId) => 
    api.post(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () => 
    api.post('/notifications/read-all')
};

export default api;
