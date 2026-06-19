export type UserRole = 'recycler' | 'producer' | 'inspector' | 'carrier' | 'admin';

export type MaterialCategory = '废金属' | '二手设备' | '废塑料';

export type MetalSubCategory = '废钢' | '废铜' | '废铝' | '废锌' | '废不锈钢' | '其他金属';
export type EquipmentSubCategory = '工程机械' | '生产设备' | '运输车辆' | '电力设备' | '其他设备';
export type PlasticSubCategory = 'PET' | 'PE' | 'PP' | 'PVC' | 'ABS' | '其他塑料';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type OrderStatus = 'published' | 'negotiating' | 'contracted' | 'deposit_paid' | 'shipping' | 'inspecting' | 'completed' | 'cancelled' | 'disputed';

export type ContractStatus = 'draft' | 'signed_buyer' | 'signed_seller' | 'fully_signed' | 'terminated';

export type PaymentStatus = 'pending' | 'deposit_frozen' | 'deposit_released' | 'full_paid' | 'refunded';

export type TraceStatus = 'generated' | 'in_transit' | 'received' | 'processed' | 'archived';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Enterprise {
  id: string;
  user_id: string;
  company_name: string;
  unified_social_credit_code: string;
  legal_person: string;
  legal_person_id: string;
  registered_address: string;
  business_license_url: string;
  qualification_cert_url?: string;
  waste_management_license_url?: string;
  verification_status: VerificationStatus;
  verified_at?: string;
  credit_rating?: number;
  credit_score?: number;
  region: string;
  created_at: string;
  updated_at: string;
}

export interface RecyclerProfile {
  id: string;
  enterprise_id: string;
  recycling_categories: string;
  annual_capacity: number;
  main_business_regions: string;
  compliance_rate?: number;
  dispute_rate?: number;
  tax_compliance_score?: number;
  created_at: string;
  updated_at: string;
}

export interface ProducerProfile {
  id: string;
  enterprise_id: string;
  industry_type: string;
  annual_waste_volume: number;
  factory_locations: string;
  waste_types: string;
  created_at: string;
  updated_at: string;
}

export interface InspectorProfile {
  id: string;
  enterprise_id: string;
  cma_cert_no: string;
  cma_valid_until: string;
  inspection_scope: string;
  created_at: string;
  updated_at: string;
}

export interface CarrierProfile {
  id: string;
  enterprise_id: string;
  carrier_license_no: string;
  vehicle_count: number;
  service_regions: string;
  api_provider?: '中储运' | '德邦' | '自有';
  created_at: string;
  updated_at: string;
}

export interface BusinessOpportunity {
  id: string;
  publisher_id: string;
  publisher_enterprise_id: string;
  type: 'supply' | 'demand';
  category: MaterialCategory;
  sub_category: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  min_price: number;
  max_price: number;
  price_unit: string;
  region: string;
  latitude?: number;
  longitude?: number;
  quality_grade?: string;
  available_date: string;
  expiry_date: string;
  status: 'active' | 'matched' | 'closed' | 'expired';
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  categories: string;
  regions: string;
  min_quantity?: number;
  max_quantity?: number;
  min_price?: number;
  max_price?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Negotiation {
  id: string;
  opportunity_id: string;
  initiator_id: string;
  responder_id: string;
  current_price: number;
  current_quantity: number;
  status: 'active' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface NegotiationMessage {
  id: string;
  negotiation_id: string;
  sender_id: string;
  price?: number;
  quantity?: number;
  message: string;
  created_at: string;
}

export interface Contract {
  id: string;
  negotiation_id: string;
  opportunity_id: string;
  buyer_id: string;
  seller_id: string;
  category: MaterialCategory;
  sub_category: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  deposit_ratio: number;
  deposit_amount: number;
  quality_standard: string;
  delivery_method: string;
  delivery_address: string;
  delivery_date: string;
  inspection_method: string;
  payment_terms: string;
  breach_clause: string;
  status: ContractStatus;
  buyer_signed_at?: string;
  seller_signed_at?: string;
  buyer_signature_url?: string;
  seller_signature_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  contract_id: string;
  buyer_id: string;
  seller_id: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  type: 'deposit' | 'full_payment' | 'refund' | 'compensation';
  amount: number;
  status: PaymentStatus;
  frozen_at?: string;
  released_at?: string;
  transaction_no?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface LogisticsQuotation {
  id: string;
  order_id: string;
  carrier_id: string;
  carrier_enterprise_id: string;
  pickup_address: string;
  delivery_address: string;
  distance_km: number;
  weight_ton: number;
  vehicle_type: string;
  quoted_price: number;
  estimated_days: number;
  insurance_fee?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  expired_at: string;
}

export interface LogisticsOrder {
  id: string;
  order_id: string;
  quotation_id: string;
  carrier_id: string;
  tracking_no: string;
  vehicle_no?: string;
  driver_name?: string;
  driver_phone?: string;
  status: 'pending_pickup' | 'picked_up' | 'in_transit' | 'delivered' | 'exception';
  current_location?: string;
  estimated_arrival?: string;
  created_at: string;
  updated_at: string;
}

export interface LogisticsEvent {
  id: string;
  logistics_order_id: string;
  status: string;
  location: string;
  description: string;
  event_time: string;
}

export interface InspectionReport {
  id: string;
  order_id: string;
  inspector_id: string;
  inspector_enterprise_id: string;
  report_no: string;
  cma_report_no?: string;
  inspection_date: string;
  category: string;
  sub_category: string;
  sample_weight: number;
  quality_grade: string;
  composition: string;
  impurity_rate: number;
  moisture_rate: number;
  photos?: string;
  conclusion: string;
  is_passed: boolean;
  api_sync_status?: 'pending' | 'synced' | 'failed';
  created_at: string;
}

export interface TraceCode {
  id: string;
  code: string;
  order_id: string;
  producer_id: string;
  recycler_id: string;
  category: MaterialCategory;
  sub_category: string;
  quantity: number;
  unit: string;
  status: TraceStatus;
  min_env_sync_status?: 'pending' | 'synced' | 'failed';
  min_env_tracking_no?: string;
  origin_address: string;
  current_address?: string;
  destination_address: string;
  inspection_report_id?: string;
  qr_code_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TraceEvent {
  id: string;
  trace_code_id: string;
  event_type: string;
  location: string;
  operator: string;
  description: string;
  event_time: string;
}

export interface CreditRating {
  id: string;
  enterprise_id: string;
  total_orders: number;
  completed_orders: number;
  performance_rate: number;
  dispute_rate: number;
  dispute_count: number;
  tax_compliance_score: number;
  quality_objection_rate: number;
  quality_objection_count: number;
  payment_timeliness_score: number;
  data_completeness_score: number;
  final_score: number;
  final_grade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC';
  calculated_at: string;
}

export interface HeatmapData {
  id: string;
  region: string;
  province: string;
  city: string;
  latitude: number;
  longitude: number;
  category: MaterialCategory;
  sub_category: string;
  supply_volume: number;
  demand_volume: number;
  avg_price: number;
  price_change_pct: number;
  steel_mill_capacity?: number;
  steel_mill_utilization?: number;
  record_date: string;
}

export interface PriceForecast {
  id: string;
  category: string;
  sub_category: string;
  region: string;
  current_price: number;
  forecast_price_7d: number;
  forecast_price_30d: number;
  confidence_7d: number;
  confidence_30d: number;
  factors: string;
  forecast_date: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'opportunity' | 'negotiation' | 'contract' | 'order' | 'payment' | 'logistics' | 'system';
  title: string;
  content: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}
