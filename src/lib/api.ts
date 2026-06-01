const API_BASE_URL = '/api'

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; total?: number }> {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const api = {
  dashboard: {
    getStats: () => apiFetch('/orders/dashboard'),
  },
  orders: {
    list: (params?: Record<string, any>) => {
      const searchParams = new URLSearchParams(params).toString()
      return apiFetch(`/orders${searchParams ? `?${searchParams}` : ''}`)
    },
    get: (id: number) => apiFetch(`/orders/${id}`),
    create: (data: any) => apiFetch('/orders', { method: 'POST', body: JSON.stringify(data) }),
    batch: (orders: any[]) => apiFetch('/orders/batch', { method: 'POST', body: JSON.stringify({ orders }) }),
    scan: (qrCode: string, userId: number) => apiFetch('/orders/scan', { method: 'POST', body: JSON.stringify({ qrCode, user_id: userId }) }),
    voice: (voiceText: string, userId: number) => apiFetch('/orders/voice', { method: 'POST', body: JSON.stringify({ voiceText, user_id: userId }) }),
    routingOptions: (params: Record<string, any>) => {
      const searchParams = new URLSearchParams(params).toString()
      return apiFetch(`/orders/routing-options?${searchParams}`)
    },
    update: (id: number, data: any) => apiFetch(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/orders/${id}`, { method: 'DELETE' }),
  },
  tracking: {
    get: (id: number) => apiFetch(`/tracking/${id}`),
    getTimeline: (id: number) => apiFetch(`/tracking/${id}/timeline`),
    addEvent: (id: number, data: any) => apiFetch(`/tracking/${id}/events`, { method: 'POST', body: JSON.stringify(data) }),
  },
  exceptions: {
    list: (params?: Record<string, any>) => {
      const searchParams = new URLSearchParams(params).toString()
      return apiFetch(`/exceptions${searchParams ? `?${searchParams}` : ''}`)
    },
    stats: () => apiFetch('/exceptions/stats'),
    respond: (id: number, data: any) => apiFetch(`/exceptions/${id}/respond`, { method: 'PUT', body: JSON.stringify(data) }),
    escalate: (id: number) => apiFetch(`/exceptions/${id}/escalate`, { method: 'POST' }),
  },
  express: {
    list: (params?: Record<string, any>) => {
      const searchParams = new URLSearchParams(params).toString()
      return apiFetch(`/express${searchParams ? `?${searchParams}` : ''}`)
    },
    create: (data: any) => apiFetch('/express', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: number) => apiFetch(`/express/${id}`),
    getRider: (id: number) => apiFetch(`/express/${id}/rider`),
    updateStatus: (id: number, status: string) => apiFetch(`/express/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    riders: {
      available: () => apiFetch('/express/riders/available'),
      updateLocation: (id: number, lat: number, lng: number) => apiFetch(`/express/riders/${id}/location`, { method: 'PUT', body: JSON.stringify({ latitude: lat, longitude: lng }) }),
    },
    protocols: {
      list: () => apiFetch('/protocols'),
      create: (data: any) => apiFetch('/protocols', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: number, data: any) => apiFetch(`/protocols/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
  },
  bulk: {
    list: (params?: Record<string, any>) => {
      const searchParams = new URLSearchParams(params).toString()
      return apiFetch(`/bulk${searchParams ? `?${searchParams}` : ''}`)
    },
    create: (data: any) => apiFetch('/bulk', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: number) => apiFetch(`/bulk/${id}`),
    providers: {
      list: () => apiFetch('/bulk/providers'),
      get: (id: number) => apiFetch(`/bulk/providers/${id}`),
      book: (id: number) => apiFetch(`/bulk/providers/${id}/book`, { method: 'POST' }),
    },
    calculator: (params: Record<string, any>) => {
      const searchParams = new URLSearchParams(params).toString()
      return apiFetch(`/bulk/calculator?${searchParams}`)
    },
  },
  twin: {
    realtime: () => apiFetch('/twin/realtime'),
    networks: () => apiFetch('/twin/networks'),
    networksHistory: (days = 7) => apiFetch(`/twin/networks/history?days=${days}`),
    vehicles: () => apiFetch('/twin/vehicles'),
    weather: () => apiFetch('/twin/weather'),
  },
  security: {
    desensitizeRules: () => apiFetch('/security/desensitize'),
    decryptApply: (data: any) => apiFetch('/security/decrypt-apply', { method: 'POST', body: JSON.stringify(data) }),
    decryptRequests: (params?: Record<string, any>) => {
      const searchParams = new URLSearchParams(params).toString()
      return apiFetch(`/security/decrypt-requests${searchParams ? `?${searchParams}` : ''}`)
    },
    decryptApprove: (id: number, adminId: number) => apiFetch(`/security/decrypt-requests/${id}`, { method: 'PUT', body: JSON.stringify({ action: 'approve', admin_id: adminId }) }),
    decryptReject: (id: number, adminId: number, reason?: string) => apiFetch(`/security/decrypt-requests/${id}`, { method: 'PUT', body: JSON.stringify({ action: 'reject', admin_id: adminId, reason }) }),
    decryptData: (requestId: number) => apiFetch(`/security/decrypt-data/${requestId}`, { headers: { 'x-skip-desensitize': 'true' } }),
    compliance: () => apiFetch('/security/compliance'),
    auditLog: (params?: Record<string, any>) => {
      const searchParams = new URLSearchParams(params).toString()
      return apiFetch(`/security/audit-log${searchParams ? `?${searchParams}` : ''}`)
    },
    login: (username: string, password: string) => apiFetch('/security/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  },
  auth: {
    login: (phone: string, password: string) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }),
    logout: () => apiFetch('/auth/logout', { method: 'POST' }),
    profile: () => apiFetch('/auth/profile'),
  },
  health: () => fetch('/api/health').then(r => r.json()),
}
