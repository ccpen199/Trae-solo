export interface Grid {
  code: string;
  name: string;
  town_code: string;
  city_code: string;
  province_code: string;
  lat: number;
  lng: number;
}

export interface Provider {
  id: number;
  name: string;
  service_type: string;
  grid_code: string;
  street_certified: number;
  certification_no: string;
  contact_name: string;
  phone: string;
  annual_review_date: string;
  review_status: 'pending' | 'approved' | 'expired';
  created_at: string;
}

export interface POI {
  id: number;
  name: string;
  type: string;
  grid_code: string;
  address: string;
  lat: number;
  lng: number;
  business_status: 'open' | 'closed' | 'resting';
  avg_cost: number;
  service_hours: string;
  provider_id: number;
  rating: number;
  created_at: string;
}

export interface User {
  id: number;
  phone: string;
  name: string;
  grid_code: string;
  role: 'resident' | 'provider' | 'leader' | 'admin';
  password_hash: string;
  created_at: string;
}

export interface Demand {
  id: number;
  type: string;
  title: string;
  description: string;
  grid_code: string;
  publisher_id: number;
  acceptor_id: number | null;
  reward: number;
  status: 'open' | 'accepted' | 'completed' | 'cancelled';
  created_at: string;
}

export interface Settlement {
  id: number;
  provider_id: number;
  amount: number;
  period: string;
  status: 'pending' | 'paid' | 'completed';
  created_at: string;
}

export interface Dispute {
  id: number;
  demand_id: number;
  complainant_id: number;
  respondent_id: number;
  description: string;
  status: 'pending' | 'resolved' | 'closed';
  resolution: string | null;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
