export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface Role {
  id: string
  name: string
  display_name: string
  permissions: string[]
}

export interface Organization {
  id: string
  name: string
  type: string
  parent_id?: string | null
  member_count?: number
  children?: Organization[]
}

export interface User {
  id: string
  phone: string
  name: string
  avatar?: string
  role: Role | null
  organization: Organization | null
}

export interface Device {
  id: string
  name: string
  type: string
  status: string
  location?: string
  organization_id?: string
  sn?: string
  firmware_version?: string
  last_heartbeat?: string
  org_name?: string
  alerts?: DeviceAlert[]
}

export interface DeviceHeartbeatStats {
  online: number
  offline: number
  maintenance: number
  total: number
  onlineRate: number
}

export interface AccessRecord {
  id: string
  user_id?: string
  user_name?: string
  device_id?: string
  device_name?: string
  mode?: string
  result?: string
  timestamp?: string
  created_at?: string
}

export interface VisitorCode {
  id: string
  code?: string
  valid_hours?: number
  max_uses?: number
  used_count?: number
  device_id?: string
  status?: string
  created_at?: string
}

export interface RepairOrder {
  id: string
  order_no?: string
  title?: string
  description?: string
  category?: string
  urgency?: string
  status: string
  reporter_id?: string
  reporter_name?: string
  assignee_id?: string
  assignee_name?: string
  images?: string
  location?: string
  created_at?: string
  updated_at?: string
  organization_id?: string
  feedbacks?: RepairFeedback[]
  feedback?: RepairFeedback[]
  evaluation?: RepairEvaluation | null
}

export interface RepairFeedback {
  id: string
  order_id?: string
  content: string
  images?: string
  user_id?: string
  user_name?: string
  created_at?: string
}

export interface RepairEvaluation {
  id: string
  order_id?: string
  rating: number
  comment?: string
  user_id?: string
  user_name?: string
  created_at?: string
}

export interface CommunityPost {
  id: string
  title?: string
  content: string
  category?: string
  images?: string
  author_id?: string
  author_name?: string
  review_status?: string
  reviewer_id?: string
  reviewer_name?: string
  review_comment?: string
  likes?: number
  comments?: number
  created_at?: string
  updated_at?: string
  organization_id?: string
}

export interface Payment {
  id: string
  type?: string
  amount?: number
  period?: string
  due_date?: string
  status: string
  paid_at?: string
  user_id?: string
  organization_id?: string
  created_at?: string
}

export interface PaymentReceipt {
  receipt_no?: string
  amount?: number
  paid_at?: string
  [key: string]: any
}

export interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  target_scope?: string
  status?: string
  published_at?: string
  read_rate?: number
  author_id?: string
  author_name?: string
  created_at?: string
  organization_id?: string
}

export interface DeviceAlert {
  id: string
  device_id?: string
  device_name?: string
  device_type?: string
  type?: string
  level: string
  message?: string
  status: string
  created_at?: string
  handled_at?: string
  handler_id?: string
  handler_name?: string
  handle_method?: string
  handle_note?: string
  organization_id?: string
}

export interface AlertStats {
  byLevel: { level: string; count: number }[]
  byStatus: { status: string; count: number }[]
  byType: { type: string; count: number }[]
  byDate: { date: string; count: number }[]
  total: number
  active: number
  critical: number
}

export interface OfflineCache {
  id: string
  device_id?: string
  device_name?: string
  action?: string
  payload?: string
  synced?: number
  created_at?: string
  synced_at?: string
}

export interface Permission {
  id: string
  code?: string
  name: string
  module?: string
}

export interface PermissionMatrix {
  role_id: string
  role_name: string
  permissions: Record<string, boolean>
}

export interface ReportResponseData {
  byMonth: { month: string; total: number; on_time: number }[]
  avgResponseHours: number
  overdueRate: number
}

export interface ReportCompletionData {
  byCategory: { category: string; total: number; completed: number }[]
  byMonth: { month: string; total: number; completed: number }[]
  total: number
  completed: number
  completionRate: number
}

export interface ReportDeviceOnlineData {
  byDay: { date: string; total: number; online: number }[]
  currentOnline: number
  total: number
  onlineRate: number
}

export interface ReportPaymentData {
  byMonth: { month: string; total: number; total_amount: number; paid_amount: number; paid_count: number }[]
  byType: { type: string; total: number; total_amount: number; paid_amount: number }[]
  totalAmount: number
  paidAmount: number
  collectionRate: number
}

export interface Member {
  id: string
  name: string
  phone: string
  role_id?: string
  role_name?: string
  org_id?: string
  org_name?: string
  status?: string
  created_at?: string
}
