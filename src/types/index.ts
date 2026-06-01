export interface PaginatedResponse<T> {
  success: boolean
  data: {
    list: T[]
    total: number
    page: number
    pageSize: number
  }
  message?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface Canal {
  id: number
  name: string
  code: string
  length: number
  capacity: number
  status: 'active' | 'inactive' | 'maintenance'
  description: string
  created_at: string
  updated_at: string
}

export interface Pump {
  id: number
  name: string
  code: string
  canal_id: number
  canal_name?: string
  flow_rate: number
  power: number
  status: 'running' | 'stopped' | 'fault' | 'maintenance'
  temperature?: number
  pressure?: number
  description: string
  created_at: string
  updated_at: string
}

export interface Gate {
  id: number
  name: string
  code: string
  canal_id: number
  canal_name?: string
  zone_id?: number
  zone_name?: string
  max_opening: number
  current_opening?: number
  flow_rate?: number
  status: 'open' | 'closed' | 'partial' | 'fault' | 'maintenance'
  description: string
  created_at: string
  updated_at: string
}

export interface Zone {
  id: number
  name: string
  code: string
  canal_id: number
  canal_name?: string
  area: number
  location: string
  responsible_person: string
  phone: string
  status: 'active' | 'inactive'
  description: string
  created_at: string
  updated_at: string
}

export interface Crop {
  id: number
  name: string
  code: string
  water_requirement: number
  growth_cycle: string
  description: string
  created_at: string
  updated_at: string
}

export interface Quota {
  id: number
  zone_id: number
  zone_name?: string
  crop_type_id: number
  crop_name?: string
  year: number
  season: string
  total_quota: number
  used_quota: number
  remaining_quota: number
  unit: string
  created_at: string
  updated_at: string
}

export interface Application {
  id: number
  applicant_name: string
  applicant_type: 'individual' | 'collective' | 'enterprise'
  zone_id: number
  zone_name?: string
  zone_code?: string
  crop_type_id: number
  crop_name?: string
  crop_code?: string
  irrigation_area: number
  start_date: string
  end_date: string
  estimated_water: number
  priority: number
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  rejection_reason?: string
  created_by: string
  reviewed_by?: string
  reviewed_at?: string
  canal_id?: number
  canal_name?: string
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: number
  application_id: number
  gate_id: number
  gate_name?: string
  zone_id: number
  zone_name?: string
  scheduled_date: string
  start_time: string
  end_time: string
  planned_flow: number
  planned_volume: number
  status: 'scheduled' | 'executing' | 'completed' | 'cancelled'
  sequence: number
  description: string
  created_at: string
  updated_at: string
}

export interface DispatchItem {
  id: number
  plan_id: number
  schedule_id?: number
  zone_id: number
  zone_name?: string
  zone_code?: string
  gate_id: number
  gate_name?: string
  gate_code?: string
  pump_station_id?: number
  pump_station_name?: string
  pump_station_code?: string
  start_time: string
  end_time: string
  flow_rate: number
  volume: number
  sequence: number
  status: 'pending' | 'executing' | 'completed' | 'skipped' | 'cancelled'
  schedule_start?: string
  schedule_end?: string
  scheduled_date?: string
  created_at: string
  updated_at: string
}

export interface DispatchAdjustment {
  id: number
  plan_id: number
  original_value: string
  new_value: string
  adjust_reason: string
  adjusted_by: string
  created_at: string
}

export interface Dispatch {
  id: number
  plan_date: string
  water_source: string
  water_level: number
  pump_capacity: number
  rotation_rule: string
  total_planned_volume: number
  status: 'draft' | 'published' | 'executing' | 'completed' | 'cancelled'
  generated_by: string
  adjusted_by?: string
  adjust_reason?: string
  description: string
  item_count?: number
  items?: DispatchItem[]
  adjustments?: DispatchAdjustment[]
  created_at: string
  updated_at: string
}

export interface Device {
  id: number
  device_type: 'gate' | 'pump' | 'sensor' | 'meter' | 'camera'
  device_id: number
  device_code: string
  gate_opening?: number | null
  flow_rate?: number | null
  water_level?: number | null
  pump_status?: string | null
  voltage?: number | null
  current?: number | null
  temperature?: number | null
  status: string
  timestamp?: string | null
}

export interface Alarm {
  id: number
  device_type: 'gate' | 'pump' | 'sensor' | 'system'
  device_id: number
  device_code: string
  alarm_type: 'fault' | 'threshold' | 'communication' | 'power' | 'manual'
  alarm_level: 'critical' | 'high' | 'medium' | 'low'
  alarm_message: string
  status: 'active' | 'acknowledged' | 'resolved'
  acknowledged_by?: string
  acknowledged_at?: string
  resolved_at?: string
  resolution?: string
  created_at: string
}

export interface WorkOrder {
  id: number
  alarm_id?: number
  alarm_type?: string
  alarm_level?: string
  alarm_message?: string
  device_type: 'gate' | 'pump' | 'sensor' | 'system'
  device_id: number
  device_code: string
  order_type: 'repair' | 'maintenance' | 'inspection' | 'emergency'
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  description: string
  assignee: string
  completed_by?: string
  completed_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Record {
  id: number
  dispatch_id?: number
  dispatch_item_id?: number
  zone_id: number
  zone_name?: string
  gate_id: number
  gate_name?: string
  start_time: string
  end_time?: string
  planned_volume: number
  actual_volume?: number
  opening_percentage?: number
  average_flow?: number
  status: 'scheduled' | 'executing' | 'completed' | 'cancelled' | 'interrupted'
  operator: string
  remark?: string
  created_at: string
  updated_at: string
}

export interface Report {
  id: number
  report_type: 'daily' | 'monthly' | 'yearly' | 'custom'
  report_period: string
  report_date: string
  zone_id?: number
  zone_name?: string
  zone_code?: string
  zone_area?: number
  planned_water: number
  actual_water: number
  water_loss: number
  deficit: number
  completion_rate: number
  irrigation_area: number
  description: string
  created_at: string
}

export interface ReportStatistics {
  summary: {
    report_count: number
    total_planned_water: number
    total_actual_water: number
    total_water_loss: number
    total_deficit: number
    avg_completion_rate: number
    total_irrigation_area: number
  }
  by_zone: Array<{
    zone_id: number
    zone_name: string
    total_planned_water: number
    total_actual_water: number
    avg_completion_rate: number
  }>
  by_type: Array<{
    report_type: string
    count: number
    total_planned_water: number
    total_actual_water: number
  }>
}

export interface Log {
  id: number
  user_id?: number
  user_name: string
  module: string
  action: string
  target_id?: number
  details: string
  ip_address: string
  created_at: string
}

export interface DashboardStats {
  totalCanals: number
  totalPumps: number
  totalGates: number
  totalZones: number
  totalCrops: number
  pendingApplications: number
  activeAlarms: number
  activeWorkOrders: number
}

export interface DashboardData {
  stats: DashboardStats
  todaySchedules: Schedule[]
  recentRecords: Record[]
  activeAlarms: Alarm[]
}
