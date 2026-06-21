export type UserRole = 'owner' | 'designer' | 'contractor' | 'supplier' | 'admin';
export type CreditLevel = 'S' | 'A' | 'B' | 'C' | 'D';

export interface RadarData {
  subject: string;
  score: number;
  fullMark: number;
}
export type DecorationStyle = 'modern' | 'european' | 'chinese' | 'minimalist' | 'industrial';
export type MaterialPreference = 'budget' | 'mid-range' | 'premium' | 'luxury';
export type MilestoneStatus = 'pending' | 'in-progress' | 'completed' | 'delayed';
export type DisputeStatus = 'submitted' | 'evidence-collecting' | 'evaluating' | 'mediating' | 'resolved' | 'closed';
export type EvidenceType = 'contract' | 'photo' | 'video' | 'chat' | 'invoice' | 'other';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  avatar: string;
  phone: string;
  creditScore: number;
  creditLevel: CreditLevel;
}

export interface AIQuoteRequest {
  id: string;
  ownerId: string;
  floorPlanImage: string;
  area: number;
  rooms: number;
  style: DecorationStyle;
  materialPreference: MaterialPreference;
  createdAt: Date;
}

export interface QuoteItem {
  category: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AIQuoteResult {
  id: string;
  requestId: string;
  totalPrice: number;
  breakdown: {
    labor: number;
    auxiliaryMaterials: number;
    mainMaterials: number;
    managementFee: number;
    designFee: number;
  };
  itemizedQuotes: QuoteItem[];
  generatedAt: Date;
}

export interface ProjectCase {
  id: string;
  title: string;
  images: string[];
  area: number;
  budget: number;
  style: string;
  ownerRating: number;
}

export interface Designer {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  specializations: string[];
  completedProjects: number;
  averageRating: number;
  complaintRate: number;
  yearsExperience: number;
  radarScores: {
    designAbility: number;
    communication: number;
    costControl: number;
    scheduleAdherence: number;
    afterSales: number;
  };
  portfolio: ProjectCase[];
}

export interface Milestone {
  id: string;
  name: string;
  order: number;
  plannedDate: Date;
  actualDate?: Date;
  status: MilestoneStatus;
  photos: string[];
  videos: string[];
}

export interface CheckInRecord {
  id: string;
  milestoneId: string;
  contractorId: string;
  timestamp: Date;
  location: { lat: number; lng: number };
  photos: string[];
  notes: string;
}

export interface ConstructionProject {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  designerId: string;
  contractorId: string;
  totalBudget: number;
  startDate: Date;
  estimatedEndDate: Date;
  progress: number;
  milestones: Milestone[];
  checkIns: CheckInRecord[];
}

export interface AuthorizationDoc {
  id: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  certificateUrl: string;
  verified: boolean;
}

export interface QualityReport {
  id: string;
  batchNumber: string;
  testDate: Date;
  testItems: { name: string; result: string; standard: string }[];
  reportUrl: string;
}

export interface LogisticsRecord {
  id: string;
  timestamp: Date;
  location: string;
  status: string;
  operator: string;
}

export interface MaterialProduct {
  id: string;
  supplierId: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image: string;
  traceCode: string;
  brandAuthorization: AuthorizationDoc;
  qualityReports: QualityReport[];
  logistics: LogisticsRecord[];
}

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  title: string;
  url: string;
  uploaderId: string;
  uploadedAt: Date;
  hash: string;
}

export interface CompensationRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  calculationFormula: string;
  maxAmount: number;
}

export interface DisputeCase {
  id: string;
  projectId: string;
  projectName: string;
  plaintiffId: string;
  plaintiffName: string;
  defendantId: string;
  defendantName: string;
  type: string;
  description: string;
  status: DisputeStatus;
  evidenceChain: EvidenceItem[];
  thirdPartyEvaluator?: string;
  compensationAmount?: number;
  ruling?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalQuotes: number;
  avgQuoteAmount: number;
  disputeCount: number;
  resolutionRate: number;
  creditTrend: { date: string; score: number }[];
  monthlyQuotes: { month: string; count: number; amount: number }[];
}

export interface CreditHistory {
  id: string;
  userId: string;
  type: 'increase' | 'decrease';
  amount: number;
  reason: string;
  timestamp: Date;
}
