import type { Material, ServiceItem, HealthMetrics, CaseRecord, HeatmapDataPoint, RelayRecord } from '@/types'

export async function apiFetch<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  const json = await res.json()
  if (json.success && json.data !== undefined) return json.data as T
  return json as T
}

export function mapService(raw: Record<string, unknown>): ServiceItem {
  const steps = (raw.process_steps || []) as Array<string | Record<string, unknown>>
  const mappedSteps = steps.map((s, i) => {
    if (typeof s === 'string') {
      return { step: i + 1, title: s as string, description: '', department: '', estimatedDays: 2 }
    }
    return { step: i + 1, title: String((s as Record<string, unknown>).title || ''), description: String((s as Record<string, unknown>).description || ''), department: String((s as Record<string, unknown>).department || ''), estimatedDays: Number((s as Record<string, unknown>).estimatedDays) || 2 }
  })

  const rawMaterials = (raw.materials || raw.requiredMaterials || []) as Array<Record<string, unknown>>
  const deptName = String(raw.department_name || raw.department || '')

  return {
    id: String(raw.id || ''),
    name: String(raw.name || ''),
    category: (raw.category as 'government' | 'convenience') || 'government',
    subCategory: String(raw.sub_category || raw.subCategory || ''),
    description: String(raw.description || ''),
    icon: String(raw.icon || 'FileText'),
    applicantCount: Number(raw.applicant_count || raw.applicantCount || 0),
    accessType: (raw.access_type || raw.accessType || 'http') as 'http' | 'webhook' | 'api-gateway',
    accessConfig: typeof raw.access_config === 'string' ? JSON.parse(raw.access_config) : (raw.accessConfig || raw.access_config || {}),
    status: (raw.status || 'online') as ServiceItem['status'],
    department: deptName,
    departmentName: deptName,
    departmentId: String(raw.department_id || raw.departmentId || ''),
    serviceCode: String(raw.service_code || raw.serviceCode || raw.code || ''),
    processingTime: Number(raw.processing_time || raw.processingTime || raw.avg_process_days || 3),
    satisfaction: Number(raw.satisfaction || raw.satisfaction_rate || raw.rating || 95),
    rating: Number(raw.rating || raw.satisfaction || 4.7),
    reviewCount: Number(raw.review_count || raw.reviewCount || raw.total_reviews || 0),
    requiredMaterials: rawMaterials.map(mapMaterial),
    processSteps: mappedSteps,
  }
}

export function mapMaterial(raw: Record<string, unknown>): Material {
  let ocrFields = raw.ocr_fields || raw.ocrFields || []
  if (typeof ocrFields === 'string') {
    try { ocrFields = JSON.parse(ocrFields) } catch { ocrFields = [] }
  }
  let fmt = raw.format || raw.file_type || ['PDF', 'JPG']
  if (typeof fmt === 'string') {
    fmt = fmt.split(/[,，;；/|]/).map((s: string) => s.trim()).filter(Boolean)
  }
  return {
    id: String(raw.id || 'mat-' + Math.random().toString(36).slice(2, 8)),
    name: String(raw.name || '材料'),
    description: String(raw.description || ''),
    ocrFields: (ocrFields as Array<Record<string, unknown> | string>).map((f) =>
      typeof f === 'string' ? f : String(f.field || f.label || f)
    ),
    required: Boolean(raw.required),
    format: Array.isArray(fmt) ? fmt.map(String) : [String(fmt)],
    quantity: Number(raw.quantity || raw.copy_count || 1),
    sampleUrl: String(raw.sample_url || raw.sampleUrl || ''),
  }
}

