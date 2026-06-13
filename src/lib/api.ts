const API_BASE_URL = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function request<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request error:', error);
    return {
      success: false,
      error: '网络请求失败',
    };
  }
}

export const api = {
  get: <T = any>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, body?: any) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T = any>(url: string, body?: any) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = any>(url: string) => request<T>(url, { method: 'DELETE' }),
};

export const propertyApi = {
  getList: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/properties${query ? `?${query}` : ''}`);
  },
  getDetail: (id: string) => api.get(`/properties/${id}`),
  getLicenses: (id: string) => api.get(`/properties/${id}/licenses`),
  getBuildings: (id: string) => api.get(`/properties/${id}/buildings`),
  getStats: () => api.get('/properties/stats/summary'),
  getFilterOptions: () => api.get('/properties/filters/options'),
};

export const mapApi = {
  getHeatmap: (type: string = 'price') =>
    api.get(`/map/heatmap?type=${type}`),
  getSubways: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/map/subway${query ? `?${query}` : ''}`);
  },
  getSubwayProperties: (id: string) =>
    api.get(`/map/subway/${id}/properties`),
  getSchools: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/map/schools${query ? `?${query}` : ''}`);
  },
  getSchoolProperties: (id: string) =>
    api.get(`/map/schools/${id}/properties`),
  getNearbyProperties: (lat: number, lng: number, radius?: number) =>
    api.get(`/map/properties/nearby?lat=${lat}&lng=${lng}${radius ? `&radius=${radius}` : ''}`),
  getMapProperties: (bounds?: any) => {
    const params = bounds ? { bounds: JSON.stringify(bounds) } : {};
    const query = new URLSearchParams(params).toString();
    return api.get(`/map/map/properties${query ? `?${query}` : ''}`);
  },
};

export const butlerApi = {
  createRequirement: (data: any) =>
    api.post('/butler/requirements', data),
  getRequirements: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/butler/requirements${query ? `?${query}` : ''}`);
  },
  getRequirement: (id: string) =>
    api.get(`/butler/requirements/${id}`),
  getMatchReport: (requirementId: string) =>
    api.get(`/butler/match-reports/${requirementId}`),
  reviewMatchReport: (id: string, data: any) =>
    api.post(`/butler/match-reports/${id}/review`, data),
  getConsultants: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/butler/consultants${query ? `?${query}` : ''}`);
  },
  getConsultant: (id: string) =>
    api.get(`/butler/consultants/${id}`),
  createViewingAppointment: (data: any) =>
    api.post('/butler/viewing-appointments', data),
  getViewingAppointments: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/butler/viewing-appointments${query ? `?${query}` : ''}`);
  },
  updateAppointmentStatus: (id: string, status: string) =>
    api.put(`/butler/viewing-appointments/${id}/status`, { status }),
  createContractProgress: (data: any) =>
    api.post('/butler/contract-progress', data),
  getContractProgress: (requirementId: string) =>
    api.get(`/butler/contract-progress/${requirementId}`),
  updateContractStage: (id: string, stageIndex: number) =>
    api.put(`/butler/contract-progress/${id}/stage`, { stageIndex }),
};

export const operationApi = {
  getSubsidies: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/operation/subsidies${query ? `?${query}` : ''}`);
  },
  getSubsidy: (id: string) =>
    api.get(`/operation/subsidies/${id}`),
  claimSubsidy: (id: string, data: any) =>
    api.post(`/operation/subsidies/${id}/claim`, data),
  getUserSubsidies: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/operation/user-subsidies${query ? `?${query}` : ''}`);
  },
  useSubsidy: (id: string, propertyId: string) =>
    api.post(`/operation/user-subsidies/${id}/use`, { propertyId }),
  getSubsidyStats: () =>
    api.get('/operation/subsidies/stats/summary'),
  getJourneyFunnel: (period?: string) =>
    api.get(`/operation/journey/funnel${period ? `?period=${period}` : ''}`),
  getJourneyDetails: () =>
    api.get('/operation/journey/funnel/details'),
  getSalesComparison: () =>
    api.get('/operation/data/sales-comparison'),
  getMarketOverview: () =>
    api.get('/operation/data/market-overview'),
};
