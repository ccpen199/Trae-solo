export type UserRole = 'admin' | 'owner' | 'designer' | 'supervisor' | 'supplier' | 'store_manager';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  real_name: string;
  phone: string;
  email: string;
  role: UserRole;
  avatar?: string;
  store_id?: string;
  city?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  name: string;
  city: string;
  address: string;
  longitude: number;
  latitude: number;
  service_radius: number;
  manager_id?: string;
  contact_phone: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface DecorationDemand {
  id: string;
  owner_id: string;
  city: string;
  district: string;
  address: string;
  house_type: string;
  area: number;
  budget_min: number;
  budget_max: number;
  decoration_style: string;
  requirement_desc: string;
  contact_name: string;
  contact_phone: string;
  status: 'pending' | 'matched' | 'signed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface AISolution {
  id: string;
  demand_id: string;
  style_plan: string;
  layout_plan: string;
  material_plan: string;
  estimated_budget: number;
  estimated_period: number;
  renderings: string;
  created_at: string;
}

export interface DesignerMatch {
  id: string;
  demand_id: string;
  designer_id: string;
  store_id: string;
  match_score: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface DecorationContract {
  id: string;
  demand_id: string;
  owner_id: string;
  designer_id: string;
  store_id: string;
  contract_no: string;
  total_amount: number;
  escrow_amount: number;
  start_date: string;
  end_date: string;
  warranty_years: number;
  terms: string;
  status: 'draft' | 'pending_sign' | 'signed' | 'terminated';
  owner_signed_at?: string;
  store_signed_at?: string;
  created_at: string;
}

export interface ProjectMilestone {
  id: string;
  contract_id: string;
  milestone_type: '水电隐蔽验收' | '泥木完工' | '竣工';
  planned_date: string;
  actual_date?: string;
  status: 'pending' | 'ready' | 'confirmed' | 'rejected';
  owner_confirmed?: boolean;
  designer_confirmed?: boolean;
  supervisor_confirmed?: boolean;
  payment_amount: number;
  payment_status: 'pending' | 'processing' | 'paid';
  paid_at?: string;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  contract_id: string;
  milestone_id?: string;
  amount: number;
  payment_type: 'deposit' | 'milestone' | 'settlement';
  payee_role: string;
  payee_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transaction_no?: string;
  created_at: string;
}

export interface AISupervisionRecord {
  id: string;
  contract_id: string;
  camera_id: string;
  detection_time: string;
  risk_type: '未戴安全帽' | '材料混用' | '违规操作' | '消防隐患' | '其他';
  risk_level: 'low' | 'medium' | 'high';
  description: string;
  screenshot_url?: string;
  status: 'detected' | 'processing' | 'resolved';
  handled_by?: string;
  handled_at?: string;
  created_at: string;
}

export interface ShowroomModel {
  id: string;
  name: string;
  style: string;
  model_url: string;
  thumbnail_url: string;
  description: string;
  store_id?: string;
  created_at: string;
}

export interface ElectronicContract {
  id: string;
  contract_id: string;
  hash: string;
  blockchain_tx?: string;
  storage_url: string;
  expire_date: string;
  created_at: string;
}

export interface MaterialBOM {
  id: string;
  contract_id: string;
  material_name: string;
  specification: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  supplier_id?: string;
  status: 'planned' | 'ordered' | 'delivered' | 'installed';
  created_at: string;
}

export interface WorkOrder {
  id: string;
  contract_id: string;
  type: 'complaint' | 'maintenance' | 'consultation' | 'warranty';
  title: string;
  description: string;
  submitter_id: string;
  handler_id?: string;
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  nps_score?: number;
  created_at: string;
  resolved_at?: string;
}

export interface NPSRecord {
  id: string;
  contract_id: string;
  owner_id: string;
  score: number;
  feedback?: string;
  created_at: string;
}

export interface CityData {
  id: string;
  name: string;
  province: string;
  longitude: number;
  latitude: number;
  store_count: number;
}
