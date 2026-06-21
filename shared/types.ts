export type UserRole = 'employer' | 'jobseeker' | 'admin';

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  ownerId: string;
  name: string;
  licenseNo: string;
  legalPerson: string;
  address: string;
  industry: string;
  employeeCount: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
}

export type VerificationStatus = 'pending_ocr' | 'ocr_done' | 'scanning' | 'risk_detected' | 'pending_review' | 'approved' | 'rejected';

export interface VerificationRecord {
  id: string;
  companyId: string;
  status: VerificationStatus;
  ocrData?: OCRResult;
  riskData?: RiskScanResult;
  submittedAt: string;
}

export interface OCRResult {
  companyName: string;
  licenseNo: string;
  legalPerson: string;
  registeredCapital: string;
  establishmentDate: string;
  businessScope: string;
  confidence: number;
}

export interface RiskScanResult {
  level: 'none' | 'low' | 'medium' | 'high';
  lawsuitCount: number;
  executionCount: number;
  dishonestCount: number;
  administrativePenaltyCount: number;
  details: RiskItem[];
}

export interface RiskItem {
  type: string;
  title: string;
  date: string;
  amount?: string;
  status: string;
}

export type IndustryType = 'restaurant' | 'retail' | 'housekeeping' | 'logistics' | 'security' | 'other';

export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  industry: IndustryType;
  salaryMin: number;
  salaryMax: number;
  salaryType: 'hourly' | 'daily' | 'monthly';
  location: string;
  longitude: number;
  latitude: number;
  workHours: WorkHours[];
  description: string;
  requirements: string[];
  benefits: string[];
  status: 'draft' | 'published' | 'offline';
  reviewStatus: 'pending' | 'approved' | 'rejected';
  tags: string[];
  channel?: string;
  createdAt: string;
}

export interface WorkHours {
  day: number;
  startTime: string;
  endTime: string;
}

export interface Resume {
  id: string;
  userId: string;
  isDesensitized: boolean;
  basicInfo: BasicInfo;
  workExperience: WorkExperience[];
  certificates: Certificate[];
  preferences: JobPreferences;
  skillTags: SkillTag[];
  updatedAt: string;
}

export interface BasicInfo {
  name: string;
  phone: string;
  idCard?: string;
  gender?: 'male' | 'female';
  age?: number;
  education?: string;
  location?: string;
  avatar?: string;
}

export interface WorkExperience {
  id: string;
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  imageUrl?: string;
}

export interface JobPreferences {
  industries: string[];
  salaryMin?: number;
  salaryMax?: number;
  commuteRadius: number;
  workHours: WorkHours[];
  tags: string[];
}

export interface SkillTag {
  id: string;
  name: string;
  category: string;
}

export type ApplicationStatus = 'applied' | 'viewed' | 'interviewing' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  resumeId: string;
  status: ApplicationStatus;
  viewedAt?: string;
  appliedAt: string;
  job?: Job;
  userName?: string;
  userPhone?: string;
}

export type InterviewStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed' | 'cancelled';

export interface Interview {
  id: string;
  applicationId: string;
  companyId: string;
  companyName: string;
  userId: string;
  userName: string;
  scheduledAt: string;
  location: string;
  contactPerson: string;
  contactPhone: string;
  ttlHours: number;
  status: InterviewStatus;
  respondedAt?: string;
  notes?: string;
  jobTitle?: string;
}

export interface Authorization {
  id: string;
  userId: string;
  employerId: string;
  employerName: string;
  scope: string[];
  grantedAt: string;
  revokedAt?: string;
  blockchainHash: string;
}

export type ContractStatus = 'draft' | 'pending_sign' | 'signed' | 'terminated';
export type FilingStatus = 'not_filed' | 'filing' | 'filed' | 'failed';

export interface Contract {
  id: string;
  companyId: string;
  userId: string;
  templateId: string;
  templateName: string;
  content: string;
  status: ContractStatus;
  filingStatus: FilingStatus;
  signedAt?: string;
  filingAt?: string;
  createdAt: string;
  companyName?: string;
  userName?: string;
}

export interface SignRecord {
  id: string;
  contractId: string;
  signerRole: 'employer' | 'jobseeker';
  signerName: string;
  signature: string;
  blockchainHash: string;
  signedAt: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  industry: IndustryType;
  description: string;
  content: string;
  clauseCount: number;
}

export interface Dispute {
  id: string;
  contractId: string;
  complainantId: string;
  complainantRole: 'employer' | 'jobseeker';
  type: 'salary' | 'working_hours' | 'termination' | 'other';
  description: string;
  evidence: EvidenceItem[];
  status: 'submitted' | 'mediating' | 'resolved' | 'escalated';
  mediatorId?: string;
  createdAt: string;
  messages?: DisputeMessage[];
}

export interface DisputeMessage {
  id: string;
  senderRole: 'employer' | 'jobseeker' | 'mediator';
  senderName: string;
  content: string;
  createdAt: string;
}

export interface EvidenceItem {
  id: string;
  type: 'text' | 'image' | 'document' | 'chat';
  title: string;
  url?: string;
  content?: string;
}

export interface AnalyticsData {
  totalApplications: number;
  totalInterviews: number;
  totalHires: number;
  interviewRate: number;
  hireRate: number;
  channelData: ChannelMetric[];
  funnelData: FunnelStep[];
  trendData: TrendPoint[];
}

export interface ChannelMetric {
  channel: string;
  views: number;
  applications: number;
  interviews: number;
  hires: number;
  costPerHire: number;
}

export interface FunnelStep {
  step: string;
  count: number;
  rate: number;
}

export interface TrendPoint {
  date: string;
  applications: number;
  interviews: number;
  hires: number;
}

export interface MatchResult {
  jobId: string;
  job: Job;
  matchScore: number;
  matchReasons: string[];
}

export interface AdminReviewDashboard {
  pendingCompanyReviews: number;
  pendingJobReviews: number;
  approvedToday: number;
  rejectedToday: number;
  recentReviews: ReviewItem[];
}

export interface ReviewItem {
  id: string;
  type: 'company' | 'job';
  name: string;
  submittedAt: string;
  riskLevel?: 'none' | 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
}
