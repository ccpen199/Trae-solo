export interface ActivityResponse {
  id: number
  title: string
  description: string
  organizer_id: number
  status: string
  location: string
  latitude?: number
  longitude?: number
  location_radius: number
  start_time: string
  end_time: string
  max_volunteers: number
  current_volunteers: number
  created_at: string
  updated_at: string
  required_skills: SkillResponse[]
}

export interface SkillResponse {
  id: number
  name: string
  description?: string
  category: string
  created_at: string
}

export interface RegistrationResponse {
  id: number
  volunteer_id: number
  activity_id: number
  status: string
  message?: string
  reviewed_by?: number
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface ShiftResponse {
  id: number
  activity_id: number
  volunteer_id: number
  registration_id?: number
  status: string
  start_time: string
  end_time: string
  confirmed_at?: string
  created_at: string
  updated_at: string
}

export interface WorkOrderResponse {
  id: number
  shift_id: number
  activity_id: number
  volunteer_id: number
  order_code: string
  tasks: string
  issued_at: string
}

export interface AttendanceResponse {
  id: number
  shift_id: number
  activity_id: number
  volunteer_id: number
  status: string
  check_in_time?: string
  check_in_latitude?: number
  check_in_longitude?: number
  check_out_time?: string
  check_out_latitude?: number
  check_out_longitude?: number
  actual_duration?: number
  created_at: string
  updated_at: string
}

export interface BadgeResponse {
  id: number
  name: string
  description: string
  tier: string
  icon?: string
  requirement_type: string
  requirement_value: number
}

export interface UserBadgeResponse {
  id: number
  user_id: number
  badge_id: number
  awarded_at: string
  awarded_by?: number
  reason?: string
  badge: BadgeResponse
}

export interface CreditRecordResponse {
  id: number
  user_id: number
  activity_id?: number
  attendance_id?: number
  change: number
  balance: number
  reason: string
  created_at: string
}

export interface NotificationResponse {
  id: number
  user_id: number
  title: string
  message: string
  is_read: boolean
  read_at?: string
  notification_type: string
  related_id?: number
  created_at: string
}

export interface AnomalyRecordResponse {
  id: number
  attendance_id?: number
  activity_id?: number
  volunteer_id?: number
  anomaly_type: string
  description: string
  is_verified: boolean
  verified_by?: number
  verified_at?: string
  action_taken?: string
  created_at: string
}

export interface ServiceHeatResponse {
  id: number
  date: string
  hour: number
  total_activities: number
  total_volunteers: number
  total_hours: number
  created_at: string
}

export interface AuditLogResponse {
  id: number
  user_id?: number
  action: string
  table_name?: string
  record_id?: number
  old_value?: string
  new_value?: string
  ip_address?: string
  user_agent?: string
  timestamp: string
}
