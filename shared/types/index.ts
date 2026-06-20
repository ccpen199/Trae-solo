export type IndustryType = 'hotel' | 'restaurant' | 'beauty' | 'healthcare' | 'retail' | 'ecommerce';
export type UserRole = 'hr' | 'talent' | 'admin' | 'store_manager';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type ScheduleType = 'fixed' | 'flexible' | 'shift';
export type JobStatus = 'draft' | 'published' | 'closed';
export type SenderType = 'hr' | 'talent';
export type MessageType = 'text' | 'image' | 'interview_invite' | 'system';
export type InterviewStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'no_show';
export type EntityType = 'company' | 'talent' | 'job';
export type RiskLevel = 'low' | 'medium' | 'high';
export type TrendType = 'rising' | 'stable' | 'falling';

export interface SkillRadar {
  professional: number;
  communication: number;
  service: number;
  teamwork: number;
  stress: number;
  learning: number;
}

export interface SalaryStructure {
  base: number;
  performance: number;
  commission: number;
  benefits: string[];
  currency: string;
}

export interface Company {
  id: string;
  name: string;
  industry: IndustryType;
  contactPerson: string;
  phone: string;
  address: string;
  geoLat: number;
  geoLng: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyQualification {
  id: string;
  companyId: string;
  businessLicense: string;
  industryCertifications: string[];
  complianceScore: number;
  status: VerificationStatus;
  verifiedAt?: Date;
}

export interface JobDescription {
  id: string;
  companyId: string;
  company?: Company;
  title: string;
  industry: IndustryType;
  description: string;
  skillRadar: SkillRadar;
  scheduleFlexibility: ScheduleType;
  salary: SalaryStructure;
  location: string;
  geoLat: number;
  geoLng: number;
  requirements: string[];
  benefits: string[];
  matchScore?: number;
  createdAt: Date;
  status: JobStatus;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expireDate?: Date;
  verified: boolean;
}

export interface TalentProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  avatar: string;
  certificates: Certificate[];
  experienceYears: number;
  serviceScenarios: string[];
  scenarioFitScore: number;
  videoResumeUrl: string;
  skillRadar: SkillRadar;
  preferredIndustries: IndustryType[];
  expectedSalary: number;
  currentLocation: string;
  geoLat: number;
  geoLng: number;
  tags: string[];
  matchScore?: number;
}

export interface PromotionPath {
  id: string;
  from: string;
  to: string;
  avgYears: number;
  requiredSkills: string[];
}

export interface KnowledgeGraph {
  id: string;
  industry: IndustryType;
  jobTitle: string;
  requiredSkills: string[];
  recommendedCourses: string[];
  promotionPaths: PromotionPath[];
}

export interface MatchResult {
  jobId: string;
  talentId: string;
  talent?: TalentProfile;
  job?: JobDescription;
  overallScore: number;
  skillMatch: number;
  experienceMatch: number;
  locationMatch: number;
  salaryMatch: number;
  scenarioMatch: number;
  reasons: string[];
  matchedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: SenderType;
  content: string;
  type: MessageType;
  encrypted: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface ChatSession {
  id: string;
  jobId: string;
  job?: JobDescription;
  talentId: string;
  talent?: TalentProfile;
  hrId: string;
  hrName?: string;
  encryptionEnabled: boolean;
  lastMessage?: ChatMessage;
  lastMessageAt?: Date;
  unreadCount?: number;
  createdAt: Date;
}

export interface InterviewInvite {
  id: string;
  sessionId: string;
  jobId: string;
  talentId: string;
  hrId: string;
  interviewTime: Date;
  location: string;
  notes: string;
  status: InterviewStatus;
  createdAt: Date;
}

export interface ChannelFunnel {
  channel: string;
  views: number;
  applications: number;
  interviews: number;
  hires: number;
}

export interface RecruitmentMetrics {
  avgFillDays: number;
  channelFunnel: ChannelFunnel[];
  retentionRate: number;
  costPerHire: number;
  timeToHireByRole: Record<string, number>;
}

export interface RiskScore {
  id: string;
  entityId: string;
  entityType: EntityType;
  riskLevel: RiskLevel;
  riskFactors: string[];
  overallScore: number;
  evaluatedAt: Date;
}

export interface RegionalLaborData {
  id: string;
  region: string;
  regionCode: string;
  industry: IndustryType;
  demandCount: number;
  supplyCount: number;
  gapRatio: number;
  avgSalary: number;
  heatIndex: number;
  trend: TrendType;
  dataDate: Date;
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  companyId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginResult {
  user: User;
  token: string;
}

export type AuthErrorCode = 
  | 'USER_NOT_FOUND'
  | 'INVALID_PASSWORD'
  | 'ROLE_MISMATCH'
  | 'ACCOUNT_LOCKED'
  | 'NETWORK_ERROR';

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(message: string, code: AuthErrorCode) {
    super(message);
    this.code = code;
    this.name = 'AuthError';
  }
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface IndustryInfo {
  key: IndustryType;
  label: string;
  icon: string;
  color: string;
}

export const INDUSTRY_LIST: IndustryInfo[] = [
  { key: 'hotel', label: '酒店', icon: 'building', color: '#1E3A5F' },
  { key: 'restaurant', label: '餐饮', icon: 'utensils', color: '#FF6B6B' },
  { key: 'beauty', label: '美业', icon: 'sparkles', color: '#4ECDC4' },
  { key: 'healthcare', label: '康养', icon: 'heart', color: '#FF6B6B' },
  { key: 'retail', label: '零售', icon: 'shopping-bag', color: '#1E3A5F' },
  { key: 'ecommerce', label: '电商', icon: 'globe', color: '#4ECDC4' },
];

export const SCHEDULE_OPTIONS = [
  { value: 'fixed', label: '固定班制' },
  { value: 'flexible', label: '弹性工作' },
  { value: 'shift', label: '轮班制' },
];

export const SKILL_DIMENSIONS = [
  { key: 'professional', label: '专业技能' },
  { key: 'communication', label: '沟通能力' },
  { key: 'service', label: '服务意识' },
  { key: 'teamwork', label: '团队协作' },
  { key: 'stress', label: '抗压能力' },
  { key: 'learning', label: '学习能力' },
];
