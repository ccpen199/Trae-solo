export type UserRole = 'employer' | 'provider' | 'admin';
export type UserStatus = 'active' | 'verified' | 'suspended';
export type TaskType = 'ui_design' | 'industrial_design' | 'animation' | 'software' | 'trademark' | 'copywriting';
export type TaskStatus = 'draft' | 'published' | 'bidding' | 'selected' | 'in_progress' | 'submitted' | 'reviewing' | 'revising' | 'completed' | 'disputed' | 'cancelled';
export type BidStatus = 'pending' | 'accepted' | 'rejected';
export type SubmissionStatus = 'submitted' | 'under_review' | 'revision_requested' | 'approved' | 'rejected';
export type MessageType = 'text' | 'file' | 'submission' | 'system';
export type TransactionType = 'deposit' | 'escrow' | 'release' | 'refund' | 'withdraw' | 'fee';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type DisputeStatus = 'pending' | 'reviewing' | 'resolved' | 'closed';
export type TalentLevel = 'entry' | 'intermediate' | 'advanced' | 'expert';

export interface User {
  id: number;
  email: string;
  phone: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface ReviewNode {
  id: string;
  name: string;
  description: string;
  order: number;
  completed: boolean;
  completedAt: string | null;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'completed' | 'released';
  completed: boolean;
  completedAt: string | null;
}

export interface Task {
  id: number;
  employerId: number;
  providerId: number | null;
  title: string;
  description: string;
  type: TaskType;
  budgetMin: number;
  budgetMax: number;
  finalBudget: number | null;
  durationDays: number;
  status: TaskStatus;
  tags: string[];
  deliveryStandards: string;
  reviewNodes: ReviewNode[];
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
  employer?: User;
  provider?: User;
  bids?: Bid[];
  submissions?: Submission[];
}

export interface TaskCreateRequest {
  title: string;
  description: string;
  type: TaskType;
  budgetMin: number;
  budgetMax: number;
  durationDays: number;
  tags: string[];
  deliveryStandards: string;
  reviewNodes: ReviewNode[];
  milestones: Milestone[];
}

export interface TaskListQuery {
  status?: TaskStatus;
  type?: TaskType;
  page?: number;
  pageSize?: number;
}

export interface Bid {
  id: number;
  taskId: number;
  providerId: number;
  proposal: string;
  budget: number;
  durationDays: number;
  status: BidStatus;
  createdAt: string;
  provider?: User;
  talent?: Talent;
}

export interface BidCreateRequest {
  proposal: string;
  budget: number;
  durationDays: number;
}

export interface SubmissionFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  hash: string;
}

export interface Submission {
  id: number;
  taskId: number;
  providerId: number;
  version: number;
  title: string;
  description: string;
  files: SubmissionFile[];
  status: SubmissionStatus;
  reviewComment: string | null;
  reviewScore: number | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
  provider?: User;
  reviewer?: User;
  ipRecord?: IPRecord;
}

export interface SubmissionCreateRequest {
  title: string;
  description: string;
  files: SubmissionFile[];
}

export interface SubmissionReviewRequest {
  status: SubmissionStatus;
  comment: string;
  score?: number;
}

export interface Talent {
  id: number;
  userId: number;
  realName: string;
  idCardVerified: boolean;
  skills: string[];
  bio: string;
  rating: number;
  completedProjects: number;
  onTimeRate: number;
  level: TalentLevel;
  verified: boolean;
  portfolio: PortfolioItem[];
  certifications: Certification[];
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  images: string[];
  url: string;
}

export interface Certification {
  id: string;
  type: string;
  name: string;
  issuer: string;
  issueDate: string;
  verified: boolean;
}

export interface Message {
  id: number;
  taskId: number;
  senderId: number;
  content: string;
  type: MessageType;
  fileUrl: string | null;
  fileName: string | null;
  read: boolean;
  createdAt: string;
  sender?: User;
}

export interface MessageCreateRequest {
  content: string;
  type?: MessageType;
  fileUrl?: string;
  fileName?: string;
}

export interface Conversation {
  taskId: number;
  taskTitle: string;
  lastMessage: Message;
  unreadCount: number;
  participants: User[];
}

export interface Wallet {
  userId: number;
  balance: number;
  frozenBalance: number;
  totalIncome: number;
  totalExpense: number;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  userId: number;
  type: TransactionType;
  amount: number;
  balance: number;
  taskId: number | null;
  description: string;
  status: TransactionStatus;
  createdAt: string;
  task?: Task;
}

export interface EscrowRequest {
  taskId: number;
  amount: number;
}

export interface ReleaseRequest {
  taskId: number;
  amount: number;
  milestoneId?: string;
}

export interface WithdrawRequest {
  amount: number;
  bankAccount: string;
  bankName: string;
  accountName: string;
}

export interface Dispute {
  id: number;
  taskId: number;
  initiatorId: number;
  respondentId: number;
  reason: string;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  resolution: string | null;
  amountDistribution: { [key: number]: number } | null;
  resolvedBy: number | null;
  resolvedAt: string | null;
  createdAt: string;
  task?: Task;
  initiator?: User;
  respondent?: User;
  resolver?: User;
}

export interface DisputeCreateRequest {
  taskId: number;
  reason: string;
  description: string;
  evidence: string[];
}

export interface DisputeResolveRequest {
  status: DisputeStatus;
  resolution: string;
  amountDistribution: { [key: number]: number };
}

export interface IPRecord {
  id: number;
  submissionId: number;
  taskId: number;
  providerId: number;
  fileHash: string;
  fileName: string;
  timestamp: number;
  blockHeight: number | null;
  txHash: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  resourceType: string;
  resourceId: number | null;
  ipAddress: string;
  userAgent: string;
  details: Record<string, unknown>;
  createdAt: string;
  user?: User;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface DashboardStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalAmount: number;
  pendingReviews: number;
  pendingDisputes: number;
  newTalents: number;
  monthlyGrowth: number;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  ui_design: 'UI设计',
  industrial_design: '工业设计',
  animation: '动漫设计',
  software: '软件开发',
  trademark: '商标注册',
  copywriting: '文案策划',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  draft: '草稿',
  published: '已发布',
  bidding: '招标中',
  selected: '已选中',
  in_progress: '进行中',
  submitted: '已提交',
  reviewing: '评审中',
  revising: '修改中',
  completed: '已完成',
  disputed: '争议中',
  cancelled: '已取消',
};

export const TALENT_LEVEL_LABELS: Record<TalentLevel, string> = {
  entry: '初级',
  intermediate: '中级',
  advanced: '高级',
  expert: '专家',
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  submitted: '已提交',
  under_review: '评审中',
  revision_requested: '需修改',
  approved: '已通过',
  rejected: '已拒绝',
};
