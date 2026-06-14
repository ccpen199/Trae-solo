export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "hr" | "hiring_manager" | "interviewer";
  department?: string;
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export type SyncStatus = "synced" | "syncing" | "failed" | "pending";

export interface PublishChannelStatus {
  channel: string;
  status: SyncStatus;
  syncedAt?: string;
  error?: string;
  postUrl?: string;
}

export interface Position {
  id: number;
  title: string;
  department: string;
  jobType?: string;
  location?: string;
  workLocation?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  headcount: number;
  hiredCount: number;
  salaryMin?: number;
  salaryMax?: number;
  experienceMin?: number;
  experienceMax?: number;
  experienceRequired?: number;
  education?: string;
  employmentType?: string;
  status: "draft" | "pending_approval" | "approved" | "published" | "closed" | "cancelled";
  keywords?: string[];
  publishChannels?: string[];
  publishStatus?: Record<string, PublishChannelStatus>;
  channels?: string[];
  skillTags?: string[];
  createdById: number;
  hrOwnerId?: number;
  hrOwner?: User;
  hiringManagerId?: number;
  hiringManager?: User;
  createdBy?: User;
  candidates?: Candidate[];
  closedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: number;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  age?: number;
  location?: string;
  education?: string;
  graduationSchool?: string;
  major?: string;
  yearsOfExperience?: number;
  currentCompany?: string;
  currentPosition?: string;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  stage: string;
  status: string;
  skillTags?: string[];
  aiScreeningResult?: AIScreeningResult;
  talentProfile?: any;
  positionId: number;
  position?: Position;
  resumeId?: number;
  resumes?: Resume[];
  interviews?: Interview[];
  approvals?: Approval[];
  source?: string;
  notes?: string;
  onboardingChecklist?: Array<{ item: string; completed: boolean; completedAt?: string }>;
  offerSentAt?: string;
  offerAcceptedAt?: string;
  onboardDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIScreeningResult {
  keywordMatchScore: number;
  experienceMatchScore: number;
  stabilityScore: number;
  overallScore: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  screenedAt: string;
  matchedKeywords?: Array<{ keyword: string; found: boolean; weight: number }>;
  experienceAnalysis?: {
    matchedRoles: string[];
    relevantYears: number;
    gap: string;
  };
  stabilityAnalysis?: {
    jobChanges: number;
    avgTenure: number;
    trend: string;
  };
}

export interface Resume {
  id: number;
  candidateId: number;
  candidate?: Candidate;
  fileName?: string;
  filePath?: string;
  fileSize: number;
  fileType?: string;
  parsedContent?: string;
  parsedData?: any;
  analysisResult?: any;
  isParsed: boolean;
  isAnalyzed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: number;
  candidateId: number;
  candidate?: Candidate;
  interviewerId: number;
  interviewer?: User;
  positionId: number;
  position?: Position;
  type: "phone" | "video" | "onsite";
  interviewType: "video" | "onsite" | "phone";
  round: "first" | "second" | "third" | "final" | "hr";
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  scheduledAt: string;
  duration: number;
  roomId?: string;
  meetingUrl?: string;
  interviewQuestions?: string;
  transcript?: string;
  transcriptData?: Array<{ timestamp: number; speaker: string; text: string; isFinal: boolean }>;
  behaviorMarkers?: Array<{ timestamp: number; marker: string; severity: string; notes?: string }>;
  evaluation?: InterviewEvaluation;
  recordingInfo?: any;
  sharedFiles?: string[];
  startedAt?: string;
  endedAt?: string;
  cancelledReason?: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewEvaluation {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  culturalFitScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: "strong_hire" | "hire" | "no_hire" | "pass";
  notes: string;
  evaluatedAt: string;
}

export interface Approval {
  id: number;
  type: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approverId: number;
  approver?: User;
  applicantId?: number;
  applicant?: User;
  candidateId?: number;
  candidate?: Candidate;
  positionId?: number;
  position?: Position;
  reason?: string;
  approvalComments?: string;
  approvalData?: any;
  approvalOrder: number;
  approvedAt?: string;
  rejectedAt?: string;
  nextApproverId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  id: number;
  name: string;
  size: number;
  type: string;
  isEncrypted: boolean;
}

export interface AuditResult {
  riskLevel: string;
  matchedKeywords: string[];
  notes?: string;
}

export interface IMMessage {
  id: number;
  senderId: number;
  sender?: User;
  receiverId: number;
  receiver?: User;
  type: "text" | "file" | "image" | "system";
  content?: string;
  decryptedContent?: string;
  fileInfo?: any;
  isRead: boolean;
  readAt?: string;
  isEncrypted: boolean;
  encryptionType?: string;
  auditStatus: "normal" | "pending" | "warning" | "violation";
  auditResult?: AuditResult;
  attachments?: MessageAttachment[];
  isAudited: boolean;
  auditInfo?: any;
  complianceCheck?: any;
  conversationId?: string;
  isDeleted: boolean;
  createdAt: string;
}

export interface TalentTag {
  id: number;
  name: string;
  category: string;
  description?: string;
  metadata?: any;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  action: string;
  userId?: number;
  userName?: string;
  targetId?: number;
  targetType?: string;
  oldValue?: any;
  newValue?: any;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  isSensitive: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalPositions: number;
  activePositions: number;
  totalCandidates: number;
  pendingScreening: number;
  interviewsToday: number;
  offersPending: number;
  hiredThisMonth: number;
  avgTimeToHire: number;
  conversionRate: number;
}

export interface FunnelStageData {
  stage: string;
  stageName: string;
  count: number;
  conversionRate: number;
  avgDurationDays: number;
}

export interface PositionHeatmapData {
  positionId: number;
  positionTitle: string;
  department: string;
  applicationCount: number;
  interviewCount: number;
  hireCount: number;
  heatScore: number;
}

export interface TalentTagStats {
  tagId: number;
  tagName: string;
  category: string;
  count: number;
  hireRate: number;
  avgSalary: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  [key: string]: any;
}
