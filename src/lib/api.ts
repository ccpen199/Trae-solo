const BASE = '/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json: ApiResponse<T> = await res.json()
  if (!json.success) {
    throw new Error(json.error ?? json.message ?? 'Request failed')
  }
  return json.data as T
}

export interface Asset {
  id: number
  name: string
  type: string
  location: string
  area: number
  area_unit: string
  ownership: string
  valuation: number
  photo_url: string
  certificate_no: string
  status: string
  remark: string
  created_at: string
  updated_at: string
}

export interface AssetListParams {
  type?: string
  status?: string
  keyword?: string
}

export interface Contract {
  id: number
  asset_id: number
  contract_no: string
  type: string
  lessee_name: string
  lessee_contact: string
  start_date: string
  end_date: string
  rent_amount: number
  rent_unit: string
  payment_cycle: string
  status: string
  remark: string
  asset_name?: string
  created_at: string
  updated_at: string
}

export interface ContractListParams {
  type?: string
  status?: string
  asset_id?: number | string
}

export interface Revenue {
  id: number
  contract_id: number
  asset_id: number
  type: string
  amount: number
  year: number
  period: string
  description: string
  asset_name?: string
  contract_no?: string
  created_at: string
  updated_at: string
}

export interface RevenueListParams {
  type?: string
  year?: number | string
  asset_id?: number | string
  contract_id?: number | string
}

export interface RevenueSummary {
  byYear: { year: number; total_receivable: number; total_received: number; total_arrears: number; total_reduction: number }[]
  byType: { type: string; total_amount: number }[]
}

export interface Decision {
  id: number
  topic: string
  content: string
  decision_type: string
  vote_result: string
  vote_count: number
  total_voters: number
  publish_start: string
  publish_end: string
  objection: string
  handling_opinion: string
  status: string
  created_at: string
  updated_at: string
}

export interface DecisionListParams {
  status?: string
  decision_type?: string
  keyword?: string
}

export interface DashboardOverview {
  assetStats: {
    total: number
    byType: { type: string; count: number }[]
    totalValuation: number
    idleCount: number
  }
  contractStats: {
    total: number
    byStatus: { status: string; count: number }[]
    expiring: number
  }
  revenueStats: {
    totalReceivable: number
    totalReceived: number
    totalArrears: number
    totalReduction: number
  }
  decisionStats: {
    total: number
    byStatus: { status: string; count: number }[]
  }
}

export interface RecentActivity {
  category: 'asset' | 'contract' | 'revenue' | 'decision'
  id: number
  title: string
  detail: string
  action: string
  time: string
}

export interface AbnormalAlert {
  level: 'critical' | 'warning'
  category: 'asset' | 'contract' | 'revenue'
  type: string
  id: number
  title: string
  detail: string
}

export interface QueryLog {
  id: number
  query_type: string
  query_params: string
  queried_by: string
  created_at: string
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return ''
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return qs ? `?${qs}` : ''
}

export const assets = {
  list: (params?: AssetListParams) =>
    request<Asset[]>(`/assets${buildQuery(params as Record<string, unknown>)}`),

  getById: (id: number | string) =>
    request<Asset>(`/assets/${id}`),

  create: (data: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) =>
    request<Asset>('/assets', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number | string, data: Partial<Omit<Asset, 'id' | 'created_at' | 'updated_at'>>) =>
    request<Asset>(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number | string) =>
    request<void>(`/assets/${id}`, { method: 'DELETE' }),
}

export const contracts = {
  list: (params?: ContractListParams) =>
    request<Contract[]>(`/contracts${buildQuery(params as Record<string, unknown>)}`),

  getById: (id: number | string) =>
    request<Contract>(`/contracts/${id}`),

  create: (data: Omit<Contract, 'id' | 'asset_name' | 'created_at' | 'updated_at'>) =>
    request<Contract>('/contracts', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number | string, data: Partial<Omit<Contract, 'id' | 'asset_name' | 'created_at' | 'updated_at'>>) =>
    request<Contract>(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number | string) =>
    request<void>(`/contracts/${id}`, { method: 'DELETE' }),
}

export const revenues = {
  list: (params?: RevenueListParams) =>
    request<Revenue[]>(`/revenues${buildQuery(params as Record<string, unknown>)}`),

  getById: (id: number | string) =>
    request<Revenue>(`/revenues/${id}`),

  create: (data: Omit<Revenue, 'id' | 'asset_name' | 'contract_no' | 'created_at' | 'updated_at'>) =>
    request<Revenue>('/revenues', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number | string, data: Partial<Omit<Revenue, 'id' | 'asset_name' | 'contract_no' | 'created_at' | 'updated_at'>>) =>
    request<Revenue>(`/revenues/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number | string) =>
    request<void>(`/revenues/${id}`, { method: 'DELETE' }),

  getSummary: () =>
    request<RevenueSummary>('/revenues/stats/summary'),
}

export const decisions = {
  list: (params?: DecisionListParams) =>
    request<Decision[]>(`/decisions${buildQuery(params as Record<string, unknown>)}`),

  getById: (id: number | string) =>
    request<Decision>(`/decisions/${id}`),

  create: (data: Omit<Decision, 'id' | 'created_at' | 'updated_at'>) =>
    request<Decision>('/decisions', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number | string, data: Partial<Omit<Decision, 'id' | 'created_at' | 'updated_at'>>) =>
    request<Decision>(`/decisions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number | string) =>
    request<void>(`/decisions/${id}`, { method: 'DELETE' }),
}

export const dashboard = {
  getOverview: () =>
    request<DashboardOverview>('/dashboard/overview'),

  getAssetChanges: () =>
    request<{ month: string; count: number }[]>('/dashboard/asset-changes'),

  getExpiringContracts: () =>
    request<Contract[]>('/dashboard/expiring-contracts'),

  getArrearsRisk: () =>
    request<(Revenue & { lessee_name: string })[]>('/dashboard/arrears-risk'),

  getRevenueTrend: () =>
    request<{ type: string; month: string; total: number }[]>('/dashboard/revenue-trend'),

  getRecentActivities: (limit?: number) =>
    request<RecentActivity[]>(`/dashboard/recent-activities${limit ? `?limit=${limit}` : ''}`),

  getAbnormalAlerts: () =>
    request<AbnormalAlert[]>('/dashboard/abnormal-alerts'),

  logQuery: (data: { query_type: string; query_params: string; queried_by: string }) =>
    request<void>('/dashboard/query-log', { method: 'POST', body: JSON.stringify(data) }),

  getQueryLogs: (limit?: number) =>
    request<QueryLog[]>(`/dashboard/query-logs${limit ? `?limit=${limit}` : ''}`),
}
