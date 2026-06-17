export type TaskType = "media" | "survey" | "experience";
export type TaskStatus = "draft" | "active" | "paused" | "completed" | "closed";

export type SubmissionStatus =
  | "pending"
  | "ai_passed"
  | "ai_flagged"
  | "manual_passed"
  | "manual_rejected"
  | "disputed"
  | "arbitrated";

export type TransactionType = "reward" | "withdrawal" | "tax" | "refund" | "deposit";
export type UserRole = "enterprise" | "executor" | "admin";

export type RiskAlertType =
  | "device_cluster"
  | "abnormal_rate"
  | "duplicate_submission"
  | "suspicious_behavior"
  | "ip_violation";

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export interface Enterprise {
  id: string;
  name: string;
  email: string;
  licenseNo: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  balance: number;
  totalBudget: number;
  completedTasks: number;
  avatar?: string;
  createdAt: string;
  industry: string;
  contactPerson: string;
  contactPhone: string;
}

export interface Executor {
  id: string;
  name: string;
  phone: string;
  idCard: string;
  deviceFingerprint: string;
  totalEarnings: number;
  availableBalance: number;
  frozenBalance: number;
  bankAccount?: string;
  bankType?: string;
  realNameVerified: boolean;
  creditScore: number;
  completedTasks: number;
  avatar?: string;
  region: string;
  age: number;
  gender: "male" | "female";
  registeredAt: string;
}

export interface Task {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  title: string;
  description: string;
  type: TaskType;
  reward: number;
  originalReward: number;
  difficulty: number;
  completionRate: number;
  quota: number;
  completed: number;
  status: TaskStatus;
  estimatedTime: number;
  targetDemographic: {
    ageRange: [number, number];
    regions: string[];
  };
  createdAt: string;
  deadline: string;
  views: number;
  clicks: number;
  conversionRate: number;
  riskConfig: {
    ipDeduplication: boolean;
    deviceFingerprintCheck: boolean;
    logicValidation: boolean;
    antiCheating: boolean;
  };
  executorQualification: {
    minCreditScore: number;
    requireRealName: boolean;
    allowedRegions?: string[];
    blockedDeviceIds?: string[];
  };
  reviewChain: {
    aiReview: boolean;
    manualSamplingRate: number;
    allowDispute: boolean;
  };
  pricingHistory: PricingAdjustmentRecord[];
  budgetLimit: number;
  mediaConfig?: {
    videoUrl: string;
    requiredDuration: number;
    allowSkip: boolean;
  };
  surveyConfig?: {
    questions: SurveyQuestion[];
    logicRules: SurveyLogicRule[];
  };
  experienceConfig?: {
    productName: string;
    requireOcr: boolean;
    requireFeedback: boolean;
    feedbackMinLength: number;
    minPhotos: number;
  };
}

export interface PricingAdjustmentRecord {
  id: string;
  timestamp: string;
  reason: string;
  oldReward: number;
  newReward: number;
  triggeredBy: "system" | "manual";
  completionRateAtTime: number;
  budgetImpact: number;
  roiImpact: number;
}

export interface ReviewFlowRecord {
  id: string;
  submissionId: string;
  stage: "ai_review" | "manual_review" | "dispute_arbitration";
  action: "pass" | "reject" | "flag" | "escalate";
  operator: string;
  timestamp: string;
  notes?: string;
  previousStage?: string;
  nextStage?: string;
}

export interface SurveyQuestion {
  id: string;
  type: "single" | "multiple" | "text" | "rating" | "scale";
  title: string;
  options?: string[];
  required: boolean;
  logicTarget?: string;
}

export interface SurveyLogicRule {
  questionId: string;
  condition: string;
  targetQuestion: string;
  action: "skip" | "show";
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  taskType: TaskType;
  executorId: string;
  executorName: string;
  executorAvatar?: string;
  status: SubmissionStatus;
  aiScore: number;
  aiFlags: string[];
  reviewNotes?: string;
  evidence: SubmissionEvidence;
  submittedAt: string;
  reviewedAt?: string;
  rewardAmount: number;
  reviewFlow: ReviewFlowRecord[];
  riskChecks: {
    ipDuplicate: boolean;
    deviceFingerprintDuplicate: boolean;
    logicValidationPassed: boolean;
    antiCheatingPassed: boolean;
  };
  deviceInfo: {
    deviceFingerprint: string;
    ip: string;
    browser: string;
    os: string;
    screenSize: string;
  };
}

export interface SubmissionEvidence {
  media?: {
    watchDuration: number;
    hasRedirected: boolean;
    completionTimestamp: number;
  };
  survey?: {
    answers: Record<string, string | string[]>;
    duration: number;
    consistencyScore: number;
  };
  experience?: {
    ocrResult?: string;
    ocrConfidence?: number;
    feedbackText: string;
    photos: string[];
  };
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userType: "enterprise" | "executor";
  type: TransactionType;
  amount: number;
  status: "pending" | "completed" | "failed" | "processing";
  description: string;
  relatedTaskId?: string;
  relatedSubmissionId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface RiskAlert {
  id: string;
  type: RiskAlertType;
  severity: RiskSeverity;
  title: string;
  description: string;
  affectedEntities: string[];
  affectedCount: number;
  detectedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  metrics?: Record<string, number>;
  batchNumber?: string;
  processingStatus?: "unprocessed" | "processing" | "processed";
}

export interface PricingRule {
  baseReward: number;
  difficultyMultiplier: number;
  completionRateThreshold: number;
  boostPercentage: number;
  maxReward: number;
  minReward: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  type: TaskType;
  description: string;
  icon: string;
  usageCount: number;
  defaultConfig: Record<string, unknown>;
}

export interface PlatformStats {
  totalUsers: number;
  totalEnterprises: number;
  totalTasks: number;
  totalSubmissions: number;
  totalRewardsDistributed: number;
  todayActiveUsers: number;
  avgCompletionRate: number;
  avgPayoutTime: number;
}

export interface CompletionRateDataPoint {
  date: string;
  rate: number;
  target: number;
}

export interface ROIDataPoint {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
}

export interface DeviceClusterPoint {
  x: number;
  y: number;
  count: number;
  clusterId: string;
  riskLevel: RiskSeverity;
}

export interface UserAgeDistribution {
  range: string;
  count: number;
  gender: "male" | "female";
}

export interface WithdrawalLimit {
  dailyLimit: number;
  todayWithdrawn: number;
  remainingLimit: number;
  minWithdrawal: number;
  taxRate: number;
}
