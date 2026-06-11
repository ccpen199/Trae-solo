import type {
  User,
  Device,
  DeviceHeartbeatStats,
  PaginatedData,
  AccessRecord,
  VisitorCode,
  RepairOrder,
  RepairFeedback,
  RepairEvaluation,
  CommunityPost,
  Payment,
  PaymentReceipt,
  Announcement,
  Organization,
  DeviceAlert,
  AlertStats,
  OfflineCache,
  PermissionMatrix,
  ReportResponseData,
  ReportCompletionData,
  ReportDeviceOnlineData,
  ReportPaymentData,
  Member,
  ApiResponse,
} from '@/types'

const BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${url}`, { ...options, headers })
  if (res.status === 401 && url !== '/auth/login') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  const result = await res.json().catch(() => ({ success: false, error: res.statusText })) as ApiResponse<any> & { errorCode?: string }
  if (!result.success) {
    const err = new Error(result.error || 'Request failed') as any
    err.errorCode = result.errorCode
    err.status = res.status
    throw err
  }
  return result.data as T
}

function get<T>(url: string, params?: Record<string, string | number | boolean>): Promise<T> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {} as Record<string, string>)
  ).toString() : ''
  return request<T>(url + qs)
}

function post<T>(url: string, data?: unknown): Promise<T> {
  return request<T>(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined })
}

function put<T>(url: string, data?: unknown): Promise<T> {
  return request<T>(url, { method: 'PUT', body: data ? JSON.stringify(data) : undefined })
}

function del<T>(url: string): Promise<T> {
  return request<T>(url, { method: 'DELETE' })
}

export const api = {
  auth: {
    login: (data: { phone: string; password: string }) => post<{ token: string; user: User }>('/auth/login', data),
    me: () => get<User>('/auth/me'),
  },
  access: {
    unlock: (data: { device_id: string; mode: string }) => post<any>('/access/unlock', data),
    records: (params?: Record<string, string | number>) => get<PaginatedData<AccessRecord>>('/access/records', params),
    visitor: {
      generate: (data: { valid_hours: number; max_uses: number; device_id?: string }) => post<VisitorCode>('/access/visitor', data),
      list: () => get<VisitorCode[]>('/access/visitor'),
    },
  },
  devices: {
    list: (params?: Record<string, string | number>) => get<PaginatedData<Device>>('/devices', params),
    detail: (id: string) => get<Device>(`/devices/${id}`),
    update: (id: string, data: Partial<Device>) => put<Device>(`/devices/${id}`, data),
    heartbeatStats: () => get<DeviceHeartbeatStats>('/devices/heartbeat/stats'),
    ota: {
      upgrade: (id: string, data: { version: string }) => post<any>(`/devices/${id}/ota`, data),
    },
    offline: {
      list: (params?: Record<string, string | number>) => get<PaginatedData<OfflineCache>>('/devices/offline', params),
      sync: () => post<any>('/devices/offline/sync'),
    },
  },
  repairs: {
    list: (params?: Record<string, string | number>) => get<PaginatedData<RepairOrder>>('/repairs', params),
    detail: (id: string) => get<RepairOrder>(`/repairs/${id}`),
    create: (data: any) => post<RepairOrder>('/repairs', data),
    dispatch: (id: string, data: { assignee_id: string }) => put<RepairOrder>(`/repairs/${id}/dispatch`, data),
    feedback: (id: string, data: { content: string; images?: string[] }) => put<RepairOrder>(`/repairs/${id}/feedback`, data),
    evaluate: (id: string, data: { rating: number; comment: string }) => post<RepairEvaluation>(`/repairs/${id}/evaluate`, data),
  },
  community: {
    posts: (params?: Record<string, string | number>) => get<PaginatedData<CommunityPost>>('/community/posts', params),
    create: (data: any) => post<CommunityPost>('/community/posts', data),
    review: (id: string, data: { review_status: 'approved' | 'rejected'; review_comment?: string }) => put<CommunityPost>(`/community/posts/${id}/review`, data),
    reviewList: (params?: Record<string, string | number>) => get<PaginatedData<CommunityPost>>('/community/review', params),
  },
  payments: {
    list: (params?: Record<string, string | number>) => get<PaginatedData<Payment>>('/payments', params),
    pay: (id: string) => post<any>(`/payments/${id}/pay`),
    receipt: (id: string) => get<PaymentReceipt>(`/payments/${id}/receipt`),
  },
  announcements: {
    list: (params?: Record<string, string | number>) => get<PaginatedData<Announcement>>('/announcements', params),
    create: (data: any) => post<Announcement>('/announcements', data),
    update: (id: string, data: any) => put<Announcement>(`/announcements/${id}`, data),
    remove: (id: string) => del<any>(`/announcements/${id}`),
  },
  organization: {
    tree: () => get<Organization[]>('/organization/tree'),
    members: (params?: Record<string, string | number>) => get<PaginatedData<Member>>('/organization/members', params),
    addMember: (data: { name: string; phone: string; password: string; role_id: string; org_id: string }) => post<Member>('/organization/members', data),
    updateMember: (id: string, data: any) => put<Member>(`/organization/members/${id}`, data),
    removeMember: (id: string) => del<any>(`/organization/members/${id}`),
  },
  permissions: {
    roles: () => get<any[]>('/permissions/roles'),
    createRole: (data: any) => post<any>('/permissions/roles', data),
    updateRole: (id: string, data: any) => put<any>(`/permissions/roles/${id}`, data),
    matrix: () => get<PermissionMatrix[]>('/permissions/matrix'),
  },
  alerts: {
    list: (params?: Record<string, string | number>) => get<PaginatedData<DeviceAlert>>('/alerts', params),
    detail: (id: string) => get<DeviceAlert>(`/alerts/${id}`),
    handle: (id: string, data: { handler_id?: string; method?: string; note?: string; status: string }) => put<DeviceAlert>(`/alerts/${id}/handle`, data),
    stats: () => get<AlertStats>('/alerts/stats'),
  },
  reports: {
    response: (params?: Record<string, string | number>) => get<ReportResponseData>('/reports/response', params),
    completion: (params?: Record<string, string | number>) => get<ReportCompletionData>('/reports/completion', params),
    deviceOnline: (params?: Record<string, string | number>) => get<ReportDeviceOnlineData>('/reports/device-online', params),
    payment: (params?: Record<string, string | number>) => get<ReportPaymentData>('/reports/payment', params),
  },
}
