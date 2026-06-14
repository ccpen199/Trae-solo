export interface User {
  id: number;
  phone: string;
  email: string | null;
  name: string;
  role: 'employer' | 'provider' | 'admin';
  avatar: string | null;
  status: string;
  created_at: string;
}

export interface EmployerProfile {
  id: number;
  user_id: number;
  company_name: string;
  business_license: string | null;
  industry: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  verified: number;
  total_projects: number;
  total_spent: number;
}

export interface ProviderProfile {
  id: number;
  user_id: number;
  real_name: string;
  id_card: string;
  skills: string[];
  level: string;
  service_categories: string[];
  price_min: number;
  price_max: number;
  bio: string | null;
  location: string | null;
  verified: boolean;
  rating: number;
  total_orders: number;
  completion_rate: number;
  avg_delivery_days: number;
  total_earnings: number;
  balance: number;
  name?: string;
  avatar?: string | null;
  phone?: string;
}

export interface Task {
  id: number;
  task_no: string;
  employer_id: number;
  title: string;
  description: string;
  category: string;
  budget_type: string;
  budget_min: number;
  budget_max: number;
  cycle_days: number;
  delivery_standards: string | null;
  review_nodes: any[];
  attachments: any[];
  nda_required: boolean;
  ip_ownership: string;
  prepayment_ratio: number;
  penalty_clause: string | null;
  status: string;
  provider_id: number | null;
  bid_count: number;
  published_at: string | null;
  selected_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  employer_name?: string;
  employer_avatar?: string | null;
  provider_name?: string;
  provider_level?: string;
}

export interface Bid {
  id: number;
  task_id: number;
  provider_id: number;
  proposal: string;
  proposed_price: number;
  proposed_days: number;
  portfolio_samples: any[];
  status: string;
  created_at: string;
  provider?: ProviderProfile & { name?: string; avatar?: string | null };
}

export interface Submission {
  id: number;
  task_id: number;
  provider_id: number;
  version: number;
  title: string;
  description: string | null;
  files: any[];
  review_node: string | null;
  status: string;
  review_comments: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Message {
  id: number;
  task_id: number;
  sender_id: number;
  type: string;
  content: string;
  file_name: string | null;
  file_size: number | null;
  read_by: any[];
  important: boolean;
  created_at: string;
}

export interface PortfolioItem {
  id: number;
  provider_id: number;
  title: string;
  description: string | null;
  category: string | null;
  images: any[];
  attachments: any[];
  client_name: string | null;
  completed_at: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
}

export interface Certification {
  id: number;
  provider_id: number;
  name: string;
  issuer: string | null;
  issue_date: string | null;
  certificate_no: string | null;
  verified: number;
}

export interface Transaction {
  id: number;
  task_id: number;
  payer_id: number;
  payee_id: number;
  amount: number;
  type: string;
  status: string;
  payment_method: string | null;
  transaction_no: string;
  created_at: string;
  completed_at: string | null;
}

export interface IPRRecord {
  id: number;
  task_id: number;
  submission_id: number;
  owner_id: number;
  owner_type: string;
  work_title: string;
  work_hash: string;
  blockchain_tx: string | null;
  timestamp: number;
  certificate_url: string | null;
  created_at: string;
}

export interface Dispute {
  id: number;
  task_id: number;
  initiator_id: number;
  respondent_id: number;
  type: string;
  title: string;
  description: string;
  evidences: any[];
  status: string;
  resolution: string | null;
  resolution_type: string | null;
  resolution_amount: number | null;
  handled_by: number | null;
  handled_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  action: string;
  target_type: string | null;
  target_id: number | null;
  details: string | null;
  ip_address: string | null;
  sensitive: number;
  created_at: string;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface LoginResult {
  token: string;
  user: User;
  provider?: ProviderProfile | null;
  employer?: EmployerProfile | null;
}

export const CATEGORY_MAP: Record<string, string> = {
  ui_design: 'UI设计',
  industrial_design: '工业设计',
  animation_design: '动漫设计',
  software_development: '软件开发',
  trademark: '商标注册',
  copywriting: '文案策划',
};

export const LEVEL_MAP: Record<string, string> = {
  normal: '普通',
  silver: '银牌',
  gold: '金牌',
};

export const TASK_STATUS_MAP: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  bidding: '投标中',
  selected: '已选标',
  in_progress: '进行中',
  reviewing: '审核中',
  completed: '已完成',
  disputed: '争议中',
  cancelled: '已取消',
};

export const BUDGET_TYPE_MAP: Record<string, string> = {
  fixed: '固定预算',
  hourly: '按小时',
  negotiable: '面议',
};
