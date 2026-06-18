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
const MAX_RETRIES = 3
const RETRY_DELAY = 300

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function get<T>(path: string): Promise<T> {
  let lastErr: unknown = null
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.status === 404) {
        throw new Error(`接口不存在: ${path} (HTTP 404)`)
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`请求失败: ${path} (HTTP ${res.status}) ${text}`)
      }
      return (await res.json()) as T
    } catch (err) {
      lastErr = err
      if (err instanceof TypeError || (err as any)?.message?.includes('HTTP 404')) {
        if (i < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY * (i + 1))
          continue
        }
      }
      throw err
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`API ${path} failed`)
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  let lastErr: unknown = null
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`请求失败: PATCH ${path} (HTTP ${res.status}) ${text}`)
      }
      return (await res.json()) as T
    } catch (err) {
      lastErr = err
      if (err instanceof TypeError) {
        if (i < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY * (i + 1))
          continue
        }
      }
      throw err
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`API PATCH ${path} failed`)
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
