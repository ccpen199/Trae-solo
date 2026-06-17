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
      localStorage.removeItem('token');
      localStorage.removeItem('admin_info');
      if (!location.pathname.startsWith('/login')) {
        location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || { success: false, message: error.message });
  }
);

export const orderApi = {
  getOrders: (params: {
    page: number;
    pageSize: number;
    status?: string;
    keyword?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/admin/orders', { params }),
  
  getOrderDetail: (id: string) => api.get(`/orders/admin/${id}`),
  
  getOrderDiagnostic: (id: string) => api.get(`/orders/${id}/diagnostic`),
  
  getErrorCodes: () => api.get('/orders/error-codes'),
  
  retryOrder: (id: string) => api.post(`/admin/orders/${id}/retry`),
  
  retrySwitchChannel: (id: string) => api.post(`/admin/orders/${id}/retry-switch-channel`),
  
  refundOrder: (id: string) => api.post(`/admin/orders/${id}/refund`),
  
  exportOrders: async (params: {
    status?: string;
    keyword?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.set(k, v);
    });
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`/api/admin/orders/export?${query.toString()}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    if (!response.ok) {
      throw new Error('导出失败');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const disposition = response.headers.get('Content-Disposition');
    let filename = `订单导出_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.csv`;
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) filename = match[1];
    }
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};

export const adminApi = {
  syncStock: () => api.post('/admin/stock/sync'),
  getCardPoolStats: () => api.get('/admin/card-pool/stats'),
  getCardPoolList: (params: any) => api.get('/admin/card-pool', { params }),
  getCardPoolCryptoLogs: (params: any) =>
    api.get('/admin/card-pool/crypto-logs', { params }),
  cleanupExpiredCards: () => api.post('/admin/card-pool/cleanup-expired'),
  extendCardExpiry: (data: { ids: string[]; days: number }) =>
    api.post('/admin/card-pool/extend-expiry', data),
  decryptCardPreview: (data: { cardId: string; reason?: string }) =>
    api.post('/admin/card-pool/decrypt-preview', data),
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
