export interface Farmer {
  id?: number;
  name: string;
  id_card: string;
  phone: string;
  address: string;
  planting_area: number;
  historical_yield: number;
  cooperative_id?: number | null;
  cooperative_name?: string;
  has_cooperative_guarantee: number;
  guarantee_amount: number;
  past_repayment_history: string;
  insurance_info: string;
  subsidy_info: string;
  risk_tags: string;
  credit_score: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreditApproval {
  id?: number;
  farmer_id: number;
  farmer_name?: string;
  cooperative_id?: number | null;
  cooperative_name?: string;
  crop_cycle: string;
  product_category: string;
  requested_amount: number;
  approved_amount: number;
  used_amount: number;
  available_amount: number;
  validity_start: string;
  validity_end: string;
  risk_tags: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approver_id?: number;
  approval_notes: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id?: number;
  name: string;
  category: string;
  specification: string;
  unit: string;
  price: number;
  store_id?: number;
  store_name?: string;
  stock_quantity: number;
  status: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id?: number;
  order_no: string;
  farmer_id: number;
  farmer_name?: string;
  store_id: number;
  store_name?: string;
  credit_approval_id: number;
  credit_approved_amount?: number;
  credit_available_amount?: number;
  total_amount: number;
  account_period_days: number;
  due_date: string;
  signed_by_farmer: number;
  signed_at?: string;
  status: string;
  notes: string;
  items?: OrderItem[];
  repayment?: Repayment;
  created_at?: string;
  updated_at?: string;
}

export interface RepaymentRecord {
  id?: number;
  repayment_id: number;
  amount: number;
  payment_method: string;
  payment_date: string;
  operator: string;
  notes: string;
  created_at?: string;
}

export interface Repayment {
  id?: number;
  repayment_no: string;
  order_id: number;
  farmer_id: number;
  farmer_name?: string;
  farmer_phone?: string;
  order_no?: string;
  order_amount?: number;
  store_name?: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  actual_paid_date?: string;
  status: string;
  is_overdue: number;
  overdue_days: number;
  extension_days: number;
  extension_reason: string;
  reduction_amount: number;
  reduction_reason: string;
  notes: string;
  records?: RepaymentRecord[];
  created_at?: string;
  updated_at?: string;
}

export interface Cooperative {
  id?: number;
  name: string;
  contact_person: string;
  phone: string;
  address: string;
  guarantee_limit: number;
  used_guarantee: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface Store {
  id?: number;
  name: string;
  owner_name: string;
  phone: string;
  address: string;
  cooperative_id?: number;
  cooperative_name?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface CollectionTask {
  id?: number;
  repayment_id: number;
  farmer_id: number;
  farmer_name?: string;
  farmer_phone?: string;
  assignee: string;
  task_status: string;
  priority: string;
  last_contact_date?: string;
  contact_result?: string;
  next_followup_date?: string;
  notes: string;
  remaining_amount?: number;
  overdue_days?: number;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id?: number;
  table_name: string;
  record_id: number;
  action: string;
  old_data?: string;
  new_data?: string;
  operator: string;
  ip_address: string;
  created_at?: string;
}

export interface DashboardOverview {
  totalFarmers: number;
  totalCredit: number;
  usedCredit: number;
  availableCredit: number;
  totalOrders: number;
  totalRepayments: number;
  overdueCount: number;
  overdueAmount: number;
  overdueRate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}
