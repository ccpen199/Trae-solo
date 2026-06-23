export interface Battery {
  battery_id: string
  model: string
  capacity: number
  nominal_voltage: number
  manufacture_date: string
  cycle_count: number
  health_score: number
  status: 'charging' | 'standby' | 'in_use' | 'maintenance'
  current_soc: number
  current_voltage: number
  current_temp: number
  gbt_standard: string
  first_use_date: string
  estimated_scrap_date: string
  cabinet_id?: string
  slot_number?: number
}

export interface ChargeRecord {
  id: string
  battery_id: string
  start_time: string
  end_time: string
  start_soc: number
  end_soc: number
  start_voltage: number
  end_voltage: number
  charge_capacity: number
  avg_temp: number
  max_temp: number
  is_full_cycle: boolean
}

export interface Cabinet {
  cabinet_id: string
  name: string
  location: string
  lat: number
  lng: number
  total_slots: number
  available_slots: number
  full_batteries: number
  charging_batteries: number
  current_temp: number
  comm_status: 'online' | 'offline'
  temp_control_status: 'normal' | 'abnormal'
  mechanical_status: 'normal' | 'jammed'
  status: 'running' | 'warning' | 'fault'
  last_heartbeat: string
  slots: CabinetSlot[]
}

export interface CabinetSlot {
  slot_number: number
  status: 'empty' | 'occupied' | 'charging' | 'fault' | 'locked'
  battery_id?: string
  soc?: number
  door_status: 'open' | 'closed'
}

export interface Rider {
  rider_id: string
  phone: string
  real_name: string
  id_card: string
  driver_license_no: string
  driver_license_type: string
  driver_license_expiry: string
  verify_status: 'pending' | 'verified' | 'rejected'
  status: 'active' | 'suspended' | 'banned'
  register_date: string
  avatar?: string
  current_battery_id?: string
  current_soc?: number
  package_balance: number
  total_swaps: number
}

export interface SwapOrder {
  order_id: string
  rider_id: string
  cabinet_id: string
  cabinet_name: string
  old_battery_id: string
  new_battery_id: string
  old_soc: number
  new_soc: number
  amount: number
  pay_method: 'package' | 'wechat' | 'alipay' | 'mixed'
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed'
  created_at: string
  completed_at?: string
  rider_name?: string
}

export interface Alert {
  alert_id: string
  cabinet_id?: string
  cabinet_name?: string
  battery_id?: string
  type: 'comm' | 'temp' | 'mechanical' | 'battery'
  level: 'critical' | 'warning' | 'info'
  title: string
  description: string
  status: 'pending' | 'processing' | 'resolved'
  created_at: string
  resolved_at?: string
  handler?: string
}

export interface Reservation {
  reservation_id: string
  rider_id: string
  cabinet_id: string
  cabinet_name: string
  battery_id: string
  expire_time: string
  status: 'active' | 'expired' | 'used'
  created_at: string
}

export interface Package {
  package_id: string
  name: string
  type: 'times' | 'duration' | 'unlimited'
  price: number
  original_price: number
  swap_times?: number
  duration_days?: number
  description: string
  features: string[]
  popular?: boolean
}

export interface HeatmapPoint {
  lat: number
  lng: number
  value: number
}

export interface RiderTrajectory {
  rider_id: string
  points: { lat: number; lng: number; time: string }[]
}

export interface BatteryHealthDetail {
  battery_id: string
  total_cycles: number
  capacity_retention: number
  internal_resistance: number
  resistance_increase_rate: number
  voltage_decay_rate: number
  estimated_remaining_cycles: number
  health_level: 'excellent' | 'good' | 'fair' | 'poor'
  last_check_date: string
}
