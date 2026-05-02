import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { username: string; password: string; fullName: string; role?: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  
  getMe: () => api.get('/auth/me'),
  
  updateMe: (data: { fullName?: string; phone?: string; email?: string }) =>
    api.put('/auth/me', data),
};

export const riskApi = {
  getQuestions: () => api.get('/risk/questions'),
  
  getAssessment: () => api.get('/risk/assessment'),
  
  submitAssessment: (answers: Record<string, string>) =>
    api.post('/risk/submit', { answers }),
  
  checkEligibility: (productRiskLevel: number) =>
    api.post('/risk/check-eligibility', { productRiskLevel }),
};

export const productApi = {
  getAll: (filters?: { status?: string; type?: string; risk_level?: number }) =>
    api.get('/products', { params: filters }),
  
  getById: (id: string) => api.get(`/products/${id}`),
};

export const orderApi = {
  getAll: (filters?: { order_type?: string; status?: string }) =>
    api.get('/orders', { params: filters }),
  
  getById: (id: string) => api.get(`/orders/${id}`),
  
  createPurchase: (data: { productId: string; amount: number }) =>
    api.post('/orders/purchase', data),
  
  createRedemption: (data: { productId: string; shares: number }) =>
    api.post('/orders/redemption', data),
  
  confirmPayment: (orderId: string) =>
    api.post(`/orders/${orderId}/confirm-payment`),
  
  confirmRedemption: (orderId: string) =>
    api.post(`/orders/${orderId}/confirm-redemption`),
  
  complete: (orderId: string) =>
    api.post(`/orders/${orderId}/complete`),
  
  reject: (orderId: string, reason?: string) =>
    api.post(`/orders/${orderId}/reject`, { reason }),
  
  retry: (orderId: string) =>
    api.post(`/orders/${orderId}/retry`),
  
  close: (orderId: string) =>
    api.post(`/orders/${orderId}/close`),
};

export const assetApi = {
  getAll: () => api.get('/assets'),
  
  getSummary: () => api.get('/assets/summary'),
  
  getByProduct: (productId: string) => api.get(`/assets/${productId}`),
};

export const adminApi = {
  getUsers: (filters?: { role?: string }) =>
    api.get('/admin/users', { params: filters }),
  
  getAllOrders: (filters?: { user_id?: string; order_type?: string; status?: string }) =>
    api.get('/admin/orders', { params: filters }),
  
  getAlerts: (filters?: { status?: string; severity?: string; alert_type?: string }) =>
    api.get('/admin/alerts', { params: filters }),
  
  resolveAlert: (alertId: string, resolutionNotes?: string) =>
    api.post(`/admin/alerts/${alertId}/resolve`, { resolutionNotes }),
  
  getReconciliations: (filters?: { start_date?: string; end_date?: string }) =>
    api.get('/admin/reconciliations', { params: filters }),
  
  runReconciliation: (date?: string) =>
    api.post('/admin/reconciliations/run', { date }),
  
  getPurchaseRedemptionRatio: () =>
    api.get('/admin/metrics/purchase-redemption-ratio'),
  
  getPositionConcentration: () =>
    api.get('/admin/metrics/position-concentration'),
  
  getEvents: (filters?: { aggregate_type?: string; aggregate_id?: string; event_type?: string; start_date?: string; end_date?: string; limit?: number; offset?: number }) =>
    api.get('/admin/events', { params: filters }),
  
  getAuditTrail: (aggregateType: string, aggregateId: string) =>
    api.get(`/admin/audit-trail/${aggregateType}/${aggregateId}`),
  
  createProduct: (data: { code: string; name: string; type: string; risk_level?: number; description?: string; issuer?: string; manager?: string; nav?: number }) =>
    api.post('/admin/products', data),
};

export default api;
