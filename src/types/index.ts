export interface Vessel {
  id: number
  name: string
  code: string
  owner_name: string
  owner_phone: string
  vessel_type: string
  fishing_type: string
  gps_device: string
  gps_status: string
  safety_device: string
  safety_status: string
  work_permit: string
  work_permit_status: string
  work_permit_expiry: string
  status: string
  created_at: string
  updated_at: string
  certificates?: Certificate[]
}

export interface Certificate {
  id: number
  vessel_id: number
  cert_type: string
  cert_number: string
  issue_date: string
  expiry_date: string
  status: string
  created_at: string
}

export interface DeclarationCrew {
  id?: number
  name: string
  id_number: string
  role: string
  phone: string
}

export interface Declaration {
  id: number
  vessel_id: number
  sea_area: string
  departure_time: string
  expected_return: string
  work_permit: string
  work_permit_status: string
  insurance_status: string
  status: string
  reject_reason: string
  verified_by: string
  approved_by: string
  verified_at: string | null
  approved_at: string | null
  actual_return: string | null
  created_at: string
  updated_at: string
  crews?: DeclarationCrew[]
  vessel?: Vessel
  crew_count?: number
  owner_name?: string
}

export interface TrackPoint {
  id: number
  vessel_id: number
  latitude: number
  longitude: number
  speed: number
  heading: number
  recorded_at: string
}

export interface Fence {
  id: number
  name: string
  fence_type: string
  coordinates: string
  status: string
  created_at: string
}

export interface Alert {
  id: number
  vessel_id: number
  fence_id: number | null
  alert_type: string
  severity: string
  message: string
  status: string
  triggered_at: string
  resolved_at: string | null
  created_at: string
  vessel_name?: string
  vessel_code?: string
}

export interface EventNotification {
  id?: number
  event_id?: number
  recipient: string
  method: string
  content: string
  sent_at?: string
}

export interface EventReceipt {
  id?: number
  event_id?: number
  respondent: string
  content: string
  received_at?: string
}

export interface Event {
  id: number
  vessel_id: number
  event_type: string
  title: string
  description: string
  status: string
  resolution: string
  occurred_at: string
  resolved_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  vessel?: Vessel
  notifications?: EventNotification[]
  receipts?: EventReceipt[]
  notification_count?: number
  receipt_count?: number
}

export interface DashboardData {
  summary: {
    vesselCount: number
    atSeaCount: number
    inPortCount: number
    maintenanceCount: number
    pendingDeclarations: number
    activeDeclarations: number
    pendingAlerts: number
    pendingEvents: number
  }
  recentDeclarations: Array<Record<string, any>>
  recentEvents: Array<Record<string, any>>
  pendingAlerts: Alert[]
  certExpiring: Certificate[]
}

export interface FleetStat {
  owner_name: string
  vessel_count: number
  declaration_count: number
  event_count: number
}

export interface SeaAreaStat {
  sea_area: string
  declaration_count: number
  event_count: number
}

export interface VoyageStat {
  total: number
  by_status: Record<string, number>
  by_month: Array<{ month: string; count: number }>
}

export interface ViolationStat {
  event_type: string
  count: number
}

export interface SafetyRiskStat {
  vessel_id: number
  vessel_name: string
  vessel_code: string
  owner_name: string
  fishing_type: string
  status: string
  event_count: number
  alert_count: number
  risk_score: number
  declaration_count: number
  active_voyage_count: number
  resolved_event_count: number
  pending_event_count: number
  sea_areas: string[]
  violation_types: string[]
}

export type VesselType = string
export type SeaArea = string

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
