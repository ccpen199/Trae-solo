export interface Building {
  id: number;
  name: string;
  address: string;
  floors: number;
  units: number;
  households: number;
  buildYear: number;
  image?: string;
}

export interface Resident {
  id: number;
  name: string;
  phone: string;
  unit: string;
  floor: number;
  moveInDate: string;
  avatar?: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  type?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'assigned';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  progress: number;
  createdAt: string;
  updatedAt?: string;
  assignee?: string;
  reporter?: string;
  reporter_name?: string;
  assignee_name?: string;
  created_at?: string;
  updated_at?: string;
  buildingId?: number;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
  category: string;
  images?: string[];
  views: number;
  reports?: number;
  help_responses?: number;
  tags?: string[];
  is_verified?: boolean;
  report_status?: string;
}

export interface Merchant {
  id: number;
  name: string;
  category: string;
  rating: number;
  address: string;
  phone: string;
  description: string;
  image?: string;
  businessHours: string;
  isOpen: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt?: string;
}

export interface MarketItem {
  id: number;
  title: string;
  description: string;
  price?: number;
  originalPrice?: number;
  seller: string;
  sellerAvatar?: string;
  seller_credit?: number;
  seller_trades?: number;
  pickup_available?: boolean;
  transaction_status?: 'pending_pickup' | 'pending_payment' | 'completed' | 'cancelled';
  images?: string[];
  category: string;
  condition?: 'new' | 'like-new' | 'good' | 'fair';
  location?: string;
  createdAt: string;
  status: 'available' | 'sold' | 'reserved' | 'on_sale' | 'off_sale' | 'sold_out';
  stock?: number;
  views?: number;
  merchantId?: number;
}

export interface Fee {
  id: number;
  type: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'unpaid' | 'paid' | 'overdue';
  description: string;
}

export interface FeeBill {
  id: number;
  residentId?: number;
  unitId?: number;
  type: 'property' | 'water' | 'electricity' | 'gas' | 'parking' | 'other';
  amount: number;
  billingMonth?: string;
  dueDate?: string;
  paidAt?: string;
  status: 'unpaid' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  remark?: string;
  createdAt?: string;
}

export interface AccessRecord {
  id: number;
  residentName: string;
  unit: string;
  gate: string;
  time: string;
  type: 'entry' | 'exit';
  method: 'card' | 'face' | 'app';
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
  recent_tickets: Ticket[];
}

export interface TempTrend {
  date: string;
  value: number;
}
