const BASE_URL = '/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || `请求失败: ${response.status}`);
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number>) => {
    const searchParams = params
      ? '?' + new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            acc[k] = String(v);
            return acc;
          }, {})
        ).toString()
      : '';
    return request<T>(`${endpoint}${searchParams}`);
  },

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

export const orderApi = {
  getOrders: (params?: Record<string, string | number>) =>
    api.get<{ list: unknown[]; total: number; page: number; pageSize: number }>('/orders', params),
  getOrderDetail: (id: string) =>
    api.get<Record<string, unknown>>(`/orders/${id}`),
  createOrder: (data: Record<string, unknown>) =>
    api.post<Record<string, unknown>>('/orders', data),
};

export const estimateApi = {
  submitEstimate: (data: Record<string, unknown>) =>
    api.post<Record<string, unknown>>('/estimate', data),
};

export const inspectionApi = {
  getInspections: (params?: Record<string, string | number>) =>
    api.get<{ list: unknown[]; total: number; page: number; pageSize: number }>('/inspections', params),
  getInspectionDetail: (id: string) =>
    api.get<Record<string, unknown>>(`/inspections/${id}`),
  checkStep: (id: string, data: Record<string, unknown>) =>
    api.put<Record<string, unknown>>(`/inspections/${id}/check`, data),
  aiScreen: (id: string) =>
    api.post<Record<string, unknown>>(`/inspections/${id}/ai-screen`),
};

export const pricingApi = {
  getRules: (params?: Record<string, string | number>) =>
    api.get<unknown[]>('/pricing/rules', params),
  createRule: (data: Record<string, unknown>) =>
    api.post<Record<string, unknown>>('/pricing/rules', data),
  updateRule: (id: string, data: Record<string, unknown>) =>
    api.put<Record<string, unknown>>(`/pricing/rules/${id}`, data),
  calculatePrice: (data: Record<string, unknown>) =>
    api.post<Record<string, unknown>>('/pricing/calculate', data),
};

export const settlementApi = {
  getSettlements: (params?: Record<string, string | number>) =>
    api.get<{ list: unknown[]; total: number; page: number; pageSize: number }>('/settlements', params),
  executeSettlement: (id: string, data?: Record<string, unknown>) =>
    api.post<Record<string, unknown>>(`/settlements/${id}/execute`, data),
  batchSettlement: (ids: string[]) =>
    api.post<Record<string, unknown>>('/settlements/batch', { settlement_ids: ids }),
};

export const logisticsApi = {
  getLogisticsOrders: (params?: Record<string, string | number>) =>
    api.get<{ list: unknown[]; total: number; page: number; pageSize: number }>('/logistics/orders', params),
  dispatchOrder: (data: Record<string, unknown>) =>
    api.post<Record<string, unknown>>('/logistics/dispatch', data),
};

export const charityApi = {
  getDonations: (params?: Record<string, string | number>) =>
    api.get<{ list: unknown[]; total: number; page: number; pageSize: number }>('/charity/donations', params),
  getProjects: () =>
    api.get<unknown[]>('/charity/projects'),
  donate: (data: Record<string, unknown>) =>
    api.post<Record<string, unknown>>('/charity/donate', data),
};

export const dashboardApi = {
  getStats: () =>
    api.get<Record<string, unknown>>('/dashboard/stats'),
  getTrends: (period?: number) =>
    api.get<Record<string, unknown>>('/dashboard/trends', period ? { days: period } : undefined),
};

export const processorApi = {
  getProcessors: (params?: Record<string, string | number>) =>
    api.get<{ list: unknown[]; total: number; page: number; pageSize: number }>('/processors', params),
  auditProcessor: (id: string, data: Record<string, unknown>) =>
    api.put<Record<string, unknown>>(`/processors/${id}/audit`, data),
};
