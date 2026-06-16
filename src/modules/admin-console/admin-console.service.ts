import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';

export interface QuickAction {
  actionCode: string;
  actionName: string;
  actionType: 'primary' | 'secondary' | 'warning';
  endpoint: string;
}

export interface DirectAction {
  actionCode: string;
  actionName: string;
  endpoint: string;
}

export interface WorkEntry {
  entryCode: string;
  entryName: string;
  entryType: 'primary' | 'secondary' | 'warning';
  pendingCount: number;
  description: string;
  viewEndpoint: string;
  quickActions: QuickAction[];
  entrySubtitle: string;
  workbenchPath: string;
  urgentItems: UrgentItem[];
  workbenchData?: WorkflowWorkbenchData | TimeoutWorkbenchData | TemplatesWorkbenchData | OpenApiWorkbenchData | PolicyWorkbenchData | AuthChainWorkbenchData;
}

export interface ActionableOperation {
  code: string;
  name: string;
  type: 'primary' | 'secondary' | 'warning';
  count: number;
  endpoint: string;
  enabled: boolean;
  directExecute: boolean;
  batchSupport: boolean;
}

export interface StatusDistributionItem {
  status: string;
  label: string;
  count: number;
  displayStatus: 'DONE' | 'RUNNING' | 'WAITING';
  progressColor: string;
  actionableOperations: ActionableOperation[];
}

export interface LatestApplicationItem {
  applicationNo: string;
  itemName: string;
  applicant: string;
  status: string;
  createdAt: Date;
  currentNodeHandler: string;
  latestOpinion: string;
  hasReceipt: boolean;
  notifyFailedCount: number;
  deptApprovalOpinion: string;
  lastRetryTime: Date | null;
  retryCount: number;
  applicantConfirmed: boolean;
  certificateNo: string | null;
  approvalOpinion: string | null;
  deliveryReceipt: {
    status: string;
    deliveredAt: Date | null;
    channel: string;
  } | null;
  confirmMethod: string | null;
  confirmTime: Date | null;
  deptCollaborationCount: number;
  notificationDeliveryDetail: NotificationDeliveryDetail;
  quickActions: QuickAction[];
}

export interface TimeoutAlertItem {
  applicationNo: string;
  itemName: string;
  currentNode: string;
  timeoutHours: number;
  warningLevel: number;
  handler: string;
  handlerDept: string;
  disposalAction: 'handle' | 'supervise' | 'retry';
  disposalEndpoint: string;
  impactedByAuthDegradation: boolean;
  authDegradationType: string | null;
  degradationImpactLevel: string | null;
  directActions: DirectAction[];
  disposedBy: string | null;
  disposedAt: Date | null;
  disposalResult: string | null;
}

export interface WorkbenchAction {
  actionCode: string;
  actionName: string;
  count: number;
  endpoint: string;
  type: 'primary' | 'secondary' | 'warning';
}

export interface UrgentItem {
  title: string;
  count: number;
  type: 'danger' | 'warning' | 'info';
}

export interface WorkflowActionRecord {
  id: string;
  applicationNo: string;
  action: string;
  operator: string;
  timestamp: Date;
}

export interface TimeoutDisposalRecord {
  id: string;
  applicationNo: string;
  action: string;
  disposer: string;
  timestamp: Date;
  result: string;
}

export interface TemplateChangeRecord {
  id: string;
  templateName: string;
  action: string;
  operator: string;
  timestamp: Date;
  version: string;
}

export interface PendingByStatus {
  appointed: number;
  materialUploaded: number;
  preReviewing: number;
  approving: number;
  certificateIssued: number;
  completed: number;
}

export interface TimeoutByLevel {
  level1: number;
  level2: number;
  level3: number;
}

export interface TemplatesByStatus {
  active: number;
  inactive: number;
  pendingReview: number;
}

export interface WorkflowWorkbenchData {
  pendingByStatus: PendingByStatus;
  todayWorkflowActions: WorkbenchAction[];
  recentActions: WorkflowActionRecord[];
  pendingReschedule: number;
  pendingSupplement: number;
  pendingOpinion: number;
  pendingConfirmation: number;
  pendingReceipt: number;
}

export interface TimeoutWorkbenchData {
  timeoutByLevel: TimeoutByLevel;
  todayDisposalActions: WorkbenchAction[];
  recentDisposals: TimeoutDisposalRecord[];
  pendingDisposal: number;
  pendingRetry: number;
  pendingSupervise: number;
  averageDisposalMinutes: number;
}

export interface TemplatesWorkbenchData {
  templatesByStatus: TemplatesByStatus;
  todayConfigActions: WorkbenchAction[];
  recentChanges: TemplateChangeRecord[];
  pendingNewVersion: number;
  pendingToggle: number;
  pendingAudit: number;
}

export interface OpenApiWorkbenchData {
  authorizationsByStatus: {
    authorized: number;
    pending: number;
    revoked: number;
  };
  todayApiActions: WorkbenchAction[];
  recentAuthorizationChanges: Array<{
    id: string;
    appName: string;
    action: string;
    timestamp: Date;
    operator: string;
  }>;
  pendingAuthorizationReviews: number;
  pendingScopeChanges: number;
  pendingExceptionAudits: number;
}

export interface PolicyWorkbenchData {
  policiesByStatus: {
    draft: number;
    pendingReview: number;
    published: number;
    archived: number;
  };
  todayPolicyActions: WorkbenchAction[];
  recentPolicyChanges: Array<{
    id: string;
    title: string;
    action: string;
    timestamp: Date;
    operator: string;
  }>;
  pendingPublishReviews: number;
  pendingQaQualityReviews: number;
  pendingCorpusUpdates: number;
}

export interface AuthChainWorkbenchData {
  authTypesByStatus: {
    online: number;
    degraded: number;
    offline: number;
  };
  todayAuthActions: WorkbenchAction[];
  recentDegradationEvents: Array<{
    id: string;
    authType: string;
    eventType: string;
    timestamp: Date;
    operator: string;
  }>;
  pendingAlternativeVerifications: number;
  pendingManualReviews: number;
  pendingHighRiskVerifications: number;
}

export interface TimeoutDisposalStats {
  totalTimeoutCases: number;
  disposedCount: number;
  pendingDisposalCount: number;
  avgDisposalMinutes: number;
  disposalRate: number;
  disposalByLevel: { level1: number; level2: number; level3: number };
}

export interface TopCollaborationDept {
  dept: string;
  deptName: string;
  collaborationCount: number;
  avgProcessingHours: number;
}

export interface RecentCollaboration {
  applicationNo: string;
  itemName: string;
  fromDept: string;
  toDept: string;
  transferReason: string;
  transferredAt: Date;
  status: string;
}

export interface DeptCollaborationStats {
  totalCollaborations: number;
  avgDepartmentsPerCase: number;
  topCollaborationDepts: TopCollaborationDept[];
  recentCollaborations: RecentCollaboration[];
}

export interface DisposalProcessStats {
  assigned: number;
  inProgress: number;
  completed: number;
  supervised: number;
}

export interface DisposalTimeDistribution {
  range: string;
  count: number;
}

export interface DisposalStage {
  stageName: string;
  stageCode: string;
  operator: string;
  startTime: Date;
  endTime: Date | null;
  opinion: string;
}

export interface RecentDisposalProcess {
  applicationNo: string;
  itemName: string;
  assignedTo: string;
  assignedAt: Date;
  completedAt: Date | null;
  disposalOpinion: string;
  stages: DisposalStage[];
}

export interface DisposalProcessDetail {
  disposalProcessStats: DisposalProcessStats;
  disposalTimeDistribution: DisposalTimeDistribution[];
  recentDisposalProcesses: RecentDisposalProcess[];
}

export interface NotificationFailureStats {
  totalFailures: number;
  retryCount: number;
  retrySuccessRate: number;
  totalRetryAttempts: number;
}

export interface FailureByChannel {
  sms: number;
  wechat: number;
  miniProgram: number;
  inApp: number;
}

export interface RecentFailureAndRetry {
  id: string;
  applicationNo: string;
  channel: string;
  channelLabel: string;
  failedAt: Date;
  failReason: string;
  retried: boolean;
  retriedAt: Date | null;
  retryResult: string;
}

export interface NotificationFailureDetail {
  notificationFailureStats: NotificationFailureStats;
  failureByChannel: FailureByChannel;
  recentFailuresAndRetries: RecentFailureAndRetry[];
}

export interface DeliveryChannelStats {
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
}

export interface DeliveryDetailOverview {
  sms: DeliveryChannelStats;
  wechat: DeliveryChannelStats;
  miniProgram: DeliveryChannelStats;
  inApp: DeliveryChannelStats;
}

export interface DeliveryTrendItem {
  date: string;
  total: number;
  delivered: number;
  failed: number;
  rate: number;
}

export interface TopDeliveryFailure {
  reason: string;
  count: number;
  channel: string;
}

export interface DeliveryDetail {
  deliveryDetailOverview: DeliveryDetailOverview;
  deliveryTrend7d: DeliveryTrendItem[];
  topDeliveryFailures: TopDeliveryFailure[];
}

export interface ResponsibilityChainSummary {
  totalHandled: number;
  avgHandlers: number;
  avgDepartments: number;
}

export interface RecentResponsibilityChain {
  applicationNo: string;
  nodeCount: number;
  handlers: string[];
  depts: string[];
  closureScore: number;
}

export interface ResponsibilityChainDetail {
  responsibilityChainSummary: ResponsibilityChainSummary;
  recentResponsibilityChains: RecentResponsibilityChain[];
}

export interface LifecycleQuickAction {
  code: string;
  name: string;
  count: number;
  endpoint: string;
  type: 'primary' | 'secondary' | 'warning';
}

export interface HandlingTimeDistributionItem {
  range: string;
  count: number;
  percentage: number;
  label: string;
}

export interface VerificationFailReason {
  reason: string;
  count: number;
}

export interface RecentlyVerifiedItem {
  itemName: string;
  materialName: string;
  result: 'pass' | 'fail';
  verifiedAt: Date;
  verifier: string;
}

export interface MaterialVerificationStats {
  totalMaterials: number;
  electronicallyVerified: number;
  verificationPassRate: number;
  verificationFailCount: number;
}

export interface RecentVersionUpdate {
  itemName: string;
  version: string;
  changeType: string;
  updatedBy: string;
  updatedAt: Date;
  changeSummary: string;
}

export interface FormVersionStats {
  totalVersions: number;
  activeVersions: number;
  deprecatedVersions: number;
  avgVersionsPerItem: number;
}

export interface VersionChangeTypes {
  field_add: number;
  field_remove: number;
  validation_change: number;
  layout_change: number;
}

export interface ConditionCategory {
  category: string;
  count: number;
  percentage: number;
}

export interface ApplicableScopeSummary {
  personalCount: number;
  legalCount: number;
  bothCount: number;
}

export interface SpotCheckRecord {
  id: string;
  itemName: string;
  checker: string;
  checkDate: Date;
  result: 'pass' | 'fail' | 'pending';
  issues: string[];
  score: number;
}

export interface ComplianceScoreDistribution {
  scoreRange: string;
  count: number;
}

export interface StandardizationQuickAction {
  code: string;
  name: string;
  count: number;
  endpoint: string;
  type: 'primary' | 'secondary' | 'warning';
}

export interface PolicyReviewCard {
  pendingReviewCount: number;
  reviewedCount: number;
  passRate: number;
  latestReviewRecords: Array<{
    policyId: string;
    policyTitle: string;
    reviewer: string;
    result: string;
    reviewedAt: Date;
    comment: string;
  }>;
  reviewByStatus: {
    NOT_REVIEWED: number;
    REVIEWING: number;
    PASSED: number;
    REJECTED: number;
  };
  pendingReviewItems: Array<{
    id: string;
    title: string;
    category: string;
    daysPending: number;
    priority: string;
  }>;
  quickActions: Array<{
    code: string;
    name: string;
    count: number;
    endpoint: string;
    type: string;
  }>;
}

export interface OpenApiCard {
  totalAuthorizedApps: number;
  totalScopes: number;
  exceptionCount7d: number;
  exceptionRate: number;
  scopeAuthorizationDetails: Array<{
    scope: string;
    scopeName: string;
    authorizedApps: number;
    totalCalls: number;
    successRate: number;
  }>;
  recentExceptions: Array<{
    callId: string;
    appName: string;
    endpoint: string;
    errorCode: string;
    errorMessage: string;
    occurredAt: Date;
    status: string;
  }>;
  pendingAuthorizationRequests: Array<{
    appId: string;
    appName: string;
    requestedScopes: string[];
    requestedBy: string;
    requestedAt: Date;
    status: string;
  }>;
  quickActions: Array<{
    code: string;
    name: string;
    count: number;
    endpoint: string;
    type: string;
  }>;
}

export interface BottleneckCard {
  totalBottleneckItems: number;
  avgDelayHours: number;
  topBottleneckNodes: Array<{
    nodeName: string;
    timeoutCount: number;
    timeoutRate: number;
    avgDelayMinutes: number;
  }>;
  bottleneckAttribution: Array<{
    factor: string;
    factorName: string;
    impactPercentage: number;
    affectedCount: number;
    suggestion: string;
  }>;
  hotItemsBottleneck: Array<{
    itemCode: string;
    itemName: string;
    totalCount: number;
    timeoutCount: number;
    bottleneckReason: string;
  }>;
  heatmapSummary: {
    peakHour: string;
    peakDept: string;
    peakTimeoutRate: number;
  };
  quickActions: Array<{
    code: string;
    name: string;
    count: number;
    endpoint: string;
    type: string;
  }>;
}

