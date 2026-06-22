export type UserRole = 'homeowner' | 'designer' | 'admin';
export type DesignerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type ConstructionStage = 'planning' | 'demolition' | 'plumbing_electrical' | 'masonry_carpentry' | 'painting' | 'installation' | 'acceptance';
export type HouseType = 'apartment' | 'villa' | 'duplex' | 'loft' | 'townhouse';
export type TransactionStatus = 'pending' | 'deposit_paid' | 'in_progress' | 'stage_completed' | 'completed' | 'disputed' | 'cancelled';
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'rejected';
export type ReportType = 'spam' | 'inappropriate' | 'fraud' | 'copyright' | 'other';

export interface User {
  _id: string;
  username: string;
  email: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  nickname?: string;
  bio?: string;
  designerStatus?: DesignerStatus;
  serviceAreas?: string[];
  qualifications?: {
    licenseNumber?: string;
    certificationImages?: string[];
    verifiedAt?: string;
  };
  portfolio?: PortfolioItem[];
  statistics?: {
    completedProjects: number;
    rating: number;
    reviewCount: number;
  };
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioItem {
  title: string;
  description: string;
  images: string[];
  style?: string;
  houseType?: string;
  houseArea?: number;
  budgetRange?: { min: number; max: number };
}

export interface UserPreferences {
  styleTags: string[];
  budgetRange?: { min: number; max: number };
  materials: string[];
}

export interface BudgetItem {
  _id?: string;
  category: string;
  subCategory?: string;
  description: string;
  estimatedAmount: number;
  actualAmount?: number;
  date?: string;
  invoiceImage?: string;
}

export interface FloorPlan {
  image?: string;
  sketchupFile?: string;
  metadata?: {
    area?: number;
    rooms?: number;
    bathrooms?: number;
    floors?: number;
  };
}

export interface StageHistory {
  stage: ConstructionStage;
  startedAt: string;
  completedAt?: string;
  description?: string;
}

export interface AIAnalysis {
  style?: {
    primary: string;
    confidence: number;
    secondary?: string[];
  };
  materials?: Array<{
    name: string;
    category: string;
    location?: string;
    confidence: number;
  }>;
  brands?: Array<{
    name: string;
    product?: string;
    location?: string;
    confidence: number;
  }>;
  colors?: string[];
  spatialTags?: string[];
  analyzedAt: string;
}

export interface Diary {
  _id: string;
  userId: User | string;
  title: string;
  description: string;
  coverImage: string;
  images: string[];
  floorPlan?: FloorPlan;
  houseType: HouseType;
  houseArea: number;
  address?: {
    city: string;
    district?: string;
    detail?: string;
  };
  constructionStage: ConstructionStage;
  stageHistory: StageHistory[];
  budget: {
    totalEstimated: number;
    totalActual?: number;
    items: BudgetItem[];
  };
  aiAnalysis?: AIAnalysis;
  styleTags: string[];
  materialTags: string[];
  likes: string[];
  commentCount: number;
  comments: Comment[];
  views: number;
  shares: number;
  isPublished: boolean;
  isVerified?: boolean;
  matchedDesigners?: string[];
  createdAt: string;
  updatedAt: string;
  budgetProgress?: number;
}

export interface Comment {
  _id?: string;
  userId: User | string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface StagePayment {
  stageName: string;
  stageIndex: number;
  percentage: number;
  amount: number;
  status: 'pending' | 'released' | 'held';
  requestedAt?: string;
  confirmedByHomeownerAt?: string;
  releasedAt?: string;
  acceptanceReport?: {
    images: string[];
    description: string;
    signature?: {
      homeownerSignature?: string;
      designerSignature?: string;
      signedAt?: string;
    };
    rating?: number;
  };
}

export interface Transaction {
  _id: string;
  diaryId: Diary | string;
  homeownerId: User | string;
  designerId: User | string;
  projectName: string;
  totalAmount: number;
  depositAmount: number;
  depositStatus: 'pending' | 'held' | 'released' | 'refunded';
  depositPaidAt?: string;
  stages: StagePayment[];
  paymentMethod: 'alipay' | 'wechat' | 'bank_transfer';
  status: TransactionStatus;
  escrowAccount: string;
  dispute?: {
    reason: string;
    raisedBy: string;
    raisedAt: string;
    resolution?: string;
    resolvedAt?: string;
    status: 'open' | 'resolved' | 'escalated';
  };
  messages?: Array<{
    userId: string;
    content: string;
    timestamp: string;
    attachments?: string[];
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  _id: string;
  reporterId: string;
  targetType: 'diary' | 'comment' | 'user' | 'designer_portfolio' | 'transaction';
  targetId: string;
  targetUserId: string;
  reportType: ReportType;
  description: string;
  evidenceImages: string[];
  status: ReportStatus;
  createdAt: string;
}

export interface FilterResult {
  passed: boolean;
  originalContent: string;
  filteredContent: string;
  matchedWords: string[];
  matchedPatterns: string[];
  action: 'blocked' | 'censored' | 'flagged';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DesignerMatch {
  designer: User;
  matchScore: number;
  matchDetails: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
