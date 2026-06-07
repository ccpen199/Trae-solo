const API_BASE = '/api';

interface ApiOptions extends Omit<RequestInit, 'body'> {
  headers?: Record<string, string>;
  requireAuth?: boolean;
  body?: any;
}

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export async function api<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { requireAuth = true, headers = {}, body, ...rest } = options;

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (requireAuth) {
    const token = getToken();
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers: authHeaders,
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw new Error(data.error || data.message || `请求失败: ${response.status}`);
  }

  return data as T;
}

export const authApi = {
  login: (phone: string, password: string) =>
    api('/auth/login', { method: 'POST', body: { phone, password }, requireAuth: false }),
  register: (data: any) =>
    api('/auth/register', { method: 'POST', body: data, requireAuth: false }),
  me: () => api('/auth/me'),
  logout: () => api('/auth/logout', { method: 'POST' }),
};

export const propertyApi = {
  list: (params?: any) => {
    const q = new URLSearchParams(params as any).toString();
    return api(`/properties${q ? '?' + q : ''}`);
  },
  get: (id: number) => api(`/properties/${id}`),
  create: (data: any) => api('/properties', { method: 'POST', body: data }),
  update: (id: number, data: any) => api(`/properties/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => api(`/properties/${id}`, { method: 'DELETE' }),
  valuation: (id: number) => api(`/properties/${id}/valuation`, { method: 'POST' }),
  contract: (id: number, templateType: string) =>
    api(`/properties/${id}/contract`, { method: 'POST', body: { templateType } }),
};

export const transactionApi = {
  list: (params?: any) => {
    const q = new URLSearchParams(params as any).toString();
    return api(`/transactions${q ? '?' + q : ''}`);
  },
  get: (id: number) => api(`/transactions/${id}`),
  create: (data: any) => api('/transactions', { method: 'POST', body: data }),
  updateNode: (id: number, nodeId: number, status: string) =>
    api(`/transactions/${id}/nodes`, { method: 'PUT', body: { nodeId, status } }),
  commission: (id: number) => api(`/transactions/${id}/commission`),
};

export const leaseApi = {
  list: (params?: any) => {
    const q = new URLSearchParams(params as any).toString();
    return api(`/leases${q ? '?' + q : ''}`);
  },
  get: (id: number) => api(`/leases/${id}`),
  create: (data: any) => api('/leases', { method: 'POST', body: data }),
  update: (id: number, data: any) => api(`/leases/${id}`, { method: 'PUT', body: data }),
  terminate: (id: number, reason: string) =>
    api(`/leases/${id}/terminate`, { method: 'POST', body: { reason } }),
  deductPayment: (id: number) =>
    api(`/leases/${id}/payments/deduct`, { method: 'POST' }),
};

export const workOrderApi = {
  list: (params?: any) => {
    const q = new URLSearchParams(params as any).toString();
    return api(`/work-orders${q ? '?' + q : ''}`);
  },
  get: (id: number) => api(`/work-orders/${id}`),
  create: (data: any) => api('/work-orders', { method: 'POST', body: data }),
  assign: (id: number, agentId: number) =>
    api(`/work-orders/${id}/assign`, { method: 'PUT', body: { agentId } }),
  start: (id: number) =>
    api(`/work-orders/${id}/start`, { method: 'PUT' }),
  complete: (id: number, result: string) =>
    api(`/work-orders/${id}/complete`, { method: 'PUT', body: { result } }),
};

export const dashboardApi = {
  agentPerformance: (period?: string) =>
    api(`/dashboard/agent-performance${period ? '?period=' + period : ''}`),
  propertyHealth: () => api('/dashboard/property-health'),
  supplyChain: () => api('/dashboard/supply-chain'),
  createSupplier: (data: any) =>
    api('/dashboard/supply-chain', { method: 'POST', body: data }),
  updateSupplier: (id: number, data: any) =>
    api(`/dashboard/supply-chain/${id}`, { method: 'PUT', body: data }),
  getSettings: () => api('/dashboard/settings'),
  updateSettings: (data: any) =>
    api('/dashboard/settings', { method: 'PUT', body: data }),
};
