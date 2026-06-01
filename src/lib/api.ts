const API_BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })
  return res.json()
}

export interface Mold {
  id: number
  mold_number: string
  product_name: string
  cavity_count: number
  total_life: number
  current_usage: number
  storage_location: string
  maintenance_cycle: number
  last_maintenance: number
  responsible_person: string
  status: 'idle' | 'in_use' | 'maintenance'
  current_work_order: string | null
  created_at: string
  updated_at: string
}

export interface ProductionUsage {
  id: number
  mold_id: number
  work_order: string
  operator: string
  start_time: string
  end_time: string | null
  produced_quantity: number
  status: string
  quality_issues: string | null
  mold_number?: string
  product_name?: string
}

export interface MaintenanceRecord {
  id: number
  mold_id: number
  fault_symptom: string
  repair_content: string
  spare_parts: string
  downtime_minutes: number
  repair_person: string
  start_time: string
  end_time: string | null
  acceptance_result: string | null
  acceptance_person: string | null
  is_repeated_fault: number
  mold_number?: string
  product_name?: string
}

export interface QualityRecord {
  id: number
  mold_id: number
  work_order: string
  defect_type: string
  defect_count: number
  inspector: string
  record_time: string
  notes: string
  mold_number?: string
  product_name?: string
}

export interface Stats {
  totalMolds: number
  inUseMolds: number
  maintenanceMolds: number
  idleMolds: number
  nearEndOfLife: number
  totalProduced: number
  pendingMaintenance: number
  repeatedFaults: number
}

export const api = {
  getMolds: (status?: string, search?: string) =>
    request<{ success: boolean; data: Mold[] }>(
      `/molds${status || search ? '?' : ''}${status ? `status=${status}` : ''}${search ? `&search=${search}` : ''}`
    ),
  
  getMold: (id: number) =>
    request<{ success: boolean; data: Mold }>(`/molds/${id}`),
  
  createMold: (data: Partial<Mold>) =>
    request<{ success: boolean; data?: { id: number }; error?: string }>('/molds', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateMold: (id: number, data: Partial<Mold>) =>
    request<{ success: boolean; message: string }>(`/molds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteMold: (id: number) =>
    request<{ success: boolean; message: string }>(`/molds/${id}`, {
      method: 'DELETE',
    }),

  checkoutMold: (data: { mold_id: number; work_order: string; operator: string }) =>
    request<{ success: boolean; message: string; warning?: string; error?: string }>('/production/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  checkinMold: (data: { mold_id: number; produced_quantity: number; quality_issues?: string }) =>
    request<{ success: boolean; message: string; error?: string }>('/production/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProductionUsage: () =>
    request<{ success: boolean; data: ProductionUsage[] }>('/production/usage'),

  getActiveProduction: () =>
    request<{ success: boolean; data: ProductionUsage[] }>('/production/active'),

  getMaintenanceRecords: (mold_id?: number, status?: string) =>
    request<{ success: boolean; data: MaintenanceRecord[] }>(
      `/maintenance${mold_id || status ? '?' : ''}${mold_id ? `mold_id=${mold_id}` : ''}${status ? `&status=${status}` : ''}`
    ),

  startMaintenance: (data: { mold_id: number; fault_symptom: string; repair_person: string }) =>
    request<{ success: boolean; data?: { id: number }; warning?: string; error?: string }>('/maintenance/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  completeMaintenance: (data: { id: number; repair_content: string; spare_parts?: string; downtime_minutes?: number }) =>
    request<{ success: boolean; message: string; error?: string }>('/maintenance/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  acceptMaintenance: (data: { id: number; acceptance_result: string; acceptance_person: string }) =>
    request<{ success: boolean; message: string; error?: string }>('/maintenance/accept', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getQualityRecords: (mold_id?: number) =>
    request<{ success: boolean; data: QualityRecord[] }>(
      `/quality${mold_id ? `?mold_id=${mold_id}` : ''}`
    ),

  createQualityRecord: (data: Partial<QualityRecord>) =>
    request<{ success: boolean; message: string }>('/quality', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStats: () =>
    request<{ success: boolean; data: Stats }>('/quality/stats'),
}