export function mapHealthMetric(raw: Record<string, unknown>): HealthMetrics {
  const avgRT = Number(raw.avg_response_time || raw.avgResponseTime || raw.avg_response || raw.avgResponse || 0)
  const failRate = Number(raw.failure_rate || raw.failureRate || 0)
  const endpoints = (raw.endpoints || raw.endpoint_details || []) as Array<Record<string, unknown>>

  return {
    id: String(raw.id || ''),
    departmentId: String(raw.department_id || raw.departmentId || ''),
    departmentName: String(raw.department_name || raw.departmentName || ''),
    avgResponseTime: avgRT,
    avgResponse: avgRT,
    p50: Number(raw.p50 || raw.p50_response || avgRT * 0.85),
    p95: Number(raw.p95 || raw.p95_response || avgRT * 1.6),
    p99: Number(raw.p99 || raw.p99_response || avgRT * 2.5),
    failureRate: failRate,
    timeoutCount: Number(raw.timeout_count || raw.timeoutCount || 0),
    totalRequests: Number(raw.total_requests || raw.totalRequests || raw.call_count || 0),
    successRate: Number(raw.success_rate || raw.successRate || 100 - failRate),
    qps: Number(raw.qps || raw.requests_per_second || 0),
    status: (raw.status || 'healthy') as HealthMetrics['status'],
    lastCheckTime: String(raw.checked_at || raw.lastCheckTime || raw.last_check || ''),
    lastCheck: String(raw.checked_at || raw.lastCheck || raw.last_check || ''),
    endpoints: endpoints.map((e) => ({
      name: String(e.name || e.endpoint_name || ''),
      path: String(e.path || e.url || ''),
      method: String(e.method || 'GET'),
      avgResponseTime: Number(e.avg_response_time || e.avgResponseTime || e.avg_response || e.avgResponse || 0),
      avgResponse: Number(e.avg_response_time || e.avgResponseTime || e.avg_response || e.avgResponse || 0),
      failureRate: Number(e.failure_rate || e.failureRate || e.fail || 0),
      fail: Number(e.failure_rate || e.failureRate || e.fail || 0),
      totalCalls: Number(e.total_calls || e.totalCalls || e.calls || e.count || 0),
      calls: Number(e.total_calls || e.totalCalls || e.calls || e.count || 0),
    })),
  }
}

export function mapCase(raw: Record<string, unknown>): CaseRecord {
  let formData = raw.form_data || raw.formData || {}
  if (typeof formData === 'string') {
    try { formData = JSON.parse(formData) } catch { formData = {} }
  }
  return {
    id: String(raw.id || ''),
    userId: String(raw.user_id || raw.userId || ''),
    serviceId: String(raw.service_id || raw.serviceId || ''),
    serviceName: String(raw.service_name || raw.serviceName || ''),
    status: raw.status as CaseRecord['status'],
    formData: formData as Record<string, string>,
    createdAt: String(raw.created_at || raw.createdAt || ''),
    updatedAt: String(raw.updated_at || raw.updatedAt || ''),
  }
}

export function mapHeatmapPoint(raw: Record<string, unknown>): HeatmapDataPoint {
  return {
    region: String(raw.region || raw.area || ''),
    timeSlot: String(raw.time_slot || raw.timeSlot || raw.hour || ''),
    serviceCategory: String(raw.service_category || raw.serviceCategory || raw.category || ''),
    category: String(raw.category || raw.service_category || ''),
    service: String(raw.service || raw.service_name || ''),
    count: Number(raw.count || raw.value || raw.case_count || 0),
  }
}

export function mapRelayRecord(raw: Record<string, unknown>): RelayRecord {
  return {
    id: String(raw.id || raw.record_id || ''),
    time: String(raw.time || raw.created_at || raw.timestamp || ''),
    direction: (raw.direction || raw.sync_direction || 'to-province') as RelayRecord['direction'],
    service: String(raw.service || raw.service_name || ''),
    dept: String(raw.dept || raw.department || raw.department_name || ''),
    batchNo: String(raw.batch_no || raw.batchNo || raw.batch_number || ''),
    dataType: String(raw.data_type || raw.dataType || raw.type || ''),
    records: Number(raw.records || raw.record_count || raw.count || 0),
    dataSize: String(raw.data_size || raw.dataSize || raw.size || '0KB'),
    duration: String(raw.duration || raw.cost || raw.time_cost || '0s'),
    status: (raw.status || 'success') as RelayRecord['status'],
    remarks: String(raw.remarks || raw.remark || raw.error_msg || ''),
  }
}
