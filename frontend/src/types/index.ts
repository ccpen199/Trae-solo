export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface Agent {
  id: number;
  name: string;
  phone: string;
  avatar?: string;
  role: 'admin' | 'agent' | 'auditor';
  points: number;
  store_id?: number;
  created_at: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Agent;
}

export interface SimilarProperty {
  id: number;
  title: string;
  similarity: number;
  reason: string;
}

export interface Property {
  id: number;
  title: string;
  type: 'sale' | 'rent';
  price: number;
  area: number;
  rooms: string;
  floor: string;
  address: string;
  district: string;
  community: string;
  orientation: string;
  decoration: string;
  year_built: number;
  description: string;
  owner_name: string;
  owner_phone: string;
  phone_verified: number;
  image_duplicate_rate: number;
  publish_date: string;
  authenticity_score: number;
  source_platform: string;
  ai_tags: string[];
  status: 'active' | 'inactive' | 'pending' | 'duplicate';
  similarity_warning?: SimilarProperty[];
  agent_id?: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyCreateRequest {
  title: string;
  type: 'sale' | 'rent';
  price: number;
  area: number;
  rooms: string;
  floor: string;
  address: string;
  district: string;
  community: string;
  orientation: string;
  decoration: string;
  year_built: number;
  description: string;
  owner_name: string;
  owner_phone: string;
  voice_text?: string;
}

export interface AITagResponse {
  tags: string[];
  confidence: number;
}

export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  similarItems: SimilarProperty[];
  suggestion: string;
}

export interface FollowUpRecord {
  id: number;
  customer_id: number;
  content: string;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  type: 'buyer' | 'seller' | 'tenant' | 'landlord';
  budget_min: number;
  budget_max: number;
  area_pref: string;
  rooms_pref: string;
  ai_tags: string[];
  source: string;
  remarks: string;
  voice_text?: string;
  agent_id: number;
  follow_up_records?: FollowUpRecord[];
  status: 'active' | 'inactive' | 'deal';
  created_at: string;
}

export interface CustomerCreateRequest {
  name: string;
  phone: string;
  type: 'buyer' | 'seller' | 'tenant' | 'landlord';
  budget_min: number;
  budget_max: number;
  area_pref: string;
  rooms_pref: string;
  remarks: string;
  voice_text?: string;
}

export interface Demand {
  id: number;
  title: string;
  type: 'buy' | 'rent';
  budget_min: number;
  budget_max: number;
  area: string;
  rooms: string;
  district: string;
  description: string;
  match_score: number;
  expires_at: string;
  status: 'open' | 'taken' | 'deal' | 'expired';
  created_at: string;
}

export interface DemandTaken {
  id: number;
  demand_id: number;
  agent_id: number;
  taken_at: string;
  status: string;
}

export interface CommissionTier {
  level: number;
  min_amount: number;
  max_amount: number;
  rate: number;
  description: string;
}

export interface Commission {
  id: number;
  demand_id?: number;
  property_id?: number;
  agent_id: number;
  agent_name: string;
  deal_amount: number;
  commission_rate: number;
  commission_amount: number;
  tier_level: number;
  tier_description: string;
  status: 'pending' | 'approved' | 'paid';
  voucher_url?: string;
  created_at: string;
  paid_at?: string;
}

export interface PaymentVoucher {
  id: string;
  commission_id: number;
  agent_name: string;
  amount: number;
  date: string;
  qr_code: string;
  serial_number: string;
}

export interface KnowledgeContent {
  id: number;
  type: 'question' | 'article' | 'resource';
  title: string;
  content: string;
  category: string;
  author_id: number;
  author_name: string;
  points: number;
  views: number;
  likes: number;
  is_answered?: boolean;
  accepted_answer_id?: number;
  audit_status: 'pending' | 'approved' | 'rejected';
  audit_reason?: string;
  created_at: string;
}

export interface KnowledgeCreateRequest {
  type: 'question' | 'article' | 'resource';
  title: string;
  content: string;
  category: string;
  points: number;
}

export interface AgentQualification {
  id?: number;
  agent_id: number;
  license_number: string;
  license_type: string;
  issue_date: string;
  expiry_date: string;
  verified: number;
  verified_at?: string;
}

export interface Promotion {
  id: number;
  property_id: number;
  property_title?: string;
  channel: string;
  status: 'pending' | 'success' | 'failed';
  qr_code?: string;
  brochure_url?: string;
  promoted_at: string;
}

export interface PromotionCreateRequest {
  property_id: number;
  channels: string[];
  template_id?: string;
}

export interface BrochureData {
  property: Property;
  agent: Agent;
  qr_code: string;
  template_id: string;
}

export interface CrawlTask {
  id: number;
  platforms: string[];
  districts: string[];
  min_score: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_found: number;
  total_approved: number;
  created_at: string;
  completed_at?: string;
}

export interface CrawlResult {
  id: number;
  task_id: number;
  title: string;
  platform: string;
  authenticity_score: number;
  phone_verified: number;
  image_duplicate_rate: number;
  publish_days: number;
  status: 'pending' | 'approved' | 'rejected';
  raw_data: string;
  created_at: string;
}

export interface DashboardStats {
  total_properties: number;
  total_customers: number;
  total_demands: number;
  total_commissions: number;
  pending_review: number;
  my_today_tasks: number;
  properties_trend: { date: string; count: number }[];
  commissions_trend: { date: string; amount: number }[];
  district_distribution: { name: string; value: number }[];
  top_agents: { name: string; deals: number; amount: number }[];
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
