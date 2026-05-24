export interface User {
  id: number;
  username: string;
  real_name: string;
  phone: string;
  email: string;
  role: 'customer' | 'store' | 'operation' | 'risk' | 'service' | 'finance';
  id_card?: string;
  license_number?: string;
  license_verified: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: number;
  name: string;
  address: string;
  province: string;
  city: string;
  district: string;
  contact_person: string;
  contact_phone: string;
  business_hours: string;
  description?: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: number;
  plate_number: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  mileage: number;
  fuel_type: 'gasoline' | 'electric' | 'hybrid';
  transmission: 'auto' | 'manual';
  seats: number;
  daily_rate: number;
  deposit_amount: number;
  insurance_fee: number;
  store_id: number;
  status: 'available' | 'maintenance' | 'rented' | 'reserved' | 'offline';
  description?: string;
  images?: string;
  features?: string;
  last_maintenance_date?: string;
  created_at: string;
  updated_at: string;
  store_name?: string;
}

export type OrderStatus = 'pending' | 'paid' | 'picked_up' | 'in_use' | 'returned' | 'settled' | 'completed' | 'cancelled' | 'overdue';

export interface Order {
  id: number;
  order_no: string;
  user_id: number;
  vehicle_id: number;
  pickup_store_id: number;
  return_store_id: number;
  pickup_time: string;
  return_time: string;
  actual_pickup_time?: string;
  actual_return_time?: string;
  daily_rate: number;
  total_days: number;
  base_amount: number;
  insurance_fee: number;
  other_fee: number;
  total_amount: number;
  deposit_amount: number;
  status: OrderStatus;
  pickup_mileage?: number;
  return_mileage?: number;
  pickup_fuel_level?: number;
  return_fuel_level?: number;
  remark?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  vehicle_info?: string;
  plate_number?: string;
  pickup_store_name?: string;
  return_store_name?: string;
}

export interface Deposit {
  id: number;
  order_id: number;
  user_id: number;
  amount: number;
  payment_method?: string;
  transaction_id?: string;
  status: 'pending' | 'paid' | 'frozen' | 'partial_refunded' | 'refunded' | 'deducted';
  paid_at?: string;
  refund_at?: string;
  refund_amount?: number;
  deduction_amount?: number;
  deduction_reason?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
  order_no?: string;
  user_name?: string;
}

export interface Inspection {
  id: number;
  order_id: number;
  vehicle_id: number;
  type: 'pickup' | 'return';
  mileage?: number;
  fuel_level?: number;
  electric_level?: number;
  exterior_damages?: string;
  interior_damages?: string;
  photos?: string;
  operator_id?: number;
  operator_name?: string;
  remark?: string;
  created_at: string;
  plate_number?: string;
  order_no?: string;
}

export interface Violation {
  id: number;
  order_id: number;
  vehicle_id: number;
  user_id: number;
  violation_time?: string;
  violation_location?: string;
  violation_type?: string;
  fine_amount: number;
  deduction_points: number;
  status: 'pending' | 'confirmed' | 'paid' | 'appealed' | 'resolved';
  remark?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  plate_number?: string;
}

export interface Settlement {
  id: number;
  order_id: number;
  user_id: number;
  vehicle_id: number;
  base_amount: number;
  extra_mileage_fee: number;
  fuel_fee: number;
  violation_fee: number;
  damage_fee: number;
  overdue_fee: number;
  other_fee: number;
  total_settlement: number;
  deposit_refund: number;
  status: 'pending' | 'confirmed' | 'paid' | 'completed';
  settlement_time?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
  order_no?: string;
  user_name?: string;
}

export interface LicenseVerification {
  id: number;
  user_id: number;
  license_number: string;
  license_type?: string;
  issue_date?: string;
  expiry_date?: string;
  id_card_front?: string;
  id_card_back?: string;
  license_front?: string;
  license_back?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id?: number;
  review_remark?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_phone?: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  total?: number;
}