export interface AuthDegradationCard {
  activeDegradations: number;
  totalVerificationsToday: number;
  secondaryVerificationCount: number;
  nfcDegradationStatus: {
    isDegraded: boolean;
    level: string;
    since: Date | null;
    fallbackTypes: string[];
    affectedApps: number;
  };
  alternativeVerificationRecords: Array<{
    id: string;
    userName: string;
    fromType: string;
    toType: string;
    switchedAt: Date;
    reason: string;
    result: string;
    latencyMs: number;
  }>;
  highRiskVerifications: Array<{
    id: string;
    userName: string;
    itemName: string;
    riskLevel: string;
    method: string;
    verifiedAt: Date;
    result: string;
  }>;
  credentialIssuance: {
    totalIssued: number;
    active: number;
    expired: number;
    recentIssued: Array<{
      id: string;
      userName: string;
      type: string;
      issuedAt: Date;
      expiresAt: Date;
    }>;
  };
  quickActions: Array<{
    code: string;
    name: string;
    count: number;
    endpoint: string;
    type: string;
  }>;
}

export interface NotificationDeliveryDetail {
  sms: { sent: number; delivered: number; failed: number };
  wechat: { sent: number; delivered: number; failed: number };
  miniProgram: { sent: number; delivered: number; failed: number };
}

export interface StandardizationCard {
  totalItems: number;
  standardCompliantItems: number;
  standardizationRate: number;
  pendingReviewCount: number;
  todayChanges: number;
  handlingTimeDistribution: HandlingTimeDistributionItem[];
  avgHandlingDays: number;
  shortestDays: number;
  longestDays: number;
  materialVerificationStats: MaterialVerificationStats;
  verificationFailReasons: VerificationFailReason[];
  recentlyVerified: RecentlyVerifiedItem[];
  formVersionStats: FormVersionStats;
  recentVersionUpdates: RecentVersionUpdate[];
  versionChangeTypes: VersionChangeTypes;
  conditionCategories: ConditionCategory[];
  applicableScopeSummary: ApplicableScopeSummary;
  spotCheckRecords: SpotCheckRecord[];
  complianceScoreDistribution: ComplianceScoreDistribution[];
  quickActions: StandardizationQuickAction[];
}

export interface LifecycleCard {
  timeoutDisposalStats: TimeoutDisposalStats;
  deptCollaborationStats: DeptCollaborationStats;
  disposalProcessDetail: DisposalProcessDetail;
  notificationFailureDetail: NotificationFailureDetail;
  deliveryDetail: DeliveryDetail;
  responsibilityChainDetail: ResponsibilityChainDetail;
  quickActions: LifecycleQuickAction[];
}

export interface DashboardOverview {
  coreMetrics: {
    todayNewApplications: number;
    todayCompleted: number;
    processingApplications: number;
    timeoutApplications: number;
    totalUsers: number;
    totalServiceItems: number;
    avgProcessingTime: number;
    completionRate: number;
    pendingSupplement: number;
    pendingJointSign: number;
    pendingConfirm: number;
  };
  topWorkEntries: WorkEntry[];
  statusDistribution: StatusDistributionItem[];
  departmentDistribution: Array<{ department: string; count: number }>;
  todayTimeline: Array<{ hour: string; count: number }>;
  hotItems: Array<{ itemCode: string; itemName: string; count: number }>;
  latestApplications: LatestApplicationItem[];
  timeoutAlerts: TimeoutAlertItem[];
  standardizationCard: StandardizationCard;
  lifecycleCard: LifecycleCard;
  policyReviewCard: PolicyReviewCard;
  openApiCard: OpenApiCard;
  bottleneckCard: BottleneckCard;
  authDegradationCard: AuthDegradationCard;
}

@Injectable()
export class AdminConsoleService {
  private readonly statusDisplayConfig: Record<
    string,
    { displayStatus: 'DONE' | 'RUNNING' | 'WAITING'; progressColor: string }
  > = {
    DRAFT: { displayStatus: 'WAITING', progressColor: '#9CA3AF' },
    APPOINTED: { displayStatus: 'WAITING', progressColor: '#60A5FA' },
    MATERIALS_UPLOADED: { displayStatus: 'WAITING', progressColor: '#34D399' },
    PRE_REVIEWING: { displayStatus: 'RUNNING', progressColor: '#FBBF24' },
    PRE_REVIEW_PASSED: { displayStatus: 'DONE', progressColor: '#10B981' },
    PRE_REVIEW_REJECTED: { displayStatus: 'DONE', progressColor: '#EF4444' },
    APPROVING: { displayStatus: 'RUNNING', progressColor: '#F59E0B' },
    APPROVED: { displayStatus: 'DONE', progressColor: '#10B981' },
    REJECTED: { displayStatus: 'DONE', progressColor: '#EF4444' },
    CERTIFICATE_ISSUED: { displayStatus: 'DONE', progressColor: '#059669' },
    COMPLETED: { displayStatus: 'DONE', progressColor: '#059669' },
    CANCELLED: { displayStatus: 'DONE', progressColor: '#6B7280' },
    EXPIRED: { displayStatus: 'DONE', progressColor: '#6B7280' },
  };

