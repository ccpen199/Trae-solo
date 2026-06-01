const API_BASE = '/api';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const request = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok || data.code !== 0) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || `请求失败: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    throw error;
  }
};

export const api = {
  get: <T>(url: string, params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<T>(`${url}${query}`, { method: 'GET' });
  },

  post: <T>(url: string, data?: any) => {
    return request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data || {})
    });
  },

  put: <T>(url: string, data?: any) => {
    return request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data || {})
    });
  },

  delete: <T>(url: string) => {
    return request<T>(url, { method: 'DELETE' });
  }
};

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  profile: () => api.get('/auth/profile'),
  changePassword: (data: { old_password: string; new_password: string }) =>
    api.post('/auth/change-password', data)
};

export const mastersApi = {
  getProducts: (params?: any) => api.get('/masters/products', params),
  getProduct: (id: number) => api.get(`/masters/products/${id}`),
  getCategories: () => api.get('/masters/categories'),
  getMembers: (params?: any) => api.get('/masters/members', params),
  getMember: (id: number) => api.get(`/masters/members/${id}`),
  getMemberByPhone: (phone: string) => api.get(`/masters/members/phone/${phone}`),
  getStores: (params?: any) => api.get('/masters/stores', params),
  getPromotions: (params?: any) => api.get('/masters/promotions', params),
  getUsers: (params?: any) => api.get('/masters/users', params),
  getRoles: () => api.get('/masters/roles'),
  createProduct: (data: any) => api.post('/masters/products', data),
  updateProduct: (id: number, data: any) => api.put(`/masters/products/${id}`, data),
  deleteProduct: (id: number) => api.delete(`/masters/products/${id}`),
  createMember: (data: any) => api.post('/masters/members', data),
  createStore: (data: any) => api.post('/masters/stores', data),
  createUser: (data: any) => api.post('/masters/users', data),
  updateUser: (id: number, data: any) => api.put(`/masters/users/${id}`, data)
};

export const ordersApi = {
  getOrders: (params?: any) => api.get('/orders', params),
  getOrder: (id: number) => api.get(`/orders/${id}`),
  verifyOrder: (id: number) => api.get(`/orders/${id}/verify`),
  createOrder: (data: any) => api.post('/orders', data),
  cancelOrder: (id: number) => api.post(`/orders/${id}/cancel`)
};

export const refundsApi = {
  getRefunds: (params?: any) => api.get('/refunds', params),
  getRefund: (id: number) => api.get(`/refunds/${id}`),
  createRefund: (data: any) => api.post('/refunds', data),
  reviewRefund: (id: number, data: any) => api.post(`/refunds/${id}/review`, data)
};

export const shiftsApi = {
  getShifts: (params?: any) => api.get('/shifts', params),
  getCurrentShift: () => api.get('/shifts/current'),
  getShift: (id: number) => api.get(`/shifts/${id}`),
  openShift: () => api.post('/shifts/open'),
  closeShift: (id: number, data: any) => api.post(`/shifts/${id}/close`),
  exportShift: (id: number) => api.get(`/shifts/${id}/export`)
};

export const reconciliationApi = {
  getReconciliations: (params?: any) => api.get('/reconciliation', params),
  getReconciliation: (id: number) => api.get(`/reconciliation/${id}`),
  createReconciliation: (data: any) => api.post('/reconciliation', data),
  reviewReconciliation: (id: number, data: any) => api.post(`/reconciliation/${id}/review`),
  markItem: (id: number, data: any) => api.post(`/reconciliation/items/${id}/mark`),
  exportReconciliation: (id: number) => api.get(`/reconciliation/${id}/export`)
};

export const reportsApi = {
  getOverview: (params?: any) => api.get('/reports/overview', params),
  getSalesTrend: (params?: any) => api.get('/reports/sales-trend', params),
  getByStore: (params?: any) => api.get('/reports/by-store', params),
  getByCashier: (params?: any) => api.get('/reports/by-cashier', params),
  getByChannel: (params?: any) => api.get('/reports/by-channel', params),
  getByCategory: (params?: any) => api.get('/reports/by-category', params),
  getExceptions: (params?: any) => api.get('/reports/exceptions', params),
  getAuditLogs: (params?: any) => api.get('/reports/audit-logs', params),
  getRoles: () => api.get('/reports/roles'),
  getPermissions: () => api.get('/reports/permissions'),
  updateRolePermissions: (id: number, permissionIds: number[]) =>
    api.post(`/reports/roles/${id}/permissions`, { permission_ids: permissionIds }),
  exportDailySettlement: (date: string, params?: any) =>
    api.get(`/reports/daily-settlement/${date}/export`, params)
};
