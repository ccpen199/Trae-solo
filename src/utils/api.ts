import useStore from '@/store/useStore'

const BASE = '/api'

class ApiError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

function getGeoParams(): Record<string, string> {
  const { locInfo } = useStore.getState()
  if (!locInfo?.lat || !locInfo?.lng) return {}
  return { lat: String(locInfo.lat), lng: String(locInfo.lng) }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  params: Record<string, string | number | undefined> = {},
  skipGeo: boolean = false,
): Promise<T> {
  const geoParams = skipGeo ? {} : getGeoParams()
  const allParams: Record<string, string> = {}

  for (const [k, v] of Object.entries({ ...params, ...geoParams })) {
    if (v !== undefined && v !== '') {
      allParams[k] = String(v)
    }
  }

  const qs = new URLSearchParams(allParams).toString()
  const url = `${BASE}${path}${qs ? `?${qs}` : ''}`

  const headers: Record<string, string> = options.body instanceof FormData
    ? { ...(options.headers as Record<string, string>) }
    : {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      }

  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message || `请求失败 (${res.status})`)
  }

  const result = await res.json()
  if (result && typeof result === 'object' && 'data' in result) {
    return result.data as T
  }
  return result as T
}

export function getMerchants(params: {
  page?: number
  pageSize?: number
  category?: string
  street?: string
  sort?: string
}) {
  return request<{ items: any[]; total: number }>('/merchants', {}, { ...params, status: 'approved' } as Record<string, any>)
}

export function getMerchant(id: string) {
  return request<any>(`/merchants/${id}`)
}

export function applyMerchant(data: FormData) {
  return request<any>('/merchants/apply', {
    method: 'POST',
    body: data,
    headers: {},
  })
}

export function getPackages(params: {
  merchantId?: string
  category?: string
  page?: number
  pageSize?: number
  type?: string
}) {
  return request<{ items: any[]; total: number }>('/packages', {}, params as Record<string, any>)
}

export function getPackage(id: string) {
  return request<any>(`/packages/${id}`)
}

export function getPackageById(id: string) {
  return getPackage(id)
}

export function createOrder(data: { packageId: string; quantity: number }) {
  return request<any>('/orders', {
    method: 'POST',
    body: JSON.stringify({ user_id: 'test-user-001', package_id: data.packageId }),
  })
}

export function getOrders(params: { userId?: string; status?: string }) {
  return request<{ items: any[]; total: number }>('/orders', {}, params as Record<string, any>)
}

export function getOrder(id: string) {
  return request<any>(`/orders/${id}`)
}

export function getOrderById(id: string) {
  return getOrder(id)
}

export function verifyOrder(data: { code: string; merchantId: string }) {
  return request<any>('/orders/verify', {
    method: 'POST',
    body: JSON.stringify({ verification_code: data.code, merchant_id: data.merchantId }),
  })
}

export function getNearby(params: {
  lat?: number
  lng?: number
  radius?: number
  category?: string
}) {
  return request<any[]>('/lbs/nearby', {}, params as Record<string, any>)
}

export function getLbsNearby(params: {
  lat?: number
  lng?: number
  radius?: number
  category?: string
}) {
  return getNearby(params)
}

export function getHeatmap() {
  return request<any>('/lbs/heatmap')
}

export function getLbsHeatmap() {
  return getHeatmap()
}

export function getCampaigns(params?: { status?: string; page?: number; pageSize?: number }) {
  return request<any>('/campaigns', {}, params as Record<string, any>)
}

export function getReportOverview() {
  return request<any>('/reports/overview', {}, {}, true)
}

export function getReportTopCategories(limit?: number) {
  return request<any[]>('/reports/top-categories', {}, { limit }, true)
}

export function getReportDailyTrend(days?: number) {
  return request<any[]>('/reports/daily-trend', {}, { days }, true)
}

export function getReportMerchantRanking(limit?: number) {
  return request<any[]>('/reports/merchant-ranking', {}, { limit }, true)
}

export function getAdminMerchants(params: {
  page?: number
  pageSize?: number
  category?: string
  street?: string
  sortBy?: string
  keyword?: string
  status?: string
}) {
  return request<any>('/merchants', {}, params as Record<string, any>, true)
}

export function auditMerchant(id: string, status: 'approved' | 'rejected') {
  return request<any>(`/merchants/${id}/audit`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }, {}, true)
}

export function createCampaign(data: Record<string, any>) {
  return request<any>('/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  }, {}, true)
}

export function updateCampaign(id: string, data: Record<string, any>) {
  return request<any>(`/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, {}, true)
}

export function updateCampaignStatus(id: string, status: 'draft' | 'active' | 'ended') {
  return request<any>(`/campaigns/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }, {}, true)
}

export function deleteCampaign(id: string) {
  return request<any>(`/campaigns/${id}`, {
    method: 'DELETE',
  }, {}, true)
}

export function getCampaignStats(id: string) {
  return request<any>(`/campaigns/${id}/stats`, {}, {}, true)
}

export { ApiError }

export function checkGeofence(lat: number, lng: number): Promise<{ inside: boolean }> {
  return request<any>('/lbs/geofence-check', {}, { lat, lng })
}
