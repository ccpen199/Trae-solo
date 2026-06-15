import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      if (!location.pathname.startsWith('/login')) {
        location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || { success: false, message: error.message });
  }
);

export const adminApi = {
  syncStock: () => api.post('/admin/stock/sync'),
  getCardPoolCryptoLogs: (params: { page: number; pageSize: number }) =>
    api.get('/admin/card-pool/crypto-logs', { params }),
  getProfitConfigs: () => api.get('/admin/profit-configs'),
  saveProfitConfig: (data: {
    supplierId: string;
    level1Ratio: number;
    level2Ratio: number;
    level3Ratio: number;
    supplierRatio: number;
    platformRatio: number;
  }) => api.post('/admin/profit-configs', data),
  getSettlementInvoice: (id: string) => api.get(`/admin/settlements/${id}/invoice`),
  saveSettlementInvoice: (id: string, data: {
    invoiceNo: string;
    invoiceAmount: number;
    invoiceDate: string;
  }) => api.post(`/admin/settlements/${id}/invoice`, data),
  getRiskLogDetail: (id: string) => api.get(`/admin/risk/logs/${id}`),
};

export default api;
