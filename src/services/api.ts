import type {
  PaginatedResponse,
  ApiResponse,
  Canal,
  Pump,
  Gate,
  Zone,
  Crop,
  Quota,
  Application,
  Schedule,
  Dispatch,
  DispatchItem,
  Device,
  Alarm,
  WorkOrder,
  Record,
  Report,
  ReportStatistics,
  Log,
  DashboardData,
} from '@/types'

const BASE_PATH = '/api'

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${BASE_PATH}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(data.message || '请求失败')
  }

  return data
}

export const canalApi = {
  getList: (params?: { status?: string; keyword?: string; page?: number; pageSize?: number }) =>
    request<PaginatedResponse<Canal>>(`/canals?${new URLSearchParams(params as any).toString()}`),
  getDetail: (id: number) => request<ApiResponse<Canal>>(`/canals/${id}`),
  create: (data: Partial<Canal> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/canals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Canal> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/canals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/canals/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
}

export const pumpApi = {
  getList: (params?: { status?: string; canal_id?: number; keyword?: string; page?: number; pageSize?: number }) =>
    request<PaginatedResponse<Pump>>(`/pumps?${new URLSearchParams(params as any).toString()}`),
  getDetail: (id: number) => request<ApiResponse<Pump>>(`/pumps/${id}`),
  create: (data: Partial<Pump> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/pumps', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Pump> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/pumps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/pumps/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
}

export const gateApi = {
  getList: (params?: { status?: string; canal_id?: number; zone_id?: number; keyword?: string; page?: number; pageSize?: number }) =>
    request<PaginatedResponse<Gate>>(`/gates?${new URLSearchParams(params as any).toString()}`),
  getDetail: (id: number) => request<ApiResponse<Gate>>(`/gates/${id}`),
  create: (data: Partial<Gate> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/gates', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Gate> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/gates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/gates/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
}

export const zoneApi = {
  getList: (params?: { status?: string; canal_id?: number; keyword?: string; page?: number; pageSize?: number }) =>
    request<PaginatedResponse<Zone>>(`/zones?${new URLSearchParams(params as any).toString()}`),
  getDetail: (id: number) => request<ApiResponse<Zone>>(`/zones/${id}`),
  create: (data: Partial<Zone> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/zones', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Zone> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/zones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/zones/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
}

export const cropApi = {
  getList: (params?: { keyword?: string; page?: number; pageSize?: number }) =>
    request<PaginatedResponse<Crop>>(`/crops?${new URLSearchParams(params as any).toString()}`),
  getDetail: (id: number) => request<ApiResponse<Crop>>(`/crops/${id}`),
  create: (data: Partial<Crop> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/crops', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Crop> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/crops/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/crops/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
}

export const quotaApi = {
  getList: (params?: { zone_id?: number; crop_type_id?: number; year?: number; season?: string; page?: number; pageSize?: number }) =>
    request<PaginatedResponse<Quota>>(`/quotas?${new URLSearchParams(params as any).toString()}`),
  getDetail: (id: number) => request<ApiResponse<Quota>>(`/quotas/${id}`),
  create: (data: Partial<Quota> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/quotas', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Quota> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/quotas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/quotas/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
}

export const applicationApi = {
  getList: (params?: {
    status?: string
    zone_id?: number
    crop_type_id?: number
    applicant_type?: string
    priority?: number
    keyword?: string
    page?: number
    pageSize?: number
  }) =>
    request<PaginatedResponse<Application>>(
      `/applications?${new URLSearchParams(params as any).toString()}`
    ),
  getDetail: (id: number) => request<ApiResponse<Application>>(`/applications/${id}`),
  create: (data: Partial<Application> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/applications', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Application> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/applications/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
  approve: (id: number, data: { reviewed_by?: string; user_name?: string }) =>
    request<ApiResponse<void>>(`/applications/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  reject: (id: number, data: { reviewed_by?: string; reason?: string; user_name?: string }) =>
    request<ApiResponse<void>>(`/applications/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
  generateSchedule: (
    id: number,
    data: {
      gate_id: number
      scheduled_date: string
      start_time: string
      end_time: string
      planned_flow: number
      planned_volume: number
      sequence?: number
      description?: string
      user_name?: string
    }
  ) =>
    request<ApiResponse<{ id: number }>>(`/applications/${id}/generate-schedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const scheduleApi = {
  getList: (params?: {
    status?: string
    application_id?: number
    zone_id?: number
    gate_id?: number
    scheduled_date?: string
    start_date?: string
    end_date?: string
    page?: number
    pageSize?: number
  }) =>
    request<PaginatedResponse<Schedule>>(
      `/schedules?${new URLSearchParams(params as any).toString()}`
    ),
  getDetail: (id: number) => request<ApiResponse<Schedule>>(`/schedules/${id}`),
  create: (data: Partial<Schedule> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Schedule> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/schedules/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
}

export const dispatchApi = {
  getList: (params?: {
    status?: string
    plan_date?: string
    start_date?: string
    end_date?: string
    page?: number
    pageSize?: number
  }) =>
    request<PaginatedResponse<Dispatch>>(
      `/dispatches?${new URLSearchParams(params as any).toString()}`
    ),
  getDetail: (id: number) => request<ApiResponse<Dispatch & { items: DispatchItem[] }>>(`/dispatches/${id}`),
  getItems: (id: number) => request<ApiResponse<DispatchItem[]>>(`/dispatches/${id}/items`),
  create: (data: Partial<Dispatch> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/dispatches', { method: 'POST', body: JSON.stringify(data) }),
  generateFromSchedules: (data: {
    plan_date: string
    water_source: string
    water_level: number
    pump_capacity: number
    rotation_rule?: string
    generated_by?: string
    user_name?: string
  }) =>
    request<ApiResponse<{ id: number; item_count: number }>>('/dispatches/generate-from-schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adjust: (
    id: number,
    data: {
      water_source?: string
      water_level?: number
      pump_capacity?: number
      rotation_rule?: string
      total_planned_volume?: number
      status?: string
      adjust_reason: string
      adjusted_by?: string
      items?: Array<Partial<DispatchItem> & { id?: number; _deleted?: boolean }>
      user_name?: string
    }
  ) =>
    request<ApiResponse<void>>(`/dispatches/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Dispatch> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/dispatches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/dispatches/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
  createItem: (data: Partial<DispatchItem> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/dispatches/items', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id: number, data: Partial<DispatchItem> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/dispatches/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteItem: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/dispatches/items/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
}

export const deviceApi = {
  getList: (params?: { device_type?: string; status?: string; keyword?: string; page?: number; pageSize?: number }) =>
    request<PaginatedResponse<Device>>(`/devices?${new URLSearchParams(params as any).toString()}`),
  getDetail: (id: number) => request<ApiResponse<Device>>(`/devices/${id}`),
  getLatest: (params?: { device_type?: string; device_id?: number }) =>
    request<ApiResponse<Device[]>>(`/devices/latest?${new URLSearchParams(params as any).toString()}`),
  getHistory: (params?: { device_type?: string; device_id?: number; start_time?: string; end_time?: string; page?: number; pageSize?: number }) =>
    request<PaginatedResponse<Device>>(`/devices/history?${new URLSearchParams(params as any).toString()}`),
  create: (data: Partial<Device> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/devices', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Device> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/devices/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
}

export const alarmApi = {
  getList: (params?: {
    status?: string
    device_type?: string
    device_id?: number
    alarm_type?: string
    alarm_level?: string
    start_time?: string
    end_time?: string
    page?: number
    pageSize?: number
  }) =>
    request<PaginatedResponse<Alarm>>(`/alarms?${new URLSearchParams(params as any).toString()}`),
  getDetail: (id: number) => request<ApiResponse<Alarm>>(`/alarms/${id}`),
  create: (data: Partial<Alarm> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/alarms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Alarm> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/alarms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/alarms/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
  acknowledge: (id: number, data: { acknowledged_by?: string; user_name?: string }) =>
    request<ApiResponse<void>>(`/alarms/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resolve: (id: number, data: { resolution?: string; acknowledged_by?: string; user_name?: string }) =>
    request<ApiResponse<void>>(`/alarms/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const workOrderApi = {
  getList: (params?: {
    status?: string
    device_type?: string
    device_id?: number
    order_type?: string
    priority?: string
    assignee?: string
    start_time?: string
    end_time?: string
    page?: number
    pageSize?: number
  }) =>
    request<PaginatedResponse<WorkOrder>>(
      `/work-orders?${new URLSearchParams(params as any).toString()}`
    ),
  getDetail: (id: number) => request<ApiResponse<WorkOrder>>(`/work-orders/${id}`),
  create: (data: Partial<WorkOrder> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/work-orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<WorkOrder> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/work-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/work-orders/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
  assign: (id: number, data: { assignee: string; user_name?: string }) =>
    request<ApiResponse<void>>(`/work-orders/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  complete: (id: number, data: { completed_by?: string; description?: string; user_name?: string }) =>
    request<ApiResponse<void>>(`/work-orders/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const recordApi = {
  getList: (params?: {
    status?: string
    zone_id?: number
    gate_id?: number
    dispatch_id?: number
    dispatch_item_id?: number
    start_time?: string
    end_time?: string
    page?: number
    pageSize?: number
  }) =>
    request<PaginatedResponse<Record>>(`/records?${new URLSearchParams(params as any).toString()}`),
  getDetail: (id: number) => request<ApiResponse<Record>>(`/records/${id}`),
  create: (data: Partial<Record> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/records', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Record> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/records/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
  startIrrigation: (data: {
    dispatch_id?: number
    dispatch_item_id?: number
    zone_id: number
    gate_id: number
    operator: string
    user_name?: string
  }) =>
    request<ApiResponse<{ id: number }>>('/records/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  stopIrrigation: (id: number, data: { operator: string; actual_volume?: number; remark?: string; user_name?: string }) =>
    request<ApiResponse<void>>(`/records/${id}/stop`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const reportApi = {
  getList: (params?: {
    report_type?: string
    report_period?: string
    zone_id?: number
    start_date?: string
    end_date?: string
    page?: number
    pageSize?: number
  }) =>
    request<PaginatedResponse<Report>>(`/reports?${new URLSearchParams(params as any).toString()}`),
  getDetail: (id: number) => request<ApiResponse<Report>>(`/reports/${id}`),
  getStatistics: (params?: { start_date?: string; end_date?: string; zone_id?: number }) =>
    request<ApiResponse<ReportStatistics>>(
      `/reports/statistics/summary?${new URLSearchParams(params as any).toString()}`
    ),
  create: (data: Partial<Report> & { user_name?: string }) =>
    request<ApiResponse<{ id: number }>>('/reports', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Report> & { user_name?: string }) =>
    request<ApiResponse<void>>(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/reports/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
  generateDaily: (data: { report_date: string; zone_id?: number; user_name?: string }) =>
    request<ApiResponse<Array<{ zone_id: number; report_id: number }>>>('/reports/generate-daily', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generateMonthly: (data: { report_period: string; zone_id?: number; user_name?: string }) =>
    request<ApiResponse<Array<{ zone_id: number; report_id: number }>>>('/reports/generate-monthly', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const logApi = {
  getList: (params?: {
    module?: string
    action?: string
    user_name?: string
    target_id?: number
    start_time?: string
    end_time?: string
    page?: number
    pageSize?: number
  }) =>
    request<PaginatedResponse<Log>>(`/logs?${new URLSearchParams(params as any).toString()}`),
  getDetail: (id: number) => request<ApiResponse<Log>>(`/logs/${id}`),
  getModules: () => request<ApiResponse<string[]>>('/logs/modules/list'),
  getActions: () => request<ApiResponse<string[]>>('/logs/actions/list'),
  create: (data: Partial<Log>) =>
    request<ApiResponse<{ id: number }>>('/logs', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number, user_name?: string) =>
    request<ApiResponse<void>>(`/logs/${id}?user_name=${encodeURIComponent(user_name || '')}`, { method: 'DELETE' }),
}

export const dashboardApi = {
  getData: () => request<ApiResponse<DashboardData>>('/dashboard'),
}
