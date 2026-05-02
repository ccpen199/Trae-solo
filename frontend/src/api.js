import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const userAPI = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  activate: (data) => api.post('/users/activate', data),
  getInfo: (userId) => api.get(`/users/info/${userId}`),
  getTransactions: (userId, limit = 20) => api.get(`/users/transactions/${userId}?limit=${limit}`),
  recharge: (data) => api.post('/users/recharge', data)
};

export const paymentAPI = {
  scanPay: (data) => api.post('/payments/scan', data),
  generateQR: (data) => api.post('/payments/qrcode', data),
  getStatus: (transactionId) => api.get(`/payments/status/${transactionId}`),
  getMerchantPayments: (merchantId, limit = 50) => api.get(`/payments/merchant/${merchantId}?limit=${limit}`)
};

export const transferAPI = {
  execute: (data) => api.post('/transfers/execute', data),
  getHistory: (userId, limit = 50) => api.get(`/transfers/history/${userId}?limit=${limit}`),
  getVoucher: (transactionId) => api.get(`/transfers/voucher/${transactionId}`),
  verifyVoucher: (data) => api.post('/transfers/voucher/verify', data),
  checkConsistency: (data) => api.post('/transfers/check-consistency', data)
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getSystemStatus: () => api.get('/admin/system-status'),
  getTransactionTrend: (days = 7) => api.get(`/admin/transaction-trend?days=${days}`),
  getRiskSummary: () => api.get('/admin/risk-summary'),
  executeReconciliation: (date) => api.post('/admin/reconciliation/daily', { date }),
  getReconciliationList: (limit = 30) => api.get(`/admin/reconciliation/list?limit=${limit}`),
  getReconciliationDetail: (id) => api.get(`/admin/reconciliation/detail/${id}`),
  getAdjustmentPool: () => api.get('/admin/adjustment-pool'),
  handleAdjustment: (data) => api.post('/admin/adjustment/handle', data),
  verifyHashChain: () => api.get('/admin/hashchain/verify'),
  traceTransaction: (transactionId) => api.get(`/admin/hashchain/trace-transaction/${transactionId}`),
  getAuditReport: (startDate, endDate) => api.get(`/admin/audit-report?startDate=${startDate || ''}&endDate=${endDate || ''}`),
  freezeUser: (data) => api.post('/admin/user/freeze', data),
  unfreezeUser: (data) => api.post('/admin/user/unfreeze', data)
};

export default api;
