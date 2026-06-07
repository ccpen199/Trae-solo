export type UserRole = 'tenant' | 'buyer' | 'owner' | 'agent_self' | 'agent_franchise' | 'admin';

export interface User {
  id: number;
  phone: string;
  name: string;
  role: UserRole;
  credit_score: number;
  created_at: string;
}

export type PropertyType = 'shared_rent' | 'whole_rent' | 'apartment' | 'second_hand';
export type PropertyStatus = 'pending' | 'active' | 'contracted' | 'sold' | 'rented' | 'offline';

export interface Property {
  id: number;
  name: string;
  type: PropertyType;
  address: string;
  area: number;
  price: number;
  owner_id: number;
  agent_id: number;
  status: PropertyStatus;
  vr_url?: string;
  floor_plan_json?: string;
  floor?: number;
  total_floor?: number;
  decoration_level?: 'rough' | 'simple' | 'medium' | 'luxury';
  community?: string;
  rooms?: number;
  halls?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Valuation {
  id: number;
  property_id: number;
  base_price: number;
  decoration_index: number;
  floor_coefficient: number;
  community_avg: number;
  estimated_price: number;
  created_at: string;
}

export type WorkOrderType = 'cleaning' | 'repair' | 'moving' | 'renovation';
export type WorkOrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type WorkOrderPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface WorkOrder {
  id: number;
  type: WorkOrderType;
  property_id: number;
  reporter_id: number;
  assignee_id?: number;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  sla_hours: number;
  deadline: string;
  completed_at?: string;
  created_at: string;
  remainingHours?: number;
  isOverdue?: boolean;
}

export type TransactionStatus = 'negotiating' | 'contracted' | 'funded' | 'transferring' | 'completed' | 'cancelled';

export interface Transaction {
  id: number;
  property_id: number;
  buyer_id: number;
  seller_id: number;
  agent_id: number;
  price: number;
  commission_rate: number;
  commission_amount: number;
  fund_status: string;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

export interface TransferNode {
  id: number;
  transaction_id: number;
  node_name: string;
  status: 'pending' | 'processing' | 'completed';
  completed_at?: string;
  sort_order: number;
}

export type LeaseStatus = 'active' | 'expired' | 'terminated' | 'renewed';

export interface Lease {
  id: number;
  property_id: number;
  tenant_id: number;
  agent_id: number;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit: number;
  deposit_status: string;
  payment_method: string;
  status: LeaseStatus;
  created_at: string;
  updated_at: string;
}

export interface RentPayment {
  id: number;
  lease_id: number;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'waived';
}

export type SupplierType = 'material' | 'housekeeping' | 'moving' | 'renovation';

export interface Supplier {
  id: number;
  name: string;
  type: SupplierType;
  contact?: string;
  phone?: string;
  status: 'active' | 'suspended' | 'terminated';
  created_at: string;
}
