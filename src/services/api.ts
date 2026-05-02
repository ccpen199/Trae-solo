import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile')
};

export const shopsAPI = {
  getAll: (params?: { platform?: string; status?: string }) =>
    api.get('/shops', { params }),
  getById: (id: number) => api.get(`/shops/${id}`),
  create: (data: any) => api.post('/shops', data),
  update: (id: number, data: any) => api.put(`/shops/${id}`, data),
  delete: (id: number) => api.delete(`/shops/${id}`),
  authorize: (id: number, authCode: string) =>
    api.post(`/shops/${id}/authorize`, { auth_code: authCode }),
  sync: (id: number) => api.post(`/shops/${id}/sync`)
};

export const productsAPI = {
  getAll: (params?: { category?: string; status?: string; search?: string }) =>
    api.get('/products', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  publish: (id: number, platforms: string[]) =>
    api.post(`/products/${id}/publish`, { platforms })
};

export const skusAPI = {
  getAll: (params?: { product_id?: number; low_stock?: boolean }) =>
    api.get('/skus', { params }),
  getById: (id: number) => api.get(`/skus/${id}`),
  create: (data: any) => api.post('/skus', data),
  update: (id: number, data: any) => api.put(`/skus/${id}`, data),
  delete: (id: number) => api.delete(`/skus/${id}`),
  updateStock: (id: number, delta: number, reason?: string) =>
    api.put(`/skus/${id}/stock`, { delta, reason }),
  batchUpdateStock: (updates: { sku_id: number; delta: number; reason?: string }[]) =>
    api.post('/skus/batch-update-stock', { updates })
};

export const ordersAPI = {
  getAll: (params?: {
    shop_id?: number;
    platform?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }) => api.get('/orders', { params }),
  getById: (id: number) => api.get(`/orders/${id}`),
  getProcessingChain: (id: number) => api.get(`/orders/${id}/processing-chain`),
  updateStatus: (id: number, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
  confirm: (id: number) => api.post(`/orders/${id}/confirm`),
  cancel: (id: number, reason?: string) =>
    api.post(`/orders/${id}/cancel`, { reason }),
  merge: (orderIds: number[]) => api.post('/orders/merge', { order_ids: orderIds }),
  sync: (shopId?: number) => api.post('/orders/sync', { shop_id: shopId }),
  getProfit: (id: number) => api.get(`/orders/${id}/profit`)
};

export const warehousesAPI = {
  getPending: () => api.get('/warehouses/pending'),
  getShipments: (params?: { status?: string; carrier?: string }) =>
    api.get('/warehouses/shipments', { params }),
  ship: (orderId: number, data: {
    tracking_number?: string;
    carrier?: string;
    package_info?: any;
    estimated_delivery?: string;
  }) => api.post(`/warehouses/${orderId}/ship`, data),
  updateTracking: (shipmentId: number, data: {
    tracking_number?: string;
    carrier?: string;
    status?: string;
  }) => api.put(`/warehouses/${shipmentId}/tracking`, data)
};

export const customersAPI = {
  getAfterSales: (params?: {
    type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }) => api.get('/customers/after-sales', { params }),
  getAfterSaleById: (id: number) => api.get(`/customers/after-sales/${id}`),
  getProcessingChain: (id: number) =>
    api.get(`/customers/after-sales/${id}/processing-chain`),
  create: (data: {
    order_id: number;
    type: 'refund' | 'return' | 'dispute';
    reason?: string;
    description?: string;
    amount?: number;
  }) => api.post('/customers/after-sales', data),
  update: (id: number, data: {
    status?: string;
    action?: string;
    notes?: string;
  }) => api.put(`/customers/after-sales/${id}`, data)
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getSales: (params?: {
    start_date?: string;
    end_date?: string;
    group_by?: string;
    platform?: string;
    shop_id?: number;
  }) => api.get('/analytics/sales', { params }),
  getProfit: (params: { start_date: string; end_date: string; group_by?: string }) =>
    api.get('/analytics/profit', { params }),
  getInventory: (params?: { low_stock?: boolean; category?: string }) =>
    api.get('/analytics/inventory', { params }),
  getAfterSales: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/analytics/after-sales', { params })
};

export const alertsAPI = {
  getAll: (params?: {
    type?: string;
    level?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/alerts', { params }),
  update: (id: number, data: { status?: string; assigned_to?: number }) =>
    api.put(`/alerts/${id}`, data),
  resolve: (id: number, notes?: string) =>
    api.post(`/alerts/${id}/resolve`, { notes })
};

export default api;