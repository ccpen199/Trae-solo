export interface FormTemplateVersionDetail {
  id: string;
  templateCode: string;
  templateName: string;
  version: string;
  isActive: boolean;
  schema: any;
  uiConfig: any;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  changeLog: string;
}

export interface MaterialVersionDetail {
  id: string;
  materialName: string;
  materialType: string;
  version: string;
  isRequired: boolean;
  format: string;
  maxSize: number;
  description: string;
  sampleUrl: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export interface HandlingTimeLimitDetail {
  legalTimeLimit: number;
  legalTimeLimitUnit: string;
  committedTimeLimit: number;
  committedTimeLimitUnit: string;
  specialProcedureTimeLimit: number | null;
  specialProcedureDescription: string;
  timeLimitDescription: string;
}

export interface MaterialNecessityInfo {
  id: string;
  materialName: string;
  necessityType: 'REQUIRED' | 'TOLERABLE' | 'OPTIONAL';
  necessityLabel: string;
  isRequired: boolean;
  sampleUrl: string;
  formatDescription: string;
  blankFormDownloadUrl: string;
  fillInstructions: string;
  uploadRate: number;
  verificationPassRate: number;
  totalApplications: number;
  uploadedCount: number;
  verifiedCount: number;
}

export interface FormTemplateVersionChain {
  id: string;
  templateCode: string;
  templateName: string;
  version: string;
  isActive: boolean;
  statusLabel: string;
  schema: any;
  uiConfig: any;
  usageCount: number;
  changeLog: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceItemEnhancedDetail {
  basicInfo: {
    id: string;
    itemCode: string;
    itemName: string;
    itemAlias: string;
    category: string;
    subCategory: string;
    description: string;
    handlingDepartment: string;
    handlingAddress: string;
    handlingTimeLimit: number;
    timeLimitUnit: string;
    feeStandard: string;
    feeBasis: string;
    version: number;
    status: boolean;
    reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
    reviewedBy: string;
    reviewedAt: Date;
    reviewComment: string;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date;
  };
  handlingTimeLimitDetail: HandlingTimeLimitDetail;
  formTemplates: FormTemplateVersionDetail[];
  formTemplateVersions: FormTemplateVersionChain[];
  materialTemplates: MaterialVersionDetail[];
  materialsInfo: MaterialNecessityInfo[];
  reviewHistory: Array<{
    reviewer: string;
    action: string;
    comment: string;
    timestamp: Date;
  }>;
  statistics: {
    totalApplications: number;
    completionRate: number;
    avgHandlingTime: number;
    timeoutRate: number;
  };
}

export interface HandlingTimeLimitSummary {
  legalLimit: number;
  promisedLimit: number;
  unitLabel: string;
}

export interface MaterialNecessitySummary {
  required: number;
  tolerable: number;
  optional: number;
}

export interface FormVersionInfo {
  currentVersion: string;
  totalVersions: number;
  latestUpdatedAt: Date;
  isActive: boolean;
}

export interface ChangeAuditRecord {
  action: string;
  operator: string;
  timestamp: Date;
  changeContent: string;
}

export interface HandlingTimeLimitFull {
  legalLimitDays: number;
  promisedLimitDays: number;
  specialLimitDays: number;
  limitDescription: string;
}

export interface MaterialsSummary {
  requiredCount: number;
  tolerableCount: number;
  optionalCount: number;
  totalCount: number;
  requirementDescription: string;
}

export interface MaterialDetail {
  name: string;
  necessity: 'REQUIRED' | 'TOLERABLE' | 'OPTIONAL';
  necessityLabel: string;
}

export interface FormTemplateVersionInfo {
  currentVersion: string;
  versionCount: number;
  lastUpdatedAt: Date;
  changeLog: string;
}

export interface MaterialTemplateVersionInfo {
  currentVersion: string;
  versionCount: number;
  lastUpdatedAt: Date;
}

export interface ChangeHistoryItem {
  action: string;
  content: string;
  operator: string;
  timestamp: Date;
}

export interface QuickAction {
  code: string;
  name: string;
  type: string;
  endpoint: string;
}

export interface ViewTemplateAction {
  code: string;
  name: string;
  endpoint: string;
  hasVersions: boolean;
  hasAuditTrail: boolean;
}

export interface ApplicableConditions {
  applicableScope: string;
  ineligibleCases: string[];
  prerequisiteMatters: string[];
  applicablePopulation: string;
  regionRestriction: string;
  conditionsSummary: string;
}

export interface RecentVerificationError {
  materialName: string;
  errorType: string;
  sampleCount: number;
}

export interface VerificationRule {
  materialName: string;
  rule: string;
  format: string;
  sizeLimit: string;
}

export interface SampleVerificationResult {
  materialName: string;
  passCount: number;
  failCount: number;
  lastVerifiedAt: Date;
}

export interface MaterialEVerification {
  totalMaterials: number;
  verifiedCount: number;
  verificationPassRate: number;
  recentVerificationErrors: RecentVerificationError[];
  verificationRules: VerificationRule[];
  ocrVerificationEnabled: boolean;
  sampleVerificationResults: SampleVerificationResult[];
}

export interface FieldVersionChange {
  fieldName: string;
  oldVersion: string;
  newVersion: string;
  changedAt: Date;
}

export interface FieldValidationRule {
  fieldName: string;
  rule: string;
  type: string;
}

export interface FormFieldVersions {
  fieldCount: number;
  requiredFieldCount: number;
  fieldVersionChanges: FieldVersionChange[];
  validationRules: FieldValidationRule[];
  currentFieldSchemaVersion: string;
  fieldHistoryCount: number;
}

export interface ReviewIssue {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface StandardizationReview {
  hasReviewed: boolean;
  reviewer: string | null;
  reviewedAt: Date | null;
  reviewScore: number;
  reviewIssues: ReviewIssue[];
  reviewPassed: boolean;
}

export interface StandardizationQuickAction {
  code: string;
  name: string;
  endpoint: string;
}

export interface StandardizationQuickActions {
  checkStandardization: StandardizationQuickAction;
  verifyMaterials: StandardizationQuickAction;
  viewApplicableConditions: StandardizationQuickAction;
}

export interface ServiceItemEnhancedList {
  list: Array<{
    id: string;
    itemCode: string;
    itemName: string;
    category: string;
    handlingDepartment: string;
    handlingTimeLimitDays: number;
    version: number;
    status: boolean;
    reviewStatus: string;
    formTemplateCount: number;
    materialTemplateCount: number;
    totalApplications: number;
    createdAt: Date;
    updatedAt: Date;
    handlingTimeLimitDetail: HandlingTimeLimitSummary;
    materialNecessitySummary: MaterialNecessitySummary;
    formVersionInfo: FormVersionInfo;
    changeAudit: ChangeAuditRecord[];
    quickActions: QuickAction[];
    isFormActive: boolean;
    hasMaterial: boolean;
    handlingTimeLimit: HandlingTimeLimitFull;
    urgentLimitDays: number;
    delayPenalty: string;
    materialsSummary: MaterialsSummary;
    materialDetails: MaterialDetail[];
    formTemplateVersion: FormTemplateVersionInfo;
    materialTemplateVersion: MaterialTemplateVersionInfo;
    formTemplateActive: boolean;
    formTemplateActiveLabel: string;
    formTemplateActivatedAt: Date;
    formTemplateDeactivatedAt: Date;
    lastReviewStatus: string;
    lastReviewer: string;
    lastReviewedAt: Date;
    pendingReview: boolean;
    changeHistory: ChangeHistoryItem[];
    viewTemplateAction: ViewTemplateAction;
    applicableConditions: ApplicableConditions;
    materialEVerification: MaterialEVerification;
    formFieldVersions: FormFieldVersions;
    standardizationReview: StandardizationReview;
    standardizationQuickActions: StandardizationQuickActions;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
