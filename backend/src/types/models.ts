export interface ChargingStation {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  operator_id: string;
  total_piles: number;
  available_piles: number;
  rating: number;
  review_count: number;
  payment_methods: string;
  created_at: string;
  updated_at: string;
}

export interface ChargingPile {
  id: string;
  station_id: string;
  pile_code: string;
  power_level: number;
  status: 'offline' | 'available' | 'charging' | 'fault' | 'reserved';
  connector_type: string;
  current_power: number;
  total_energy: number;
  last_heartbeat: string | null;
  firmware_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  phone: string;
  nickname: string | null;
  avatar: string | null;
  balance: number;
  created_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  plate_number: string;
  brand: string | null;
  model: string | null;
  battery_capacity: number;
  current_soc: number;
  current_mileage: number;
  energy_consumption: number;
  fault_codes: string;
  is_default: number;
  created_at: string;
}

export interface ChargingSession {
  id: string;
  user_id: string;
  pile_id: string;
  station_id: string;
  vehicle_id: string | null;
  start_time: string;
  end_time: string | null;
  start_soc: number | null;
  end_soc: number | null;
  energy_charged: number;
  amount: number;
  status: 'charging' | 'completed' | 'stopped' | 'failed';
  payment_method: string | null;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  station_id: string;
  pile_id: string | null;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string | null;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignee: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Review {
  id: string;
  user_id: string;
  station_id: string;
  session_id: string;
  rating: number;
  content: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  is_approved: number;
  created_at: string;
}

export interface Settlement {
  id: string;
  session_id: string;
  station_id: string;
  operator_id: string;
  total_amount: number;
  platform_fee: number;
  operator_share: number;
  settle_time: string;
}

export interface CityHeatData {
  id?: number;
  city: string;
  date: string;
  total_charges: number;
  total_energy: number;
  avg_occupancy: number;
  failure_rate: number;
}
