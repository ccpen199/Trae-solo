export interface SkillCategory {
  id: string;
  name: string;
  icon: string;
}

export type SkillCertStatus = 'verified' | 'pending' | 'expired';

export interface SkillCert {
  categoryId: string;
  categoryName: string;
  certName: string;
  certNo: string;
  issueDate: string;
  expiryDate: string;
  status: SkillCertStatus;
  ocrResult?: OCRCertData;
  imageUrl?: string;
}

export interface OCRCertData {
  name: string;
  certType: string;
  certNo: string;
  issueOrg: string;
  issueDate: string;
  expiryDate: string;
  confidence: number;
}

export type WorkerStatus = 'online' | 'busy' | 'offline';

export interface Worker {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  skills: SkillCert[];
  rating: number;
  orderCount: number;
  location: { lat: number; lng: number };
  status: WorkerStatus;
  distanceKm?: number;
  matchScore?: number;
  bio?: string;
}

export interface FaultType {
  id: string;
  name: string;
  icon: string;
  children?: FaultType[];
  skillCategoryId: string;
}

export interface PartItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
}

export interface LaborRate {
  city: string;
  baseRate: number;
  tierRates: { tier: string; multiplier: number }[];
}

export type OrderStatus =
  | 'pending'
  | 'matched'
  | 'quoted'
  | 'paid'
  | 'in_service'
  | 'completed'
  | 'reviewed';

export interface QuotePart {
  partId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Quote {
  parts: QuotePart[];
  laborHours: number;
  laborRate: number;
  cityBaseRate: number;
  totalParts: number;
  totalLabor: number;
  platformFee: number;
  totalAmount: number;
}

export interface CheckIn {
  id: string;
  time: string;
  type: 'gps' | 'face' | 'complete';
  location: { lat: number; lng: number; accuracy: number };
  photo?: string;
  verified: boolean;
}

export interface ProcessPhoto {
  id: string;
  step: string;
  stepIndex: number;
  isRequired: boolean;
  isHiddenWork: boolean;
  photoUrl?: string;
  timestamp?: string;
  description: string;
}

export interface Review {
  rating: number;
  comment: string;
  keywords: string[];
  createdAt: string;
}

export interface Order {
  id: string;
  homeownerName: string;
  homeownerPhone: string;
  homeownerAddress: string;
  location: { lat: number; lng: number };
  workerId: string | null;
  workerName?: string;
  faultTypeId: string;
  faultTypeName: string;
  faultCategory: string[];
  description: string;
  faultPhotos: string[];
  status: OrderStatus;
  quote?: Quote;
  checkIns: CheckIn[];
  processPhotos: ProcessPhoto[];
  review?: Review;
  createdAt: string;
  serviceTime?: string;
}

export type EscrowStatus = 'frozen' | 'released' | 'refunded';

export interface EscrowRecord {
  id: string;
  orderId: string;
  amount: number;
  status: EscrowStatus;
  frozenAt: string;
  releaseAt: string | null;
  homeownerName: string;
  workerName: string;
  faultTypeName: string;
}

export type QualityIssueSeverity = 'low' | 'medium' | 'high';
export type QualityIssueStatus = 'open' | 'investigating' | 'resolved';

export interface QualityIssue {
  id: string;
  orderId: string;
  workerId: string;
  workerName: string;
  keywords: string[];
  severity: QualityIssueSeverity;
  status: QualityIssueStatus;
  reviewComment: string;
  reviewRating: number;
  createdAt: string;
  assignee?: string;
}

export interface DashboardStats {
  todayOrders: number;
  completedOrders: number;
  completionRate: number;
  avgResponseTime: number;
  badReviewRate: number;
  onlineWorkers: number;
  activeOrders: number;
  escrowAmount: number;
}

export interface BadKeyword {
  word: string;
  count: number;
}
