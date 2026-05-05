import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:21224/api',
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { username: string; password: string; name: string; phone?: string; email?: string }) =>
    api.post('/auth/register', data),
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
};

export const assetApi = {
  getOverview: () => api.get('/assets/overview'),
  getBalance: () => api.get('/assets/balance'),
  getFundShare: () => api.get('/assets/fund-share'),
  purchase: (data: { amount: number; fromAccount: 'BALANCE' | 'BANK_CARD' }) =>
    api.post('/assets/purchase', data),
  getTransactions: (params?: { page?: number; pageSize?: number }) =>
    api.get('/assets/transactions', { params }),
  getTransferIn: (params?: { page?: number; pageSize?: number }) =>
    api.get('/assets/transfer-in', { params }),
  getTransferOut: (params?: { page?: number; pageSize?: number }) =>
    api.get('/assets/transfer-out', { params }),
};

export const paymentApi = {
  getInfo: (orderAmount: number) =>
    api.get('/payments/info', { params: { orderAmount } }),
  execute: (data: {
    orderAmount: number;
    useFundShare: boolean;
    useAccountBalance: boolean;
    paymentPassword: string;
  }) => api.post('/payments/execute', data),
  refund: (data: { originalOrderNo: string; refundAmount: number }) =>
    api.post('/payments/refund', data),
};

export const redeemApi = {
  getLimitInfo: () => api.get('/redeems/limit-info'),
  instantRedeem: (data: { amount: number }) =>
    api.post('/redeems/instant', data),
  normalRedeem: (data: { amount: number }) =>
    api.post('/redeems/normal', data),
};

export const withdrawApi = {
  normalWithdraw: (data: { amount: number; source: 'BALANCE' | 'FUND'; bankCardId?: string }) =>
    api.post('/withdraws/normal', data),
  normalRedeemWithdraw: (data: { amount: number; bankCardId?: string }) =>
    api.post('/withdraws/normal-redeem', data),
};

export const reportApi = {
  getOverview: () => api.get('/reports/overview'),
  getDailyStats: (days?: number) =>
    api.get('/reports/daily-stats', { params: { days } }),
  getFailedOrders: (params?: { page?: number; pageSize?: number }) =>
    api.get('/reports/failed-orders', { params }),
  getDPlanStats: () => api.get('/reports/dplan-stats'),
};

export default api;
