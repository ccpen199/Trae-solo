export enum UserRole {
  PUBLISHER = 'publisher',
  WORKER = 'worker',
  EXPERT = 'expert',
  ADMIN = 'admin',
}

export enum TaskStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DELIVERED = 'delivered',
  PENDING_REVIEW = 'pending_review',
  REVIEWING = 'reviewing',
  QUALIFIED = 'qualified',
  DISQUALIFIED = 'disqualified',
  APPEALING = 'appealing',
  SETTLED = 'settled',
}

export enum ReviewResult {
  PENDING = 'pending',
  QUALIFIED = 'qualified',
  DISQUALIFIED = 'disqualified',
}

export enum AppealStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum CheatingRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface User {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  real_name: string | null;
  role: UserRole;
  level: number;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

export interface TaskBatch {
  id: number;
  publisher_id: number;
  batch_name: string;
  description: string | null;
  total_units: number;
  completed_units: number;
  unit_reward: number;
  total_reward: number;
  requirements: string | null;
  min_worker_level: number;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface TaskUnit {
  id: number;
  batch_id: number;
  unit_index: number;
  task_data: string;
  reward: number;
  status: TaskStatus;
  min_worker_level: number;
  created_at: string;
  updated_at: string;
}

export interface TaskDelivery {
  id: number;
  task_unit_id: number;
  worker_id: number;
  delivery_data: string;
  ip_address: string | null;
  device_fingerprint: string | null;
  delivered_at: string;
  version: number;
}

export interface AntiCheatingRecord {
  id: number;
  task_unit_id: number;
  worker_id: number;
  ip_address: string | null;
  device_fingerprint: string | null;
  ip_risk_score: number;
  fingerprint_risk_score: number;
  total_risk_score: number;
  risk_level: CheatingRiskLevel;
  risk_factors: string | null;
  is_flagged: boolean;
  checked_at: string;
}

export interface ExpertReview {
  id: number;
  task_unit_id: number;
  expert_id: number;
  is_blind: boolean;
  result: ReviewResult;
  score: number | null;
  comments: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface SettlementRecord {
  id: number;
  task_unit_id: number;
  worker_id: number;
  amount: number;
  transaction_id: number | null;
  report_reference: string | null;
  settled_at: string;
}

export interface Appeal {
  id: number;
  task_unit_id: number;
  requester_id: number;
  reason: string;
  evidence: string | null;
  status: AppealStatus;
  admin_id: number | null;
  admin_comments: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  total_income: number;
  total_withdraw: number;
  updated_at: string;
}

export interface Transaction {
  id: number;
  wallet_id: number;
  task_unit_id: number | null;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

export interface OperationTrace {
  id: number;
  user_id: number | null;
  task_unit_id: number | null;
  operation: string;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  created_at: string;
  version: number;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  resource: string | null;
  resource_id: number | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface StatisticsOverview {
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  settled_tasks: number;
  total_reward: number;
  total_settled: number;
  total_users: number;
  total_workers: number;
  total_experts: number;
}
