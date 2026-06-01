const BASE_URL = ''

function buildUrl(path: string, params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return `${BASE_URL}${path}${query}`
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }
  const json = await res.json()
  if (json.success && json.data !== undefined) {
    return json.data as T
  }
  return json as T
}

export interface Site {
  id: number
  name: string
  address: string
  operator: string
  device_count: number
  electricity_price: number
  service_fee: number
  business_hours_start: string
  business_hours_end: string
  status: string
  created_at: string
  updated_at: string
}

export interface Device {
  id: number
  site_id: number
  name: string
  model: string
  power: number
  online: number
  fault_code: string | null
  last_heartbeat: string
  status: string
  ports?: DevicePort[]
  site_name?: string
  related_work_order_id?: number | null
  work_order_status?: string | null
  created_at: string
  updated_at: string
}

export interface DevicePort {
  id: number
  device_id: number
  port_number: number
  status: string
  connector_type: string
}

export interface Order {
  id: number
  device_id: number
  port_id: number
  site_id: number
  start_time: string
  end_time: string | null
  duration: number
  energy: number
  cost: number
  stop_reason: string | null
  refund_status: string
  refund_amount: number
  status: string
  site_name?: string
  device_name?: string
  scan_time?: string
  charge_start_time?: string
  fee_breakdown?: { electricity_cost: number; service_cost: number; total_cost: number }
  created_at: string
  updated_at: string
}

export interface WorkOrder {
  id: number
  device_id: number | null
  site_id: number | null
  type: string
  status: string
  priority: string
  description: string | null
  assignee: string | null
  created_at: string
  assigned_at: string | null
  resolved_at: string | null
  resolution: string | null
  photos?: WorkOrderPhoto[]
  site_name?: string
  device_name?: string
  photo_count?: number
  has_complaint?: boolean
  first_response_minutes?: number
}

export interface WorkOrderPhoto {
  id: number
  work_order_id: number
  photo_url: string
  description: string | null
  uploaded_at: string
}

export interface Partner {
  id: number
  site_id: number
  name: string
  share_ratio: number
  contact: string | null
}

export interface FinanceSummary {
  total_revenue: number
  total_electricity_cost: number
  total_refund: number
  net_income: number
}

export interface FinanceBySite {
  site_id: number
  site_name: string
  order_count: number
  total_revenue: number
  electricity_cost: number
  service_fee: number
  refund: number
  net_income: number
  proportion: number
}

export interface FinanceByDevice {
  device_id: number
  device_name: string
  site_name: string
  total_revenue: number
  energy_total: number
  electricity_cost: number
  net_income: number
  order_count: number
  utilization_rate: number
}

export interface FinanceByPartner {
  partner_id: number
  partner_name: string
  site_name: string
  contact?: string | null
  share_ratio: number
  partner_share: number
  platform_share: number
  total_revenue: number
  order_count: number
  settlement_status: string
}

export interface FinanceByOrder {
  record_id: number
  order_id: number
  site_name: string
  device_name: string
  partner_name: string
  energy: number
  duration: number
  total_amount: number
  electricity_cost: number
  partner_share: number
  platform_share: number
  refund_deduction: number
  actual_received: number
  created_at: string
}

export interface FinanceRefund {
  id: number
  order_id: number
  site_name: string
  device_name: string
  original_amount: number
  refund_amount: number
  refund_status: string
  refund_time: string
  refund_reason: string
  operator: string
}

export interface DashboardStats {
  total_sites: number
  online_devices: number
  today_orders: number
  today_revenue: number
  alert_devices: Device[]
  pending_work_orders: number
  pending_work_orders_list: WorkOrder[]
  recent_orders: Order[]
}

export const getSites = (params?: Record<string, string>) =>
  request<Site[]>(buildUrl('/api/sites', params))

export const getSite = (id: number) => request<Site>(`${BASE_URL}/api/sites/${id}`)

export const createSite = (data: Partial<Site>) =>
  request<Site>(`${BASE_URL}/api/sites`, { method: 'POST', body: JSON.stringify(data) })

