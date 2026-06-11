export type UserRole = 'admin' | 'platform' | 'ops';
export type TaskStatus = 'draft' | 'pending' | 'published' | 'bidding' | 'selected' | 'in_progress' | 'submitted' | 'reviewing' | 'revising' | 'completed' | 'cancelled' | 'disputed';
export type TaskCategory = 'gov_affairs' | 'livelihood' | 'community' | 'market' | 'safety' | 'data';
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type SubmissionStatus = 'draft' | 'submitted' | 'under_review' | 'reviewing' | 'approved' | 'revision_requested' | 'rejected';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'escrow' | 'released';
export type DisputeStatus = 'pending' | 'reviewing' | 'investigating' | 'resolved' | 'rejected' | 'cancelled';
export type AuditAction = 'login' | 'logout' | 'create_task' | 'update_task' | 'delete_task' | 'place_bid' | 'submit_work' | 'make_payment' | 'open_dispute' | 'resolve_dispute' | 'account_update';
export type RiskLevel = 'low' | 'medium' | 'high';
export type CertificateStatus = 'pending' | 'certified' | 'issued' | 'revoked';

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  name?: string;
  url?: string;
  size?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  avatar?: string;
  role: UserRole;
  phone?: string;
  company?: string;
  location?: string;
  bio?: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  gender?: string;
  birthday?: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  taskCount: number;
}

export interface Task {
  id: string;
  taskNo: string;
  title: string;
  description: string;
  category: TaskCategory;
  categoryName: string;
  skills: string[];
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  duration?: number;
  status: TaskStatus;
  statusName: string;
  employerId: string;
  employerName: string;
  employerAvatar?: string;
  employer?: User;
  selectedProviderId?: string;
  selectedProviderName?: string;
  selectedProvider?: Provider;
  selectedBid?: Bid;
  bidCount: number;
  viewCount: number;
  attachments: Attachment[];
  milestones: Milestone[];
  deliveryStandards: string[];
  createdAt: string;
  updatedAt: string;
  auditStatus?: 'pending' | 'approved' | 'rejected';
  auditRemark?: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  amount: number;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed' | 'paid';
}

export interface Bid {
  id: string;
  taskId: string;
  taskTitle: string;
  taskCategory: TaskCategory;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  providerRating: number;
  providerReviewCount: number;
  providerVerified: boolean;
  price: number;
  amount?: number;
  deliveryDays: number;
  coverLetter: string;
  portfolioReferences: string[];
  status: BidStatus;
  matchScore?: number;
  matchReasons?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  providerId: string;
  providerName: string;
  version: number;
  title: string;
  description: string;
  attachments: Attachment[];
  status: SubmissionStatus;
  submittedAt: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComments: ReviewComment[];
}

export interface ReviewComment {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole;
  content: string;
  rating?: number;
  attachments: Attachment[];
  createdAt: string;
}

export interface Provider extends User {
  skills: string[];
  level: number;
  levelName: string;
  experienceYears: number;
  completedTasks: number;
  totalEarnings: number;
  responseRate: number;
  responseTime: number;
  portfolioCount: number;
  certifications: string[];
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  gender?: string;
  education?: string;
  categories?: TaskCategory[];
  onTimeRate?: number;
  goodRate?: number;
  repeatRate?: number;
  available?: boolean;
  hourlyRate?: number;
  paymentMethods?: Record<string, any>;
}

export interface PortfolioItem {
  id: string;
  providerId: string;
  title: string;
  description: string;
  category: TaskCategory;
  categoryName: string;
  skills: string[];
  images: string[];
  attachments: Attachment[];
  clientName?: string;
  completionDate?: string;
  budget?: number;
  likes: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  coverImage?: string;
  rating?: number;
  reviewCount?: number;
  tools?: string[];
  projectUrl?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: Attachment[];
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  taskId?: string;
  taskTitle?: string;
  participants: string[];
  participantNames: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentNo: string;
  taskId: string;
  taskTitle: string;
  task?: Task;
  payerId: string;
  payerName: string;
  payeeId: string;
  payeeName: string;
  amount: number;
  type: 'deposit' | 'milestone' | 'refund' | 'withdraw' | 'income' | 'compensation' | 'withdrawal';
  status: PaymentStatus;
  transactionId?: string;
  transactionNo?: string;
  remark?: string;
  details?: Record<string, any>;
  createdAt: string;
  paidAt?: string;
}

export type Transaction = Payment;

export interface IPCertificate {
  id: string;
  certificateNo: string;
  taskId: string;
  taskTitle: string;
  task?: Task;
  ownerId: string;
  ownerName: string;
  owner?: User;
  type: 'copyright' | 'patent' | 'trademark';
  title: string;
  description: string;
  hash: string;
  blockchainHash?: string;
  blockchainTxId?: string;
  transactionHash?: string;
  blockHeight?: number;
  status: CertificateStatus;
  issuedAt?: string;
  expiredAt?: string;
  expiresAt?: string;
  evidence?: Attachment[];
  createdAt: string;
}

export interface Dispute {
  id: string;
  disputeNo: string;
  taskId: string;
  taskTitle: string;
  task?: Task;
  plaintiffId: string;
  plaintiffName: string;
  plaintiff?: User;
  defendantId: string;
  defendantName: string;
  defendant?: User;
  type: string;
  title: string;
  description: string;
  amount?: number;
  expectedResolution?: string;
  status: DisputeStatus;
  statusName: string;
  evidence: Attachment[];
  arbitratorId?: string;
  arbitratorName?: string;
  arbitrationResult?: string;
  arbitrationReason?: string;
  compensationAmount?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  actionName: string;
  targetType: string;
  targetId: string;
  targetName?: string;
  ipAddress?: string;
  userAgent?: string;
  riskLevel: RiskLevel;
  riskLevelName: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalProviders: number;
  totalEmployers: number;
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  pendingTasks: number;
  pendingReview: number;
  pendingDisputes: number;
  totalTransactionAmount: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  todayNewUsers: number;
  todayNewTasks: number;
  todayTransactionAmount: number;
  todayCompletedTasks: number;
  todayRevenue: number;
  todayNewDisputes: number;
}

export interface CategoryStats {
  category: TaskCategory;
  categoryName: string;
  taskCount: number;
  completedCount: number;
  totalAmount: number;
  avgBudget: number;
}

export interface HeatmapData {
  date: string;
  count: number;
}

export interface TaskPublishResult {
  taskId: string;
  taskNo: string;
  submittedAt: string;
  auditStatus: 'pending' | 'approved' | 'rejected';
  estimatedAuditTime: string;
  trackingUrl: string;
}

export interface MatchResult {
  provider: Provider;
  matchScore: number;
  matchReasons: string[];
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PageParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface TaskFilterParams extends PageParams {
  category?: TaskCategory;
  status?: TaskStatus;
  budgetMin?: number;
  budgetMax?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProviderFilterParams extends PageParams {
  category?: TaskCategory;
  skills?: string[];
  minRating?: number;
  level?: number;
  location?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LoginParams {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  company?: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

export interface KanbanColumn {
  key: TaskStatus;
  title: string;
  tasks: Task[];
}
