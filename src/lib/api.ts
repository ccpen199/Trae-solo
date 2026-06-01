const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }
  
  return data;
}

export const api = {
  auth: {
    register: (data: { username: string; email: string; password: string; role: string; phone?: string }) =>
      request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    
    login: (data: { username: string; password: string }) =>
      request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    
    profile: () => request<any>('/auth/profile'),
    
    updateProfile: (data: any) =>
      request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
    
    verify: (data: { real_name: string; id_card: string }) =>
      request<any>('/auth/verify', { method: 'POST', body: JSON.stringify(data) }),
  },

  demands: {
    list: (params?: { status?: string; industry?: string; region?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any>(`/demands?${query}`);
    },
    
    my: (params?: { status?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any>(`/demands/my?${query}`);
    },
    
    get: (id: number) => request<any>(`/demands/${id}`),
    
    create: (data: any) =>
      request<any>('/demands', { method: 'POST', body: JSON.stringify(data) }),
    
    update: (id: number, data: any) =>
      request<any>(`/demands/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    
    publish: (id: number) =>
      request<any>(`/demands/${id}/publish`, { method: 'POST' }),
    
    delete: (id: number) =>
      request<any>(`/demands/${id}`, { method: 'DELETE' }),
  },

  enterprises: {
    my: () => request<any>('/enterprises/my'),
    
    list: (params?: { industry?: string; region?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any>(`/enterprises?${query}`);
    },
    
    get: (id: number) => request<any>(`/enterprises/${id}`),
    
    create: (data: any) =>
      request<any>('/enterprises', { method: 'POST', body: JSON.stringify(data) }),
    
    update: (id: number, data: any) =>
      request<any>(`/enterprises/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    
    capabilities: () => request<any>('/enterprises/capabilities/my'),
    
    addCapability: (data: any) =>
      request<any>('/enterprises/capabilities', { method: 'POST', body: JSON.stringify(data) }),
  },

  quotes: {
    my: (params?: { status?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any>(`/quotes/my?${query}`);
    },
    
    received: (params?: { status?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any>(`/quotes/received?${query}`);
    },
    
    create: (data: any) =>
      request<any>('/quotes', { method: 'POST', body: JSON.stringify(data) }),
    
    accept: (id: number) =>
      request<any>(`/quotes/${id}/accept`, { method: 'POST' }),
    
    reject: (id: number) =>
      request<any>(`/quotes/${id}/reject`, { method: 'POST' }),
  },

  matches: {
    list: (params?: { status?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any>(`/matches?${query}`);
    },
    
    run: (demandId: number) =>
      request<any>(`/matches/demand/${demandId}`, { method: 'POST' }),
    
    assign: (id: number, projectManagerId: number) =>
      request<any>(`/matches/${id}/assign`, { method: 'POST', body: JSON.stringify({ project_manager_id: projectManagerId }) }),
  },

  orders: {
    my: (params?: { status?: string; type?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any>(`/orders/my?${query}`);
    },
    
    get: (id: number) => request<any>(`/orders/${id}`),
    
    create: (data: any) =>
      request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    
    pay: (id: number, data?: { payment_method?: string; amount?: number }) =>
      request<any>(`/orders/${id}/pay`, { method: 'POST', body: JSON.stringify(data || {}) }),
    
    confirm: (id: number) =>
      request<any>(`/orders/${id}/confirm`, { method: 'POST' }),
    
    refund: (id: number, data?: { amount?: number; reason?: string }) =>
      request<any>(`/orders/${id}/refund`, { method: 'POST', body: JSON.stringify(data || {}) }),
  },

  accounts: {
    balance: () => request<any>('/accounts/balance'),
    
    payments: (params?: { type?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any>(`/accounts/payments?${query}`);
    },
    
    refunds: (params?: { status?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any>(`/accounts/refunds?${query}`);
    },
    
    recharge: (amount: number) =>
      request<any>('/accounts/recharge', { method: 'POST', body: JSON.stringify({ amount }) }),
    
    withdraw: (amount: number) =>
      request<any>('/accounts/withdraw', { method: 'POST', body: JSON.stringify({ amount }) }),
    
    security: () => request<any>('/accounts/security'),
    
    changePassword: (oldPassword: string, newPassword: string) =>
      request<any>('/accounts/security/password', {
        method: 'PUT',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      }),
  },
};
