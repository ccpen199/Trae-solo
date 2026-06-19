export type RiderType = 'fulltime' | 'parttime';
export type RiderStatus = 'online' | 'offline' | 'busy' | 'rest';

export interface Rider {
  id: number;
  name: string;
  phone: string;
  type: RiderType;
  status: RiderStatus;
  credit_score: number;
  battery: number;
  vehicle_type: string;
  willingness_coefficient: number;
  fulfillment_rate: number;
  current_lat: number | null;
  current_lng: number | null;
  last_online_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface RiderLocation {
  id: number;
  rider_id: number;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
}

export type OrderPlatform = 'self' | 'meituan' | 'eleme';
export type OrderStatus = 'pending' | 'assigned' | 'picking' | 'delivering' | 'delivered' | 'cancelled';
export type GoodsType = 'normal' | 'fragile' | 'cold' | 'perishable' | 'large';

export interface Order {
  id: number;
  order_no: string;
  platform: OrderPlatform;
  merchant_id: number | null;
  merchant_name: string | null;
  merchant_address: string | null;
  merchant_lat: number | null;
  merchant_lng: number | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  recipient_address: string | null;
  recipient_lat: number | null;
  recipient_lng: number | null;
  goods_type: GoodsType;
  goods_name: string | null;
  weight: number;
  volume: number;
  is_special: number;
  special_note: string | null;
  pickup_time_start: number | null;
  pickup_time_end: number | null;
  delivery_time_start: number | null;
  delivery_time_end: number | null;
  delivery_fee: number;
  tip_amount: number;
  total_amount: number;
  status: OrderStatus;
  assigned_rider_id: number | null;
  assigned_at: number | null;
  picked_at: number | null;
  delivered_at: number | null;
  cancelled_at: number | null;
  cancel_reason: string | null;
  estimated_distance: number;
  estimated_duration: number;
  created_at: number;
  updated_at: number;
}

export type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'timeout';

export interface OrderAssignment {
  id: number;
  order_id: number;
  rider_id: number;
  status: AssignmentStatus;
  score: number;
  distance: number;
  responded_at: number | null;
  created_at: number;
}

export type IncomeType = 'delivery_fee' | 'tip' | 'reward' | 'platform_commission' | 'insurance' | 'penalty' | 'withdraw';

export interface IncomeDetail {
  id: number;
  rider_id: number;
  order_id: number | null;
  type: IncomeType;
  amount: number;
  balance: number;
  description: string | null;
  platform_commission: number;
  insurance_fee: number;
  reward_type: string | null;
  created_at: number;
}

export type ComplaintType = 'timeout' | 'lost' | 'bad_review' | 'service' | 'other';
export type ComplaintStatus = 'pending' | 'reviewing' | 'resolved' | 'closed';

export interface Complaint {
  id: number;
  order_id: number;
  rider_id: number | null;
  type: ComplaintType;
  reason: string | null;
  status: ComplaintStatus;
  complainant_type: string | null;
  complainant_id: number | null;
  has_video_evidence: number;
  video_url: string | null;
  handler_id: number | null;
  handler_note: string | null;
  result: string | null;
  penalty_amount: number;
  created_at: number;
  handled_at: number | null;
  closed_at: number | null;
}

export interface CreditScoreRecord {
  id: number;
  rider_id: number;
  change_type: string;
  change_amount: number;
  before_score: number;
  after_score: number;
  order_id: number | null;
  complaint_id: number | null;
  reason: string | null;
  created_at: number;
}

export interface Region {
  id: number;
  name: string;
  code: string;
  center_lat: number | null;
  center_lng: number | null;
  radius: number;
  is_active: number;
}

export interface RegionOrderStats {
  id: number;
  region_id: number;
  date: string;
  hour: number;
  order_count: number;
  rider_count: number;
  avg_delivery_time: number;
  weather: string | null;
  temperature: number | null;
  is_holiday: number;
  has_promotion: number;
  created_at: number;
}

export interface OrderPrediction {
  id: number;
  region_id: number;
  date: string;
  hour: number;
  predicted_count: number;
  confidence: number;
  factors: string | null;
  created_at: number;
}

export interface HealthMetrics {
  online_rate: number;
  rejection_rate: number;
  accident_rate: number;
  avg_fulfillment_rate: number;
  total_rider_count: number;
  online_rider_count: number;
  busy_rider_count: number;
}
