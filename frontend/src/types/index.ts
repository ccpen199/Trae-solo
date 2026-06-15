export interface User {
  id: string;
  username: string;
  real_name?: string;
  phone?: string;
  role: 'employer' | 'worker' | 'driver' | 'admin';
  avatar?: string;
  credit_score: number;
  balance: number;
  city?: string;
  address?: string;
  created_at?: string;
  worker_profile?: WorkerProfile;
  driver_profile?: DriverProfile;
}

export interface WorkerProfile {
  skills: string[];
  service_radius: number;
  hourly_rate: number;
  task_rate: number;
  completed_orders: number;
  rating: number;
  bio?: string;
  id_card_verified: number;
}

export interface DriverProfile {
  vehicle_type: string;
  vehicle_brand?: string;
  plate_number?: string;
  load_capacity: number;
  vehicle_length: number;
  insurance_verified: number;
  insurance_expiry?: string;
  completed_orders: number;
  rating: number;
  bio?: string;
}

export interface LaborOrder {
  id: string;
  employer_id: string;
  worker_id?: string;
  title: string;
  description?: string;
  category?: string;
  skills_required: string[];
  pricing_type: 'hourly' | 'task';
  price_per_hour?: number;
  task_price?: number;
  estimated_hours?: number;
  total_price: number;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  start_time?: string;
  end_time?: string;
  status: LaborOrderStatus;
  worker_count: number;
  split_enabled: number;
  parent_order_id?: string;
  sub_orders?: LaborOrder[];
  created_at: string;
  updated_at: string;
  employer_name?: string;
  employer_real_name?: string;
  employer_avatar?: string;
  employer_phone?: string;
  worker_name?: string;
  worker_real_name?: string;
  worker_avatar?: string;
  worker_phone?: string;
}

export type LaborOrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'split';

export interface DeliveryOrder {
  id: string;
  employer_id: string;
  driver_id?: string;
  title: string;
  description?: string;
  vehicle_type_required: string;
  weight: number;
  volume: number;
  goods_type?: string;
  pickup_address: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  delivery_address: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  distance: number;
  base_price: number;
  bid_start_price: number;
  final_price: number;
  pickup_time?: string;
  delivery_time?: string;
  status: DeliveryOrderStatus;
  waybill_no: string;
  bids?: DeliveryBid[];
  created_at: string;
  updated_at: string;
  employer_name?: string;
  employer_real_name?: string;
  employer_avatar?: string;
  employer_phone?: string;
  driver_name?: string;
  driver_real_name?: string;
  driver_avatar?: string;
  driver_phone?: string;
  vehicle_type?: string;
  plate_number?: string;
}

export type DeliveryOrderStatus = 'bidding' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface DeliveryBid {
  id: string;
  order_id: string;
  driver_id: string;
  bid_price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  driver_name?: string;
  driver_avatar?: string;
  credit_score?: number;
  vehicle_type?: string;
  plate_number?: string;
  rating?: number;
  completed_orders?: number;
}

export interface MovingOrder {
  id: string;
  employer_id: string;
  driver_id?: string;
  worker_ids: string[];
  workers?: User[];
  title: string;
  description?: string;
  from_address: string;
  from_floor: number;
  from_elevator: number;
  to_address: string;
  to_floor: number;
  to_elevator: number;
  distance: number;
  vehicle_type: string;
  package_list: PackageItem[];
  service_packages: ServicePackage[];
  base_price: number;
  package_price: number;
  floor_price: number;
  total_price: number;
  move_date?: string;
  status: MovingOrderStatus;
  created_at: string;
  updated_at: string;
  employer_name?: string;
  employer_real_name?: string;
  employer_avatar?: string;
  employer_phone?: string;
  driver_name?: string;
  driver_real_name?: string;
  driver_avatar?: string;
  driver_phone?: string;
}

export type MovingOrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface PackageItem {
  name: string;
  quantity: number;
  size?: 'small' | 'medium' | 'large';
  fragile?: boolean;
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  base_price: number;
  includes: string[];
}

export interface GpsTrack {
  id: string;
  order_id: string;
  order_type: string;
  user_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export interface Review {
  id: string;
  order_id: string;
  order_type: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  content?: string;
  photos: string[];
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
}

export interface Dispute {
  id: string;
  order_id: string;
  order_type: string;
  complainant_id: string;
  respondent_id: string;
  reason: string;
  description?: string;
  evidence_photos: string[];
  call_recordings: string[];
  status: string;
  resolution?: string;
  arbitrator_id?: string;
  created_at: string;
  resolved_at?: string;
  complainant_name?: string;
  complainant_avatar?: string;
  respondent_name?: string;
  respondent_avatar?: string;
  arbitrator_name?: string;
}

export interface InsuranceClaim {
  id: string;
  order_id: string;
  order_type: string;
  claimant_id: string;
  claim_amount: number;
  claim_reason: string;
  description?: string;
  evidence: string[];
  status: string;
  insurance_company: string;
  policy_no?: string;
  payout_amount?: number;
  created_at: string;
  processed_at?: string;
  claimant_name?: string;
  claimant_avatar?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content?: string;
  related_id?: string;
  read: number;
  created_at: string;
}

export interface QualityRule {
  id: string;
  name: string;
  rule_type: string;
  threshold: number;
  action: string;
  description?: string;
  enabled: number;
  created_at: string;
}
