export type UserRole = 'owner' | 'tenant' | 'visitor' | 'property' | 'merchant';

export interface User {
  id: number;
  role: UserRole;
  username: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  house_address?: string;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  role?: UserRole;
}

export interface MemberProfile {
  level: string;
  points: number;
  totalSpent: number;
  orderCount: number;
  couponUsed: number;
  visitCount: number;
  benefits: string[];
  recentOrders: { id: number; merchantName: string; totalAmount: number; status: string; created_at: string }[];
}

export interface LoginResponse {
  token: string;
  user: User & { permissions: string[] };
}

export interface House {
  id: number;
  owner_id: number;
  building: string;
  unit: string;
  room_number: string;
  area: number;
  created_at: string;
}

export type WorkOrderType = 'repair' | 'complaint' | 'suggestion' | 'consultation' | 'other';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkOrderStatus = 'pending' | 'assigned' | 'processing' | 'completed' | 'closed';

export interface WorkOrder {
  id: number;
  user_id: number;
  house_id?: number;
  type: WorkOrderType;
  title: string;
  description: string;
  location: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignee_id?: number;
  user_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkOrderRequest {
  type: WorkOrderType;
  title: string;
  description: string;
  location: string;
  images?: string[];
  priority: WorkOrderPriority;
}

export interface UpdateWorkOrderStatusRequest {
  status: WorkOrderStatus;
  remark?: string;
}

export interface VisitorPass {
  id: number;
  creator_id: number;
  visitor_name: string;
  visitor_phone: string;
  visitor_id_card?: string;
  qr_code: string;
  access_areas: string[];
  valid_from: string;
  valid_to: string;
  status: 'active' | 'expired' | 'used';
  created_at: string;
}

export interface CreateVisitorRequest {
  visitorName: string;
  visitorPhone: string;
  visitorIdCard?: string;
  validFrom: string;
  validTo: string;
  accessAreas: string[];
}

export interface Merchant {
  id: number;
  user_id: number;
  name: string;
  license_no?: string;
  description?: string;
  logo_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  rating: number;
  created_at: string;
}

export interface Product {
  id: number;
  merchant_id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
  category: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Coupon {
  id: number;
  merchant_id: number;
  name: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  min_amount: number;
  total_quantity: number;
  used_quantity: number;
  valid_from: string;
  valid_to: string;
  created_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  merchant_id: number;
  coupon_id?: number;
  total_amount: number;
  discount_amount: number;
  pay_amount: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  created_at: string;
}

export interface Circle {
  id: number;
  name: string;
  description?: string;
  member_count: number;
  created_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  circle_id?: number;
  title: string;
  content: string;
  type: 'normal' | 'idle' | 'activity';
  images?: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
}

export interface PostComment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  user_name?: string;
  user_avatar?: string;
  created_at: string;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  max_participants?: number;
  participant_count: number;
  organizer_id: number;
  status: 'active' | 'ended' | 'cancelled';
  created_at: string;
}

export type AlertType = 'high_fall' | 'fire_channel' | 'abnormal_visitor' | 'device_offline';
export type AlertLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: number;
  type: AlertType;
  level: AlertLevel;
  title: string;
  description: string;
  location: string;
  image_url?: string;
  status: 'pending' | 'processing' | 'resolved' | 'ignored';
  handler_id?: number;
  occurred_at: string;
  handled_at?: string;
}

export interface Membership {
  id: number;
  user_id: number;
  level: number;
  points: number;
  balance: number;
  total_spent: number;
  updated_at: string;
  created_at: string;
}

export interface AccessRecord {
  id: number;
  pass_id?: number;
  device_id?: number;
  access_type: 'qr' | 'face' | 'bluetooth' | 'nfc' | 'card';
  access_time: string;
  result: 'success' | 'failed';
  person_name: string;
  person_type?: UserRole;
  device_name?: string;
}

export interface AccessDevice {
  id: number;
  name: string;
  type: 'gate' | 'elevator' | 'door';
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  last_heartbeat?: string;
}

export interface KPIData {
  workOrderTimelyRate: number;
  complaintCloseRate: number;
  deviceOnlineRate: number;
  totalWorkOrders: number;
  pendingWorkOrders: number;
  todayVisitors: number;
}

export interface MerchantAnalytics {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  repeatPurchaseRate: number;
  conversionRate: number;
  dailyRevenue: { date: string; revenue: number }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
