export type UserRole = 'enterprise' | 'applicant' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  phone: string;
  name: string;
}

export interface EnterpriseCertification {
  id: string;
  enterpriseId: string;
  companyName: string;
  creditCode: string;
  legalPerson: string;
  legalPersonPhone: string;
  licenseImageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  createdAt: string;
}

export type EmploymentType = 'fulltime' | 'parttime' | 'project';
export type JobStatus = 'active' | 'closed' | 'draft';

export interface Job {
  id: string;
  enterpriseId: string;
  title: string;
  jd: string;
  salaryMin: number;
  salaryMax: number;
  arrivalTime: string;
  employmentType: EmploymentType;
  location: string;
  status: JobStatus;
  closeReason?: string;
  applicationsCount: number;
  createdAt: string;
}

export interface Resume {
  id: string;
  name: string;
  phone: string;
  email: string;
  skills: string[];
  experience: string;
  education: string;
  matchScore: number;
  matchedKeywords: string[];
  skillRadar: { axis: string; value: number }[];
  avatar?: string;
}

export type InterviewFormat = 'onsite' | 'video' | 'phone';
export type InterviewStatus = 'pending' | 'confirmed' | 'rejected' | 'expired' | 'completed';
export type InterviewRound = 'first' | 'second' | 'final';

export interface InterviewRoundDetail {
  round: InterviewRound;
  score: number;
  feedback: string;
  attribution: string[];
  completedAt?: string;
}

export interface Interview {
  id: string;
  jobId: string;
  resumeId: string;
  resumeName: string;
  enterpriseId: string;
  jobTitle: string;
  scheduledTime: string;
  format: InterviewFormat;
  status: InterviewStatus;
  smsReminderSent: boolean;
  currentRound: InterviewRound;
  rounds: InterviewRoundDetail[];
  note?: string;
}

export interface EnterpriseReview {
  id: string;
  enterpriseId: string;
  rating: number;
  content: string;
  anonymousName: string;
  createdAt: string;
}

export interface EnterpriseProfile {
  id: string;
  name: string;
  certified: boolean;
  responseRate: number;
  avgResponseTime: string;
  reviews: EnterpriseReview[];
  description: string;
  industry: string;
  size: string;
  logo?: string;
}

export type BlacklistType = 'enterprise' | 'individual';
export type BlacklistReason = 'black_agency' | 'fraud' | 'other';

export interface BlacklistEntry {
  id: string;
  type: BlacklistType;
  name: string;
  phone?: string;
  reason: BlacklistReason;
  description: string;
  createdAt: string;
}

export type RiskLevel = 'high' | 'medium' | 'low';
export type FraudAlertStatus = 'pending' | 'reviewed' | 'dismissed';

export interface FraudAlert {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  salaryDeviation: number;
  addressFuzzyScore: number;
  riskLevel: RiskLevel;
  status: FraudAlertStatus;
  createdAt: string;
  reviewedAt?: string;
}

export interface DashboardData {
  avgRecruitmentCycle: { month: string; days: number; industryAvg: number }[];
  jobCloseReasons: { reason: string; count: number; color: string }[];
  regionHeatmap: {
    region: string;
    demand: number;
    supply: number;
    ratio: number;
    path: string;
    x: number;
    y: number;
  }[];
}