export const updateSite = (id: number, data: Partial<Site>) =>
  request<Site>(`${BASE_URL}/api/sites/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteSite = (id: number) =>
  request<void>(`${BASE_URL}/api/sites/${id}`, { method: 'DELETE' })

export const getDevices = (params?: Record<string, string>) =>
  request<Device[]>(buildUrl('/api/devices', params))

export const getDevice = (id: number) => request<Device>(`${BASE_URL}/api/devices/${id}`)

export const createDevice = (data: Partial<Device>) =>
  request<Device>(`${BASE_URL}/api/devices`, { method: 'POST', body: JSON.stringify(data) })

export const updateDevice = (id: number, data: Partial<Device>) =>
  request<Device>(`${BASE_URL}/api/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const updateHeartbeat = (id: number) =>
  request<Device>(`${BASE_URL}/api/devices/${id}/heartbeat`, { method: 'PATCH' })

export const setOffline = (id: number) =>
  request<Device>(`${BASE_URL}/api/devices/${id}`, { method: 'PUT', body: JSON.stringify({ online: 0 }) })

export const getOrders = (params?: Record<string, string>) =>
  request<Order[]>(buildUrl('/api/orders', params))

export const getOrder = (id: number) => request<Order>(`${BASE_URL}/api/orders/${id}`)

export const createOrder = (data: { device_id: number; port_id: number; site_id?: number }) =>
  request<Order>(`${BASE_URL}/api/orders`, { method: 'POST', body: JSON.stringify(data) })

export const stopOrder = (id: number) =>
  request<Order>(`${BASE_URL}/api/orders/${id}/stop`, { method: 'PATCH' })

export const refundOrder = (id: number) =>
  request<Order>(`${BASE_URL}/api/orders/${id}/refund`, { method: 'PATCH' })

export const getOrderStats = (params?: Record<string, string>) =>
  request<{ total: number; revenue: number }>(buildUrl('/api/orders/stats', params))

export const getWorkOrders = (params?: Record<string, string>) =>
  request<WorkOrder[]>(buildUrl('/api/work-orders', params))

export const getWorkOrder = (id: number) => request<WorkOrder>(`${BASE_URL}/api/work-orders/${id}`)

export const createWorkOrder = (data: Partial<WorkOrder>) =>
  request<WorkOrder>(`${BASE_URL}/api/work-orders`, { method: 'POST', body: JSON.stringify(data) })

export const assignWorkOrder = (id: number, assignee: string) =>
  request<WorkOrder>(`${BASE_URL}/api/work-orders/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assignee }) })

export const resolveWorkOrder = (id: number, resolution: string) =>
  request<WorkOrder>(`${BASE_URL}/api/work-orders/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolution }) })

export const addWorkOrderPhoto = (id: number, data: { photo_url: string; description?: string }) =>
  request<WorkOrderPhoto>(`${BASE_URL}/api/work-orders/${id}/photos`, { method: 'POST', body: JSON.stringify(data) })

export const getFinanceSummary = (params?: Record<string, string>) =>
  request<FinanceSummary>(buildUrl('/api/finance/summary', params))

export const getFinanceBySite = (params?: Record<string, string>) =>
  request<FinanceBySite[]>(buildUrl('/api/finance/by-site', params))

export const getFinanceByDevice = (params?: Record<string, string>) =>
  request<FinanceByDevice[]>(buildUrl('/api/finance/by-device', params))

export const getFinanceByPartner = (params?: Record<string, string>) =>
  request<FinanceByPartner[]>(buildUrl('/api/finance/by-partner', params))

export const getRevenueSharing = (params?: Record<string, string>) =>
  request<FinanceByPartner[]>(buildUrl('/api/finance/revenue-sharing', params))

export const getFinanceByOrder = (params?: Record<string, string>) =>
  request<FinanceByOrder[]>(buildUrl('/api/finance/by-order', params))

export const getFinanceRefunds = (params?: Record<string, string>) =>
  request<FinanceRefund[]>(buildUrl('/api/finance/refunds', params))

export const getDashboardStats = () => request<DashboardStats>(`${BASE_URL}/api/dashboard/stats`)
