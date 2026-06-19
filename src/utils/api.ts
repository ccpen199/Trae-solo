import type { Post, GeoRegion, Merchant, AuditRecord, SensitiveWord, ApiKey, FunnelData, TimeSeriesPoint } from '@/types'

const API_BASE = '/api'

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || '请求失败')
  return json.data
}

export const api = {
  posts: {
    list: (params: Record<string, string | number | undefined> = {}) => {
      const query = new URLSearchParams()
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.set(k, String(v))
      })
      return fetchApi<{ posts: Post[]; total: number; page: number; limit: number }>(`/posts?${query}`)
    },
    get: (id: string) => fetchApi<Post>(`/posts/${id}`),
    create: (data: Partial<Post>) => fetchApi<Post>('/posts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Post>) => fetchApi<Post>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/posts/${id}`, { method: 'DELETE' }),
  },
  risk: {
    check: (postId: string) => fetchApi<{ sensitiveWords: string[]; imageRisk: string; phoneValid: boolean; overallScore: number }>('/risk/check', { method: 'POST', body: JSON.stringify({ postId }) }),
    words: (params: Record<string, string | number> = {}) => {
      const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))
      return fetchApi<{ words: SensitiveWord[]; total: number }>(`/risk/words?${query}`)
    },
    addWord: (data: { word: string; category: string }) => fetchApi<SensitiveWord>('/risk/words', { method: 'POST', body: JSON.stringify(data) }),
    deleteWord: (id: string) => fetchApi<void>(`/risk/words/${id}`, { method: 'DELETE' }),
    stats: () => fetchApi<{ distribution: { range: string; count: number }[]; highRiskCount: number }>('/risk/stats'),
  },
  audit: {
    queue: (params: Record<string, string | number> = {}) => {
      const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))
      return fetchApi<{ records: AuditRecord[]; total: number }>(`/audit/queue?${query}`)
    },
    action: (id: string, data: { result: string; comment?: string }) => fetchApi<AuditRecord>(`/audit/${id}/action`, { method: 'POST', body: JSON.stringify(data) }),
    stats: () => fetchApi<{ total: number; approved: number; rejected: number; pending: number; byAuditor: { name: string; count: number }[] }>('/audit/stats'),
  },
  merchants: {
    list: () => fetchApi<Merchant[]>('/merchants'),
    get: (id: string) => fetchApi<Merchant>(`/merchants/${id}`),
    verify: (data: { name: string; licenseNo: string }) => fetchApi<Merchant>('/merchants/verify', { method: 'POST', body: JSON.stringify(data) }),
    deposit: (id: string, amount: number) => fetchApi<Merchant>(`/merchants/${id}/deposit`, { method: 'POST', body: JSON.stringify({ amount }) }),
    reviews: (id: string) => fetchApi<{ id: string; merchantId: string; userId: string; rating: number; content: string; createdAt: string }[]>(`/merchants/${id}/reviews`),
  },
  stats: {
    traffic: (start?: string, end?: string) => {
      const params = new URLSearchParams()
      if (start) params.set('start', start)
      if (end) params.set('end', end)
      return fetchApi<{ viewsTrend: TimeSeriesPoint[]; leadsTrend: TimeSeriesPoint[] }>(`/stats/traffic?${params}`)
    },
    funnel: () => fetchApi<FunnelData>('/stats/funnel'),
    audit: () => fetchApi<{ total: number; approved: number; rejected: number; pending: number }>('/stats/audit'),
  },
  geo: {
    regions: (parentCode?: string) => {
      const params = new URLSearchParams()
      if (parentCode) params.set('parentCode', parentCode)
      return fetchApi<GeoRegion[]>(`/geo/regions?${params}`)
    },
    heatmap: () => fetchApi<GeoRegion[]>('/geo/heatmap'),
    stats: (code: string) => fetchApi<{ postCount: number; topCategories: { category: string; count: number }[] }>(`/geo/stats?code=${code}`),
  },
  open: {
    keys: () => fetchApi<ApiKey[]>('/open/keys'),
    createKey: (data: { name: string; org: string; permissions: string[] }) => fetchApi<ApiKey>('/open/keys', { method: 'POST', body: JSON.stringify(data) }),
    deleteKey: (id: string) => fetchApi<void>(`/open/keys/${id}`, { method: 'DELETE' }),
    stats: () => fetchApi<{ totalCalls: number; byOrg: { org: string; calls: number }[] }>('/open/stats'),
  },
}