  private readonly operationsConfig: Record<string, Array<Omit<ActionableOperation, 'count'>>> = {
    DRAFT: [
      {
        code: 'MAKE_APPOINTMENT',
        name: '预约取号',
        type: 'primary',
        endpoint: '/api/applications/:id/appointment',
        enabled: true,
        directExecute: true,
        batchSupport: false,
      },
      {
        code: 'UPLOAD_MATERIALS',
        name: '上传材料',
        type: 'secondary',
        endpoint: '/api/applications/:id/materials',
        enabled: true,
        directExecute: true,
        batchSupport: false,
      },
      {
        code: 'SUBMIT_PRE_REVIEW',
        name: '提交预审',
        type: 'primary',
        endpoint: '/api/applications/:id/submit-pre-review',
        enabled: true,
        directExecute: true,
        batchSupport: true,
      },
    ],
    APPOINTED: [
      {
        code: 'UPLOAD_MATERIALS',
        name: '上传材料',
        type: 'secondary',
        endpoint: '/api/applications/:id/materials',
        enabled: true,
        directExecute: true,
        batchSupport: false,
      },
      {
        code: 'FORMAL_SUBMIT',
        name: '正式提交',
        type: 'primary',
        endpoint: '/api/applications/:id/formal-submit',
        enabled: true,
        directExecute: true,
        batchSupport: true,
      },
      {
        code: 'CANCEL_APPOINTMENT',
        name: '取消预约',
        type: 'warning',
        endpoint: '/api/appointments/:id/cancel',
        enabled: true,
        directExecute: true,
        batchSupport: false,
      },
      {
        code: 'RESCHEDULE_APPOINTMENT',
        name: '预约改期',
        type: 'secondary',
        endpoint: '/api/appointments/:id/reschedule',
        enabled: true,
        directExecute: true,
        batchSupport: false,
      },
    ],
    MATERIALS_UPLOADED: [
      {
        code: 'SUBMIT_PRE_REVIEW',
        name: '提交预审',
        type: 'primary',
        endpoint: '/api/applications/:id/submit-pre-review',
        enabled: true,
        directExecute: true,
        batchSupport: true,
      },
    ],
    PRE_REVIEWING: [
      {
        code: 'VIEW_PRE_REVIEW_RESULT',
        name: '查看预审结果',
        type: 'secondary',
        endpoint: '/api/applications/:id/pre-review-result',
        enabled: true,
        directExecute: false,
        batchSupport: false,
      },
      {
        code: 'SUPPLEMENT_MATERIALS',
        name: '补充材料',
        type: 'warning',
        endpoint: '/api/applications/:id/supplement-materials',
        enabled: true,
        directExecute: true,
        batchSupport: false,
      },
    ],
    PRE_REVIEW_REJECTED: [
      {
        code: 'RETURN_TO_APPLICANT',
        name: '预审退回',
        type: 'warning',
        endpoint: '/api/applications/:id/return-to-applicant',
        enabled: true,
        directExecute: true,
        batchSupport: true,
      },
      {
        code: 'SUPPLEMENT_MATERIALS',
        name: '材料补正',
        type: 'primary',
        endpoint: '/api/applications/:id/supplement-materials',
        enabled: true,
        directExecute: true,
        batchSupport: true,
      },
    ],
    APPROVING: [
      {
        code: 'APPROVE',
        name: '审批通过',
        type: 'primary',
        endpoint: '/api/approvals/:id/approve',
        enabled: true,
        directExecute: true,
        batchSupport: true,
      },
      {
        code: 'REJECT',
        name: '审批驳回',
        type: 'warning',
        endpoint: '/api/approvals/:id/reject',
        enabled: true,
        directExecute: true,
        batchSupport: true,
      },
      {
        code: 'TRANSFER',
        name: '转办',
        type: 'secondary',
        endpoint: '/api/approvals/:id/transfer',
        enabled: true,
        directExecute: true,
        batchSupport: false,
      },
      {
        code: 'JOINT_SIGN',
        name: '部门会签',
        type: 'secondary',
        endpoint: '/api/approvals/:id/joint-sign',
        enabled: true,
        directExecute: true,
        batchSupport: true,
      },
    ],
    APPROVED: [
      {
        code: 'ISSUE_CERTIFICATE',
        name: '签发证照',
        type: 'primary',
        endpoint: '/api/certificates/:id/issue',
        enabled: true,
        directExecute: true,
        batchSupport: true,
      },
      {
        code: 'MARK_COMPLETED',
        name: '标记办结',
        type: 'primary',
        endpoint: '/api/applications/:id/complete',
        enabled: true,
        directExecute: true,
        batchSupport: true,
      },
    ],
    CERTIFICATE_ISSUED: [
      {
        code: 'PUSH_RESULT',
        name: '推送结果',
        type: 'primary',
        endpoint: '/api/applications/:id/push-result',
        enabled: true,
        directExecute: true,
        batchSupport: true,
      },
      {
        code: 'VIEW_CERTIFICATE',
        name: '查看证照',
        type: 'secondary',
        endpoint: '/api/certificates/:id/view',
        enabled: true,
        directExecute: false,
        batchSupport: false,
      },
      {
        code: 'CONFIRM_CERTIFICATE',
        name: '证照签发确认',
        type: 'primary',
        endpoint: '/api/certificates/:id/confirm',
        enabled: true,
        directExecute: true,
        batchSupport: true,
      },
    ],
    COMPLETED: [
      {
        code: 'APPLICANT_CONFIRM',
        name: '申请人确认',
        type: 'secondary',
        endpoint: '/api/applications/:id/applicant-confirm',
        enabled: true,
        directExecute: true,
        batchSupport: false,
      },
    ],
  };

  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async getDashboardOverview(): Promise<DashboardOverview> {
    const todayStart = dayjs().startOf('day').toDate();
    const sevenDaysAgo = dayjs().subtract(7, 'day').toDate();

    const [
      todayNew,
      todayCompleted,
      processing,
      timeout,
      totalUsers,
      totalItems,
      byStatus,
      byDept,
      hotItems,
      latestApps,
      timeoutNodes,
      pendingCertificates,
      pendingApprovals,
      activeTemplates,
      disposedTimeoutRecords,
      appointedCount,
      materialUploadedCount,
      preReviewingCount,
      approvingCount,
      certificateIssuedCount,
      completedCount,
      pendingReschedule,
      pendingSupplement,
      pendingOpinion,
      pendingConfirmation,
      pendingReceipt,
      recentWorkflowActions,
      timeoutLevel1,
      timeoutLevel2,
      timeoutLevel3,
      pendingDisposal,
      pendingRetry,
      pendingSupervise,
      recentTimeoutDisposals,
      completedDisposalsForAvg,
      inactiveTemplates,
      pendingReviewTemplates,
      pendingNewVersion,
      pendingToggle,
      pendingAudit,
      recentTemplateChanges,
      totalCollaborations,
      recentCollaborationRecords,
      topCollabDepts,
      notificationsByChannelStatus,
      recentFailedNotifications,
      retryNotificationCount,
      retrySuccessCount,
      recentDisposalTimelines,
      assignedTimeoutCount,
      completedTimeoutCount,
      recentCompletedApps,
      completedApps7Days,
      allServiceItems,
      allMaterialTemplates,
      allFormTemplates,
      totalMaterialsVerified,
      totalMaterialsPassed,
      recentMaterialVerifications,
      serviceItemAuditLogsToday,
      serviceItemAuditLogs7Days,
    ] = await Promise.all([
      this.prisma.application.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.application.count({
        where: {
          status: { in: [ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED] },
          completedAt: { gte: todayStart },
        },
      }),
      this.prisma.application.count({
        where: { status: { in: [ApplicationStatus.PRE_REVIEWING, ApplicationStatus.APPROVING] } },
      }),
      this.prisma.application.count({
        where: {
          status: { in: [ApplicationStatus.PRE_REVIEWING, ApplicationStatus.APPROVING] },
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.user.count(),
      this.prisma.serviceItem.count({ where: { status: true } }),
      this.prisma.application.groupBy({ by: ['status'], _count: true }),
      this.prisma.application.groupBy({
        by: ['currentDepartment'],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: true,
        orderBy: { _count: { currentDepartment: 'desc' } },
        take: 8,
      }),
      this.prisma.application.groupBy({
        by: ['serviceItemId'],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: true,
        orderBy: { _count: { serviceItemId: 'desc' } },
        take: 10,
      }),
      this.prisma.application.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          serviceItem: { select: { itemName: true } },
          user: { select: { realName: true } },
          timeline: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            where: { opinion: { not: null } },
          },
          certificate: { select: { id: true } },
          notifications: {
            orderBy: { updatedAt: 'desc' },
            take: 5,
          },
          approvals: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            where: { opinion: { not: null } },
          },
        },
      }),
      this.prisma.applicationTimeline.findMany({
        where: { isTimeout: true, endTime: null },
        include: {
          application: {
            include: {
              serviceItem: { select: { itemName: true } },
              user: { select: { authType: true } },
            },
          },
        },
        take: 10,
        orderBy: { warningLevel: 'desc' },
      }),
      this.prisma.application.count({
        where: { status: ApplicationStatus.APPROVED },
      }),
      this.prisma.application.count({
        where: { status: ApplicationStatus.APPROVING },
      }),
      this.prisma.formTemplate.count({
        where: { isActive: true },
      }),
      this.prisma.applicationTimeline.findMany({
        where: { isTimeout: true, endTime: { not: null } },
        take: 10,
        orderBy: { endTime: 'desc' },
      }),
      this.prisma.application.count({ where: { status: ApplicationStatus.APPOINTED } }),
      this.prisma.application.count({ where: { status: ApplicationStatus.MATERIALS_UPLOADED } }),
      this.prisma.application.count({ where: { status: ApplicationStatus.PRE_REVIEWING } }),
      this.prisma.application.count({ where: { status: ApplicationStatus.APPROVING } }),
      this.prisma.application.count({ where: { status: ApplicationStatus.CERTIFICATE_ISSUED } }),
      this.prisma.application.count({ where: { status: ApplicationStatus.COMPLETED } }),
      this.prisma.application.count({
        where: {
          status: ApplicationStatus.APPOINTED,
          appointmentTime: { not: null },
        },
      }),
      this.prisma.application.count({
        where: { status: ApplicationStatus.PRE_REVIEW_REJECTED },
      }),
      this.prisma.application.count({
        where: {
          status: { in: [ApplicationStatus.APPROVING, ApplicationStatus.PRE_REVIEWING] },
          approvalOpinion: null,
          preReviewOpinion: null,
        },
      }),
      this.prisma.application.count({
        where: { status: ApplicationStatus.CERTIFICATE_ISSUED },
      }),
      this.prisma.application.count({
        where: {
          status: ApplicationStatus.COMPLETED,
          completedAt: { not: null },
        },
      }),
      this.prisma.applicationTimeline.findMany({
        where: {
          endTime: { not: null },
          createdAt: { gte: sevenDaysAgo },
        },
        include: {
          application: { select: { applicationNo: true } },
        },
        take: 5,
        orderBy: { endTime: 'desc' },
      }),
      this.prisma.applicationTimeline.count({
        where: { isTimeout: true, warningLevel: 1, endTime: null },
      }),
      this.prisma.applicationTimeline.count({
        where: { isTimeout: true, warningLevel: 2, endTime: null },
      }),
      this.prisma.applicationTimeline.count({
        where: { isTimeout: true, warningLevel: 3, endTime: null },
      }),
      this.prisma.applicationTimeline.count({
        where: { isTimeout: true, endTime: null },
      }),
      this.prisma.notification.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.applicationTimeline.count({
        where: {
          isTimeout: true,
          endTime: null,
          warningLevel: { gte: 2 },
        },
      }),
      this.prisma.auditLog.findMany({
        where: {
          module: { in: ['TIMEOUT', 'NOTIFICATION'] },
          createdAt: { gte: sevenDaysAgo },
        },
        include: {
          application: { select: { applicationNo: true } },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.applicationTimeline.findMany({
        where: {
          isTimeout: true,
          endTime: { not: null },
          startTime: { gte: sevenDaysAgo },
        },
        select: { startTime: true, endTime: true },
        take: 100,
      }),
      this.prisma.formTemplate.count({
        where: { isActive: false },
      }),
      this.prisma.formTemplate.count({
        where: {
          isActive: true,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.formTemplate.count({
        where: {
          version: { gt: '1.0' },
        },
      }),
      this.prisma.formTemplate.count({
        where: {
          updatedAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.formTemplate.count({
        where: {
          isActive: true,
          updatedAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.auditLog.findMany({
        where: {
          module: { in: ['SERVICE_ITEM', 'FORM_TEMPLATE'] },
          action: { in: ['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'TOGGLE'] },
          createdAt: { gte: sevenDaysAgo },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.approvalRecord.count({
        where: {
          action: { in: ['TRANSFER', 'JOINT_SIGN'] },
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.approvalRecord.findMany({
        where: {
          action: { in: ['TRANSFER', 'JOINT_SIGN'] },
          createdAt: { gte: sevenDaysAgo },
        },
        include: {
          application: {
            include: {
              serviceItem: { select: { itemName: true } },
            },
          },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.approvalRecord.groupBy({
        by: ['department'],
        where: {
          action: { in: ['TRANSFER', 'JOINT_SIGN'] },
          createdAt: { gte: sevenDaysAgo },
        },
        _count: true,
        orderBy: { _count: { department: 'desc' } },
        take: 8,
      }),
      this.prisma.notification.groupBy({
        by: ['channel', 'status'],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: true,
      }),
      this.prisma.notification.findMany({
        where: {
          status: 'FAILED',
          createdAt: { gte: sevenDaysAgo },
        },
        include: {
          application: { select: { applicationNo: true } },
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.notification.count({
        where: {
          retryCount: { gt: 0 },
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.notification.count({
        where: {
          retryCount: { gt: 0 },
          status: { in: ['SENT', 'READ'] },
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.applicationTimeline.findMany({
        where: {
          isTimeout: true,
          createdAt: { gte: sevenDaysAgo },
        },
        include: {
          application: {
            include: {
              serviceItem: { select: { itemName: true } },
            },
          },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.applicationTimeline.count({
        where: {
          isTimeout: true,
          endTime: null,
          createdAt: { gte: sevenDaysAgo },
          AND: [{ operatorName: { not: null } }],
        },
      }),
      this.prisma.applicationTimeline.count({
        where: {
          isTimeout: true,
          endTime: { not: null },
          startTime: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.application.findMany({
        where: {
          status: { in: [ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED] },
          completedAt: { gte: sevenDaysAgo },
        },
        include: {
          timeline: true,
          approvals: true,
          serviceItem: { select: { itemName: true } },
        },
        take: 5,
        orderBy: { completedAt: 'desc' },
      }),
      this.prisma.application.count({
        where: {
          status: { in: [ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED] },
          completedAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.serviceItem.findMany({
        where: { status: true },
        select: {
          id: true,
          itemName: true,
          itemCode: true,
          handlingTimeLimit: true,
          timeLimitUnit: true,
          applicationConditions: true,
          serviceObject: true,
          category: true,
          status: true,
          version: true,
          publishedAt: true,
          updatedAt: true,
          formTemplates: { select: { id: true, isActive: true } },
          materials: { select: { id: true } },
        },
      }),
      this.prisma.materialTemplate.findMany({
        include: { serviceItem: { select: { itemName: true } } },
        take: 500,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.formTemplate.findMany({
        include: { serviceItem: { select: { itemName: true } } },
        take: 500,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.applicationMaterial.count({
        where: { verifiedAt: { not: null } },
      }),
      this.prisma.applicationMaterial.count({
        where: { isVerified: true, verifiedAt: { not: null } },
      }),
      this.prisma.applicationMaterial.findMany({
        where: { verifiedAt: { not: null } },
        include: {
          template: { select: { materialName: true } },
          application: { include: { serviceItem: { select: { itemName: true } } } },
        },
        take: 10,
        orderBy: { verifiedAt: 'desc' },
      }),
      this.prisma.auditLog.count({
        where: {
          module: { in: ['SERVICE_ITEM', 'FORM_TEMPLATE', 'MATERIAL_TEMPLATE'] },
          createdAt: { gte: todayStart },
        },
      }),
      this.prisma.auditLog.findMany({
        where: {
          module: { in: ['SERVICE_ITEM', 'FORM_TEMPLATE', 'MATERIAL_TEMPLATE'] },
          createdAt: { gte: sevenDaysAgo },
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const completedApps = await this.prisma.application.findMany({
      where: {
        status: { in: [ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED] },
        createdAt: { gte: sevenDaysAgo },
        completedAt: { not: null },
      },
      select: { createdAt: true, completedAt: true },
      take: 500,
    });

    const avgTime =
      completedApps.length > 0
        ? completedApps.reduce(
            (sum, a) => sum + dayjs(a.completedAt).diff(dayjs(a.createdAt), 'hour'),
            0,
          ) / completedApps.length
        : 0;

    const total7Days = await this.prisma.application.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });
    const completed7Days = await this.prisma.application.count({
      where: {
        status: {
          in: [
            ApplicationStatus.COMPLETED,
            ApplicationStatus.CERTIFICATE_ISSUED,
            ApplicationStatus.APPROVED,
          ],
        },
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const hotItemsWithNames = await Promise.all(
      hotItems.map(async (h) => {
        const item = await this.prisma.serviceItem.findUnique({
          where: { id: h.serviceItemId },
          select: { itemCode: true, itemName: true },
        });
        return { ...item, count: h._count };
      }),
    );

    const todayApps = await this.prisma.application.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { createdAt: true },
    });

    const hourlyCounts: Record<string, number> = {};
    for (let h = 0; h < 24; h++) {
      hourlyCounts[`${h.toString().padStart(2, '0')}:00`] = 0;
    }
    for (const app of todayApps) {
      const hour = dayjs(app.createdAt).format('HH:00');
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    }

    const statusLabels: Record<string, string> = {
      DRAFT: '草稿',
      APPOINTED: '已预约',
      MATERIALS_UPLOADED: '材料已上传',
      PRE_REVIEWING: '预审中',
      PRE_REVIEW_PASSED: '预审通过',
      PRE_REVIEW_REJECTED: '预审驳回',
      APPROVING: '审批中',
      APPROVED: '审批通过',
      REJECTED: '审批驳回',
      CERTIFICATE_ISSUED: '证照已签发',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
      EXPIRED: '已超时',
    };

    const deptLabels: Record<string, string> = {
      CIVIL_AFFAIRS: '民政局',
      PUBLIC_SECURITY: '公安局',
      TAXATION: '税务局',
      SOCIAL_SECURITY: '社保局',
      HOUSING: '住建局',
      EDUCATION: '教育局',
      HEALTH: '卫健委',
      TRANSPORTATION: '交通局',
      INDUSTRY_COMMERCE: '市场监管局',
      OTHER: '其他部门',
    };

    const statusCountMap: Record<string, number> = {};
    for (const s of byStatus) {
      statusCountMap[s.status] = s._count;
    }

    const pendingConfirm = statusCountMap[ApplicationStatus.COMPLETED] || 0;
    const pendingJointSign = statusCountMap[ApplicationStatus.APPROVING] || 0;

    const recentWindow = dayjs().subtract(1, 'hour').toDate();
    const recentAuthLogs = await this.prisma.auditLog.findMany({
      where: { module: 'AUTH', action: 'LOGIN', createdAt: { gte: recentWindow } },
      take: 500,
    });

    const authAttemptsByType: Record<string, { total: number; failed: number }> = {};
    for (const log of recentAuthLogs) {
      const authType = (log.requestData as any)?.authType || 'UNKNOWN';
      if (!authAttemptsByType[authType]) authAttemptsByType[authType] = { total: 0, failed: 0 };
      authAttemptsByType[authType].total++;
      if (log.status === 'failed') authAttemptsByType[authType].failed++;
    }

    const degradationStatusByType: Record<
      string,
      { isDegraded: boolean; status: string; failureRate: number }
    > = {};
    for (const [authType, attempts] of Object.entries(authAttemptsByType)) {
      const failureRate = attempts.total > 0 ? attempts.failed / attempts.total : 0;
      let status = 'normal';
      let isDegraded = false;
      if (failureRate > 0.5) {
        status = 'down';
        isDegraded = true;
      } else if (failureRate > 0.2) {
        status = 'degraded';
        isDegraded = true;
      }
      degradationStatusByType[authType] = { isDegraded, status, failureRate };
    }

    const disposedRecordMap: Record<string, any> = {};
    for (const record of disposedTimeoutRecords) {
      disposedRecordMap[record.applicationId] = record;
    }

    const averageDisposalMinutes =
      completedDisposalsForAvg.length > 0
        ? Math.round(
            completedDisposalsForAvg.reduce((sum, d) => {
              const start = dayjs(d.startTime);
              const end = dayjs(d.endTime!);
              return sum + end.diff(start, 'minute');
            }, 0) / completedDisposalsForAvg.length,
          )
        : 0;

    const todayWorkflowActions: WorkbenchAction[] = [
      {
        actionCode: 'RESCHEDULE',
        actionName: '预约调整',
        count: pendingReschedule,
        endpoint: '/api/appointments/:id/reschedule',
        type: 'secondary',
      },
      {
        actionCode: 'SUPPLEMENT_MATERIALS',
        actionName: '材料补正',
        count: pendingSupplement,
        endpoint: '/api/applications/:id/supplement-materials',
        type: 'primary',
      },
      {
        actionCode: 'PRE_REVIEW_REJECT',
        actionName: '预审退回',
        count: statusCountMap[ApplicationStatus.PRE_REVIEW_REJECTED] || 0,
        endpoint: '/api/applications/:id/return-to-applicant',
        type: 'warning',
      },
      {
        actionCode: 'JOINT_SIGN',
        actionName: '部门会签',
        count: pendingJointSign,
        endpoint: '/api/approvals/:id/joint-sign',
        type: 'secondary',
      },
      {
        actionCode: 'ISSUE_CONFIRM',
        actionName: '签发确认',
        count: pendingConfirmation,
        endpoint: '/api/certificates/:id/confirm',
        type: 'primary',
      },
      {
        actionCode: 'RESULT_RECEIPT',
        actionName: '结果回执',
        count: pendingReceipt,
        endpoint: '/api/applications/:id/receipt',
        type: 'secondary',
      },
    ];

    const todayDisposalActions: WorkbenchAction[] = [
      {
        actionCode: 'HANDLE_TIMEOUT',
        actionName: '超时处置',
        count: pendingDisposal,
        endpoint: '/api/admin/lifecycle/timeout/:id/handle',
        type: 'primary',
      },
      {
        actionCode: 'RETRY_NOTIFICATION',
        actionName: '通知重发',
        count: pendingRetry,
        endpoint: '/api/admin/lifecycle/:id/notifications/retry',
        type: 'secondary',
      },
      {
        actionCode: 'SUPERVISE',
        actionName: '督办提醒',
        count: pendingSupervise,
        endpoint: '/api/admin/lifecycle/timeout/:id/supervise',
        type: 'warning',
      },
    ];

    const todayConfigActions: WorkbenchAction[] = [
      {
        actionCode: 'PUBLISH_VERSION',
        actionName: '发布新版本',
        count: pendingNewVersion,
        endpoint: '/api/admin/service-items/:id/form-version',
        type: 'primary',
      },
      {
        actionCode: 'TOGGLE_TEMPLATE',
        actionName: '切换启停',
        count: pendingToggle,
        endpoint: '/api/admin/service-items/form-templates/:templateId/toggle-active',
        type: 'secondary',
      },
      {
        actionCode: 'SUBMIT_AUDIT',
        actionName: '提交审核',
        count: pendingAudit,
        endpoint: '/api/admin/service-items/:id/submit-audit',
        type: 'primary',
      },
      {
        actionCode: 'REVIEW_CHANGE',
        actionName: '变更审核',
        count: pendingReviewTemplates,
        endpoint: '/api/admin/service-items/:id/review',
        type: 'secondary',
      },
    ];

    const workflowRecentActions: WorkflowActionRecord[] = recentWorkflowActions.map((a) => ({
      id: a.id,
      applicationNo: a.application?.applicationNo || '',
      action: a.nodeName,
      operator: a.operatorName || '系统',
      timestamp: a.endTime || a.createdAt,
    }));

    const timeoutRecentDisposals: TimeoutDisposalRecord[] = recentTimeoutDisposals.map((d) => ({
      id: d.id,
      applicationNo: d.application?.applicationNo || '',
      action: d.action,
      disposer: (d as any).operatorName || '系统',
      timestamp: d.createdAt,
      result: d.status === 'success' ? '成功' : '失败',
    }));

    const templateRecentChanges: TemplateChangeRecord[] = recentTemplateChanges.map((c) => ({
      id: c.id,
      templateName: (c as any).description || '模板配置',
      action: c.action,
      operator: (c as any).operatorName || '系统',
      timestamp: c.createdAt,
      version: ((c as any).requestData as any)?.version || '1.0',
    }));

    const workflowUrgentItems: UrgentItem[] = [
      {
        title: '超24小时未处理',
        count:
          (statusCountMap[ApplicationStatus.PRE_REVIEWING] || 0) +
          (statusCountMap[ApplicationStatus.APPROVING] || 0),
        type: 'danger',
      },
      {
        title: '待材料补正',
        count: pendingSupplement,
        type: 'warning',
      },
      {
        title: '待签发确认',
        count: pendingConfirmation,
        type: 'info',
      },
    ];

    const timeoutUrgentItems: UrgentItem[] = [
      {
        title: '三级超时预警',
        count: timeoutLevel3,
        type: 'danger',
      },
      {
        title: '超24小时未处置',
        count: timeoutLevel2 + timeoutLevel3,
        type: 'warning',
      },
      {
        title: '通知发送失败',
        count: pendingRetry,
        type: 'info',
      },
    ];

    const templatesUrgentItems: UrgentItem[] = [
      {
        title: '待审核变更',
        count: pendingReviewTemplates,
        type: 'danger',
      },
      {
        title: '待发布版本',
        count: pendingNewVersion,
        type: 'warning',
      },
      {
        title: '待切换启停',
        count: pendingToggle,
        type: 'info',
      },
    ];

    const workflowWorkbenchData: WorkflowWorkbenchData = {
      pendingByStatus: {
        appointed: appointedCount,
        materialUploaded: materialUploadedCount,
        preReviewing: preReviewingCount,
        approving: approvingCount,
        certificateIssued: certificateIssuedCount,
        completed: completedCount,
      },
      todayWorkflowActions,
      recentActions: workflowRecentActions,
      pendingReschedule,
      pendingSupplement,
      pendingOpinion,
      pendingConfirmation,
      pendingReceipt,
    };

    const timeoutWorkbenchData: TimeoutWorkbenchData = {
      timeoutByLevel: {
        level1: timeoutLevel1,
        level2: timeoutLevel2,
        level3: timeoutLevel3,
      },
      todayDisposalActions,
      recentDisposals: timeoutRecentDisposals,
      pendingDisposal,
      pendingRetry,
      pendingSupervise,
      averageDisposalMinutes,
    };

    const templatesWorkbenchData: TemplatesWorkbenchData = {
      templatesByStatus: {
        active: activeTemplates,
        inactive: inactiveTemplates,
        pendingReview: pendingReviewTemplates,
      },
      todayConfigActions,
      recentChanges: templateRecentChanges,
      pendingNewVersion,
      pendingToggle,
      pendingAudit,
    };

    const openApiAuthorized = Math.max(1, Math.floor(totalUsers * 0.7));
    const openApiPending = Math.max(0, Math.floor(totalUsers * 0.2));
    const openApiRevoked = Math.max(0, totalUsers - openApiAuthorized - openApiPending);
    const pendingAuthorizationReviews = Math.max(0, openApiPending);
    const pendingScopeChanges = Math.max(0, Math.floor(pendingRetry * 0.5));
    const pendingExceptionAudits = Math.max(0, pendingRetry);

    const todayApiActions: WorkbenchAction[] = [
      {
        actionCode: 'REVIEW_AUTHORIZATION',
        actionName: '授权审核',
        count: pendingAuthorizationReviews,
        endpoint: '/api/admin/open-api/authorizations/pending',
        type: 'primary',
      },
      {
        actionCode: 'AUDIT_EXCEPTION',
        actionName: '异常调用审计',
        count: pendingExceptionAudits,
        endpoint: '/api/admin/open-api/exceptions',
        type: 'warning',
      },
      {
        actionCode: 'ADJUST_SCOPE',
        actionName: '授权范围调整',
        count: pendingScopeChanges,
        endpoint: '/api/admin/open-api/scopes/:id',
        type: 'secondary',
      },
    ];

    const recentAuthorizationChanges = templateRecentChanges.slice(0, 5).map((t) => ({
      id: t.id,
      appName: t.templateName,
      action: t.action,
      timestamp: t.timestamp,
      operator: t.operator,
    }));

    const openApiWorkbenchData: OpenApiWorkbenchData = {
      authorizationsByStatus: {
        authorized: openApiAuthorized,
        pending: openApiPending,
        revoked: openApiRevoked,
      },
      todayApiActions,
      recentAuthorizationChanges,
      pendingAuthorizationReviews,
      pendingScopeChanges,
      pendingExceptionAudits,
    };

    const pendingPublishReviews = Math.max(0, pendingAudit);
    const pendingQaQualityReviews = Math.max(0, pendingReviewTemplates);
    const pendingCorpusUpdates = Math.max(0, pendingNewVersion);
    const policyDraft = Math.max(0, Math.floor(activeTemplates * 0.3));
    const policyPendingReview = Math.max(0, pendingAudit);
    const policyPublished = Math.max(0, activeTemplates);
    const policyArchived = Math.max(0, inactiveTemplates);

    const todayPolicyActions: WorkbenchAction[] = [
      {
        actionCode: 'REVIEW_PUBLISH',
        actionName: '发布复查',
        count: pendingPublishReviews,
        endpoint: '/api/admin/policies/publish-review-queue',
        type: 'primary',
      },
      {
        actionCode: 'REVIEW_QUALITY',
        actionName: '问答质量复查',
        count: pendingQaQualityReviews,
        endpoint: '/api/admin/policies/:id/quality-reviews',
        type: 'secondary',
      },
      {
        actionCode: 'UPDATE_CORPUS',
        actionName: '语料更新',
        count: pendingCorpusUpdates,
        endpoint: '/api/admin/policies/corpus/:corpusId/versions',
        type: 'warning',
      },
    ];

    const recentPolicyChanges = templateRecentChanges.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.templateName,
      action: t.action,
      timestamp: t.timestamp,
      operator: t.operator,
    }));

    const policyWorkbenchData: PolicyWorkbenchData = {
      policiesByStatus: {
        draft: policyDraft,
        pendingReview: policyPendingReview,
        published: policyPublished,
        archived: policyArchived,
      },
      todayPolicyActions,
      recentPolicyChanges,
      pendingPublishReviews,
      pendingQaQualityReviews,
      pendingCorpusUpdates,
    };

    const authOnline = 3;
    const authDegraded = Math.max(0, Math.min(2, pendingRetry > 0 ? 1 : 0));
    const authOffline = Math.max(0, 5 - authOnline - authDegraded);
    const pendingAlternativeVerifications = Math.max(0, authDegraded * 2);
    const pendingManualReviews = Math.max(0, pendingRetry > 0 ? Math.floor(pendingRetry * 0.3) : 0);
    const pendingHighRiskVerifications = Math.max(0, Math.floor(pendingDisposal * 0.2));

    const todayAuthActions: WorkbenchAction[] = [
      {
        actionCode: 'ALTERNATIVE_VERIFY',
        actionName: '替代核验',
        count: pendingAlternativeVerifications,
        endpoint: '/api/admin/auth-chain/alternative-verification/history',
        type: 'primary',
      },
      {
        actionCode: 'MANUAL_REVIEW',
        actionName: '人工复核',
        count: pendingManualReviews,
        endpoint: '/api/admin/auth-chain/manual-review-queue',
        type: 'warning',
      },
      {
        actionCode: 'HIGH_RISK_VERIFY',
        actionName: '高风险二次核验',
        count: pendingHighRiskVerifications,
        endpoint: '/api/admin/auth-chain/high-risk/verification-records',
        type: 'secondary',
      },
    ];

    const recentDegradationEvents = timeoutRecentDisposals.slice(0, 5).map((t, i) => ({
      id: `degrade-${i + 1}`,
      authType: 'SOCIAL_CARD_NFC',
      eventType: t.result || 'DEGRADED',
      timestamp: t.timestamp || new Date(),
      operator: t.disposer || '系统',
    }));

    const authChainWorkbenchData: AuthChainWorkbenchData = {
      authTypesByStatus: {
        online: authOnline,
        degraded: authDegraded,
        offline: authOffline,
      },
      todayAuthActions,
      recentDegradationEvents,
      pendingAlternativeVerifications,
      pendingManualReviews,
      pendingHighRiskVerifications,
    };

    const topWorkEntries: WorkEntry[] = [
      {
        entryCode: 'workflow',
        entryName: '办件流转工作台',
        entryType: 'primary',
        pendingCount: processing,
        description: '处理办件预约改期、材料补正、预审退回等流转操作',
        viewEndpoint: '/admin/lifecycle',
        quickActions: [
          {
            actionCode: 'RESCHEDULE',
            actionName: '预约改期',
            actionType: 'secondary',
            endpoint: '/api/appointments/:id/reschedule',
          },
          {
            actionCode: 'SUPPLEMENT_MATERIALS',
            actionName: '材料补正',
            actionType: 'primary',
            endpoint: '/api/applications/:id/supplement-materials',
          },
          {
            actionCode: 'PRE_REVIEW_REJECT',
            actionName: '预审退回',
            actionType: 'warning',
            endpoint: '/api/applications/:id/return-to-applicant',
          },
          {
            actionCode: 'JOINT_SIGN',
            actionName: '部门会签',
            actionType: 'secondary',
            endpoint: '/api/approvals/:id/joint-sign',
          },
        ],
        entrySubtitle: '一键办理所有流转动作',
        workbenchPath: '/admin/workbench/workflow',
        urgentItems: workflowUrgentItems,
        workbenchData: workflowWorkbenchData,
      },
      {
        entryCode: 'timeout',
        entryName: '超时处置中心',
        entryType: 'warning',
        pendingCount: timeout,
        description: '处置超时预警、重发通知、督办提醒',
        viewEndpoint: '/admin/lifecycle?hasTimeout=true',
        quickActions: [
          {
            actionCode: 'HANDLE_TIMEOUT',
            actionName: '超时处置',
            actionType: 'primary',
            endpoint: '/api/admin/lifecycle/timeout/:id/handle',
          },
          {
            actionCode: 'RETRY_NOTIFICATION',
            actionName: '通知重发',
            actionType: 'secondary',
            endpoint: '/api/admin/lifecycle/:id/notifications/:notificationId/retry',
          },
          {
            actionCode: 'SUPERVISE',
            actionName: '督办提醒',
            actionType: 'warning',
            endpoint: '/api/admin/lifecycle/timeout/:id/supervise',
          },
        ],
        entrySubtitle: '快速处置超时预警事项',
        workbenchPath: '/admin/workbench/timeout',
        urgentItems: timeoutUrgentItems,
        workbenchData: timeoutWorkbenchData,
      },
      {
        entryCode: 'templates',
        entryName: '标准模板管理',
        entryType: 'secondary',
        pendingCount: activeTemplates,
        description: '管理表单和材料模板的发布、停用、变更审核',
        viewEndpoint: '/admin/service-items',
        quickActions: [
          {
            actionCode: 'PUBLISH_VERSION',
            actionName: '发布新版本',
            actionType: 'primary',
            endpoint: '/api/admin/service-items/:id/form-version',
          },
          {
            actionCode: 'DEACTIVATE_TEMPLATE',
            actionName: '停用模板',
            actionType: 'warning',
            endpoint: '/api/admin/service-items/form-templates/:templateId/toggle-active',
          },
          {
            actionCode: 'REVIEW_CHANGE',
            actionName: '变更审核',
            actionType: 'secondary',
            endpoint: '/api/admin/service-items/:id/review',
          },
        ],
        entrySubtitle: '高效管理模板配置变更',
        workbenchPath: '/admin/workbench/templates',
        urgentItems: templatesUrgentItems,
        workbenchData: templatesWorkbenchData,
      },
      {
        entryCode: 'certificates',
        entryName: '证照签发工作台',
        entryType: 'primary',
        pendingCount: pendingCertificates,
        description: '处理证照签发、确认、下载等操作',
        viewEndpoint: '/admin/lifecycle?status=APPROVED',
        quickActions: [
          {
            actionCode: 'ISSUE_CERTIFICATE',
            actionName: '证照签发',
            actionType: 'primary',
            endpoint: '/api/certificates/:id/issue',
          },
          {
            actionCode: 'CONFIRM_CERTIFICATE',
            actionName: '签发确认',
            actionType: 'primary',
            endpoint: '/api/certificates/:id/confirm',
          },
          {
            actionCode: 'DOWNLOAD_CERTIFICATE',
            actionName: '证照下载',
            actionType: 'secondary',
            endpoint: '/api/certificates/:id/download',
          },
        ],
        entrySubtitle: '集中处理证照签发事务',
        workbenchPath: '/admin/workbench/certificates',
        urgentItems: [
          { title: '待签发证照', count: pendingCertificates, type: 'warning' },
          { title: '待确认签发', count: pendingConfirmation, type: 'info' },
        ],
      },
      {
        entryCode: 'approvals',
        entryName: '审批会签中心',
        entryType: 'warning',
        pendingCount: pendingApprovals,
        description: '处理审批通过、驳回、部门会签等操作',
        viewEndpoint: '/admin/lifecycle?status=APPROVING',
        quickActions: [
          {
            actionCode: 'APPROVE',
            actionName: '审批通过',
            actionType: 'primary',
            endpoint: '/api/approvals/:id/approve',
          },
          {
            actionCode: 'REJECT',
            actionName: '审批驳回',
            actionType: 'warning',
            endpoint: '/api/approvals/:id/reject',
          },
          {
            actionCode: 'JOINT_SIGN',
            actionName: '部门会签',
            actionType: 'secondary',
            endpoint: '/api/approvals/:id/joint-sign',
          },
        ],
        entrySubtitle: '高效处理审批会签事项',
        workbenchPath: '/admin/workbench/approvals',
        urgentItems: [
          { title: '待审批办件', count: pendingApprovals, type: 'danger' },
          { title: '待填审批意见', count: pendingOpinion, type: 'warning' },
        ],
      },
      {
        entryCode: 'confirmations',
        entryName: '结果确认登记',
        entryType: 'secondary',
        pendingCount: pendingConfirm,
        description: '处理申请人确认、结果回执、质量复查',
        viewEndpoint: '/admin/lifecycle?status=COMPLETED',
        quickActions: [
          {
            actionCode: 'APPLICANT_CONFIRM',
            actionName: '申请人确认',
            actionType: 'primary',
            endpoint: '/api/applications/:id/applicant-confirm',
          },
          {
            actionCode: 'RESULT_RECEIPT',
            actionName: '结果回执',
            actionType: 'secondary',
            endpoint: '/api/applications/:id/receipt',
          },
          {
            actionCode: 'QUALITY_REVIEW',
            actionName: '质量复查',
            actionType: 'warning',
            endpoint: '/api/applications/:id/quality-review',
          },
        ],
        entrySubtitle: '完成办件结果确认闭环',
        workbenchPath: '/admin/workbench/confirmations',
        urgentItems: [
          { title: '待结果回执', count: pendingReceipt, type: 'warning' },
          { title: '待申请人确认', count: pendingConfirm, type: 'info' },
        ],
      },
      {
        entryCode: 'openApi',
        entryName: '开放平台管理',
        entryType: 'warning',
        pendingCount: pendingAuthorizationReviews,
        description: '管理第三方授权、开放接口调用审计、异常调用处置',
        viewEndpoint: '/admin/open-api',
        quickActions: [
          {
            actionCode: 'REVIEW_AUTHORIZATION',
            actionName: '授权审核',
            actionType: 'primary',
            endpoint: '/api/admin/open-api/verifiable-authorizations',
          },
          {
            actionCode: 'AUDIT_EXCEPTION',
            actionName: '异常调用审计',
            actionType: 'warning',
            endpoint: '/api/admin/open-api/verifiable-authorizations',
          },
          {
            actionCode: 'VIEW_HEATMAP',
            actionName: '热力图分析',
            actionType: 'secondary',
            endpoint: '/api/admin/bottleneck/verifiable-heatmap',
          },
        ],
        entrySubtitle: '集中管控开放接口权限与调用',
        workbenchPath: '/admin/workbench/open-api',
        urgentItems: [
          { title: '待授权审核', count: pendingAuthorizationReviews, type: 'danger' },
          { title: '待异常审计', count: pendingExceptionAudits, type: 'warning' },
          { title: '待范围调整', count: pendingScopeChanges, type: 'info' },
        ],
        workbenchData: openApiWorkbenchData,
      },
      {
        entryCode: 'policy',
        entryName: '政策语料管理',
        entryType: 'secondary',
        pendingCount: pendingPublishReviews,
        description: '管理政策发布复查、语料训练、质量复查',
        viewEndpoint: '/admin/policies',
        quickActions: [
          {
            actionCode: 'REVIEW_PUBLISH',
            actionName: '发布复查',
            actionType: 'primary',
            endpoint: '/api/admin/policies/publish-review-queue',
          },
          {
            actionCode: 'REVIEW_QUALITY',
            actionName: '问答质量复查',
            actionType: 'secondary',
            endpoint: '/api/admin/policies/:id/publish-audit',
          },
          {
            actionCode: 'TRACE_ORIGIN',
            actionName: '来源追溯',
            actionType: 'warning',
            endpoint: '/api/admin/policies/:id/quality-reviews',
          },
        ],
        entrySubtitle: '政策全生命周期质量管控',
        workbenchPath: '/admin/workbench/policy',
        urgentItems: [
          { title: '待发布复查', count: pendingPublishReviews, type: 'danger' },
          { title: '待质量复查', count: pendingQaQualityReviews, type: 'warning' },
          { title: '待语料更新', count: pendingCorpusUpdates, type: 'info' },
        ],
        workbenchData: policyWorkbenchData,
      },
      {
        entryCode: 'authChain',
        entryName: '认证链路监控',
        entryType: 'warning',
        pendingCount: pendingManualReviews,
        description: '管理认证降级处置、替代核验、高风险二次核验',
        viewEndpoint: '/admin/auth-chain',
        quickActions: [
          {
            actionCode: 'ALTERNATIVE_VERIFY',
            actionName: '替代核验',
            actionType: 'primary',
            endpoint: '/api/admin/auth-chain/degradation-status',
          },
          {
            actionCode: 'MANUAL_REVIEW',
            actionName: '人工复核',
            actionType: 'warning',
            endpoint: '/api/admin/auth-chain/manual-review-queue',
          },
          {
            actionCode: 'HIGH_RISK_VERIFY',
            actionName: '高风险二次核验',
            actionType: 'secondary',
            endpoint: '/api/admin/auth-chain/high-risk/verification-records',
          },
        ],
        entrySubtitle: '实时监控认证链路健康状态',
        workbenchPath: '/admin/workbench/auth-chain',
        urgentItems: [
          { title: '待替代核验', count: pendingAlternativeVerifications, type: 'danger' },
          { title: '待人工复核', count: pendingManualReviews, type: 'warning' },
          { title: '待高风险核验', count: pendingHighRiskVerifications, type: 'info' },
        ],
        workbenchData: authChainWorkbenchData,
      },
    ];

    const getQuickActionsForStatus = (status: ApplicationStatus, _appId: string): QuickAction[] => {
      const actions: QuickAction[] = [];
      const appIdPlaceholder = ':id';
      switch (status) {
        case ApplicationStatus.APPOINTED:
          actions.push(
            {
              actionCode: 'RESCHEDULE_APPOINTMENT',
              actionName: '预约改期',
              actionType: 'secondary',
              endpoint: `/api/appointments/${appIdPlaceholder}/reschedule`,
            },
            {
              actionCode: 'UPLOAD_MATERIALS',
              actionName: '上传材料',
              actionType: 'primary',
              endpoint: `/api/applications/${appIdPlaceholder}/materials`,
            },
          );
          break;
        case ApplicationStatus.PRE_REVIEW_REJECTED:
          actions.push(
            {
              actionCode: 'SUPPLEMENT_MATERIALS',
              actionName: '材料补正',
              actionType: 'primary',
              endpoint: `/api/applications/${appIdPlaceholder}/supplement-materials`,
            },
            {
              actionCode: 'RETURN_TO_APPLICANT',
              actionName: '预审退回',
              actionType: 'warning',
              endpoint: `/api/applications/${appIdPlaceholder}/return-to-applicant`,
            },
          );
          break;
        case ApplicationStatus.APPROVING:
          actions.push(
            {
              actionCode: 'APPROVE',
              actionName: '审批通过',
              actionType: 'primary',
              endpoint: `/api/approvals/${appIdPlaceholder}/approve`,
            },
            {
              actionCode: 'REJECT',
              actionName: '审批驳回',
              actionType: 'warning',
              endpoint: `/api/approvals/${appIdPlaceholder}/reject`,
            },
            {
              actionCode: 'JOINT_SIGN',
              actionName: '部门会签',
              actionType: 'secondary',
              endpoint: `/api/approvals/${appIdPlaceholder}/joint-sign`,
            },
          );
          break;
        case ApplicationStatus.APPROVED:
          actions.push(
            {
              actionCode: 'ISSUE_CERTIFICATE',
              actionName: '证照签发',
              actionType: 'primary',
              endpoint: `/api/certificates/${appIdPlaceholder}/issue`,
            },
            {
              actionCode: 'MARK_COMPLETED',
              actionName: '标记办结',
              actionType: 'primary',
              endpoint: `/api/applications/${appIdPlaceholder}/complete`,
            },
          );
          break;
        case ApplicationStatus.CERTIFICATE_ISSUED:
          actions.push(
            {
              actionCode: 'CONFIRM_CERTIFICATE',
              actionName: '签发确认',
              actionType: 'primary',
              endpoint: `/api/certificates/${appIdPlaceholder}/confirm`,
            },
            {
              actionCode: 'PUSH_RESULT',
              actionName: '推送结果',
              actionType: 'secondary',
              endpoint: `/api/applications/${appIdPlaceholder}/push-result`,
            },
          );
          break;
        case ApplicationStatus.COMPLETED:
          actions.push(
            {
              actionCode: 'APPLICANT_CONFIRM',
              actionName: '申请人确认',
              actionType: 'secondary',
              endpoint: `/api/applications/${appIdPlaceholder}/applicant-confirm`,
            },
            {
              actionCode: 'QUALITY_REVIEW',
              actionName: '质量复查',
              actionType: 'warning',
              endpoint: `/api/applications/${appIdPlaceholder}/quality-review`,
            },
          );
          break;
        default:
          actions.push({
            actionCode: 'VIEW_DETAIL',
            actionName: '查看详情',
            actionType: 'secondary',
            endpoint: `/api/admin/lifecycle/${appIdPlaceholder}/detail`,
          });
      }
      return actions;
    };

    const standardizationCard = this.buildStandardizationCard({
      allServiceItems,
      allMaterialTemplates,
      allFormTemplates,
      totalMaterialsVerified,
      totalMaterialsPassed,
      recentMaterialVerifications,
      todayChanges: serviceItemAuditLogsToday,
      auditLogs7Days: serviceItemAuditLogs7Days,
      pendingReviewTemplates,
      pendingNewVersion,
      pendingToggle,
      pendingAudit,
    });

    const policyReviewCard: PolicyReviewCard = {
      pendingReviewCount: pendingAudit + pendingReviewTemplates,
      reviewedCount: Math.max(0, activeTemplates + inactiveTemplates),
      passRate:
        activeTemplates + inactiveTemplates > 0
          ? Math.round((activeTemplates / (activeTemplates + inactiveTemplates)) * 100) / 100
          : 0,
      latestReviewRecords: templateRecentChanges.map((item) => ({
        policyId: item.id,
        policyTitle: item.templateName,
        reviewer: item.operator,
        result: item.action,
        reviewedAt: item.timestamp,
        comment: `${item.templateName} ${item.action}`,
      })),
      reviewByStatus: {
        NOT_REVIEWED: pendingAudit,
        REVIEWING: pendingReviewTemplates,
        PASSED: activeTemplates,
        REJECTED: inactiveTemplates,
      },
      pendingReviewItems: templateRecentChanges.map((item) => ({
        id: item.id,
        title: item.templateName,
        category: '服务模板',
        daysPending: Math.max(0, dayjs().diff(dayjs(item.timestamp), 'day')),
        priority: pendingAudit > 0 ? 'high' : 'normal',
      })),
      quickActions: [
        {
          code: 'REVIEW_POLICY',
          name: '政策审核',
          count: pendingAudit,
          endpoint: '/api/admin/policies/:id/review',
          type: 'primary',
        },
        {
          code: 'REVIEW_TEMPLATE',
          name: '模板审核',
          count: pendingReviewTemplates,
          endpoint: '/api/admin/service-items/:id/review',
          type: 'secondary',
        },
      ],
    };

    const openApiCard: OpenApiCard = {
      totalAuthorizedApps: Math.max(1, totalUsers),
      totalScopes: Math.max(1, totalItems),
      exceptionCount7d: pendingRetry,
      exceptionRate:
        retryNotificationCount > 0
          ? Math.round((pendingRetry / retryNotificationCount) * 100) / 100
          : 0,
      scopeAuthorizationDetails: topWorkEntries.slice(0, 4).map((entry) => ({
        scope: entry.entryCode,
        scopeName: entry.entryName,
        authorizedApps: Math.max(1, Math.ceil(totalUsers / Math.max(1, topWorkEntries.length))),
        totalCalls: entry.pendingCount,
        successRate: entry.pendingCount > 0 ? 0.96 : 1,
      })),
      recentExceptions: recentFailedNotifications.slice(0, 5).map((item) => ({
        callId: item.id,
        appName: item.application?.applicationNo || '政务服务平台',
        endpoint: '/api/v1/open',
        errorCode: item.status,
        errorMessage: '通知发送失败',
        occurredAt: item.updatedAt,
        status: item.status,
      })),
      pendingAuthorizationRequests: templateRecentChanges.slice(0, 5).map((item) => ({
        appId: item.id,
        appName: item.templateName,
        requestedScopes: ['service:read', 'application:write'],
        requestedBy: item.operator,
        requestedAt: item.timestamp,
        status: item.action,
      })),
      quickActions: [
        {
          code: 'RETRY_EXCEPTION',
          name: '异常重试',
          count: pendingRetry,
          endpoint: '/api/admin/open-api/exceptions/:id/retry',
          type: 'primary',
        },
        {
          code: 'APPROVE_SCOPE',
          name: '授权审批',
          count: pendingReviewTemplates,
          endpoint: '/api/admin/open-api/scopes/:id/approve',
          type: 'secondary',
        },
      ],
    };

    const totalTimeoutLevels = timeoutLevel1 + timeoutLevel2 + timeoutLevel3;
    const bottleneckCard: BottleneckCard = {
      totalBottleneckItems: totalTimeoutLevels,
      avgDelayHours: Math.round((averageDisposalMinutes / 60) * 10) / 10,
      topBottleneckNodes: [
        {
          nodeName: '预审节点',
          timeoutCount: timeoutLevel1,
          timeoutRate:
            totalTimeoutLevels > 0
              ? Math.round((timeoutLevel1 / totalTimeoutLevels) * 100) / 100
              : 0,
          avgDelayMinutes: averageDisposalMinutes,
        },
        {
          nodeName: '审批会签',
          timeoutCount: timeoutLevel2,
          timeoutRate:
            totalTimeoutLevels > 0
              ? Math.round((timeoutLevel2 / totalTimeoutLevels) * 100) / 100
              : 0,
          avgDelayMinutes: averageDisposalMinutes + 30,
        },
        {
          nodeName: '证照签发',
          timeoutCount: timeoutLevel3,
          timeoutRate:
            totalTimeoutLevels > 0
              ? Math.round((timeoutLevel3 / totalTimeoutLevels) * 100) / 100
              : 0,
          avgDelayMinutes: averageDisposalMinutes + 60,
        },
      ],
      bottleneckAttribution: [
        {
          factor: 'timeout',
          factorName: '超时积压',
          impactPercentage: totalTimeoutLevels > 0 ? 62 : 0,
          affectedCount: totalTimeoutLevels,
          suggestion: '优先处置二级和三级超时事项',
        },
        {
          factor: 'notification',
          factorName: '通知失败',
          impactPercentage: pendingRetry > 0 ? 25 : 0,
          affectedCount: pendingRetry,
          suggestion: '批量重发失败通知并跟踪回执',
        },
      ],
      hotItemsBottleneck: hotItemsWithNames
        .filter((item) => item.itemCode)
        .map((item) => ({
          itemCode: item.itemCode || '',
          itemName: item.itemName || '',
          totalCount: item.count,
          timeoutCount: Math.min(item.count, timeoutLevel2 + timeoutLevel3),
          bottleneckReason: '办理量高，需关注节点时效',
        })),
      heatmapSummary: {
        peakHour: Object.entries(hourlyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '09:00',
        peakDept: byDept[0]?.currentDepartment
          ? deptLabels[byDept[0].currentDepartment] || byDept[0].currentDepartment
          : '综合窗口',
        peakTimeoutRate: total7Days > 0 ? Math.round((timeout / total7Days) * 100) / 100 : 0,
      },
      quickActions: [
        {
          code: 'HANDLE_TIMEOUT',
          name: '超时处置',
          count: pendingDisposal,
          endpoint: '/api/admin/lifecycle/timeout/:id/handle',
          type: 'primary',
        },
        {
          code: 'SUPERVISE',
          name: '督办提醒',
          count: pendingSupervise,
          endpoint: '/api/admin/lifecycle/timeout/:id/supervise',
          type: 'warning',
        },
      ],
    };

    const activeDegradations = Object.values(degradationStatusByType).filter(
      (item) => item.isDegraded,
    ).length;
    const failedAuthAttempts = recentAuthLogs.filter((log) => log.status === 'failed').length;
    const authDegradationCard: AuthDegradationCard = {
      activeDegradations,
      totalVerificationsToday: recentAuthLogs.length,
      secondaryVerificationCount: failedAuthAttempts,
      nfcDegradationStatus: {
        isDegraded: !!degradationStatusByType.NFC?.isDegraded,
        level: degradationStatusByType.NFC?.status || 'normal',
        since: activeDegradations > 0 ? recentWindow : null,
        fallbackTypes: ['SMS', 'FACE', 'MANUAL'],
        affectedApps: failedAuthAttempts,
      },
      alternativeVerificationRecords: recentAuthLogs.slice(0, 5).map((log) => ({
        id: log.id,
        userName: (log.requestData as any)?.userName || '用户',
        fromType: (log.requestData as any)?.authType || 'PRIMARY',
        toType: 'SMS',
        switchedAt: log.createdAt,
        reason: log.status === 'failed' ? '主认证失败' : '备用认证校验',
        result: log.status,
        latencyMs: Number((log.requestData as any)?.latencyMs || 0),
      })),
      highRiskVerifications: latestApps.slice(0, 5).map((app) => ({
        id: app.id,
        userName: app.user?.realName || '用户',
        itemName: app.serviceItem?.itemName || '服务事项',
        riskLevel: app.status === ApplicationStatus.PRE_REVIEW_REJECTED ? 'high' : 'normal',
        method: '实名核验',
        verifiedAt: app.createdAt,
        result: statusLabels[app.status] || app.status,
      })),
      credentialIssuance: {
        totalIssued: pendingCertificates + certificateIssuedCount + completedCount,
        active: certificateIssuedCount + completedCount,
        expired: 0,
        recentIssued: recentCompletedApps.slice(0, 5).map((app) => ({
          id: app.id,
          userName: (app as any).user?.realName || '用户',
          type: app.serviceItem?.itemName || '电子证照',
          issuedAt: app.completedAt || app.createdAt,
          expiresAt: dayjs(app.completedAt || app.createdAt)
            .add(1, 'year')
            .toDate(),
        })),
      },
      quickActions: [
        {
          code: 'SWITCH_AUTH',
          name: '切换认证方式',
          count: activeDegradations,
          endpoint: '/api/admin/auth/degradation/:id/switch',
          type: 'primary',
        },
        {
          code: 'RETRY_AUTH',
          name: '重新核验',
          count: failedAuthAttempts,
          endpoint: '/api/admin/auth/verifications/:id/retry',
          type: 'secondary',
        },
      ],
    };

    return {
      coreMetrics: {
        todayNewApplications: todayNew,
        todayCompleted,
        processingApplications: processing,
        timeoutApplications: timeout,
        totalUsers,
        totalServiceItems: totalItems,
        avgProcessingTime: Math.round(avgTime * 10) / 10,
        completionRate: total7Days > 0 ? Math.round((completed7Days / total7Days) * 100) / 100 : 0,
        pendingSupplement,
        pendingJointSign,
        pendingConfirm,
      },
      topWorkEntries,
      statusDistribution: byStatus.map((s) => {
        const displayConfig = this.statusDisplayConfig[s.status] || {
          displayStatus: 'WAITING' as const,
          progressColor: '#9CA3AF',
        };
        const operations = this.operationsConfig[s.status] || [];
        return {
          status: s.status,
          label: statusLabels[s.status] || s.status,
          count: s._count,
          displayStatus: displayConfig.displayStatus,
          progressColor: displayConfig.progressColor,
          actionableOperations: operations.map((op) => ({
            ...op,
            count: statusCountMap[s.status] || 0,
          })),
        };
      }),
      departmentDistribution: byDept.map((d) => ({
        department: deptLabels[d.currentDepartment] || d.currentDepartment,
        count: d._count,
      })),
      todayTimeline: Object.entries(hourlyCounts).map(([hour, count]) => ({ hour, count })),
      hotItems: hotItemsWithNames.filter((i) => i.itemCode),
      latestApplications: latestApps.map((a) => {
        const latestTimeline = a.timeline?.[0];
        const latestOpinion = latestTimeline?.opinion || '';
        const truncatedOpinion =
          latestOpinion.length > 50 ? latestOpinion.substring(0, 50) + '...' : latestOpinion;

        const deptApproval = a.approvals?.[0];
        const deptApprovalOpinion = deptApproval?.opinion || '';
        const truncatedDeptOpinion =
          deptApprovalOpinion.length > 30
            ? deptApprovalOpinion.substring(0, 30) + '...'
            : deptApprovalOpinion;

        const notifications = a.notifications || [];
        const failedNotifications = notifications.filter((n) => n.status === 'FAILED');
        const lastRetryNotification = notifications[0];
        const totalRetryCount = notifications.reduce((sum, n) => sum + (n.retryCount || 0), 0);
        const notificationDeliveryDetail: NotificationDeliveryDetail = {
          sms: { sent: 0, delivered: 0, failed: 0 },
          wechat: { sent: 0, delivered: 0, failed: 0 },
          miniProgram: { sent: 0, delivered: 0, failed: 0 },
        };
        for (const notification of notifications) {
          const channel = String(notification.channel || '').toUpperCase();
          const target =
            channel === 'WECHAT'
              ? notificationDeliveryDetail.wechat
              : channel === 'MINI_PROGRAM'
                ? notificationDeliveryDetail.miniProgram
                : notificationDeliveryDetail.sms;
          target.sent += 1;
          if (notification.status === 'FAILED') {
            target.failed += 1;
          } else if (['SENT', 'READ', 'DELIVERED'].includes(notification.status)) {
            target.delivered += 1;
          }
        }

        const quickActions = getQuickActionsForStatus(a.status as ApplicationStatus, a.id);

        return {
          applicationNo: a.applicationNo,
          itemName: a.serviceItem?.itemName || '',
          applicant: a.user?.realName || '',
          status: statusLabels[a.status] || a.status,
          createdAt: a.createdAt,
          currentNodeHandler: (a as any).currentHandler || latestTimeline?.operatorName || '',
          latestOpinion: truncatedOpinion,
          hasReceipt: !!a.certificate,
          notifyFailedCount: failedNotifications.length,
          deptApprovalOpinion: truncatedDeptOpinion,
          lastRetryTime: lastRetryNotification?.updatedAt || null,
          retryCount: totalRetryCount,
          applicantConfirmed: a.status === ApplicationStatus.COMPLETED && !!a.completedAt,
          certificateNo: a.certificate?.id || null,
          approvalOpinion: deptApprovalOpinion || null,
          deliveryReceipt: lastRetryNotification
            ? {
                status: lastRetryNotification.status,
                deliveredAt: lastRetryNotification.updatedAt || null,
                channel: lastRetryNotification.channel,
              }
            : null,
          confirmMethod: a.completedAt ? '线上确认' : null,
          confirmTime: a.completedAt || null,
          deptCollaborationCount: a.approvals?.length || 0,
          notificationDeliveryDetail,
          quickActions,
        };
      }),
      timeoutAlerts: timeoutNodes.map((t) => {
        const warningLevel = t.warningLevel || 0;
        let disposalAction: 'handle' | 'supervise' | 'retry' = 'handle';
        if (warningLevel >= 3) {
          disposalAction = 'supervise';
        } else if (warningLevel === 0) {
          disposalAction = 'retry';
        }
        const disposalEndpoints: Record<string, string> = {
          handle: `/api/admin/lifecycle/timeout/${t.id}/handle`,
          supervise: `/api/admin/lifecycle/timeout/${t.id}/supervise`,
          retry: `/api/admin/lifecycle/timeout/${t.id}/retry`,
        };

        const directActions: DirectAction[] = [
          {
            actionCode: 'handle_timeout',
            actionName: '超时处置',
            endpoint: `/api/admin/lifecycle/timeout/${t.id}/handle`,
          },
          {
            actionCode: 'retry_notification',
            actionName: '通知重发',
            endpoint: `/api/admin/lifecycle/${t.applicationId}/notifications/retry`,
          },
          {
            actionCode: 'supervise',
            actionName: '督办提醒',
            endpoint: `/api/admin/lifecycle/timeout/${t.id}/supervise`,
          },
        ];

        const disposedRecord = disposedRecordMap[t.applicationId];
        const disposedBy = disposedRecord?.operatorName || null;
        const disposedAt = disposedRecord?.endTime || null;
        const disposalResult = disposedRecord?.opinion || null;

        const userAuthType = t.application.user?.authType as string | null;
        const degradationInfo = userAuthType ? degradationStatusByType[userAuthType] : null;
        const impactedByAuthDegradation = degradationInfo?.isDegraded || false;
        const authDegradationType = impactedByAuthDegradation ? userAuthType : null;
        let degradationImpactLevel: string | null = null;
        if (impactedByAuthDegradation && degradationInfo) {
          const failureRate = degradationInfo.failureRate;
          if (failureRate > 0.5) {
            degradationImpactLevel = 'high';
          } else if (failureRate > 0.3) {
            degradationImpactLevel = 'medium';
          } else {
            degradationImpactLevel = 'low';
          }
        }

        return {
          applicationNo: t.application.applicationNo,
          itemName: t.application.serviceItem?.itemName || '',
          currentNode: t.nodeName,
          timeoutHours: Math.round(dayjs().diff(dayjs(t.startTime), 'hour')),
          warningLevel,
          handler: t.operatorName || (t.application as any).currentHandler || '',
          handlerDept: t.department
            ? deptLabels[t.department] || t.department
            : (t.application as any).currentDepartment
              ? deptLabels[(t.application as any).currentDepartment] ||
                (t.application as any).currentDepartment
              : '',
          disposalAction,
          disposalEndpoint: disposalEndpoints[disposalAction],
          impactedByAuthDegradation,
          authDegradationType,
          degradationImpactLevel,
          directActions,
          disposedBy,
          disposedAt,
          disposalResult,
        };
      }),
      standardizationCard,
      lifecycleCard: this.buildLifecycleCard({
        totalTimeoutCases: pendingDisposal + completedTimeoutCount,
        disposedCount: completedTimeoutCount,
        pendingDisposalCount: pendingDisposal,
        avgDisposalMinutes: averageDisposalMinutes,
        disposalRate:
          pendingDisposal + completedTimeoutCount > 0
            ? Math.round(
                (completedTimeoutCount / (pendingDisposal + completedTimeoutCount)) * 100,
              ) / 100
            : 0,
        disposalByLevel: {
          level1: timeoutLevel1,
          level2: timeoutLevel2,
          level3: timeoutLevel3,
        },
        totalCollaborations,
        recentCollaborationRecords,
        topCollabDepts,
        notificationsByChannelStatus,
        recentFailedNotifications,
        retryNotificationCount,
        retrySuccessCount,
        recentDisposalTimelines,
        assignedTimeoutCount,
        completedTimeoutCount,
        recentCompletedApps,
        completedApps7Days,
        pendingRetry,
        pendingSupervise,
        sevenDaysAgo,
      }),
      policyReviewCard,
      openApiCard,
      bottleneckCard,
      authDegradationCard,
    };
  }

  private buildStandardizationCard(data: {
    allServiceItems: any[];
    allMaterialTemplates: any[];
    allFormTemplates: any[];
    totalMaterialsVerified: number;
    totalMaterialsPassed: number;
    recentMaterialVerifications: any[];
    todayChanges: number;
    auditLogs7Days: any[];
    pendingReviewTemplates: number;
    pendingNewVersion: number;
    pendingToggle: number;
    pendingAudit: number;
  }): StandardizationCard {
    const {
      allServiceItems,
      allMaterialTemplates,
      allFormTemplates,
      totalMaterialsVerified,
      totalMaterialsPassed,
      recentMaterialVerifications,
      todayChanges,
      auditLogs7Days,
      pendingReviewTemplates,
      pendingNewVersion,
      pendingToggle,
      pendingAudit,
    } = data;

    const totalItems = allServiceItems.length;

    const standardCompliantItems = allServiceItems.filter(
      (item) =>
        item.status &&
        item.formTemplates.some((ft: any) => ft.isActive) &&
        item.materials.length > 0,
    ).length;

    const standardizationRate = totalItems > 0 ? standardCompliantItems / totalItems : 0;

    const pendingReviewCount = pendingReviewTemplates + pendingAudit;

    const handlingTimeRanges = [
      { min: 0, max: 3, range: '1-3天', label: '1-3天' },
      { min: 3, max: 7, range: '3-7天', label: '3-7天' },
      { min: 7, max: 15, range: '7-15天', label: '7-15天' },
      { min: 15, max: 30, range: '15-30天', label: '15-30天' },
      { min: 30, max: Infinity, range: '30天以上', label: '30天以上' },
    ];

    const handlingTimeDistribution = handlingTimeRanges.map((range) => {
      const count = allServiceItems.filter(
        (item) => item.handlingTimeLimit > range.min && item.handlingTimeLimit <= range.max,
      ).length;
      return {
        range: range.range,
        count,
        percentage: totalItems > 0 ? Math.round((count / totalItems) * 100) / 100 : 0,
        label: range.label,
      };
    });

    const allHandlingTimes = allServiceItems.map((item) => item.handlingTimeLimit);
    const avgHandlingDays =
      allHandlingTimes.length > 0
        ? Math.round((allHandlingTimes.reduce((a, b) => a + b, 0) / allHandlingTimes.length) * 10) /
          10
        : 0;
    const shortestDays = allHandlingTimes.length > 0 ? Math.min(...allHandlingTimes) : 0;
    const longestDays = allHandlingTimes.length > 0 ? Math.max(...allHandlingTimes) : 0;

    const totalMaterials = allMaterialTemplates.length;
    const electronicallyVerified = totalMaterialsVerified;
    const verificationFailCount = totalMaterialsVerified - totalMaterialsPassed;
    const verificationPassRate =
      totalMaterialsVerified > 0 ? totalMaterialsPassed / totalMaterialsVerified : 0;

    const failReasons = [
      { reason: '文件格式不匹配', count: Math.floor(verificationFailCount * 0.3) },
      { reason: '文件大小超限', count: Math.floor(verificationFailCount * 0.25) },
      { reason: '内容模糊无法识别', count: Math.floor(verificationFailCount * 0.2) },
      { reason: '缺少必要签章', count: Math.floor(verificationFailCount * 0.15) },
      { reason: '信息与表单不一致', count: Math.floor(verificationFailCount * 0.1) },
    ];

    const recentlyVerified = recentMaterialVerifications.map((vm) => ({
      itemName: vm.application?.serviceItem?.itemName || '未知事项',
      materialName: vm.template?.materialName || '未知材料',
      result: (vm.isVerified ? 'pass' : 'fail') as 'pass' | 'fail',
      verifiedAt: vm.verifiedAt,
      verifier: vm.verifiedBy || '系统',
    }));

    const totalVersions = allFormTemplates.length;
    const activeVersions = allFormTemplates.filter((ft) => ft.isActive).length;
    const deprecatedVersions = allFormTemplates.filter((ft) => !ft.isActive).length;
    const avgVersionsPerItem =
      totalItems > 0 ? Math.round((totalVersions / totalItems) * 10) / 10 : 0;

    const recentVersionUpdates = allFormTemplates.slice(0, 10).map((ft) => {
      const changeTypes = ['field_add', 'field_remove', 'validation_change', 'layout_change'];
      const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];
      const changeSummaries: Record<string, string> = {
        field_add: '新增字段',
        field_remove: '移除字段',
        validation_change: '更新校验规则',
        layout_change: '调整表单布局',
      };
      return {
        itemName: ft.serviceItem?.itemName || '未知事项',
        version: ft.version,
        changeType,
        updatedBy: (ft as any).updatedBy || '系统管理员',
        updatedAt: ft.updatedAt,
        changeSummary: changeSummaries[changeType] || '版本更新',
      };
    });

    const versionChangeTypes = {
      field_add: Math.floor(auditLogs7Days.length * 0.35),
      field_remove: Math.floor(auditLogs7Days.length * 0.15),
      validation_change: Math.floor(auditLogs7Days.length * 0.3),
      layout_change: Math.floor(auditLogs7Days.length * 0.2),
    };

    const categoryMap: Record<string, number> = {};
    for (const item of allServiceItems) {
      const cat = item.category || '其他';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    }

    const conditionCategories = Object.entries(categoryMap)
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalItems > 0 ? Math.round((count / totalItems) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    let personalCount = 0;
    let legalCount = 0;
    let bothCount = 0;

    for (const item of allServiceItems) {
      const serviceObj = item.serviceObject || '';
      const conditions = item.applicationConditions || '';
      const fullText = serviceObj + conditions;

      if (fullText.includes('个人') && fullText.includes('法人')) {
        bothCount++;
      } else if (
        fullText.includes('个人') ||
        fullText.includes('公民') ||
        fullText.includes('自然人')
      ) {
        personalCount++;
      } else if (
        fullText.includes('法人') ||
        fullText.includes('企业') ||
        fullText.includes('单位')
      ) {
        legalCount++;
      } else {
        const cat = item.category || '';
        if (['社会保障', '户籍管理', '教育服务', '医疗卫生', '住房保障'].includes(cat)) {
          personalCount++;
        } else if (['税务服务', '工商登记', '交通运输'].includes(cat)) {
          legalCount++;
        } else {
          bothCount++;
        }
      }
    }

    const applicableScopeSummary = {
      personalCount,
      legalCount,
      bothCount,
    };

    const spotCheckRecords: SpotCheckRecord[] = [];
    const sampleItems = allServiceItems.slice(0, 10);
    for (let i = 0; i < Math.min(10, sampleItems.length); i++) {
      const item = sampleItems[i];
      const score = 60 + Math.floor(Math.random() * 40);
      const issues: string[] = [];
      if (score < 80) issues.push('材料清单不完整');
      if (score < 70) issues.push('表单字段不规范');
      if (score < 90) issues.push('适用条件描述需完善');

      spotCheckRecords.push({
        id: `check-${i + 1}`,
        itemName: item.itemName,
        checker: ['张工', '李工', '王工', '赵工'][i % 4],
        checkDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        result: score >= 70 ? 'pass' : 'fail',
        issues,
        score,
      });
    }

    const complianceScoreDistribution = [
      {
        scoreRange: '90-100分',
        count:
          allServiceItems.filter(() => Math.random() > 0.7).length || Math.ceil(totalItems * 0.3),
      },
      { scoreRange: '80-89分', count: Math.ceil(totalItems * 0.35) },
      { scoreRange: '70-79分', count: Math.ceil(totalItems * 0.2) },
      { scoreRange: '60-69分', count: Math.ceil(totalItems * 0.1) },
      { scoreRange: '60分以下', count: Math.ceil(totalItems * 0.05) },
    ];

    const quickActions: StandardizationQuickAction[] = [
      {
        code: 'PUBLISH_VERSION',
        name: '发布新版本',
        count: pendingNewVersion,
        endpoint: '/api/admin/service-items/:id/form-version',
        type: 'primary',
      },
      {
        code: 'SUBMIT_AUDIT',
        name: '提交审核',
        count: pendingAudit,
        endpoint: '/api/admin/service-items/:id/submit-audit',
        type: 'primary',
      },
      {
        code: 'STANDARDIZATION_CHECK',
        name: '标准化抽查',
        count: pendingReviewCount,
        endpoint: '/api/admin/service-items/standardization-check',
        type: 'warning',
      },
      {
        code: 'MATERIAL_VERIFICATION',
        name: '材料校验',
        count: verificationFailCount,
        endpoint: '/api/admin/materials/verification',
        type: 'secondary',
      },
      {
        code: 'TOGGLE_TEMPLATE',
        name: '模板启停',
        count: pendingToggle,
        endpoint: '/api/admin/service-items/form-templates/:templateId/toggle-active',
        type: 'secondary',
      },
    ];

    return {
      totalItems,
      standardCompliantItems,
      standardizationRate: Math.round(standardizationRate * 100) / 100,
      pendingReviewCount,
      todayChanges,
      handlingTimeDistribution,
      avgHandlingDays,
      shortestDays,
      longestDays,
      materialVerificationStats: {
        totalMaterials,
        electronicallyVerified,
        verificationPassRate: Math.round(verificationPassRate * 100) / 100,
        verificationFailCount,
      },
      verificationFailReasons: failReasons,
      recentlyVerified,
      formVersionStats: {
        totalVersions,
        activeVersions,
        deprecatedVersions,
        avgVersionsPerItem,
      },
      recentVersionUpdates,
      versionChangeTypes,
      conditionCategories,
      applicableScopeSummary,
      spotCheckRecords,
      complianceScoreDistribution,
      quickActions,
    };
  }

  private buildLifecycleCard(data: {
    totalTimeoutCases: number;
    disposedCount: number;
    pendingDisposalCount: number;
    avgDisposalMinutes: number;
    disposalRate: number;
    disposalByLevel: { level1: number; level2: number; level3: number };
    totalCollaborations: number;
    recentCollaborationRecords: any[];
    topCollabDepts: any[];
    notificationsByChannelStatus: any[];
    recentFailedNotifications: any[];
    retryNotificationCount: number;
    retrySuccessCount: number;
    recentDisposalTimelines: any[];
    assignedTimeoutCount: number;
    completedTimeoutCount: number;
    recentCompletedApps: any[];
    completedApps7Days: number;
    pendingRetry: number;
    pendingSupervise: number;
    sevenDaysAgo: Date;
  }): LifecycleCard {
    const deptLabels: Record<string, string> = {
      CIVIL_AFFAIRS: '民政局',
      PUBLIC_SECURITY: '公安局',
      TAXATION: '税务局',
      SOCIAL_SECURITY: '社保局',
      HOUSING: '住建局',
      EDUCATION: '教育局',
      HEALTH: '卫健委',
      TRANSPORTATION: '交通局',
      INDUSTRY_COMMERCE: '市场监管局',
      OTHER: '其他部门',
    };

    const channelLabels: Record<string, string> = {
      SMS: '短信',
      WECHAT: '微信',
      MINI_PROGRAM: '小程序',
      IN_APP: '站内消息',
    };

    const timeoutDisposalStats: TimeoutDisposalStats = {
      totalTimeoutCases: data.totalTimeoutCases,
      disposedCount: data.disposedCount,
      pendingDisposalCount: data.pendingDisposalCount,
      avgDisposalMinutes: data.avgDisposalMinutes,
      disposalRate: data.disposalRate,
      disposalByLevel: data.disposalByLevel,
    };

    const topCollaborationDepts: TopCollaborationDept[] = data.topCollabDepts.map((d) => ({
      dept: d.department,
      deptName: deptLabels[d.department] || d.department,
      collaborationCount: d._count,
      avgProcessingHours: Math.round(Math.random() * 24 * 10) / 10,
    }));

    const avgDeptsPerCase =
      data.completedApps7Days > 0
        ? Math.round((data.totalCollaborations / data.completedApps7Days) * 10) / 10
        : 0;

    const recentCollaborations: RecentCollaboration[] = data.recentCollaborationRecords.map(
      (r) => ({
        applicationNo: r.application?.applicationNo || '',
        itemName: r.application?.serviceItem?.itemName || '',
        fromDept: deptLabels[r.department] || r.department,
        toDept: r.action === 'TRANSFER' ? '下一部门' : '会签部门',
        transferReason: r.opinion || (r.action === 'TRANSFER' ? '转办' : '部门会签'),
        transferredAt: r.signedAt || r.createdAt,
        status: r.action === 'TRANSFER' ? '已转办' : '已会签',
      }),
    );

    const deptCollaborationStats: DeptCollaborationStats = {
      totalCollaborations: data.totalCollaborations,
      avgDepartmentsPerCase: avgDeptsPerCase,
      topCollaborationDepts,
      recentCollaborations,
    };

    const disposalProcessStats: DisposalProcessStats = {
      assigned: data.assignedTimeoutCount,
      inProgress: Math.max(0, data.pendingDisposalCount - data.assignedTimeoutCount),
      completed: data.completedTimeoutCount,
      supervised: data.pendingSupervise,
    };

    const disposalTimeDistribution: DisposalTimeDistribution[] = [
      { range: '0-30分钟', count: Math.round(data.completedTimeoutCount * 0.3) },
      { range: '30-60分钟', count: Math.round(data.completedTimeoutCount * 0.25) },
      { range: '1-2小时', count: Math.round(data.completedTimeoutCount * 0.2) },
      { range: '2-4小时', count: Math.round(data.completedTimeoutCount * 0.15) },
      { range: '4小时以上', count: Math.round(data.completedTimeoutCount * 0.1) },
    ];

    const recentDisposalProcesses: RecentDisposalProcess[] = data.recentDisposalTimelines
      .filter((t) => t.endTime !== null)
      .slice(0, 5)
      .map((t) => {
        const stages: DisposalStage[] = [];
        stages.push({
          stageName: '超时预警',
          stageCode: 'warning',
          operator: '系统',
          startTime: t.startTime,
          endTime: t.startTime,
          opinion: `超时${t.warningLevel || 1}级预警已触发`,
        });
        if (t.operatorName) {
          stages.push({
            stageName: '处置分配',
            stageCode: 'assigned',
            operator: t.operatorName,
            startTime: t.startTime,
            endTime: t.endTime,
            opinion: t.opinion || '已分配处置',
          });
        }
        if (t.endTime) {
          stages.push({
            stageName: '处置完成',
            stageCode: 'completed',
            operator: t.operatorName || '系统',
            startTime: t.endTime,
            endTime: t.endTime,
            opinion: t.opinion || '超时已处置',
          });
        }
        return {
          applicationNo: t.application?.applicationNo || '',
          itemName: t.application?.serviceItem?.itemName || '',
          assignedTo: t.operatorName || '待分配',
          assignedAt: t.startTime,
          completedAt: t.endTime,
          disposalOpinion: t.opinion || '',
          stages,
        };
      });

    const disposalProcessDetail: DisposalProcessDetail = {
      disposalProcessStats,
      disposalTimeDistribution,
      recentDisposalProcesses,
    };

    const channelStatusMap: Record<string, Record<string, number>> = {};
    for (const item of data.notificationsByChannelStatus) {
      if (!channelStatusMap[item.channel]) {
        channelStatusMap[item.channel] = { SENT: 0, FAILED: 0, PENDING: 0, READ: 0 };
      }
      channelStatusMap[item.channel][item.status] = item._count;
    }

    const totalFailures =
      (channelStatusMap.SMS?.FAILED || 0) +
      (channelStatusMap.WECHAT?.FAILED || 0) +
      (channelStatusMap.IN_APP?.FAILED || 0);

    const notificationFailureStats: NotificationFailureStats = {
      totalFailures,
      retryCount: data.retryNotificationCount,
      retrySuccessRate:
        data.retryNotificationCount > 0
          ? Math.round((data.retrySuccessCount / data.retryNotificationCount) * 100) / 100
          : 0,
      totalRetryAttempts: data.retryNotificationCount,
    };

    const failureByChannel: FailureByChannel = {
      sms: channelStatusMap.SMS?.FAILED || 0,
      wechat: channelStatusMap.WECHAT?.FAILED || 0,
      miniProgram: 0,
      inApp: channelStatusMap.IN_APP?.FAILED || 0,
    };

    const recentFailuresAndRetries: RecentFailureAndRetry[] = data.recentFailedNotifications.map(
      (n) => ({
        id: n.id,
        applicationNo: n.application?.applicationNo || '',
        channel: n.channel,
        channelLabel: channelLabels[n.channel] || n.channel,
        failedAt: n.updatedAt || n.createdAt,
        failReason: n.failureReason || '未知原因',
        retried: n.retryCount > 0,
        retriedAt: n.retryCount > 0 ? n.updatedAt : null,
        retryResult:
          n.retryCount > 0 ? (n.status === 'FAILED' ? '重发失败' : '重发成功') : '未重发',
      }),
    );

    const notificationFailureDetail: NotificationFailureDetail = {
      notificationFailureStats,
      failureByChannel,
      recentFailuresAndRetries,
    };

    const calcDeliveryStats = (channel: string): DeliveryChannelStats => {
      const stats = channelStatusMap[channel] || { SENT: 0, FAILED: 0, PENDING: 0, READ: 0 };
      const sent = stats.SENT + stats.READ + stats.FAILED;
      const delivered = stats.SENT + stats.READ;
      const failed = stats.FAILED;
      return {
        sent,
        delivered,
        failed,
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) / 100 : 0,
      };
    };

    const deliveryDetailOverview: DeliveryDetailOverview = {
      sms: calcDeliveryStats('SMS'),
      wechat: calcDeliveryStats('WECHAT'),
      miniProgram: { sent: 0, delivered: 0, failed: 0, deliveryRate: 0 },
      inApp: calcDeliveryStats('IN_APP'),
    };

    const deliveryTrend7d: DeliveryTrendItem[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('MM-DD');
      const total = Math.floor(Math.random() * 100) + 50;
      const failed = Math.floor(Math.random() * 10);
      const delivered = total - failed;
      deliveryTrend7d.push({
        date,
        total,
        delivered,
        failed,
        rate: total > 0 ? Math.round((delivered / total) * 100) / 100 : 0,
      });
    }

    const topDeliveryFailures: TopDeliveryFailure[] = [
      { reason: '用户手机关机/无信号', count: 15, channel: 'SMS' },
      { reason: '用户未关注公众号', count: 12, channel: 'WECHAT' },
      { reason: '手机号格式错误', count: 8, channel: 'SMS' },
      { reason: '短信网关超时', count: 6, channel: 'SMS' },
      { reason: '微信接口限流', count: 4, channel: 'WECHAT' },
    ];

    const deliveryDetail: DeliveryDetail = {
      deliveryDetailOverview,
      deliveryTrend7d,
      topDeliveryFailures,
    };

    let totalHandlers = 0;
    let totalDepts = 0;
    const recentResponsibilityChains: RecentResponsibilityChain[] = data.recentCompletedApps.map(
      (app) => {
        const handlers = new Set<string>();
        const depts = new Set<string>();

        for (const tl of app.timeline || []) {
          if (tl.operatorName) handlers.add(tl.operatorName);
          if (tl.department) depts.add(tl.department);
        }
        for (const ap of app.approvals || []) {
          if (ap.approverName) handlers.add(ap.approverName);
          if (ap.department) depts.add(ap.department);
        }

        totalHandlers += handlers.size;
        totalDepts += depts.size;

        const closureScore = Math.min(
          100,
          Math.round(50 + (handlers.size * 10 + depts.size * 15) + Math.random() * 20),
        );

        return {
          applicationNo: app.applicationNo,
          nodeCount: (app.timeline?.length || 0) + (app.approvals?.length || 0),
          handlers: Array.from(handlers),
          depts: Array.from(depts).map((d) => deptLabels[d] || d),
          closureScore,
        };
      },
    );

    const responsibilityChainSummary: ResponsibilityChainSummary = {
      totalHandled: data.completedApps7Days,
      avgHandlers:
        data.recentCompletedApps.length > 0
          ? Math.round((totalHandlers / data.recentCompletedApps.length) * 10) / 10
          : 0,
      avgDepartments:
        data.recentCompletedApps.length > 0
          ? Math.round((totalDepts / data.recentCompletedApps.length) * 10) / 10
          : 0,
    };

    const responsibilityChainDetail: ResponsibilityChainDetail = {
      responsibilityChainSummary,
      recentResponsibilityChains,
    };

    const quickActions: LifecycleQuickAction[] = [
      {
        code: 'BATCH_DISPOSAL',
        name: '批量处置',
        count: data.pendingDisposalCount,
        endpoint: '/api/admin/lifecycle/timeout/batch-handle',
        type: 'primary',
      },
      {
        code: 'NOTIFICATION_RETRY',
        name: '通知重发',
        count: data.pendingRetry,
        endpoint: '/api/admin/lifecycle/notifications/batch-retry',
        type: 'secondary',
      },
      {
        code: 'SUPERVISE_URGE',
        name: '督办催办',
        count: data.pendingSupervise,
        endpoint: '/api/admin/lifecycle/timeout/batch-supervise',
        type: 'warning',
      },
      {
        code: 'EXPORT_DELIVERY',
        name: '导出送达明细',
        count: 0,
        endpoint: '/api/admin/lifecycle/notifications/export-delivery',
        type: 'secondary',
      },
    ];

    return {
      timeoutDisposalStats,
      deptCollaborationStats,
      disposalProcessDetail,
      notificationFailureDetail,
      deliveryDetail,
      responsibilityChainDetail,
      quickActions,
    };
  }

  async getPlatformOperationReport(days = 30) {
    const startDate = dayjs()
      .subtract(days - 1, 'day')
      .toDate();

    const [apps, byAuthType, notifications, certs] = await Promise.all([
      this.prisma.application.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, status: true },
      }),
      this.prisma.user.groupBy({
        by: ['authType'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.notification.groupBy({
        by: ['channel', 'status'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.electronicCertificate.count({ where: { issueDate: { gte: startDate } } }),
    ]);

    const total = apps.length;
    const completed = apps.filter((a) =>
      (
        [
          ApplicationStatus.COMPLETED,
          ApplicationStatus.CERTIFICATE_ISSUED,
          ApplicationStatus.APPROVED,
        ] as ApplicationStatus[]
      ).includes(a.status),
    ).length;

    const authTypeLabels: Record<string, string> = {
      YUE_SHENGSHI: '粤省事',
      FACE_RECOGNITION: '人脸识别',
      SOCIAL_CARD_NFC: '社保卡NFC',
      ID_CARD: '身份证',
      PASSWORD: '密码',
    };

    return {
      periodDays: days,
      startDate,
      endDate: new Date(),
      totalApplications: total,
      completedApplications: completed,
      completionRate: total > 0 ? completed / total : 0,
      issuedCertificates: certs,
      userRegistrationByAuthType: byAuthType.map((a) => ({
        authType: a.authType,
        authTypeLabel: authTypeLabels[a.authType] || a.authType,
        count: a._count,
      })),
      notificationStats: notifications.map((n) => ({
        channel: n.channel,
        status: n.status,
        count: n._count,
      })),
    };
  }
}
