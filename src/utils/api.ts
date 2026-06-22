import type {
  Building,
  Certificate,
  Complaint,
  CreatorContent,
  FeedItem,
  HeatmapData,
  MapProperty,
  PriceHistoryItem,
  Property,
} from '@/types'

const API_BASE = '/api'
const DEMO_CREATOR_ID = 'creator-demo'
const DEMO_CREATOR_NAME = '居易内容组'
const DEMO_USER_ID = 'buyer-demo-chen'

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string')
    } catch {}
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function mapPriceHistoryItem(item: any): PriceHistoryItem {
  return {
    month: item.month ?? '',
    avgPrice: toNumber(item.avgPrice ?? item.price),
    volume: toNumber(item.volume, 0),
  }
}

function mapCertificate(item: any): Certificate {
  return {
    id: item.id,
    buildingId: item.buildingId ?? item.building_id ?? '',
    type: item.type ?? '',
    number: item.number ?? item.cert_number ?? '',
    status: item.status ?? 'pending',
    issueDate: item.issueDate ?? item.issue_date ?? '',
    expireDate: item.expireDate ?? item.expire_date ?? '',
  }
}

function mapBuilding(item: any): Building {
  return {
    id: item.id,
    name: item.name ?? '',
    developer: item.developer ?? '',
    address: item.address ?? '',
    district: item.district ?? '',
    lat: toNumber(item.lat ?? item.latitude),
    lng: toNumber(item.lng ?? item.longitude),
    status: item.status ?? 'pending',
    totalUnits: toNumber(item.totalUnits),
    availableUnits: toNumber(item.availableUnits),
    avgPrice: toNumber(item.avgPrice ?? item.avg_price),
    minPrice: toNumber(item.minPrice ?? item.min_price),
    maxPrice: toNumber(item.maxPrice ?? item.max_price),
    areaMin: toNumber(item.areaMin ?? item.area_min),
    areaMax: toNumber(item.areaMax ?? item.area_max),
    deliveryDate: item.deliveryDate ?? item.delivery_date ?? '',
    description: item.description ?? '',
    tags: normalizeTags(item.tags),
    images: Array.isArray(item.images) ? item.images : [],
    createdAt: item.createdAt ?? item.created_at ?? '',
    updatedAt: item.updatedAt ?? item.updated_at ?? '',
    certificates: Array.isArray(item.certificates) ? item.certificates.map(mapCertificate) : undefined,
    priceHistory: Array.isArray(item.priceHistory) ? item.priceHistory.map(mapPriceHistoryItem) : undefined,
  }
}

function mapProperty(item: any): Property {
  return {
    id: item.id,
    buildingId: item.buildingId ?? item.building_id ?? '',
    unitNumber: item.unitNumber ?? item.unit_number ?? '',
    floor: toNumber(item.floor),
    totalFloors: toNumber(item.totalFloors ?? item.total_floors),
    area: toNumber(item.area),
    layout: item.layout ?? '',
    orientation: item.orientation ?? '',
    price: toNumber(item.price ?? item.total_price ?? item.totalPrice),
    unitPrice: toNumber(item.unitPrice ?? item.unit_price),
    status: item.status ?? 'available',
  }
}

function mapMapProperty(item: any): MapProperty {
  return {
    id: item.id,
    buildingId: item.buildingId ?? item.building_id ?? '',
    buildingName: item.buildingName ?? item.building_name ?? '',
    unitNumber: item.unitNumber ?? item.unit_number ?? '',
    price: toNumber(item.price ?? item.total_price ?? item.totalPrice),
    unitPrice: toNumber(item.unitPrice ?? item.unit_price),
    area: toNumber(item.area),
    layout: item.layout ?? '',
    floor: toNumber(item.floor),
    totalFloors: toNumber(item.totalFloors ?? item.total_floors),
    orientation: item.orientation ?? '',
    status: item.status ?? 'available',
    district: item.district ?? '',
    lat: toNumber(item.lat ?? item.latitude),
    lng: toNumber(item.lng ?? item.longitude),
  }
}

function mapHeatmapData(item: any): HeatmapData {
  return {
    district: item.district ?? '',
    lat: toNumber(item.lat ?? item.latitude),
    lng: toNumber(item.lng ?? item.longitude),
    avgPrice: toNumber(item.avgPrice ?? item.avgUnitPrice),
    volume: toNumber(item.volume ?? item.transactionCount ?? item.propertyCount),
  }
}

function mapFeedItem(item: any): FeedItem {
  return {
    id: item.id,
    buildingId: item.buildingId ?? item.building_id ?? '',
    type: item.type ?? '',
    title: item.title ?? '',
    summary: item.summary ?? item.content ?? '',
    source: item.source ?? item.consultant_name ?? '平台播报',
    createdAt: item.createdAt ?? item.created_at ?? '',
  }
}

