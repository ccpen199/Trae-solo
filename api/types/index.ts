export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface User {
  id: number;
  phone: string;
  name: string;
  password_hash?: string;
  role: 'customer' | 'agent' | 'advisor' | 'admin';
  city: string;
  tags: string[];
  created_at: string;
}

export interface Property {
  id: number;
  project_name: string;
  city: string;
  district: string;
  address: string;
  status: 'available' | 'locked' | 'sold' | 'offline';
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  floor: string;
  orientation: string;
  decoration: string;
  discount: number;
  promotion: string;
  vr_showroom_url: string;
  vr_sales_office_url: string;
  vr_panorama_url: string;
  vr_street_view_url: string;
  erp_source: string;
  erp_sync_status: string;
  erp_last_sync_at: string;
  erp_sync_count: number;
  supply_batch: string;
  city_strategy: string;
  created_at: string;
  updated_at: string;
  order?: Order;
}

export interface PriceChangeLog {
  id: number;
  property_id: number;
  old_price: number;
  new_price: number;
  change_reason: string;
  changed_by: number;
  erp_source: string;
  discount_rate: number;
  promotion_condition: string;
  effective_date: string;
  expiry_date: string;
  reviewed_by: number;
  reviewed_at: string;
  review_status: string;
  review_comment: string;
  created_at: string;
  changed_by_user?: User;
  reviewed_by_user?: User;
}

export interface PriceSchedule {
  id: number;
  property_id: number;
  unit_no: string;
  original_price: number;
  current_price: number;
  status: 'available' | 'locked' | 'sold';
}

export interface Order {
  id: number;
  order_no: string;
  property_id: number;
  user_id: number;
  advisor_id: number;
  status: 'eligibility_pending' | 'eligibility_pass' | 'subscribed' | 'signed' | 'fund_supervised' | 'loan_pending' | 'completed';
  amount: number;
  ca_verified: boolean;
  blockchain_hash: string;
  eligibility_status: string;
  eligibility_feedback: string;
  eligibility_verified_at: string;
  lock_status: string;
  lock_expires_at: string;
  lock_amount: number;
  subscribe_status: string;
  subscribe_verified_at: string;
  subscribe_certificate_no: string;
  sign_status: string;
  sign_verified_at: string;
  sign_contract_no: string;
  sign_blockchain_hash: string;
  supervise_status: string;
  supervise_bank: string;
  supervise_account_no: string;
  supervise_amount: number;
  supervise_verified_at: string;
  loan_status: string;
  loan_bank: string;
  loan_amount: number;
  loan_approved_at: string;
  loan_feedback: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  customer_id: number;
  advisor_id: number;
  property_id: number;
  last_message_at: string;
  customer?: User;
  advisor?: User;
  property?: Property;
  last_message?: Message;
}

export interface Message {
  id: number;
  session_id: string;
  sender_id: number;
  receiver_id: number;
  content: string;
  type: 'text' | 'image' | 'file' | 'sop';
  timestamp: string;
  is_read: boolean;
  sender?: User;
}

export interface SopTemplate {
  id: number;
  category: string;
  title: string;
  content: string;
  scenario: string;
}

export interface Ticket {
  id: number;
  property_id: number;
  type: string;
  risk_level: 'low' | 'medium' | 'high';
  ai_analysis: string;
  status: 'pending' | 'processing' | 'resolved';
  handler_id: number;
  created_at: string;
  property?: Property;
  handler?: User;
}

export interface CommissionRule {
  id: number;
  city: string;
  base_rate: number;
  bonus_rate: number;
  conditions: string;
}

export interface BlockchainRecord {
  id: number;
  order_id: number;
  hash: string;
  block_number: string;
  timestamp: string;
}

export interface EligibilityCheck {
  id: number;
  user_id: number;
  property_id: number;
  city_policy: string;
  id_number: string;
  hukou_status: string;
  house_count: number;
  passed: boolean;
  result: string;
  checked_at: string;
}

export interface Promotion {
  id: number;
  property_id: number;
  type: string;
  name: string;
  discount_value: number;
  start_time: string;
  end_time: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  name: string;
  role?: 'customer' | 'agent' | 'advisor';
  city?: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}

export interface DashboardStats {
  totalProperties: number;
  availableProperties: number;
  soldProperties: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingTickets: number;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface JwtPayload {
  userId: number;
  role: string;
  phone: string;
}

export interface FollowUpRecord {
  id: number;
  user_id: number;
  advisor_id: number;
  property_id: number;
  type: string;
  content: string;
  result: string;
  created_at: string;
  advisor?: User;
  property?: Property;
}

export interface CustomerTag {
  id: number;
  user_id: number;
  tag: string;
  created_by: number;
  created_at: string;
  creator?: User;
}

export interface Reminder {
  id: number;
  user_id: number;
  advisor_id: number;
  type: string;
  title: string;
  content: string;
  remind_at: string;
  status: string;
  created_at: string;
  advisor?: User;
}

export interface CityStrategy {
  id: number;
  city: string;
  district: string;
  strategy: string;
  target_price_min: number;
  target_price_max: number;
  priority: number;
  created_at: string;
}
