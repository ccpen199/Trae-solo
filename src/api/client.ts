import type {
  Member,
  Merchant,
  Product,
  City,
  CityMetrics,
  CrossCityFlow,
  AuditRecord,
  PointRecord,
  CrossCityBenefit,
  SettlementConfig,
  ProductType,
} from '@/types'

const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return (await res.json()) as T
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API PATCH ${path} failed: ${res.status}`)
  return (await res.json()) as T
}

export const api = {
  cities: {
    list: () => get<City[]>('/cities'),
  },

  member: {
    profile: () => get<Member>('/member/profile'),
    points: () =>
      get<{ points: number; records: PointRecord[] }>('/member/points'),
    benefits: () => get<CrossCityBenefit[]>('/member/benefits'),
    recommendations: (city?: string) =>
      get<Product[]>(`/member/recommendations${city ? `?city=${encodeURIComponent(city)}` : ''}`),
  },

  merchant: {
    list: () => get<Merchant[]>('/merchant/list'),
    audit: () => get<Merchant[]>('/merchant/audit'),
    auditAction: (id: string, action: 'approve' | 'reject', note?: string) =>
      patch<{ success: boolean; merchant: Merchant }>(`/merchant/audit/${id}`, { action, note }),
    auditRecords: () => get<AuditRecord[]>('/merchant/audit-records'),
    rules: () =>
      get<{ from: string; to: string; ratio: number; enabled: boolean }[]>('/merchant/rules'),
    updateRule: (index: number, data: { ratio?: number; enabled?: boolean }) =>
      patch<{ success: boolean; rule: { from: string; to: string; ratio: number; enabled: boolean } }>(`/merchant/rules/${index}`, data),
    settlements: () =>
      get<(SettlementConfig & { merchantName: string })[]>('/merchant/settlements'),
    updateSettlement: (id: string, data: { cycle?: string; minAmount?: number }) =>
      patch<{ success: boolean; config: SettlementConfig & { merchantName: string } }>(`/merchant/settlements/${id}`, data),
  },

  products: {
    list: (params?: { type?: ProductType; city?: string }) => {
      const qs = new URLSearchParams()
      if (params?.type) qs.set('type', params.type)
      if (params?.city) qs.set('city', params.city)
      const q = qs.toString()
      return get<Product[]>(`/products${q ? `?${q}` : ''}`)
    },
    get: (id: string) => get<Product>(`/products/${id}`),
  },

  dashboard: {
    summary: () =>
      get<{
        totalGmv: number
        totalMerchants: number
        totalMembers: number
        crossCityTransactions: number
      }>('/dashboard/summary'),
    metrics: () => get<CityMetrics[]>('/dashboard/metrics'),
    crossCityFlows: () => get<CrossCityFlow[]>('/dashboard/cross-city-flows'),
  },
}