function mapComplaint(item: any): Complaint {
  return {
    id: item.id,
    buildingId: item.buildingId ?? item.building_id ?? '',
    submitterName: item.submitterName ?? item.submitter_name ?? '',
    submitterPhone: item.submitterPhone ?? item.submitter_phone ?? '',
    category: item.category ?? item.type ?? '',
    title: item.title ?? '',
    content: item.content ?? '',
    status: item.status ?? 'pending',
    timeline: typeof item.timeline === 'object' ? JSON.stringify(item.timeline) : (item.timeline ?? ''),
    createdAt: item.createdAt ?? item.created_at ?? '',
    updatedAt: item.updatedAt ?? item.updated_at ?? '',
  }
}

function mapCreatorContent(item: any): CreatorContent {
  return {
    id: item.id,
    authorId: item.authorId ?? item.author_id ?? '',
    authorName: item.authorName ?? item.author_name ?? '',
    buildingId: item.buildingId ?? item.building_id ?? '',
    type: item.type ?? '',
    title: item.title ?? '',
    content: item.content ?? '',
    images: typeof item.images === 'string' ? item.images : JSON.stringify(item.images ?? []),
    likes: toNumber(item.likes ?? item.like_count),
    views: toNumber(item.views ?? item.read_count),
    createdAt: item.createdAt ?? item.created_at ?? '',
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export const api = {
  getBuildings: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ success: boolean; data: any[] }>(`/buildings${query}`).then((res) => ({
      ...res,
      data: (res.data || []).map(mapBuilding),
    }))
  },
  getBuilding: (id: string) =>
    request<{ success: boolean; data: any }>(`/buildings/${id}`).then((res) => ({
      ...res,
      data: res.data ? mapBuilding(res.data) : null,
    })),
  getProperties: (id: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ success: boolean; data: any[] }>(`/buildings/${id}/properties${query}`).then((res) => ({
      ...res,
      data: (res.data || []).map(mapProperty),
    }))
  },
  getMapProperties: (params?: Record<string, string | number>) => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<{ success: boolean; data: { properties: any[]; heatmap: any[] } }>(`/properties/map${query}`).then((res) => ({
      ...res,
      data: {
        properties: (res.data?.properties || []).map(mapMapProperty),
        heatmap: (res.data?.heatmap || []).map(mapHeatmapData),
      },
    }))
  },
  computeCalculator: (data: any) =>
    request<{ success: boolean; data: any }>('/calculator/compute', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  registerLottery: (buildingId: string, data: any) =>
    request<{ success: boolean; data: any }>(`/lottery/${buildingId}/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  runLottery: (buildingId: string) =>
    request<{ success: boolean; data: any }>(`/lottery/${buildingId}/run`, {
      method: 'POST',
    }),
  getLotteryResult: (buildingId: string) =>
    request<{ success: boolean; data: any }>(`/lottery/${buildingId}/result`),
  submitComplaint: (data: any) =>
    request<{ success: boolean; data: any }>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then((res) => ({
      ...res,
      data: res.data ? mapComplaint(res.data) : null,
    })),
  getComplaints: () =>
    request<{ success: boolean; data: any[] }>('/complaints').then((res) => ({
      ...res,
      data: (res.data || []).map(mapComplaint),
    })),
  getComplaint: (id: string) =>
    request<{ success: boolean; data: any }>(`/complaints/${id}`).then((res) => ({
      ...res,
      data: res.data ? mapComplaint(res.data) : null,
    })),
  updateComplaintStatus: (id: string, status: string) =>
    request<{ success: boolean; data: any }>(`/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }).then((res) => ({
      ...res,
      data: res.data ? mapComplaint(res.data) : null,
    })),
  getContents: () =>
    request<{ success: boolean; data: any[] }>('/contents').then((res) => ({
      ...res,
      data: (res.data || []).map(mapCreatorContent),
    })),
  getContentStats: (authorId = DEMO_CREATOR_ID) =>
    request<{ success: boolean; data: any }>(`/contents/stats?${new URLSearchParams({ authorId }).toString()}`),
  publishContent: (data: any) =>
    request<{ success: boolean; data: any }>('/contents', {
      method: 'POST',
      body: JSON.stringify({
        authorId: DEMO_CREATOR_ID,
        authorName: DEMO_CREATOR_NAME,
        ...data,
        images: Array.isArray(data?.images)
          ? data.images
          : typeof data?.images === 'string'
          ? data.images.split(',').map((item: string) => item.trim()).filter(Boolean)
          : [],
      }),
    }),
  getFeed: () =>
    request<{ success: boolean; data: any[] }>('/contents/feed').then((res) => ({
      ...res,
      data: (res.data || []).map(mapFeedItem),
    })),
  createSubscription: (data: any) =>
    request<{ success: boolean; data: any }>('/contents/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        userId: DEMO_USER_ID,
        ...data,
      }),
    }),
  deleteSubscription: (id: string) =>
    request<{ success: boolean }>(`/contents/subscriptions/${id}`, {
      method: 'DELETE',
    }),
  verifyOcr: (data: any) =>
    request<{ success: boolean; data: any }>('/verify/ocr', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  verifyBureau: (data: any) =>
    request<{ success: boolean; data: any }>('/verify/bureau', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
