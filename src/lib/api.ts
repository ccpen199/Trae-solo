const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  coupons: {
    getPackages: () => request<any>('/coupons/packages'),
    getPackage: (id: string) => request<any>(`/coupons/packages/${id}`),
    createPackage: (data: any) => request<any>('/coupons/packages', { method: 'POST', body: JSON.stringify(data) }),
    getMyCoupons: (userId: number = 1) => request<any>(`/coupons/my?user_id=${userId}`),
    getCoupon: (code: string) => request<any>(`/coupons/${code}`),
    purchase: (data: any) => request<any>('/coupons/purchase', { method: 'POST', body: JSON.stringify(data) }),
    getStores: () => request<any>('/coupons/stores/all'),
    getServices: () => request<any>('/coupons/services/all'),
  },
  verifications: {
    verify: (data: any) => request<any>('/verifications/verify', { method: 'POST', body: JSON.stringify(data) }),
    getHistory: (params?: any) => request<any>(`/verifications/history${params ? '?' + new URLSearchParams(params).toString() : ''}`),
    get: (id: string) => request<any>(`/verifications/${id}`),
  },
  appointments: {
    list: (params?: any) => request<any>(`/appointments${params ? '?' + new URLSearchParams(params).toString() : ''}`),
    create: (data: any) => request<any>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    cancel: (id: string) => request<any>(`/appointments/${id}`, { method: 'DELETE' }),
    getStaff: (storeId?: number) => request<any>(`/appointments/staff${storeId ? `?store_id=${storeId}` : ''}`),
  },
  refunds: {
    list: (params?: any) => request<any>(`/refunds${params ? '?' + new URLSearchParams(params).toString() : ''}`),
    create: (data: any) => request<any>('/refunds', { method: 'POST', body: JSON.stringify(data) }),
    approve: (id: string, operatorId?: number) => request<any>(`/refunds/${id}/approve`, { method: 'PUT', body: JSON.stringify({ operator_id: operatorId }) }),
    reject: (id: string, operatorId?: number, reason?: string) => request<any>(`/refunds/${id}/reject`, { method: 'PUT', body: JSON.stringify({ operator_id: operatorId, reason }) }),
  },
  merchant: {
    getDashboard: (storeId?: number) => request<any>(`/merchant/dashboard${storeId ? `?store_id=${storeId}` : ''}`),
    getVerifications: (params?: any) => request<any>(`/merchant/verifications${params ? '?' + new URLSearchParams(params).toString() : ''}`),
    getSettlements: (params?: any) => request<any>(`/merchant/settlements${params ? '?' + new URLSearchParams(params).toString() : ''}`),
    settle: (data: any) => request<any>('/merchant/settlements/settle', { method: 'POST', body: JSON.stringify(data) }),
    getStorePerformance: (params?: any) => request<any>(`/merchant/store-performance${params ? '?' + new URLSearchParams(params).toString() : ''}`),
    getAnomalies: () => request<any>('/merchant/anomalies'),
  },
};
