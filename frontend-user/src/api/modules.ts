import api from './index';

const data = (request: Promise<unknown>) => request as Promise<any>;

interface CalculatePriceItem {
  productId: string;
  quantity: number;
  account?: string;
  channelId?: string;
  supplierId?: string;
}

interface CalculatePriceSinglePayload {
  productId: string;
  quantity: number;
  account?: string;
  channelId?: string;
  supplierId?: string;
}

interface CalculatePriceItemsPayload {
  items: CalculatePriceItem[];
  channelId?: string;
  supplierId?: string;
}

type CalculatePricePayload = CalculatePriceSinglePayload | CalculatePriceItemsPayload;

export const authApi = {
  register: (payload: any) => data(api.post('/auth/register', payload)),
  login: (payload: any) => data(api.post('/auth/login', payload)),
  getProfile: () => data(api.get('/auth/profile')),
  updateProfile: (payload: any) => data(api.put('/auth/profile', payload))
};

export const productApi = {
  list: (params: any) => data(api.get('/products', { params })),
  search: (keyword: string, params?: any) => data(api.get('/products', { params: { keyword, ...params } })),
  hot: () => data(api.get('/products/hot')),
  categories: () => data(api.get('/categories')),
  getProductDetail: (id: string) => data(api.get(`/products/${id}`)),
  calculatePrice: (payload: CalculatePricePayload) => data(api.post('/calculate-price', payload)),
  getPromotions: () => data(api.get('/promotions')),
  syncStock: (id: string) => data(api.post(`/products/${id}/sync-stock`)),
  getAlternatives: (id: string) => data(api.get(`/products/${id}/alternatives`))
};

export const orderApi = {
  create: (payload: any) => data(api.post('/orders', payload)),
  pay: (id: string) => data(api.post(`/orders/${id}/pay`)),
  retry: (id: string) => data(api.post(`/orders/${id}/retry`)),
  list: (params: any) => data(api.get('/orders', { params })),
  detail: (id: string) => data(api.get(`/orders/${id}`)),
  getCards: (id: string) => data(api.get(`/orders/${id}/cards`)),
  diagnostic: (id: string) => data(api.get(`/orders/${id}/diagnostic`)),
  retrySwitchChannel: (id: string) => data(api.post(`/orders/${id}/retry-switch-channel`)),
  getAbnormalSummary: () => data(api.get('/orders/abnormal/summary')),
  getAbnormalList: (params: any) => data(api.get('/orders/abnormal/list', { params })),
  appeal: (id: string, payload: any) => data(api.post(`/orders/${id}/appeal`, payload)),
  getRecentFlow: (limit?: number) => data(api.get('/orders/flow/recent', { params: { limit } }))
};

export const commissionApi = {
  records: (params: any) => data(api.get('/commission/records', { params })),
  team: (params: any) => data(api.get('/commission/team', { params })),
  referrals: () => data(api.get('/commission/referrals')),
  shareCode: () => data(api.get('/commission/share-code')),
  withdraw: (payload: any) => data(api.post('/commission/withdraw', payload)),
  recharge: (payload: any) => data(api.post('/balance/recharge', payload)),
  getRelationChain: () => data(api.get('/commission/relation-chain')),
  getTraceChain: (commissionId: string) => data(api.get(`/commission/trace/${commissionId}`)),
  getReviewRecords: () => data(api.get('/commission/reviews')),
  submitReview: (payload: any) => data(api.post('/commission/reviews', payload))
};

export const adminApi = {
  getDashboard: () => data(api.get('/admin/dashboard')),
  getStats: () => data(api.get('/admin/stats')),
  getRiskLogs: (params?: any) => data(api.get('/admin/risk/logs', { params })),
  getRiskStats: () => data(api.get('/admin/risk/stats')),
  getSettlements: () => data(api.get('/admin/settlements')),
  getProfitConfigs: () => data(api.get('/admin/profit-configs')),
  getCardPool: () => data(api.get('/admin/card-pool')),
  getCardCryptoLogs: () => data(api.get('/admin/card-pool/crypto-logs')),
  getInvoices: (params?: any) => data(api.get('/admin/invoices', { params })),
  exportReport: (type: string, format: string = 'csv', startDate?: string, endDate?: string) => {
    const params: any = { type, format };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return data(api.get('/admin/reports/export', { params, responseType: format === 'csv' ? 'blob' : 'json' }));
  },
  getOperationLogs: (params?: any) => data(api.get('/admin/operation-logs', { params })),
  addOperationLog: (payload: any) => data(api.post('/admin/operation-logs', payload)),
  getAuditDashboard: () => data(api.get('/admin/audit/dashboard')),
  getReviewSummary: () => data(api.get('/admin/review-center/summary')),
  getReviewList: (params?: any) => data(api.get('/admin/review-center/list', { params })),
  processReview: (id: string, payload: any) => data(api.post(`/admin/review-center/process/${id}`, payload))
};
