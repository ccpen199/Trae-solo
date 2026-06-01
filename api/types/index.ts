export interface User {
  id: number;
  phone: string;
  password: string;
  nickname: string;
  balance: number;
  role: 'owner' | 'operator' | 'admin';
  vehicle_info?: string;
  created_at: string;
  updated_at: string;
}

export interface Station {
  id: number;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  operator_id: number;
  price_per_kwh: number;
  parking_fee: number;
  business_hours: string;
  status: 'open' | 'closed' | 'maintenance';
  total_guns: number;
  available_guns: number;
  created_at: string;
  updated_at: string;
}

export interface Charger {
  id: number;
  station_id: number;
  serial_number: string;
  model: string;
  power: number;
  status: 'online' | 'offline' | 'fault' | 'charging';
  firmware_version: string;
  last_heartbeat: string;
  created_at: string;
  updated_at: string;
}

export interface Gun {
  id: number;
  charger_id: number;
  station_id: number;
  gun_no: string;
  connector_type: 'CCS' | 'CHAdeMO' | 'GB/T' | 'Type2';
  max_power: number;
  status: 'idle' | 'occupied' | 'charging' | 'reserved' | 'fault';
  current_order_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: number;
  user_id: number;
  station_id: number;
  gun_id: number;
  vehicle_plate: string;
  reserve_time: string;
  expire_time: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface ChargingOrder {
  id: number;
  order_no: string;
  user_id: number;
  station_id: number;
  gun_id: number;
  start_time?: string;
  end_time?: string;
  start_soc?: number;
  end_soc?: number;
  total_kwh: number;
  peak_kwh: number;
  valley_kwh: number;
  avg_power: number;
  total_amount: number;
  electricity_fee: number;
  service_fee: number;
  parking_fee: number;
  payment_status: 'unpaid' | 'paid' | 'refunded';
  charging_status: 'pending' | 'charging' | 'completed' | 'stopped' | 'fault';
  stop_reason?: string;
  power_curve?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  transaction_no: string;
  user_id: number;
  order_id?: number;
  type: 'recharge' | 'payment' | 'refund';
  amount: number;
  balance_before: number;
  balance_after: number;
  payment_method: 'balance' | 'wechat' | 'alipay';
  status: 'pending' | 'success' | 'failed';
  created_at: string;
}

export interface WorkOrder {
  id: number;
  order_no: string;
  station_id: number;
  charger_id?: number;
  gun_id?: number;
  type: 'fault' | 'maintenance' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  reporter: string;
  assignee?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Alarm {
  id: number;
  station_id: number;
  charger_id?: number;
  gun_id?: number;
  type: 'offline' | 'overheat' | 'overvoltage' | 'undervoltage' | 'leakage' | 'other';
  level: 'warning' | 'error' | 'critical';
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at?: string;
}

export interface Firmware {
  id: number;
  version: string;
  model: string;
  file_path: string;
  file_size: number;
  md5: string;
  release_notes: string;
  created_at: string;
}

export interface InspectionRecord {
  id: number;
  station_id: number;
  inspector: string;
  inspection_date: string;
  items: string;
  result: 'pass' | 'fail' | 'partial';
  remarks: string;
  created_at: string;
}

export interface DailyStats {
  id: number;
  stat_date: string;
  station_id: number;
  total_orders: number;
  total_kwh: number;
  peak_kwh: number;
  valley_kwh: number;
  total_revenue: number;
  avg_charging_duration: number;
  utilization_rate: number;
  unique_users: number;
  repeat_users: number;
  queue_loss_count: number;
  queue_loss_amount: number;
  created_at: string;
}
