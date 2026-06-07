import { useAuthStore } from '@/store'

const BASE_URL = ''

interface ApiRequestOptions extends RequestInit {
  requireAuth?: boolean
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { requireAuth = false, headers = {}, ...rest } = options

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }

  if (requireAuth) {
    const token = useAuthStore.getState().token
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: authHeaders,
    ...rest,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed')
  }

  return data as T
}

export const api = {
  auth: {
    register: (data: { username: string; password: string; role: string; phone?: string; email?: string }) =>
      apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { username: string; password: string }) =>
      apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () =>
      apiRequest('/api/auth/logout', { method: 'POST', requireAuth: true }),
    me: () =>
      apiRequest('/api/auth/me', { requireAuth: true }),
  },
  lives: {
    list: (params?: Record<string, string | number>) => {
      const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
      return apiRequest(`/api/lives${query}`)
    },
    get: (id: number) => apiRequest(`/api/lives/${id}`),
    create: (data: unknown) =>
      apiRequest('/api/lives', { method: 'POST', body: JSON.stringify(data), requireAuth: true }),
    sendDanmaku: (id: number, content: string) =>
      apiRequest(`/api/lives/${id}/danmaku`, { method: 'POST', body: JSON.stringify({ content }), requireAuth: true }),
    messages: (id: number) => apiRequest(`/api/lives/${id}/messages`),
  },
  properties: {
    list: (params?: Record<string, string | number>) => {
      const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
      return apiRequest(`/api/properties${query}`)
    },
    get: (id: number) => apiRequest(`/api/properties/${id}`),
    getVR: (id: number) => apiRequest(`/api/properties/${id}/vr`),
  },
  renovation: {
    companies: () => apiRequest('/api/renovation/companies'),
    company: (id: number) => apiRequest(`/api/renovation/companies/${id}`),
    cases: (params?: { style?: string; company_id?: number; page?: number; pageSize?: number }) => {
      const query = params ? '?' + new URLSearchParams(params as unknown as Record<string, string>).toString() : ''
      return apiRequest(`/api/renovation/cases${query}`)
    },
    compareQuotes: (data: { quoteIds: number[] }) =>
      apiRequest('/api/renovation/quote-compare', { method: 'POST', body: JSON.stringify(data), requireAuth: true }),
    orders: () => apiRequest('/api/renovation/orders', { requireAuth: true }),
  },
  contents: {
    list: (params?: Record<string, string | number>) => {
      const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
      return apiRequest(`/api/contents${query}`)
    },
    get: (id: number) => apiRequest(`/api/contents/${id}`),
    like: (id: number) =>
      apiRequest(`/api/contents/${id}/like`, { method: 'POST', requireAuth: true }),
    collect: (id: number) =>
      apiRequest(`/api/contents/${id}/collect`, { method: 'POST', requireAuth: true }),
  },
  search: {
    query: (params: { q: string; type?: string; page?: number; pageSize?: number }) => {
      const query = '?' + new URLSearchParams(params as unknown as Record<string, string>).toString()
      return apiRequest(`/api/search${query}`)
    },
    suggest: (q: string) => apiRequest(`/api/search/suggest?q=${encodeURIComponent(q)}`),
  },
  materials: {
    brands: () => apiRequest('/api/materials/brands'),
    samples: () => apiRequest('/api/materials/samples'),
  },
  admin: {
    reviews: () => apiRequest('/api/admin/reviews', { requireAuth: true }),
    reviewAction: (id: number, result: string, reason?: string) =>
      apiRequest(`/api/admin/reviews/${id}`, { method: 'POST', body: JSON.stringify({ result, reason }), requireAuth: true }),
    kols: () => apiRequest('/api/admin/kols', { requireAuth: true }),
    annualReviews: () => apiRequest('/api/admin/companies/annual', { requireAuth: true }),
    dashboard: () => apiRequest('/api/admin/dashboard', { requireAuth: true }),
  },
}
