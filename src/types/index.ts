export interface User {
  id: number;
  phone: string;
  nickname: string;
  avatar: string;
  created_at: string;
}

export interface Address {
  id: number;
  user_id: number;
  name: string;
  detail: string;
  lng: number;
  lat: number;
  is_default: boolean;
}

export interface Worker {
  id: number;
  phone: string;
  real_name: string;
  avatar: string;
  status: 'pending' | 'verified' | 'rejected' | 'blacklisted';
  verified_at?: string;
  skills: string[];
  age: number;
  experience_years: number;
}

export interface WorkerCert {
  id: number;
  worker_id: number;
  id_card_url: string;
  health_cert_url: string;
  crime_record_url: string;
  ocr_result: string;
  verify_status: 'pending' | 'ocr_done' | 'approved' | 'rejected';
  submitted_at: string;
}

export interface WorkerScore {
  id: number;
  worker_id: number;
  overall_score: number;
  punctuality_rate: number;
  satisfaction_rate: number;
  complaint_rate: number;
  total_orders: number;
  trend: number[];
}

export type OrderStatus = 
  | 'pending' 
  | 'assigned' 
  | 'accepted' 
  | 'departing' 
  | 'arrived' 
  | 'servicing' 
  | 'completed' 
  | 'cancelled'
  | 'compensated';

export type ServiceType = 'cleaning' | 'babysitting' | 'cooking';

export interface Order {
  id: number;
  user_id: number;
  worker_id?: number;
  service_type: ServiceType;
  service_type_label: string;
  address: string;
  address_name?: string;
  lng: number;
  lat: number;
  start_time: string;
  duration_hours: number;
  status: OrderStatus;
  status_label: string;
  amount: number;
  remark?: string;
  worker_name?: string;
  worker_avatar?: string;
  worker_phone?: string;
  worker_score?: number;
  distance_km?: number;
  created_at: string;
  nodes?: ServiceNode[];
  compensation?: CompensationRecord;
  qa_record?: QARecordDetail;
  insurance?: InsuranceInfo;
  is_overtime?: boolean;
  overtime_minutes?: number;
}

export interface InsuranceInfo {
  policy_no: string;
  product_name: string;
  coverage_amount: number;
  premium: number;
  status: 'active' | 'expired' | 'claimed';
}

export interface CompensationRecord {
  id: number;
  order_id: number;
  reason: string;
  reason_category: string;
  refund_amount: number;
  coupon_amount: number;
  coupon_code: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  trigger_type: 'auto' | 'manual';
  created_at: string;
  approved_at?: string;
  paid_at?: string;
  auditor?: string;
  description?: string;
}

export interface QARecordDetail {
  id: number;
  order_id: number;
  audio_url: string;
  audio_duration: number;
  transcript_text: string;
  transcript_summary: string;
  keywords: { text: string; hit: boolean; count: number }[];
  compliance_rate: number;
  root_cause: string;
  root_cause_category: string;
  root_cause_detail: string;
  rating: number;
  complaint_count: number;
  reviewer: string;
  review_time: string;
  review_conclusion: 'pass' | 'warning' | 'fail';
  review_remark: string;
  created_at: string;
  qa_status: 'pending' | 'completed';
}

export interface AddressDispatchInfo {
  address_id: number;
  nearby_workers_count: number;
  avg_score: number;
  avg_arrive_minutes: number;
  heat_level: 'high' | 'medium' | 'low';
  worker_distribution: { distance: string; count: number }[];
}

export type NodeType = 'order_created' | 'assigned' | 'accepted' | 'departing' | 'arrived' | 'servicing' | 'completed';

export interface ServiceNode {
  id: number;
  order_id: number;
  node_type: NodeType;
  node_label: string;
  node_time: string;
  remark?: string;
}

export interface Compensation {
  id: number;
  order_id: number;
  reason: string;
  refund_amount: number;
  coupon_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface QARecord {
  id: number;
  order_id: number;
  audio_url: string;
  transcript_text: string;
  keywords: string[];
  root_cause: string;
  root_cause_category: string;
  rating: number;
  created_at: string;
}

export interface Enterprise {
  id: number;
  name: string;
  contact: string;
  phone: string;
  status: 'active' | 'inactive';
}

export interface ServicePackage {
  id: number;
  name: string;
  service_types: ServiceType[];
  service_type_labels: string[];
  price: number;
  original_price: number;
  valid_days: number;
  description: string;
  features: string[];
}

export interface BatchOrder {
  id: number;
  enterprise_id: number;
  package_id: number;
  package_name: string;
  total_count: number;
  used_count: number;
  total_amount: number;
  status: 'active' | 'exhausted' | 'expired';
  created_at: string;
  expire_at: string;
}

export interface Bill {
  id: number;
  enterprise_id: number;
  period: string;
  amount: number;
  status: 'unpaid' | 'paid';
  items: { description: string; amount: number }[];
  issued_at: string;
  due_date: string;
}

export interface InsuranceProduct {
  id: number;
  name: string;
  coverage: string;
  coverage_amount: number;
  premium: number;
  provider: string;
  description: string;
}

export interface InsurancePolicy {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  policy_no: string;
  status: 'active' | 'expired' | 'claimed';
  effective_date: string;
  expire_date: string;
}

export interface SopDocument {
  id: number;
  service_type: ServiceType;
  service_type_label: string;
  title: string;
  content: string;
  version: string;
  updated_at: string;
  steps: { title: string; description: string; tips?: string }[];
}

export interface DispatchOrder {
  id: number;
  address: string;
  lng: number;
  lat: number;
  service_type: ServiceType;
  start_time: string;
  amount: number;
  distance_km: number;
  priority_score: number;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  weight: number;
  type: 'worker' | 'order';
}

export interface QAAnalysis {
  totalReviews: number;
  averageRating: number;
  negativeReviews: number;
  positiveReviews: number;
  rootCauses: { name: string; value: number; color: string }[];
  keywordCloud: { text: string; value: number }[];
  monthlyTrend: { month: string; positive: number; negative: number }[];
}

export interface DispatchMapData {
  orders: DispatchOrder[];
  workers: {
    id: number;
    name: string;
    lng: number;
    lat: number;
    status: 'idle' | 'busy';
    score: number;
  }[];
  heatmap: HeatmapPoint[];
}

export type PageRole = 'user' | 'worker' | 'admin' | 'enterprise';
