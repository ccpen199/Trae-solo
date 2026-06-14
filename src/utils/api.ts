import type {
  Property,
  SearchFilters,
  MapSearchParams,
  MetroSearchParams,
  PriceTrendPoint,
  MortgageParams,
  MortgageResult,
  TaxParams,
  TaxResult,
  Agent,
  ApiResponse,
  ViewingRecord,
  Client,
  Deal,
  RegulatoryReport,
} from '@shared/types';

const BASE_URL = '/api';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { requireAuth = false, headers, ...rest } = options;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = localStorage.getItem('user-store');
    if (token) {
      try {
        const userStore = JSON.parse(token);
        if (userStore.state?.token) {
          defaultHeaders['Authorization'] = `Bearer ${userStore.state.token}`;
        }
      } catch {
        // ignore
      }
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { ...defaultHeaders, ...headers },
      ...rest,
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络错误',
    };
  }
}

export const propertyApi = {
  getPropertyList: (filters?: SearchFilters): Promise<ApiResponse<{ list: Property[]; total: number; page: number; pageSize: number }>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    return fetchApi<{ list: Property[]; total: number; page: number; pageSize: number }>(`/properties${params.toString() ? `?${params.toString()}` : ''}`);
  },

  getPropertyById: (id: string): Promise<ApiResponse<Property>> =>
    fetchApi<Property>(`/properties/${id}`),

  getPropertyRecommendations: (): Promise<ApiResponse<Property[]>> =>
    fetchApi<{ list: Property[]; total: number; page: number; pageSize: number }>('/properties?sortBy=weight&pageSize=8').then(res => ({
      ...res,
      data: res.success ? (res.data?.list || []) : []
    }) as unknown as ApiResponse<Property[]>),

  searchByKeyword: (keyword: string, filters?: SearchFilters): Promise<ApiResponse<{ list: Property[]; total: number; page: number; pageSize: number }>> => {
    const params = new URLSearchParams({ keyword });
    if (filters?.type) params.append('type', filters.type);
    return fetchApi<{ list: Property[]; total: number; page: number; pageSize: number }>(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  },

  searchByMap: (params: MapSearchParams): Promise<ApiResponse<Property[]>> => {
    const queryParams = new URLSearchParams({
      southWestLat: String(params.bounds.southWest.lat),
      southWestLng: String(params.bounds.southWest.lng),
      northEastLat: String(params.bounds.northEast.lat),
      northEastLng: String(params.bounds.northEast.lng),
    });
    if (params.filters?.type) queryParams.append('type', params.filters.type);
    return fetchApi<Property[]>(`/properties/map?${queryParams.toString()}`);
  },

  searchByMetro: (params: MetroSearchParams): Promise<ApiResponse<Property[]>> => {
    const queryParams = new URLSearchParams({
      stationName: params.stationName,
      radius: String(params.radius || 1000),
    });
    if (params.filters?.type) queryParams.append('type', params.filters.type);
    return fetchApi<Property[]>(`/properties/nearby?${queryParams.toString()}`);
  },

  getSimilarProperties: (id: string): Promise<ApiResponse<Property[]>> =>
    fetchApi<{ list: Property[]; total: number; page: number; pageSize: number }>('/properties?pageSize=5').then(res => ({
      ...res,
      data: res.success ? (res.data?.list?.slice(0, 5) || []) : []
    }) as unknown as ApiResponse<Property[]>),
};

export const priceApi = {
  getPriceTrend: (
    city: string,
    district?: string
  ): Promise<ApiResponse<PriceTrendPoint[]>> => {
    const params = new URLSearchParams();
    if (district) params.append('district', district);
    return fetchApi<PriceTrendPoint[]>(
      `/search/price-trend${params.toString() ? `?${params.toString()}` : ''}`
    );
  },

  getPropertyPriceHistory: (id: string): Promise<ApiResponse<PriceTrendPoint[]>> =>
    fetchApi<PriceTrendPoint[]>(`/search/price-trend?days=30`),
};

