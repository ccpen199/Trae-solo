export interface User {
  id: string;
  user_id?: string;
  real_name: string;
  id_card: string;
  phone: string;
  gender: 'male' | 'female' | 'unknown';
  birth_date?: string;
  avatar?: string;
  address?: string;
  email?: string;
  education?: string;
  occupation?: string;
  marital_status?: string;
  real_name_verified: number;
  face_verified: number;
  government_verified: number;
  user_level: number;
  tags: string;
  password_hash?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface InsuranceInfo {
  id: number;
  user_id: string;
  insurance_type?: string;
  payment_months: number;
  pension_balance: number;
  unemployment_months: number;
  medical_type?: string;
  last_payment_date?: string;
  created_at: string;
  updated_at: string;
}

export interface License {
  id: number;
  user_id: string;
  license_code: string;
  type: string;
  type_name: string;
  holder_name: string;
  holder_id_card: string;
  issuer: string;
  issuer_code?: string;
  issue_date: string;
  valid_from: string;
  valid_to: string;
  status: 'active' | 'expiring' | 'expired' | 'revoked' | 'lost' | 'pending';
  verify_code: string;
  qr_code?: string;
  front_image?: string;
  back_image?: string;
  electronic_signature: number;
  verify_count: number;
  created_at: string;
  updated_at: string;
}

export interface LicenseVerifyRecord {
  id: number;
  license_id: number;
  verify_method: string;
  verify_time: string;
  verifier: string;
  verify_location?: string;
  result: 'valid' | 'invalid' | 'expired';
  remark?: string;
  created_at: string;
}

export interface LicenseUsageRecord {
  id: number;
  license_id: number;
  usage_scene: string;
  usage_time: string;
  usage_location?: string;
  operator: string;
  result: 'success' | 'fail';
  remark?: string;
  created_at: string;
}

export interface Matter {
  id: number;
  user_id: string;
  matter_code: string;
  type: string;
  type_name: string;
  title: string;
  description?: string;
  form_data: string;
  materials: string;
  status: 'pending' | 'processing' | 'supplement' | 'completed' | 'rejected' | 'withdrawn';
  current_node: string;
  fee?: number;
  is_urgent: number;
  is_cross_province: number;
  target_province?: string;
  target_city?: string;
  applicant_name: string;
  applicant_id_card: string;
  applicant_phone: string;
  handle_organization?: string;
  handler?: string;
  handler_phone?: string;
  estimated_finish_time?: string;
  actual_finish_time?: string;
  result?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalNode {
  id: number;
  matter_id: number;
  node_code: string;
  node_name: string;
  node_role: string;
  node_order: number;
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'skipped';
  operator_id?: string;
  operator_name?: string;
  operated_at?: string;
  remark?: string;
  handle_result?: 'approve' | 'reject' | 'transfer';
  created_at: string;
  updated_at: string;
}

export interface MatterMaterial {
  id: number;
  matter_id: number;
  name: string;
  type: 'required' | 'optional';
  format: 'image' | 'pdf' | 'other';
  file_url: string;
  upload_time: string;
  verified: number;
  verify_time?: string;
}

export interface TraceRecord {
  id: number;
  matter_id: number;
  operation_type: string;
  operation_name: string;
  description?: string;
  operator: string;
  operator_role: string;
  status: string;
  remark?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Message {
  id: number;
  user_id: string;
  type: 'system' | 'business' | 'approval' | 'service';
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: number;
  read_at?: string;
  business_id?: string;
  business_type?: string;
  created_at: string;
}

export interface RecommendService {
  id: number;
  user_id: string;
  service_code: string;
  service_name: string;
  service_type: string;
  description?: string;
  confidence: number;
  user_match_score: number;
  reason_type: 'user_profile' | 'behavior' | 'hot' | 'similar' | 'location';
  reason: string;
  match_tags: string;
  satisfaction: number;
  average_duration: number;
  apply_count: number;
  is_cross_province: number;
  created_at: string;
}

export interface BehaviorRecord {
  id: number;
  user_id: string;
  service_id?: number;
  service_code?: string;
  service_name?: string;
  service_category?: string;
  action_type: 'view' | 'apply' | 'search' | 'collect' | 'share' | 'behavior';
  action_detail?: string;
  page_seconds?: number;
  search_keyword?: string;
  ip_address?: string;
  created_at: string;
}

export interface UserTag {
  id: number;
  user_id: string;
  tag: string;
  tag_value: string;
  weight: number;
  source: string;
  created_at: string;
}

export interface UserProfile {
  userId: string;
  basicInfo: {
    name: string;
    gender: string;
    age: number;
    phone: string;
    address?: string;
    education?: string;
    occupation?: string;
    maritalStatus?: string;
  };
  insurance: {
    type?: string;
    paymentMonths: number;
    pensionBalance: number;
    unemploymentMonths: number;
    medicalType?: string;
    lastPaymentDate?: string;
  };
  tags: Array<{
    tag: string;
    value: string;
    weight: number;
    source: string;
  }>;
  behavior: {
    totalActions: number;
    viewCount: number;
    applyCount: number;
    searchCount: number;
    categoryCount: number;
  };
  recentActivities: Array<{
    type: string;
    typeName: string;
    status: string;
    time: string;
  }>;
  activeLicenses: Array<{
    type: string;
    typeName: string;
  }>;
}

export interface CrossProvinceNode {
  id: number;
  node_code: string;
  node_name: string;
  province: string;
  city: string;
  status: 'active' | 'inactive' | 'maintenance';
  endpoint: string;
  is_source: number;
  supported_services: string;
  last_heartbeat?: string;
  created_at: string;
  updated_at: string;
}

export interface CrossProvinceService {
  id: number;
  service_code: string;
  name: string;
  category: string;
  sub_category?: string;
  description?: string;
  available_provinces: string;
  handling_time?: string;
  required_materials: string;
  hot_level: number;
  status: 'active' | 'inactive';
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface DataExchangeRecord {
  id: number;
  exchange_no: string;
  matter_id?: number;
  user_id: string;
  source_node_id: number;
  target_node_id: number;
  service_code: string;
  service_name: string;
  data_type: string;
  data_payload: string;
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retry_count: number;
  started_at?: string;
  completed_at?: string;
  response_data?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DataExchangeLog {
  id: number;
  exchange_id: number;
  operation_type: string;
  operation_name: string;
  description?: string;
  operator: string;
  status: string;
  created_at: string;
}

export interface NodeStatusLog {
  id: number;
  node_id: number;
  status: string;
  response_time?: number;
  error_message?: string;
  created_at: string;
}

export interface NotificationSetting {
  id: number;
  user_id: string;
  push_enabled: number;
  system_enabled: number;
  business_enabled: number;
  approval_enabled: number;
  service_enabled: number;
  sound_enabled: number;
  vibration_enabled: number;
  quiet_start: string;
  quiet_end: string;
  quiet_enabled: number;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  id: number;
  user_id: string;
  token: string;
  refresh_token: string;
  token_type: 'access' | 'refresh';
  expires_at: string;
  created_at: string;
  revoked: number;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  requestId: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
