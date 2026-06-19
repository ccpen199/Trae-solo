export type UserRole = 'worker' | 'union_admin' | 'provincial_admin' | 'lawyer';

export type MemberStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: number;
  idCard: string;
  name: string;
  phone: string;
  role: UserRole;
  memberStatus: MemberStatus;
  createdAt: string;
}

export interface LoginRequest {
  idCard: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  idCard: string;
  name: string;
  phone: string;
  password: string;
}

export type MembershipStatus =
  | 'draft'
  | 'police_verify'
  | 'social_verify'
  | 'union_review'
  | 'provincial_review'
  | 'approved'
  | 'rejected';

export interface MembershipApplyRequest {
  personalInfo: {
    name: string;
    idCard: string;
    gender: 'male' | 'female';
    birthDate: string;
    ethnicity: string;
    education: string;
  };
  workInfo: {
    companyName: string;
    jobTitle: string;
    workYears: number;
    socialSecurityMonths: number;
  };
  unionId: number;
}

export interface PoliceVerifyResponse {
  verified: boolean;
  nameMatch: boolean;
}

export interface SocialVerifyResponse {
  verified: boolean;
  contributionMonths: number;
  lastContributionDate: string;
}

export interface ApprovalHistory {
  step: string;
  status: string;
  date: string;
  remark?: string;
}

export interface MembershipStatusResponse {
  status: MembershipStatus;
  currentStep: number;
  totalSteps: number;
  approvalHistory: ApprovalHistory[];
}

export type CaseType = 'labor' | 'civil' | 'criminal' | 'other';
export type CaseStatus = 'pending' | 'matched' | 'processing' | 'closed';

export interface LegalAidApplyRequest {
  caseType: CaseType;
  caseTitle: string;
  caseDescription: string;
  evidenceIds: string[];
}

export interface Lawyer {
  id: number;
  name: string;
  avatar: string;
  specialty: string[];
  experienceYears: number;
  caseCount: number;
  rating: number;
}

export interface LawyerMatchResponse {
  lawyers: Lawyer[];
}

export interface LegalCase {
  id: number;
  title: string;
  type: string;
  status: CaseStatus;
  lawyerName?: string;
  createDate: string;
}

export interface CaseListResponse {
  cases: LegalCase[];
}

export type AssistanceType = 'minimum_allowance' | 'disability' | 'serious_illness' | 'disaster' | 'other';
export type AssistanceStatus =
  | 'draft'
  | 'auto_review'
  | 'manual_review'
  | 'union_approved'
  | 'provincial_approved'
  | 'funded'
  | 'rejected';

export interface AssistanceApplyRequest {
  assistanceType: AssistanceType;
  familyIncome: number;
  familyMemberCount: number;
  description: string;
  documentIds: string[];
}

export interface AutoReviewCheck {
  type: 'minimum_allowance' | 'disability' | 'serious_illness';
  matched: boolean;
  details?: string;
}

export interface AutoReviewResponse {
  passed: boolean;
  score: number;
  checks: AutoReviewCheck[];
  needManualReview: boolean;
}

export interface AuditTrail {
  action: string;
  operator: string;
  date: string;
  remark: string;
}

export interface AssistanceStatusResponse {
  status: AssistanceStatus;
  fundAmount?: number;
  fundDate?: string;
  auditTrail: AuditTrail[];
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Course {
  id: number;
  title: string;
  category: string;
  coverImage: string;
  totalHours: number;
  skillLevel: SkillLevel;
  progress?: number;
}

export interface CourseListResponse {
  courses: Course[];
}

export interface StudyProgressRequest {
  courseId: number;
  chapterId: number;
  studySeconds: number;
  completed: boolean;
}

export interface Certificate {
  id: number;
  courseName: string;
  totalHours: number;
  issueDate: string;
  certificateNumber: string;
}

export interface CertificateResponse {
  certificates: Certificate[];
}

export interface DatingProfile {
  id: number;
  maskedLabel: string;
  ageRange: string;
  city: string;
  occupation: string;
  tags: string[];
  compatibilityScore: number;
}

export interface DatingProfileResponse {
  profiles: DatingProfile[];
}

export interface MaskedProfile {
  maskedLabel: string;
  ageRange: string;
  city: string;
  occupation: string;
  heightRange: string;
  tags: string[];
  hobbies: string[];
}

export type EmotionType = 'positive' | 'neutral' | 'negative' | 'crisis';

export interface ChatMessage {
  message: string;
  sessionId: string;
}

export interface ChatResponse {
  reply: string;
  emotion: EmotionType;
  emotionScore: number;
  crisisDetected: boolean;
  crisisKeywords: string[];
  transferredToHuman: boolean;
}

export interface EmotionTrend {
  time: string;
  emotion: string;
  score: number;
}

export interface PsychologyReport {
  sessionId: string;
  duration: number;
  emotionTrend: EmotionTrend[];
  mainConcerns: string[];
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  supplier: string;
  supplyBase: string;
  stock: number;
}

export interface ProductListResponse {
  products: Product[];
}

export interface SupplyChainStage {
  stage: string;
  location: string;
  operator: string;
  date: string;
  description: string;
}

export interface SupplyChainResponse {
  productId: number;
  supplyChain: SupplyChainStage[];
}

export type OrgType = 'provincial' | 'city' | 'district' | 'enterprise';

export interface OrgChartNode {
  id: number;
  name: string;
  type: OrgType;
  memberCount: number;
  coverageRate: number;
  children?: OrgChartNode[];
}

export interface OrgChartResponse {
  root: OrgChartNode;
}

export interface SentimentCategories {
  complaint: number;
  suggestion: number;
  praise: number;
}

export interface TrendDataPoint {
  date: string;
  complaint: number;
  suggestion: number;
  praise: number;
}

export interface SentimentAnalysisResponse {
  period: string;
  totalCount: number;
  categories: SentimentCategories;
  trendData: TrendDataPoint[];
}

export type FundStatus = 'pending' | 'approved' | 'released' | 'received';

export interface FundFlow {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string;
  purpose: string;
  status: FundStatus;
}

export interface AuditLog {
  fundId: string;
  action: string;
  operator: string;
  timestamp: string;
  details: string;
}

export interface FundAuditResponse {
  totalFund: number;
  totalProjects: number;
  fundFlow: FundFlow[];
  auditTrail: AuditLog[];
}

export interface UnionOrganization {
  id: number;
  name: string;
  type: OrgType;
  parentId: number | null;
  memberCount: number;
  totalEmployees: number;
  coverageRate: number;
}
