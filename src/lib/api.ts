const API_BASE = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

const request = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });
    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: '网络请求失败',
    } as ApiResponse<T>;
  }
};

export const api = {
  auth: {
    login: (data: { username: string; password: string }) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: any) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    profile: () => request('/auth/profile'),
  },
  properties: {
    list: (params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return request(`/properties${query ? `?${query}` : ''}`);
    },
    detail: (id: string) => request(`/properties/${id}`),
    create: (data: any) =>
      request('/properties', { method: 'POST', body: JSON.stringify(data) }),
    mapSearch: (params: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return request(`/properties/map/search?${query}`);
    },
    inquiry: (id: string, data: any) =>
      request(`/properties/${id}/inquiry`, { method: 'POST', body: JSON.stringify(data) }),
    favorite: (id: string) =>
      request(`/properties/${id}/favorite`, { method: 'POST' }),
    appeal: (id: string, data: any) =>
      request(`/properties/${id}/appeal`, { method: 'POST', body: JSON.stringify(data) }),
    verification: (id: string) =>
      request(`/properties/${id}/verification`),
  },
  agents: {
    list: (params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return request(`/agents${query ? `?${query}` : ''}`);
    },
    detail: (id: string) => request(`/agents/${id}`),
    credit: (id: string) => request(`/agents/${id}/credit`),
  },
  tools: {
    calculateMortgage: (data: any) =>
      request('/tools/mortgage/calculate', { method: 'POST', body: JSON.stringify(data) }),
    saveMortgage: (data: any) =>
      request('/tools/mortgage/save', { method: 'POST', body: JSON.stringify(data) }),
    decorationPlans: (params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return request(`/tools/decoration/plans${query ? `?${query}` : ''}`);
    },
    saveViewingNote: (data: any) =>
      request('/tools/viewing-notes', { method: 'POST', body: JSON.stringify(data) }),
    getViewingNotes: () => request('/tools/viewing-notes'),
    getHeatmap: (params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return request(`/tools/heatmap${query ? `?${query}` : ''}`);
    },
    ocrCertificate: (data: any) =>
      request('/tools/ocr/certificate', { method: 'POST', body: JSON.stringify(data) }),
    fakeDetection: (propertyId: string) =>
      request(`/tools/fake-detection/${propertyId}`, { method: 'POST' }),
  },
  admin: {
    dashboard: () => request('/admin/dashboard'),
    properties: (params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/properties${query ? `?${query}` : ''}`);
    },
    verifyProperty: (id: string, data: any) =>
      request(`/admin/properties/${id}/verify`, { method: 'POST', body: JSON.stringify(data) }),
    appeals: (params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/appeals${query ? `?${query}` : ''}`);
    },
    handleAppeal: (id: string, data: any) =>
      request(`/admin/appeals/${id}/handle`, { method: 'POST', body: JSON.stringify(data) }),
    agents: (params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/agents${query ? `?${query}` : ''}`);
    },
    approveAgent: (id: string) =>
      request(`/admin/agents/${id}/approve`, { method: 'POST' }),
    inspections: () => request('/admin/inspections'),
    handleInspection: (id: string, data: any) =>
      request(`/admin/inspections/${id}/handle`, { method: 'POST', body: JSON.stringify(data) }),
    riskControls: () => request('/admin/risk-controls'),
    handleRiskControl: (id: string, data: any) =>
      request(`/admin/risk-controls/${id}/handle`, { method: 'POST', body: JSON.stringify(data) }),
    generateHeatmap: () => request('/admin/heatmap/generate'),
  },
};
