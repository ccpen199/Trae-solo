export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'property' | 'resident' | 'merchant';
  name: string;
  phone: string;
  avatar?: string;
  skills?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Building {
  id: number;
  name: string;
  address: string;
  total_floors: number;
  total_units: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: number;
  building_id: number;
  unit_number: string;
  floor: number;
  area: number;
  owner_name?: string;
  owner_phone?: string;
  status: 'occupied' | 'vacant' | 'rented';
  created_at: string;
  updated_at: string;
}

export interface Resident {
  id: number;
  unit_id: number;
  user_id?: number;
  name: string;
  phone: string;
  id_card?: string;
  relation: 'owner' | 'tenant' | 'family';
  move_in_date?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkTicket {
  id: number;
  title: string;
  description: string;
  type: 'repair' | 'complaint' | 'suggestion' | 'service';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'processing' | 'completed' | 'cancelled';
  reporter_id: number;
  assignee_id?: number;
  unit_id?: number;
  location?: string;
  contact_name?: string;
  contact_phone?: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  rating?: number;
  feedback?: string;
  skills_required?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  category: 'notice' | 'activity' | 'news' | 'help';
  author_id: number;
  status: 'draft' | 'published' | 'archived';
  views: number;
  created_at: string;
  updated_at: string;
}

export interface Merchant {
  id: number;
  user_id?: number;
  name: string;
  category: string;
  phone: string;
  address: string;
  description?: string;
  business_hours?: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface MarketItem {
  id: number;
  merchant_id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  original_price?: number;
  images?: string;
  stock: number;
  status: 'on_sale' | 'off_sale' | 'sold_out';
  created_at: string;
  updated_at: string;
}

export interface PickupPoint {
  id: number;
  name: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  business_hours?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface FeeBill {
  id: number;
  resident_id: number;
  unit_id: number;
  type: 'property' | 'water' | 'electricity' | 'gas' | 'parking' | 'other';
  amount: number;
  billing_month: string;
  due_date: string;
  paid_at?: string;
  status: 'unpaid' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface AccessLog {
  id: number;
  user_id?: number;
  resident_name?: string;
  phone?: string;
  access_type: 'enter' | 'exit' | 'visitor_enter' | 'visitor_exit';
  location: string;
  device?: string;
  remark?: string;
  created_at: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface AuthPayload {
  id: number;
  username: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
  phone: string;
  role: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: Omit<User, 'password'>;
}

export interface TicketAssignResult {
  assignee_id: number;
  score: number;
  reason: string;
}

export interface AISummary {
  summary: string;
  key_points: string[];
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface DashboardStats {
  total_tickets: number;
  pending_tickets: number;
  completed_tickets: number;
  total_residents: number;
  total_units: number;
  occupied_units: number;
  total_fee: number;
  paid_fee: number;
  unpaid_fee: number;
  tickets_by_status: { status: string; count: number }[];
  tickets_by_type: { type: string; count: number }[];
  recent_tickets: WorkTicket[];
}
