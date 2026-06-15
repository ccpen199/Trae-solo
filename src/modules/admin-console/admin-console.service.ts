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
  workbenchData?: WorkflowWorkbenchData | TimeoutWorkbenchData | TemplatesWorkbenchData;
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
