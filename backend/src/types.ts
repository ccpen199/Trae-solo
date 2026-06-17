export interface Task {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  title: string;
  description: string;
  type: "media" | "survey" | "experience";
  reward: number;
  originalReward: number;
  difficulty: number;
  completionRate: number;
  quota: number;
  completed: number;
  status: "draft" | "active" | "paused" | "completed" | "closed";
  estimatedTime: number;
  targetDemographic: { ageRange: [number, number]; regions: string[] };
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
    questions: any[];
    logicRules: any[];
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

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  taskType: "media" | "survey" | "experience";
  executorId: string;
  executorName: string;
  executorAvatar?: string;
  status: "pending" | "ai_passed" | "ai_flagged" | "manual_passed" | "manual_rejected" | "disputed" | "arbitrated";
  aiScore: number;
  aiFlags: string[];
  reviewNotes?: string;
  evidence: any;
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

export interface RiskAlert {
  id: string;
  type: "device_cluster" | "abnormal_rate" | "duplicate_submission" | "suspicious_behavior";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  affectedEntities: string[];
  detectedAt: string;
  resolved: boolean;
  batchNumber: string;
  processingStatus: "unprocessed" | "processing" | "processed";
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: "reward" | "withdrawal" | "tax" | "refund";
  amount: number;
  status: "pending" | "completed" | "failed";
  description: string;
  createdAt: string;
}

export interface Enterprise {
  id: string;
  name: string;
  email: string;
  licenseNo: string;
  industry: string;
  contactPerson: string;
  contactPhone: string;
  status: "verified" | "pending" | "rejected";
  balance: number;
  totalBudget: number;
  taskCount: number;
  createdAt: string;
}

export interface Executor {
  id: string;
  name: string;
  phone: string;
  realNameVerified: boolean;
  creditScore: number;
  totalEarnings: number;
  availableBalance: number;
  frozenBalance: number;
  bankAccount: string;
  bankType: string;
  taskCount: number;
  passRate: number;
  deviceFingerprint: string;
  createdAt: string;
}