export const calculatorApi = {
  calculateMortgage: (params: MortgageParams): Promise<ApiResponse<MortgageResult>> =>
    fetchApi<MortgageResult>('/calculate/mortgage', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  calculateTax: (params: TaxParams): Promise<ApiResponse<TaxResult>> =>
    fetchApi<TaxResult>('/calculate/tax', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

export const agentApi = {
  getAgentList: (): Promise<ApiResponse<Agent[]>> =>
    fetchApi<Agent[]>('/agent?action=list'),

  getAgentById: (id: string): Promise<ApiResponse<Agent>> =>
    fetchApi<Agent>(`/agent?agentId=${id}`),

  getAgentProperties: (agentId: string): Promise<ApiResponse<Property[]>> =>
    fetchApi<{ list: Property[]; total: number; page: number; pageSize: number }>(`/properties?agentId=${agentId}`).then(res => ({
      ...res,
      data: res.success ? (res.data?.list || []) : []
    }) as unknown as ApiResponse<Property[]>),

  getAgentDeals: (agentId: string): Promise<ApiResponse<Deal[]>> =>
    fetchApi<Deal[]>(`/agent/deals?agentId=${agentId}`, { requireAuth: true }),

  getDashboardStats: (agentId: string): Promise<ApiResponse<{
    todayViewings: number;
    monthlyDeals: number;
    pendingClients: number;
    totalCommission: number;
    dealTrend: { month: string; count: number; amount: number }[];
    intentDistribution: { name: string; value: number }[];
    todos: { id: string; title: string; priority: 'high' | 'medium' | 'low'; deadline: string }[];
    recentViewings: ViewingRecord[];
  }>> =>
    fetchApi(`/agent/statistics?agentId=${agentId}`, { requireAuth: true }),

  getViewingRecords: (agentId: string, filters?: {
    dateFrom?: string;
    dateTo?: string;
    clientId?: string;
    interestLevel?: 'high' | 'medium' | 'low';
  }): Promise<ApiResponse<ViewingRecord[]>> => {
    const params = new URLSearchParams({ agentId });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return fetchApi<ViewingRecord[]>(
      `/agent/viewings?${params.toString()}`,
      { requireAuth: true }
    );
  },

  createViewingRecord: (agentId: string, data: Omit<ViewingRecord, 'id' | 'agentId' | 'createdAt'>): Promise<ApiResponse<ViewingRecord>> =>
    fetchApi<ViewingRecord>('/agent/viewings', {
      method: 'POST',
      body: JSON.stringify({ ...data, agentId }),
      requireAuth: true,
    }),

  updateViewingFeedback: (agentId: string, viewingId: string, feedback: string, interestLevel: 'high' | 'medium' | 'low'): Promise<ApiResponse<ViewingRecord>> =>
    fetchApi<ViewingRecord>(`/agent/viewings/${viewingId}/feedback?agentId=${agentId}`, {
      method: 'PUT',
      body: JSON.stringify({ feedback, interestLevel }),
      requireAuth: true,
    }),

  getClients: (agentId: string, level?: 'A' | 'B' | 'C'): Promise<ApiResponse<Client[]>> => {
    const params = new URLSearchParams({ agentId });
    if (level) params.append('level', level);
    return fetchApi<Client[]>(`/agent/clients?${params.toString()}`, { requireAuth: true });
  },

  createClient: (agentId: string, data: Omit<Client, 'id' | 'agentId' | 'createdAt'>): Promise<ApiResponse<Client>> =>
    fetchApi<Client>('/agent/clients', {
      method: 'POST',
      body: JSON.stringify({ ...data, agentId }),
      requireAuth: true,
    }),

  getClientFollowUps: (agentId: string, clientId: string): Promise<ApiResponse<{
    id: string;
    content: string;
    type: 'call' | 'viewing' | 'message' | 'other';
    createdAt: string;
  }[]>> =>
    fetchApi(`/agent/clients/${clientId}/followups?agentId=${agentId}`, { requireAuth: true }),

  addFollowUp: (agentId: string, clientId: string, content: string, type: 'call' | 'viewing' | 'message' | 'other'): Promise<ApiResponse<unknown>> =>
    fetchApi(`/agent/clients/${clientId}/followups?agentId=${agentId}`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
      requireAuth: true,
    }),

  getDeals: (agentId: string, status?: 'pending' | 'completed' | 'reported'): Promise<ApiResponse<Deal[]>> => {
    const params = new URLSearchParams({ agentId });
    if (status) params.append('status', status);
    return fetchApi<Deal[]>(`/agent/deals?${params.toString()}`, { requireAuth: true });
  },

  createDeal: (agentId: string, data: Omit<Deal, 'id' | 'agentId' | 'createdAt' | 'status'>): Promise<ApiResponse<Deal>> =>
    fetchApi<Deal>('/agent/deals', {
      method: 'POST',
      body: JSON.stringify({ ...data, agentId, status: 'pending' }),
      requireAuth: true,
    }),

  updateDealStatus: (agentId: string, dealId: string, status: 'pending' | 'completed' | 'reported'): Promise<ApiResponse<Deal>> =>
    fetchApi<Deal>(`/agent/deals/${dealId}/status?agentId=${agentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
      requireAuth: true,
    }),

  calculateCommission: (dealPrice: number, commissionRate: number = 0.02): Promise<ApiResponse<{
    commission: number;
    breakdown: { name: string; amount: number }[];
  }>> =>
    fetchApi('/calculate/commission', {
      method: 'POST',
      body: JSON.stringify({ dealPrice, commissionRate }),
      requireAuth: true,
    }),

  reportToRegulatory: (agentId: string, dealId: string): Promise<ApiResponse<RegulatoryReport>> =>
    fetchApi<RegulatoryReport>(`/agent/deals/${dealId}/report?agentId=${agentId}`, {
      method: 'POST',
      requireAuth: true,
    }),
};

export const authApi = {
  login: (phone: string, password: string): Promise<ApiResponse<{ token: string; user: unknown }>> =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  logout: (): Promise<ApiResponse<null>> =>
    fetchApi('/auth/logout', {
      method: 'POST',
      requireAuth: true,
    }),

  getCurrentUser: (): Promise<ApiResponse<unknown>> =>
    fetchApi('/auth/me', {
      requireAuth: true,
    }),
};

export const userApi = {
  bookViewing: (
    propertyId: string, date: string, timeSlot: string
  ): Promise<ApiResponse<unknown>> =>
    fetchApi('/user/viewings', {
      method: 'POST',
      body: JSON.stringify({ propertyId, date, timeSlot }),
      requireAuth: true,
    }),

  getViewingHistory: (): Promise<ApiResponse<unknown[]>> =>
    fetchApi('/user/viewings', { requireAuth: true }),

  getFavorites: (): Promise<ApiResponse<string[]>> =>
    fetchApi<string[]>('/user/favorites', { requireAuth: true }),

  addFavorite: (propertyId: string): Promise<ApiResponse<null>> =>
    fetchApi('/user/favorites', {
      method: 'POST',
      body: JSON.stringify({ propertyId }),
      requireAuth: true,
    }),

  removeFavorite: (propertyId: string): Promise<ApiResponse<null>> =>
    fetchApi(`/user/favorites/${propertyId}`, {
      method: 'DELETE',
      requireAuth: true,
    }),
};
