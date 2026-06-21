import type { ApiResponse, MarketPrice, PricePoint, RegionalPrice, PriceAlert, Supply, SupplyFilter, Station, AllianceNode, AllianceTask, Settlement, DashboardMetrics, DataPoint, FunnelStep, User } from '../../shared/types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (options.headers) {
    const extra = options.headers as Record<string, string>;
    Object.entries(extra).forEach(([k, v]) => { headers[k] = v; });
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `HTTP error! status: ${response.status}`);
  }

  return data;
}

export const authAPI = {
  login: (phone: string, password: string, role: string) =>
    request<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password, role }),
    }),
  
  register: (phone: string, password: string, role: string, companyName: string) =>
    request<ApiResponse<{ userId: string }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone, password, role, companyName }),
    }),
  
  getMe: () =>
    request<ApiResponse<{ user: User }>>('/auth/me'),
  
  logout: () =>
    request<ApiResponse<null>>('/auth/logout', { method: 'POST' }),
};

export const marketAPI = {
  getPrices: () =>
    request<ApiResponse<{ categories: MarketPrice[]; updateTime: string }>>('/market/prices'),
  
  getHistory: (category: string, startDate?: string, endDate?: string, region?: string) => {
    const params = new URLSearchParams({ category });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (region) params.append('region', region);
    return request<ApiResponse<{ data: PricePoint[]; region?: string }>>(`/market/history?${params}`);
  },
  
  getRegional: (category: string) =>
    request<ApiResponse<{ regions: RegionalPrice[] }>>(`/market/regional?category=${category}`),
  
  getAlerts: () =>
    request<ApiResponse<{ alerts: PriceAlert[] }>>('/market/alerts'),
  
  createAlert: (category: string, threshold: number, type: 'above' | 'below', notifyType: string[]) =>
    request<ApiResponse<{ alertId: string }>>('/market/alerts', {
      method: 'POST',
      body: JSON.stringify({ category, threshold, type, notifyType }),
    }),
  
  deleteAlert: (id: string) =>
    request<ApiResponse<null>>(`/market/alerts/${id}`, { method: 'DELETE' }),
};

export const suppliesAPI = {
  getList: (filter?: SupplyFilter) => {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return request<ApiResponse<Supply[]>>(`/supplies?${params}`);
  },
  
  create: (data: Partial<Supply> & { location?: { province: string; city: string; address: string } }) =>
    request<ApiResponse<{ supplyId: string }>>('/supplies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getDetail: (id: string) =>
    request<ApiResponse<Supply>>(`/supplies/${id}`),
  
  createInquiry: (id: string, message: string, expectedPrice?: number) =>
    request<ApiResponse<{ inquiryId: string }>>(`/supplies/${id}/inquiry`, {
      method: 'POST',
      body: JSON.stringify({ message, expectedPrice }),
    }),
};

export const stationsAPI = {
  getList: (region?: string, category?: string, page = 1, pageSize = 20) => {
    const params = new URLSearchParams();
    if (region) params.append('region', region);
    if (category) params.append('category', category);
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));
    return request<ApiResponse<Station[]>>(`/stations?${params}`);
  },
  
  getDetail: (id: string) =>
    request<ApiResponse<Station>>(`/stations/${id}`),
  
  update: (id: string, data: Partial<Station>) =>
    request<ApiResponse<{ success: boolean }>>(`/stations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const allianceAPI = {
  getStructure: () =>
    request<ApiResponse<{ structure: AllianceNode }>>('/alliance/structure'),
  
  getTasks: () =>
    request<ApiResponse<{ tasks: AllianceTask[] }>>('/alliance/tasks'),
  
  createTask: (title: string, description: string, assigneeId: string, deadline: string) =>
    request<ApiResponse<{ taskId: string }>>('/alliance/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description, assigneeId, deadline }),
    }),
  
  updateTaskStatus: (id: string, status: string) =>
    request<ApiResponse<{ success: boolean }>>(`/alliance/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  
  getSettlements: (month?: string) => {
    const params = month ? `?month=${month}` : '';
    return request<ApiResponse<{ settlements: Settlement[] }>>(`/alliance/settlements${params}`);
  },
  
  getRules: () =>
    request<ApiResponse<{ rules: any[] }>>('/alliance/rules'),
  
  updateRule: (role: string, percentage: number) =>
    request<ApiResponse<{ success: boolean }>>('/alliance/rules', {
      method: 'POST',
      body: JSON.stringify({ role, percentage }),
    }),
};

export const dashboardAPI = {
  getMetrics: () =>
    request<ApiResponse<DashboardMetrics>>('/dashboard/metrics'),
  
  getSupplyDemand: (period: 'week' | 'month' | 'quarter' | 'year' = 'month') =>
    request<ApiResponse<{ supplyData: DataPoint[]; demandData: DataPoint[] }>>(`/dashboard/supply-demand?period=${period}`),
  
  getFunnel: (period: 'week' | 'month' | 'quarter' = 'month') =>
    request<ApiResponse<{ funnel: FunnelStep[]; period: string }>>(`/dashboard/funnel?period=${period}`),
  
  getRegionalStats: () =>
    request<ApiResponse<any[]>>('/dashboard/regional-stats'),
  
  getCategoryStats: () =>
    request<ApiResponse<any[]>>('/dashboard/category-stats'),
};
