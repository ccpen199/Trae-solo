export type UserRole = 'courier' | 'outlet_admin' | 'regional_supervisor' | 'head_auditor'

export type UserStatus = 'active' | 'disabled'

export interface User {
  id: string
  username: string
  password_hash?: string
  real_name: string
  role: UserRole
  outlet_id?: string
  region_id?: string
  status: UserStatus
  created_at: string
  updated_at: string
}

export interface Outlet {
  id: string
  name: string
  region_id: string
  address?: string
  contact_phone?: string
  created_at: string
}

export type WaybillStatus = 'created' | 'synced' | 'pending_sync'

export interface WaybillItem {
  category: string
  name: string
  quantity: number
  declaredValue: number
  isProhibited: boolean
  prohibitedNote?: string
}

export interface Waybill {
  id: string
  tracking_no: string
  regulatory_code: string
  sender_name_enc: string
  sender_phone_enc: string
  sender_address_enc: string
  sender_real_name_id?: string
  receiver_name_enc: string
  receiver_phone_enc: string
  receiver_address_enc: string
  items_json_enc: string
  weight: number
  volume?: number
  freight: number
  status: WaybillStatus
  courier_id?: string
  outlet_id?: string
  qr_code?: string
  created_at: string
  synced_at?: string
}

export type ExceptionType = 'id_suspicious' | 'address_ambiguous' | 'prohibited_item' | 'liveness_failed'
export type ExceptionStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected'
export type ExceptionPriority = 'high' | 'medium' | 'low'

export interface ExceptionRecord {
  id: string
  waybill_id?: string
  type: ExceptionType
  status: ExceptionStatus
  priority: ExceptionPriority
  description?: string
  handler_id?: string
  review_note?: string
  created_at: string
  reviewed_at?: string
}

export interface AuditLog {
  id: string
  user_id?: string
  operation_type: string
  operation_desc: string
  detail_json?: string
  ip?: string
  user_agent?: string
  created_at: string
}

export type LoginStatus = 'success' | 'failed'

export interface LoginLog {
  id: string
  user_id?: string
  username: string
  status: LoginStatus
  ip?: string
  location?: string
  device?: string
  fail_reason?: string
  created_at: string
}

export type OrderPriority = 'urgent' | 'normal' | 'low'
export type OrderStatus = 'pending' | 'executing' | 'submitted' | 'approved' | 'rejected'

export interface RegulatoryOrder {
  id: string
  title: string
  content: string
  priority: OrderPriority
  status: OrderStatus
  deadline: string
  issuer_id?: string
  target_outlet_ids: string
  feedback_content_enc?: string
  feedback_attachments?: string
  feedback_submitted_at?: string
  created_at: string
}

export interface RealNameRecord {
  id: string
  encrypted_real_name_id: string
  name_hash: string
  id_number_hash: string
  face_feature_hash?: string
  verified_source: string
  verified_at: string
  user_id?: string
}

export interface LoginRequest {
  username: string
  password: string
  captcha?: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    username: string
    realName: string
    role: UserRole
    outletId?: string
    regionId?: string
  }
}

export interface JwtPayload {
  userId: string
  username: string
  role: UserRole
  outletId?: string
  regionId?: string
  iat?: number
  exp?: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
