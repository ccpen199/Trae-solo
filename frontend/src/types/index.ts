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
  features?: string;
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
  user_name?: string;
  user_phone?: string;
  plate_number?: string;
  brand?: string;
  model?: string;
  pickup_store_name?: string;
  return_store_name?: string;
  inspections?: Inspection[];
  deposit?: Deposit;
  violations?: Violation[];
  settlement?: Settlement;
}

export interface Deposit {
  id: number;
  order_id: number;
  user_id: number;
  amount: number;
  status: 'pending' | 'paid' | 'frozen' | 'partial_refunded' | 'refunded' | 'deducted';
  paid_at?: string;
  refund_at?: string;
  refund_amount?: number;
  deduction_amount?: number;
  deduction_reason?: string;
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
  exterior_damages?: string;
  interior_damages?: string;
  operator_id?: number;
  operator_name?: string;
  remark?: string;
  created_at: string;
  order_no?: string;
  plate_number?: string;
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
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id?: number;
  review_remark?: string;
  reviewed_at?: string;
  created_at: string;
  user_name?: string;
  user_phone?: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  total?: number;
}

export const RoleMap: Record<string, string> = {
  customer: '租客',
  store: '门店',
  operation: '运营',
  risk: '风控',
  service: '客服',
  finance: '财务'
};

export const VehicleStatusMap: Record<string, { text: string; color: string }> = {
  available: { text: '可租', color: 'success' },
  maintenance: { text: '维护中', color: 'warning' },
  rented: { text: '已租出', color: 'processing' },
  reserved: { text: '已预订', color: 'blue' },
  offline: { text: '已下架', color: 'default' }
};

export const OrderStatusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待支付', color: 'warning' },
  paid: { text: '已支付', color: 'blue' },
  picked_up: { text: '已取车', color: 'processing' },
  in_use: { text: '使用中', color: 'processing' },
  returned: { text: '已还车', color: 'cyan' },
  settled: { text: '已结算', color: 'purple' },
  completed: { text: '已完成', color: 'success' },
  cancelled: { text: '已取消', color: 'default' },
  overdue: { text: '已逾期', color: 'error' }
};

export const DepositStatusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待支付', color: 'warning' },
  paid: { text: '已支付', color: 'blue' },
  frozen: { text: '已冻结', color: 'processing' },
  partial_refunded: { text: '部分退还', color: 'cyan' },
  refunded: { text: '已退还', color: 'success' },
  deducted: { text: '已扣除', color: 'error' }
};

export const ViolationStatusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'warning' },
  confirmed: { text: '已确认', color: 'blue' },
  paid: { text: '已缴费', color: 'success' },
  appealed: { text: '申诉中', color: 'processing' },
  resolved: { text: '已解决', color: 'success' }
};

export const LicenseStatusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '审核中', color: 'warning' },
  approved: { text: '已通过', color: 'success' },
  rejected: { text: '已拒绝', color: 'error' }
};

export const FuelTypeMap: Record<string, string> = {
  gasoline: '汽油',
  electric: '纯电',
  hybrid: '混动'
};
