export interface Estate {
  id: number;
  name: string;
  type: 'new' | 'secondhand' | 'rent';
  address: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  developer: string;
  property_company: string;
  property_fee: number;
  build_year: number;
  total_households: number;
  parking_count: number;
  green_rate: number;
  volume_rate: number;
  average_price: number;
  description: string;
  metro_lines: string;
  school_district: string;
  facilities: string;
  status: string;
  created_at: string;
  updated_at: string;
  property_count?: number;
  min_price?: number;
  max_price?: number;
  distance?: number;
}

export interface Property {
  id: number;
  estate_id: number;
  title: string;
  type: 'new' | 'secondhand' | 'rent';
  price: number;
  unit_price: number;
  area: number;
  bedrooms: number;
  livingrooms: number;
  bathrooms: number;
  floor: string;
  total_floors: number;
  orientation: string;
  decoration: string;
  building_type: string;
  has_vr: number;
  vr_url: string;
  floor_plan_url: string;
  images: string | string[];
  hotspots: string | any[];
  description: string;
  features: string;
  tags: string | string[];
  broker_id: number;
  status: string;
  is_fake: number;
  fake_score: number;
  price_deviation: number;
  created_at: string;
  updated_at: string;
  estate_name?: string;
  estate_address?: string;
  district?: string;
  lat?: number;
  lng?: number;
  metro_lines?: string;
  school_district?: string;
  broker_name?: string;
  broker_avatar?: string;
  broker_rating?: number;
  broker_certified?: number;
  estate_avg_price?: number;
  distance?: number;
  priceHistory?: PriceHistory[];
  nearby?: Property[];
  match_score?: number;
}

export interface PriceHistory {
  price: number;
  date: string;
  source?: string;
}

export interface Broker {
  id: number;
  name: string;
  phone: string;
  avatar: string;
  certified: number;
  certification_no: string;
  store_id: number;
  rating: number;
  deal_count: number;
  experience_years: number;
  description: string;
  created_at: string;
  store_name?: string;
  store_address?: string;
  store_phone?: string;
  store_lat?: number;
  store_lng?: number;
  business_hours?: string;
  property_count?: number;
  properties?: Property[];
  schedule?: Appointment[];
  todayFreeSlots?: string[];
  commissions?: Commission[];
  totalCommission?: number;
  training?: BrokerTraining[];
}

export interface Store {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  business_hours: string;
  broker_count?: number;
}

export interface User {
  id: number;
  phone: string;
  name: string;
  avatar: string;
  role: string;
  created_at: string;
  browsing_count?: number;
  appointment_count?: number;
  favorite_count?: number;
}

export interface POI {
  id: number;
  name: string;
  type: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  city: string;
  properties: string;
  distance?: number;
}

export interface MetroLine {
  id: number;
  line_name: string;
  line_number: string;
  color: string;
  stations: string[];
  estate_count?: number;
}

export interface SchoolDistrict {
  id: number;
  name: string;
  type: string;
  level: string;
  boundary: [number, number][];
  lat: number;
  lng: number;
  distance?: number;
}

export interface Appointment {
  id: number;
  user_id: number;
  broker_id: number;
  property_id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  type: string;
  notes: string;
  created_at: string;
  user_name?: string;
  property_title?: string;
}

export interface Viewing {
  id: number;
  user_id: number;
  broker_id: number;
  property_id: number;
  viewing_date: string;
  viewing_time: string;
  status: string;
  feedback: string;
  rating: number;
  created_at: string;
  user_name?: string;
  user_phone?: string;
  property_title?: string;
  property_price?: number;
  property_area?: number;
}

export interface CustomerFollow {
  id: number;
  broker_id: number;
  user_id: number;
  follow_date: string;
  content: string;
  next_follow_date: string;
  status: string;
  created_at: string;
  user_name?: string;
  user_phone?: string;
  user_avatar?: string;
}

export interface Commission {
  id: number;
  broker_id: number;
  property_id: number;
  store_id?: number;
  deal_amount: number;
  commission_rate: number;
  commission_amount: number;
  performance_bonus?: number;
  deduction?: number;
  actual_commission?: number;
  deal_date: string;
  settlement_date?: string;
  status: 'pending' | 'settled' | 'rejected';
  created_at: string;
  updated_at?: string;
  property_title?: string;
  customer_name?: string;
  customer_phone?: string;
  broker_name?: string;
  store_name?: string;
  deal_no?: string;
  settlement_remark?: string;
  reject_reason?: string;
  audit_records?: AuditRecord[];
}

export interface AuditRecord {
  id: number;
  commission_id: number;
  action: 'create' | 'submit' | 'settle' | 'reject';
  operator: string;
  operator_id: number;
  remark?: string;
  created_at: string;
}

export interface CommissionStats {
  month_pending: number;
  month_settled: number;
  total_commission: number;
  avg_commission_rate: number;
  monthly_trend?: { month: string; amount: number }[];
  broker_ranking?: { broker_name: string; amount: number }[];
  store_distribution?: { store_name: string; amount: number }[];
}

export interface TrainingCourse {
  id: number;
  title: string;
  description: string;
  duration: number;
  category: string;
  level: string;
  content: string;
  created_at: string;
  enrolled_count?: number;
  completed_count?: number;
  progress?: number;
  completed?: number;
  start_date?: string;
  complete_date?: string;
  score?: number;
}

export interface BrokerTraining {
  id: number;
  broker_id: number;
  course_id: number;
  progress: number;
  completed: number;
  start_date: string;
  complete_date: string;
  score: number;
  created_at: string;
  course_title?: string;
  course_description?: string;
  duration?: number;
  category?: string;
  level?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface MapFilter {
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  hasVR?: boolean;
  hasFloorPlan?: boolean;
  hasPriceHistory?: boolean;
  nearMetro?: boolean;
  nearSchool?: boolean;
  hasAIRecommendation?: boolean;
  minCommuteTime?: number;
  maxCommuteTime?: number;
  district?: string;
  metroLine?: string;
  schoolDistrict?: string;
  poiType?: string;
  sortBy?: 'price' | 'price_desc' | 'area' | 'area_desc' | 'distance' | 'rating';
  radius?: number;
  lat?: number;
  lng?: number;
  keyword?: string;
}

export interface PriceEvaluation {
  estimatedPrice: number;
  unitPrice: number;
  adjustment: number;
  confidence: 'high' | 'medium' | 'low';
  similarCount: number;
  breakdown: {
    basePrice: number;
    bedroomBonus: number;
    orientationBonus: number;
    decorationBonus: number;
  };
}

export interface CommuteResult {
  distance: number;
  distanceKm: number;
  timeMinutes: number;
  mode: string;
  trafficFactor: number;
}
