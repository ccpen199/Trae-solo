import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';

export interface LifecycleNode {
  nodeCode: string;
  nodeName: string;
  status: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  operatorName: string | null;
  department: string | null;
  opinion: string | null;
  isTimeout: boolean;
  warningLevel: number | null;
  metadata: any;
  evidence?: {
    materials?: any[];
    approvalRecords?: any[];
    certificates?: any;
  };
}

export interface SignatureEvidence {
  signatureUrl: string | null;
  signedAt: Date;
}

export interface TransferChainItem {
  fromDepartment: string;
  toDepartment: string;
  reason: string;
  transferredAt: Date;
}

export interface PushReceiptItem {
  channel: string;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  status: string;
  failureCode: string | null;
  failureMessage: string | null;
  retryCount: number;
}

export interface NotificationRetryAction {
  canRetry: boolean;
  retryEndpoint: string;
}

export interface FailureDetail {
  errorCode: string | null;
  errorDescription: string | null;
}

export interface UrgedRecord {
  urgedAt: Date;
  urgedBy: string;
  urgedByName: string;
  urgedOpinion: string;
}

export interface TimeoutHandlingInfo {
  timeoutLevel: string | null;
  handlerId: string | null;
  handlerName: string | null;
  handledAt: Date | null;
  handlingOpinion: string | null;
  urgedRecords: UrgedRecord[];
}

export interface NotifyRetryAction {
  canRetry: boolean;
  retryEndpoint: string;
}

export interface ResultReceipt {
  receivedAt: Date;
  channel: string;
  operator: string;
}

export interface AuditLogEntry {
  action: string;
  operator: string;
  timestamp: Date;
}

export interface TimeoutDisposalChain {
  timeoutDisposedBy: string | null;
  timeoutDisposedById: string | null;
  timeoutDisposedAt: Date | null;
  timeoutDisposalOpinion: string | null;
  timeoutSupervised: boolean;
  timeoutSupervisor: string | null;
  timeoutSupervisedAt: Date | null;
}

export interface DeptApprovalOpinion {
  dept: string;
  approver: string;
  opinion: string;
  action: string;
  timestamp: Date;
}

export interface DeptApprovalChain {
  deptApprovalOpinions: DeptApprovalOpinion[];
  lastApprovalDept: string | null;
  lastApprover: string | null;
  lastApprovalOpinion: string | null;
  lastApprovalAt: Date | null;
}

export interface NotificationRetryRecord {
  channel: string;
  retryAt: Date;
  retryBy: string;
  result: string;
}

export interface NotificationChain {
  notificationRetryRecords: NotificationRetryRecord[];
  lastNotificationStatus: string | null;
  lastRetryAt: Date | null;
  retryCount: number;
}

export interface ApplicantConfirmChain {
  applicantConfirmed: boolean;
  applicantConfirmedAt: Date | null;
  applicantConfirmMethod: string | null;
  applicantConfirmRemark: string | null;
  resultReceiptNo: string | null;
}

export interface RetryableNotification {
  id: string;
  channel: string;
  channelLabel: string;
  failedAt: Date;
  failureReason: string | null;
  canRetry: boolean;
  retryEndpoint: string;
}

export interface TimeoutWarning {
  warningLevel: 1 | 2 | 3;
  warningLevelLabel: string;
  overdueHours: number;
  dueDate: Date;
  disposalDeadline: Date;
  disposalCountdownMinutes: number;
  disposalDeadlinePassed: boolean;
  disposer: string | null;
  disposerId: string | null;
  disposerDept: string | null;
  disposalAssignedAt: Date | null;
  retryableNotifications: RetryableNotification[];
}

export interface TimeoutDisposalChainNode {
  stage:
    | 'warning_issued'
    | 'disposal_assigned'
    | 'disposal_completed'
    | 'supervision_issued'
    | 'retry_notification';
  operator: string | null;
  operatorId: string | null;
  timestamp: Date;
  opinion: string | null;
  result: string | null;
}

export interface ApplicantConfirmation {
  confirmed: boolean;
  confirmedAt: Date | null;
  confirmMethod: string | null;
  confirmRemark: string | null;
  receiptNo: string | null;
  confirmDeadline: Date | null;
  confirmCountdownMinutes: number | null;
}

export interface ResponsibilityChainNode {
  node: string;
  handler: string;
  dept: string;
  action: string;
  timestamp: Date;
  opinion: string;
}

export interface QuickAction {
  key: string;
  label: string;
  type: 'primary' | 'default' | 'danger' | 'warning';
  endpoint: string;
  disabled: boolean;
}

export interface WorkflowNodeAction {
  actionCode: string;
  actionName: string;
  actionType: 'primary' | 'secondary' | 'warning';
  endpoint: string;
  disabled: boolean;
  disabledReason: string | null;
}

export interface WorkflowNodeStatus {
  currentNodeCode: string;
  currentNodeName: string;
  nodeProgress: number;
  nodeExpectedMinutes: number;
  nodeActions: WorkflowNodeAction[];
}

export interface ResponsibilitySummary {
  currentHandler: string | null;
  currentDept: string | null;
  nextHandler: string | null;
  nextDept: string | null;
  deadlinePressure: 'normal' | 'urgent' | 'overdue';
}

export interface ClosureStatus {
  hasAppointmentAdjusted: boolean;
  hasMaterialSupplemented: boolean;
  hasApprovalOpinion: boolean;
  hasCertificateConfirmed: boolean;
  hasResultReceipt: boolean;
  closureScore: number;
}

export interface LifecycleTraceListItem {
  id: string;
  applicationNo: string;
  itemCode: string | undefined;
  itemName: string | undefined;
  applicant: string | undefined;
  phone: string | undefined;
  department: string | undefined;
  status: string;
  currentNode: string;
  isTimeout: boolean;
  createdAt: Date;
  dueDate: Date | null;
  nodeHandler: string | null;
  nodeHandlerId: string | null;
  nodeDepartment: string | null;
  latestDeptOpinion: string | null;
  timeoutHandled: boolean;
  timeoutHandler: string | null;
  timeoutHandledAt: Date | null;
  notifyFailedCount: number;
  notifyRetryAction: NotifyRetryAction;
  hasResultReceipt: boolean;
  resultReceipt: ResultReceipt | null;
  auditLogs: AuditLogEntry[];
  timeoutDisposedBy: string | null;
  timeoutDisposedById: string | null;
  timeoutDisposedAt: Date | null;
  timeoutDisposalOpinion: string | null;
  timeoutSupervised: boolean;
  timeoutSupervisor: string | null;
  timeoutSupervisedAt: Date | null;
  deptApprovalOpinions: DeptApprovalOpinion[];
  lastApprovalDept: string | null;
  lastApprover: string | null;
  lastApprovalOpinion: string | null;
  lastApprovalAt: Date | null;
  notificationRetryRecords: NotificationRetryRecord[];
  lastNotificationStatus: string | null;
  lastRetryAt: Date | null;
  retryCount: number;
  applicantConfirmed: boolean;
  applicantConfirmedAt: Date | null;
  applicantConfirmMethod: string | null;
  applicantConfirmRemark: string | null;
  resultReceiptNo: string | null;
  responsibilityChain: ResponsibilityChainNode[];
  quickActions: QuickAction[];
  timeoutWarning: TimeoutWarning | null;
  applicantConfirmation: ApplicantConfirmation | null;
  workflowNodeActions: WorkflowNodeAction[];
  workflowNodeStatus: WorkflowNodeStatus;
  responsibilitySummary: ResponsibilitySummary;
  closureStatus: ClosureStatus;
}

export interface LifecycleTraceDetail {
  basicInfo: {
    applicationNo: string;
    itemCode: string;
    itemName: string;
    applicantName: string;
    applicantIdCard: string;
    applicantPhone: string;
    createdAt: Date;
    submittedAt: Date | null;
    completedAt: Date | null;
    dueDate: Date | null;
    currentStatus: string;
    currentNode: string;
    isExpedited: boolean;
  };
  appointmentInfo?: {
    time: Date | null;
    location: string | null;
    appointmentChannel?: string;
  };
  materialsInfo: {
    uploaded: Array<{
      materialName: string;
      fileName: string;
      uploadTime: Date;
      isVerified: boolean;
      verifiedBy: string | null;
      verifiedAt: Date | null;
      ocrData: any;
    }>;
    missing: string[];
    verifiedCount: number;
    totalRequired: number;
  };
  preReviewInfo?: {
    score: number;
    passed: boolean;
    issues: string[];
    suggestions: string[];
    reviewer: string | null;
    reviewedAt: Date | null;
  };
  approvalFlow: Array<{
    nodeName: string;
    approverName: string;
    department: string;
    action: string;
    opinion: string;
    signedAt: Date;
    signatureUrl: string | null;
    departmentOpinion: string | null;
    correctionNotice: string | null;
    rejectionReason: string | null;
    signatureEvidence: SignatureEvidence;
    transferChain: TransferChainItem[];
  }>;
  certificateInfo?: {
    certNo: string;
    certName: string;
    certType: string;
    issueDate: Date | null;
    validFrom: Date | null;
    validTo: Date | null;
    issuer: string | null;
    qrCodeUrl: string | null;
    verifyCount: number;
    issueEvidence: {
      issuedBy: string | null;
      issuedAt: Date | null;
      issuingSealUrl: string | null;
    };
    qrCodeVerifyUrl: string | null;
    digitalSeal: string | null;
  };
  resultPushInfo: {
    pushTime: Date | null;
    pushChannels: string[];
    pushStatus: string;
    errorMessage: string | null;
    pushReceipts: PushReceiptItem[];
  };
  notificationTrail: Array<{
    id: string;
    title: string;
    content: string;
    channel: string;
    status: string;
    sentAt: Date | null;
    readAt: Date | null;
    failureReason: string | null;
    deliveryStatus: string;
    deliveryTime: Date | null;
    failureDetail: FailureDetail;
    retryAction: NotificationRetryAction;
  }>;
  timeoutHandlingInfo: TimeoutHandlingInfo[];
  fullTimeline: LifecycleNode[];
  timeoutDisposalChain: TimeoutDisposalChainNode[];
}

const STATUS_LABELS: Record<string, string> = {
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

const DEPT_LABELS: Record<string, string> = {
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

const CHANNEL_LABELS: Record<string, string> = {
  SMS: '短信',
  WECHAT: '微信',
  IN_APP: '站内消息',
  EMAIL: '邮件',
};

const NOTIFICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: '待发送',
  SENT: '已发送',
  FAILED: '发送失败',
  READ: '已读',
};

const DELIVERY_STATUS_MAP: Record<string, string> = {
  PENDING: '未送达',
  SENT: '已送达',
  FAILED: '未送达',
  READ: '已读',
};

const WARNING_LEVEL_MAP: Record<number, string> = {
  1: '一般预警',
  2: '严重预警',
  3: '特别严重',
};

const WARNING_LEVEL_LABEL: Record<number, string> = {
  1: '一级',
  2: '二级',
  3: '三级',
};

function buildTransferChain(
  approvals: any[],
  currentApproval: any,
  currentIdx: number,
): TransferChainItem[] {
  const chain: TransferChainItem[] = [];
  if (currentApproval.action === 'TRANSFER') {
    chain.push({
      fromDepartment: DEPT_LABELS[currentApproval.department] || currentApproval.department,
      toDepartment:
        currentIdx < approvals.length - 1
          ? DEPT_LABELS[approvals[currentIdx + 1].department] ||
            approvals[currentIdx + 1].department
          : '未知',
      reason: currentApproval.opinion || '转办原因未填写',
      transferredAt: currentApproval.signedAt,
    });
  }
  for (let i = 0; i < currentIdx; i++) {
    const prev = approvals[i];
    if (prev.action === 'TRANSFER') {
      chain.push({
        fromDepartment: DEPT_LABELS[prev.department] || prev.department,
        toDepartment:
          i < approvals.length - 1
            ? DEPT_LABELS[approvals[i + 1].department] || approvals[i + 1].department
            : '未知',
        reason: prev.opinion || '转办原因未填写',
        transferredAt: prev.signedAt,
      });
    }
  }
  return chain;
}

function extractFailureDetail(notification: any): FailureDetail {
  if (notification.status !== 'FAILED' || !notification.failureReason) {
    return { errorCode: null, errorDescription: null };
  }
  const match = notification.failureReason.match(/^\[([A-Z0-9_]+)\]\s*(.*)$/);
  if (match) {
    return { errorCode: match[1], errorDescription: match[2] };
  }
  return { errorCode: 'UNKNOWN', errorDescription: notification.failureReason };
}

function buildRetryAction(notification: any): NotificationRetryAction {
  if (notification.status === 'FAILED') {
    return {
      canRetry: true,
      retryEndpoint: `/api/admin/lifecycle-trace/notifications/${notification.id}/retry`,
    };
  }
  return { canRetry: false, retryEndpoint: '' };
}

function extractTimeoutDisposalChain(timeline: any[]): TimeoutDisposalChain {
  const timeoutNodes = timeline.filter((t) => t.isTimeout);
  const handledTimeout = timeoutNodes.find((t) => t.endTime !== null);
  const metadata = handledTimeout?.metadata ? (handledTimeout.metadata as Record<string, any>) : {};

  const urgedRecords: any[] = metadata.urgedRecords || [];
  const latestUrged = urgedRecords.length > 0 ? urgedRecords[urgedRecords.length - 1] : null;

  return {
    timeoutDisposedBy: handledTimeout?.operatorName || metadata.handlerName || null,
    timeoutDisposedById: handledTimeout?.operatorId || metadata.handlerId || null,
    timeoutDisposedAt:
      handledTimeout?.endTime || (metadata.handledAt ? new Date(metadata.handledAt) : null),
    timeoutDisposalOpinion: handledTimeout?.opinion || metadata.handlingOpinion || null,
    timeoutSupervised: urgedRecords.length > 0,
    timeoutSupervisor: latestUrged?.urgedByName || latestUrged?.urgedBy || null,
    timeoutSupervisedAt: latestUrged?.urgedAt ? new Date(latestUrged.urgedAt) : null,
  };
}

function extractDeptApprovalChain(approvals: any[]): DeptApprovalChain {
  const sortedApprovals = [...approvals].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const lastApproval =
    sortedApprovals.length > 0 ? sortedApprovals[sortedApprovals.length - 1] : null;

  const deptApprovalOpinions: DeptApprovalOpinion[] = sortedApprovals.map((a) => {
    const deptLabel = DEPT_LABELS[a.department] || a.department;
    const actionLabel = a.action === 'APPROVE' ? '通过' : a.action === 'REJECT' ? '驳回' : '转交';
    return {
      dept: deptLabel,
      approver: a.approverName,
      opinion: a.opinion || '',
      action: actionLabel,
      timestamp: a.signedAt,
    };
  });

  return {
    deptApprovalOpinions,
    lastApprovalDept: lastApproval
      ? DEPT_LABELS[lastApproval.department] || lastApproval.department
      : null,
    lastApprover: lastApproval?.approverName || null,
    lastApprovalOpinion: lastApproval?.opinion || null,
    lastApprovalAt: lastApproval?.signedAt || null,
  };
}

function extractNotificationChain(notifications: any[]): NotificationChain {
  const sortedNotifications = [...notifications].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const latestNotification =
    sortedNotifications.length > 0 ? sortedNotifications[sortedNotifications.length - 1] : null;

  const notificationRetryRecords: NotificationRetryRecord[] = [];
  let totalRetryCount = 0;
  let lastRetryAt: Date | null = null;

  for (const notification of sortedNotifications) {
    const nParams = notification.params as Record<string, any> | null;
    totalRetryCount += notification.retryCount || 0;

    if (notification.retryCount > 0 && nParams?.retryHistory) {
      const retryHistory: any[] = nParams.retryHistory || [];
      for (const retry of retryHistory) {
        const retryDate = retry.retryAt ? new Date(retry.retryAt) : notification.updatedAt;
        if (!lastRetryAt || retryDate > lastRetryAt) {
          lastRetryAt = retryDate;
        }
        notificationRetryRecords.push({
          channel: CHANNEL_LABELS[notification.channel] || notification.channel,
          retryAt: retryDate,
          retryBy: retry.retryBy || '系统自动',
          result: retry.result || '已重发',
        });
      }
    } else if (notification.retryCount > 0) {
      const retryDate = notification.updatedAt;
      if (!lastRetryAt || retryDate > lastRetryAt) {
        lastRetryAt = retryDate;
      }
      notificationRetryRecords.push({
        channel: CHANNEL_LABELS[notification.channel] || notification.channel,
        retryAt: retryDate,
        retryBy: '系统自动',
        result: notification.status === 'FAILED' ? '重发失败' : '重发成功',
      });
    }
  }

  return {
    notificationRetryRecords,
    lastNotificationStatus: latestNotification
      ? NOTIFICATION_STATUS_LABELS[latestNotification.status] || latestNotification.status
      : null,
    lastRetryAt,
    retryCount: totalRetryCount,
  };
}

function extractApplicantConfirmChain(
  timeline: any[],
  certificate: any,
  application: any,
): ApplicantConfirmChain {
  const resultPushNode = timeline.find((t) => t.nodeCode === 'result_pushed' && t.endTime !== null);
  const confirmNode = timeline.find(
    (t) => t.nodeCode === 'applicant_confirmed' || t.nodeName?.includes('申请人确认'),
  );
  const metadata = confirmNode?.metadata ? (confirmNode.metadata as Record<string, any>) : {};

  return {
    applicantConfirmed: !!(confirmNode?.endTime || (resultPushNode && certificate)),
    applicantConfirmedAt: confirmNode?.endTime || resultPushNode?.endTime || null,
    applicantConfirmMethod:
      metadata.confirmMethod || resultPushNode?.opinion?.includes('短信')
        ? '短信'
        : resultPushNode?.opinion?.includes('微信')
          ? '微信'
          : resultPushNode?.opinion?.includes('线下')
            ? '线下'
            : resultPushNode
              ? '线上'
              : null,
    applicantConfirmRemark: metadata.remark || confirmNode?.opinion || null,
    resultReceiptNo: certificate?.certNo || application.applicationNo || null,
  };
}

function buildResponsibilityChain(
  timeline: any[],
  approvals: any[],
  notifications: any[],
): ResponsibilityChainNode[] {
  const chain: ResponsibilityChainNode[] = [];

  for (const node of timeline) {
    if (node.operatorName || node.opinion) {
      chain.push({
        node: node.nodeName,
        handler: node.operatorName || '系统',
        dept: node.department ? DEPT_LABELS[node.department] || node.department : '系统',
        action:
          node.status === 'COMPLETED'
            ? '完成'
            : node.status === 'IN_PROGRESS'
              ? '处理中'
              : node.status,
        timestamp: node.endTime || node.startTime,
        opinion: node.opinion || '',
      });
    }
  }

  for (const approval of approvals) {
    const actionLabel =
      approval.action === 'APPROVE' ? '通过' : approval.action === 'REJECT' ? '驳回' : '转交';
    chain.push({
      node: approval.nodeName,
      handler: approval.approverName,
      dept: DEPT_LABELS[approval.department] || approval.department,
      action: actionLabel,
      timestamp: approval.signedAt,
      opinion: approval.opinion || '',
    });
  }

  for (const notification of notifications) {
    if (notification.sentAt) {
      chain.push({
        node: `通知-${CHANNEL_LABELS[notification.channel] || notification.channel}`,
        handler: '系统通知',
        dept: '系统',
        action: NOTIFICATION_STATUS_LABELS[notification.status] || notification.status,
        timestamp: notification.sentAt,
        opinion: notification.title,
      });
    }
  }

  return chain.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function buildQuickActions(
  application: any,
  hasTimeout: boolean,
  status: string,
  activeTimeline: any,
): QuickAction[] {
  const actions: QuickAction[] = [];
  const appId = application.id;
  const timelineId = activeTimeline?.id;

  if (hasTimeout) {
    actions.push({
      key: 'timeout_disposal',
      label: '超时处置',
      type: 'warning',
      endpoint: `/api/admin/lifecycle-trace/timeline/${timelineId}/handle-timeout`,
      disabled: !timelineId,
    });
    actions.push({
      key: 'notify_retry',
      label: '通知重发',
      type: 'default',
      endpoint: `/api/admin/lifecycle-trace/${appId}/notifications/retry-all`,
      disabled: false,
    });
  }

  if (status === 'APPROVING' || status === '审批中' || application.status === 'APPROVING') {
    actions.push({
      key: 'approve',
      label: '审批',
      type: 'primary',
      endpoint: `/api/admin/lifecycle-trace/${appId}/approve`,
      disabled: false,
    });
    actions.push({
      key: 'reject',
      label: '驳回',
      type: 'danger',
      endpoint: `/api/admin/lifecycle-trace/${appId}/reject`,
      disabled: false,
    });
    actions.push({
      key: 'countersign',
      label: '会签',
      type: 'default',
      endpoint: `/api/admin/lifecycle-trace/${appId}/countersign`,
      disabled: false,
    });
  }

  if (status === 'COMPLETED' || status === '已完成' || application.status === 'COMPLETED') {
    actions.push({
      key: 'quality_review',
      label: '质量复查',
      type: 'default',
      endpoint: `/api/admin/lifecycle-trace/${appId}/quality-review`,
      disabled: false,
    });
    actions.push({
      key: 'view_receipt',
      label: '查看回执',
      type: 'primary',
      endpoint: `/api/admin/lifecycle-trace/${appId}/receipt`,
      disabled: false,
    });
  }

  return actions;
}

function buildWorkflowNodeActions(
  application: any,
  status: string,
  activeTimeline: any,
): WorkflowNodeAction[] {
  const actions: WorkflowNodeAction[] = [];
  const appId = application.id;

  const addAction = (
    actionCode: string,
    actionName: string,
    actionType: 'primary' | 'secondary' | 'warning',
    endpoint: string,
    disabled: boolean = false,
    disabledReason: string | null = null,
  ) => {
    actions.push({ actionCode, actionName, actionType, endpoint, disabled, disabledReason });
  };

  switch (status) {
    case 'APPOINTED':
    case '已预约':
      addAction(
        'APPOINTMENT_ADJUST',
        '预约调整',
        'secondary',
        `/api/admin/lifecycle-trace/${appId}/appointment-adjust`,
      );
      addAction(
        'UPLOAD_MATERIALS',
        '上传材料',
        'secondary',
        `/api/admin/lifecycle-trace/${appId}/upload-materials`,
      );
      addAction(
        'FORMAL_SUBMIT',
        '正式提交',
        'primary',
        `/api/admin/lifecycle-trace/${appId}/formal-submit`,
        !application.materials || application.materials.length === 0,
        !application.materials || application.materials.length === 0 ? '请先上传材料' : null,
      );
      addAction(
        'CANCEL_APPOINTMENT',
        '取消预约',
        'warning',
        `/api/admin/lifecycle-trace/${appId}/cancel-appointment`,
      );
      break;

    case 'MATERIALS_UPLOADED':
    case '材料已上传':
      addAction(
        'MATERIAL_SUPPLEMENT',
        '材料补正',
        'secondary',
        `/api/admin/lifecycle-trace/${appId}/material-supplement`,
      );
      addAction(
        'SUBMIT_PRE_REVIEW',
        '提交预审',
        'primary',
        `/api/admin/lifecycle-trace/${appId}/submit-pre-review`,
      );
      addAction(
        'DELETE_MATERIAL',
        '删除材料',
        'warning',
        `/api/admin/lifecycle-trace/${appId}/delete-material`,
      );
      break;

    case 'PRE_REVIEWING':
    case '预审中':
    case 'PRE_REVIEW_REJECTED':
    case '预审驳回':
      addAction(
        'PRE_REVIEW_RETURN',
        '预审退回',
        'warning',
        `/api/admin/lifecycle-trace/${appId}/pre-review-return`,
      );
      addAction(
        'MATERIAL_SUPPLEMENT',
        '材料补正',
        'secondary',
        `/api/admin/lifecycle-trace/${appId}/material-supplement`,
      );
      addAction(
        'RE_SUBMIT',
        '重新提交',
        'primary',
        `/api/admin/lifecycle-trace/${appId}/re-submit`,
      );
      break;

    case 'APPROVING':
    case '审批中':
      addAction(
        'FILL_APPROVAL_OPINION',
        '填写审批意见',
        'secondary',
        `/api/admin/lifecycle-trace/${appId}/fill-approval-opinion`,
      );
      addAction('APPROVE', '审批通过', 'primary', `/api/admin/lifecycle-trace/${appId}/approve`);
      addAction('REJECT', '审批驳回', 'warning', `/api/admin/lifecycle-trace/${appId}/reject`);
      addAction(
        'DEPT_COUNTERSIGN',
        '部门会签',
        'secondary',
        `/api/admin/lifecycle-trace/${appId}/dept-countersign`,
      );
      addAction('TRANSFER', '转办', 'secondary', `/api/admin/lifecycle-trace/${appId}/transfer`);
      break;

    case 'CERTIFICATE_ISSUED':
    case '证照已签发':
      addAction(
        'CERTIFICATE_CONFIRM',
        '证照签发确认',
        'primary',
        `/api/admin/lifecycle-trace/${appId}/certificate-confirm`,
      );
      addAction(
        'VIEW_CERTIFICATE',
        '查看证照',
        'secondary',
        `/api/admin/lifecycle-trace/${appId}/view-certificate`,
      );
      addAction(
        'DOWNLOAD_CERTIFICATE',
        '下载证照',
        'secondary',
        `/api/admin/lifecycle-trace/${appId}/download-certificate`,
      );
      break;

    case 'COMPLETED':
    case '已完成':
      addAction(
        'RESULT_RECEIPT',
        '结果回执',
        'secondary',
        `/api/admin/lifecycle-trace/${appId}/result-receipt`,
      );
      addAction(
        'APPLICANT_CONFIRM',
        '申请人确认',
        'primary',
        `/api/admin/lifecycle-trace/${appId}/applicant-confirm`,
      );
      addAction(
        'QUALITY_REVIEW',
        '质量复查',
        'secondary',
        `/api/admin/lifecycle-trace/${appId}/quality-review`,
      );
      addAction(
        'RESEND_NOTIFICATION',
        '重发通知',
        'secondary',
        `/api/admin/lifecycle-trace/${appId}/resend-notification`,
      );
      break;

    default:
      break;
  }

  return actions;
}

function buildWorkflowNodeStatus(
  application: any,
  status: string,
  activeTimeline: any,
  timeline: any[],
): WorkflowNodeStatus {
  const nodeActions = buildWorkflowNodeActions(application, status, activeTimeline);

  let nodeProgress = 0;
  const nodeOrder = [
    'DRAFT',
    'APPOINTED',
    'MATERIALS_UPLOADED',
    'PRE_REVIEWING',
    'PRE_REVIEW_PASSED',
    'PRE_REVIEW_REJECTED',
    'APPROVING',
    'APPROVED',
    'REJECTED',
    'CERTIFICATE_ISSUED',
    'COMPLETED',
  ];
  const currentIndex = nodeOrder.indexOf(application.status);
  if (currentIndex >= 0) {
    nodeProgress = Math.round((currentIndex / (nodeOrder.length - 1)) * 100);
  }

  let nodeExpectedMinutes = 0;
  if (activeTimeline && activeTimeline.startTime) {
    const now = dayjs();
    const startTime = dayjs(activeTimeline.startTime);
    const elapsedMinutes = now.diff(startTime, 'minute');
    const timeLimit = application.serviceItem?.handlingTimeLimit || 3;
    const totalExpectedMinutes = timeLimit * 24 * 60;
    nodeExpectedMinutes = Math.max(0, totalExpectedMinutes - elapsedMinutes);
  }

  return {
    currentNodeCode: application.status || activeTimeline?.nodeCode || '',
    currentNodeName: STATUS_LABELS[application.status] || activeTimeline?.nodeName || '',
    nodeProgress,
    nodeExpectedMinutes,
    nodeActions,
  };
}

function buildResponsibilitySummary(
  application: any,
  activeTimeline: any,
  timeline: any[],
  approvals: any[],
): ResponsibilitySummary {
  const currentHandler = application.currentHandler || activeTimeline?.operatorName || null;
  const currentDept = application.currentDepartment
    ? DEPT_LABELS[application.currentDepartment] || application.currentDepartment
    : activeTimeline?.department
      ? DEPT_LABELS[activeTimeline.department] || activeTimeline.department
      : null;

  let nextHandler: string | null = null;
  let nextDept: string | null = null;

  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  const activeIndex = sortedTimeline.findIndex((t) => t.endTime === null);
  if (activeIndex >= 0 && activeIndex < sortedTimeline.length - 1) {
    const nextNode = sortedTimeline[activeIndex + 1];
    nextHandler = nextNode.operatorName || null;
    nextDept = nextNode.department ? DEPT_LABELS[nextNode.department] || nextNode.department : null;
  }

  if (!nextHandler && approvals.length > 0) {
    const sortedApprovals = [...approvals].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const lastApproval = sortedApprovals[sortedApprovals.length - 1];
    if (lastApproval && lastApproval.action === 'TRANSFER') {
      const nextApproval = sortedApprovals.find(
        (a) => new Date(a.createdAt).getTime() > new Date(lastApproval.createdAt).getTime(),
      );
      if (nextApproval) {
        nextHandler = nextApproval.approverName;
        nextDept = DEPT_LABELS[nextApproval.department] || nextApproval.department;
      }
    }
  }

  let deadlinePressure: 'normal' | 'urgent' | 'overdue' = 'normal';
  if (application.dueDate) {
    const now = dayjs();
    const dueDate = dayjs(application.dueDate);
    const hoursUntilDue = dueDate.diff(now, 'hour');

    if (hoursUntilDue < 0) {
      deadlinePressure = 'overdue';
    } else if (hoursUntilDue <= 24) {
      deadlinePressure = 'urgent';
    }
  }

  const hasTimeout = timeline.some((t) => t.isTimeout && t.endTime === null);
  if (hasTimeout) {
    deadlinePressure = 'overdue';
  }

  return {
    currentHandler,
    currentDept,
    nextHandler,
    nextDept,
    deadlinePressure,
  };
}

function buildClosureStatus(application: any, timeline: any[], approvals: any[]): ClosureStatus {
  const hasAppointmentAdjusted = timeline.some(
    (t) =>
      t.nodeCode === 'appointment_adjusted' ||
      t.nodeName?.includes('预约调整') ||
      t.opinion?.includes('预约调整'),
  );

  const hasMaterialSupplemented =
    timeline.some(
      (t) =>
        t.nodeCode === 'material_supplemented' ||
        t.nodeName?.includes('材料补正') ||
        t.opinion?.includes('材料补正') ||
        t.opinion?.includes('[补正]'),
    ) || approvals.some((a) => a.opinion?.includes('[补正]') || a.opinion?.includes('材料补正'));

  const hasApprovalOpinion =
    !!application.approvalOpinion ||
    approvals.some((a) => a.opinion && a.opinion.trim().length > 0) ||
    timeline.some(
      (t) =>
        (t.nodeCode === 'department_review' || t.nodeName?.includes('审批')) &&
        t.opinion &&
        t.opinion.trim().length > 0,
    );

  const hasCertificateConfirmed = timeline.some(
    (t) =>
      t.nodeCode === 'certificate_confirmed' ||
      t.nodeName?.includes('签发确认') ||
      t.opinion?.includes('签发确认'),
  );

  const resultPushNode = timeline.find((t) => t.nodeCode === 'result_pushed');
  const hasResultReceipt = !!(
    resultPushNode?.endTime &&
    (resultPushNode.opinion?.includes('回执') || application.certificate)
  );

  let closureScore = 0;
  const totalChecks = 5;
  let completedChecks = 0;

  if (hasAppointmentAdjusted || application.status !== 'APPOINTED') completedChecks++;
  if (hasMaterialSupplemented || application.status === 'COMPLETED') completedChecks++;
  if (hasApprovalOpinion) completedChecks++;
  if (hasCertificateConfirmed || application.status !== 'CERTIFICATE_ISSUED') completedChecks++;
  if (hasResultReceipt) completedChecks++;

  closureScore = Math.round((completedChecks / totalChecks) * 100);

  return {
    hasAppointmentAdjusted,
    hasMaterialSupplemented,
    hasApprovalOpinion,
    hasCertificateConfirmed,
    hasResultReceipt,
    closureScore,
  };
}

function buildTimeoutWarning(
  application: any,
  timeline: any[],
  notifications: any[],
): TimeoutWarning | null {
  const timeoutNode = timeline.find((t) => t.isTimeout);
  if (!timeoutNode || !application.dueDate) return null;

  const now = dayjs();
  const dueDate = dayjs(application.dueDate);
  const overdueHours = Math.max(0, now.diff(dueDate, 'hour'));

  const warningLevel = (timeoutNode.warningLevel as 1 | 2 | 3) || 1;
  const warningLevelLabel = WARNING_LEVEL_LABEL[warningLevel] || '一级';

  const warningIssuedAt = timeoutNode.startTime ? dayjs(timeoutNode.startTime) : now;
  const disposalDeadline = warningIssuedAt.add(24, 'hour');
  const disposalCountdownMinutes = Math.max(0, disposalDeadline.diff(now, 'minute'));
  const disposalDeadlinePassed = now.isAfter(disposalDeadline);

  const metadata = (timeoutNode.metadata as Record<string, any>) || {};
  const disposer = metadata.disposerName || metadata.handlerName || null;
  const disposerId = metadata.disposerId || metadata.handlerId || null;
  const disposerDept = metadata.disposerDept
    ? DEPT_LABELS[metadata.disposerDept] || metadata.disposerDept
    : null;
  const disposalAssignedAt = metadata.disposalAssignedAt
    ? new Date(metadata.disposalAssignedAt)
    : null;

  const retryableNotifications: RetryableNotification[] = notifications
    .filter((n) => n.status === 'FAILED')
    .map((n) => ({
      id: n.id,
      channel: n.channel,
      channelLabel: CHANNEL_LABELS[n.channel] || n.channel,
      failedAt: n.updatedAt || n.createdAt,
      failureReason: n.failureReason,
      canRetry: true,
      retryEndpoint: `/api/admin/lifecycle-trace/${application.id}/notifications/${n.id}/retry`,
    }));

  return {
    warningLevel,
    warningLevelLabel,
    overdueHours,
    dueDate: application.dueDate,
    disposalDeadline: disposalDeadline.toDate(),
    disposalCountdownMinutes,
    disposalDeadlinePassed,
    disposer,
    disposerId,
    disposerDept,
    disposalAssignedAt,
    retryableNotifications,
  };
}

function buildApplicantConfirmation(
  timeline: any[],
  certificate: any,
  application: any,
): ApplicantConfirmation | null {
  const resultPushNode = timeline.find((t) => t.nodeCode === 'result_pushed' && t.endTime !== null);
  const confirmNode = timeline.find(
    (t) => t.nodeCode === 'applicant_confirmed' || t.nodeName?.includes('申请人确认'),
  );
  const metadata = confirmNode?.metadata ? (confirmNode.metadata as Record<string, any>) : {};

  const confirmed = !!(confirmNode?.endTime || (resultPushNode && certificate));
  const confirmedAt = confirmNode?.endTime || resultPushNode?.endTime || null;

  let confirmDeadline: Date | null = null;
  let confirmCountdownMinutes: number | null = null;

  if (application.completedAt && !confirmed) {
    const completedAt = dayjs(application.completedAt);
    confirmDeadline = completedAt.add(7, 'day').toDate();
    confirmCountdownMinutes = Math.max(0, dayjs(confirmDeadline).diff(dayjs(), 'minute'));
  }

  const confirmMethod =
    metadata.confirmMethod || resultPushNode?.opinion?.includes('短信')
      ? '短信'
      : resultPushNode?.opinion?.includes('微信')
        ? '微信'
        : resultPushNode?.opinion?.includes('线下')
          ? '线下'
          : resultPushNode
            ? '线上'
            : null;

  return {
    confirmed,
    confirmedAt,
    confirmMethod,
    confirmRemark: metadata.remark || confirmNode?.opinion || null,
    receiptNo: certificate?.certNo || application.applicationNo || null,
    confirmDeadline,
    confirmCountdownMinutes,
  };
}

function buildTimeoutDisposalChain(
  timeline: any[],
  notifications: any[],
  approvals: any[],
): TimeoutDisposalChainNode[] {
  const chain: TimeoutDisposalChainNode[] = [];

  const timeoutNodes = timeline.filter((t) => t.isTimeout);
  for (const node of timeoutNodes) {
    chain.push({
      stage: 'warning_issued',
      operator: node.operatorName || '系统',
      operatorId: node.operatorId || null,
      timestamp: node.startTime,
      opinion:
        node.opinion || `超时预警已触发，预警等级：${WARNING_LEVEL_MAP[node.warningLevel || 1]}`,
      result: '预警已发布',
    });

    const metadata = (node.metadata as Record<string, any>) || {};
    if (metadata.disposalAssignedAt && metadata.disposerName) {
      chain.push({
        stage: 'disposal_assigned',
        operator: metadata.disposerName,
        operatorId: metadata.disposerId || null,
        timestamp: new Date(metadata.disposalAssignedAt),
        opinion: metadata.disposalOpinion || '已分配处置责任人',
        result: '处置已分配',
      });
    }

    if (node.endTime) {
      chain.push({
        stage: 'disposal_completed',
        operator: node.operatorName || metadata.handlerName || '系统',
        operatorId: node.operatorId || metadata.handlerId || null,
        timestamp: node.endTime,
        opinion: node.opinion || metadata.handlingOpinion || '超时已处置',
        result: '处置已完成',
      });
    }

    const urgedRecords: any[] = metadata.urgedRecords || [];
    for (const urged of urgedRecords) {
      chain.push({
        stage: 'supervision_issued',
        operator: urged.urgedByName || urged.urgedBy || '系统',
        operatorId: urged.urgedBy || null,
        timestamp: new Date(urged.urgedAt),
        opinion: urged.urgedOpinion || '督办催办',
        result: '督办已发布',
      });
    }
  }

  const failedNotifications = notifications.filter(
    (n) => n.status === 'FAILED' && n.retryCount > 0,
  );
  for (const notification of failedNotifications) {
    const nParams = notification.params as Record<string, any> | null;
    const retryHistory: any[] = nParams?.retryHistory || [];
    for (const retry of retryHistory) {
      chain.push({
        stage: 'retry_notification',
        operator: retry.retryBy || '系统自动',
        operatorId: null,
        timestamp: retry.retryAt ? new Date(retry.retryAt) : notification.updatedAt,
        opinion: `重发${CHANNEL_LABELS[notification.channel] || notification.channel}通知`,
        result: retry.result || (notification.status === 'FAILED' ? '重发失败' : '重发成功'),
      });
    }
  }

  return chain.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

@Injectable()
export class LifecycleTraceService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async getFullLifecycleTrace(applicationId: string): Promise<LifecycleTraceDetail> {
    this.logger.log(`获取办件全生命周期追踪: ${applicationId}`, 'LifecycleTraceService');

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        serviceItem: { select: { itemCode: true, itemName: true, handlingTimeLimit: true } },
        user: { select: { id: true, realName: true, idCardNumber: true, phoneNumber: true } },
        materials: { include: { template: { select: { materialName: true, isRequired: true } } } },
        timeline: { orderBy: { createdAt: 'asc' } },
        approvals: { orderBy: { createdAt: 'asc' } },
        certificate: true,
        notifications: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!application) throw new NotFoundException('办件不存在');

    const requiredMaterials = await this.prisma.materialTemplate.findMany({
      where: { serviceItemId: application.serviceItemId, isRequired: true },
    });

    const uploadedTemplateIds = application.materials.map((m) => m.templateId);
    const missingRequired = requiredMaterials
      .filter((t) => !uploadedTemplateIds.includes(t.id))
      .map((t) => t.materialName);

    const fullTimeline: LifecycleNode[] = application.timeline.map((t) => ({
      nodeCode: t.nodeCode,
      nodeName: t.nodeName,
      status: t.status,
      startTime: t.startTime,
      endTime: t.endTime,
      duration: t.duration,
      operatorName: t.operatorName,
      department: t.department ? DEPT_LABELS[t.department] : null,
      opinion: t.opinion,
      isTimeout: t.isTimeout,
      warningLevel: t.warningLevel,
      metadata: t.metadata,
    }));

    const latestNotification = application.notifications[application.notifications.length - 1];

    const approvalFlow = application.approvals.map((a, idx) => {
      const deptLabel = DEPT_LABELS[a.department] || a.department;
      const actionLabel = a.action === 'APPROVE' ? '通过' : a.action === 'REJECT' ? '驳回' : '转交';

      let departmentOpinion: string | null = null;
      let correctionNotice: string | null = null;
      let rejectionReason: string | null = null;

      if (a.opinion) {
        const correctionMatch = a.opinion.match(/\[补正\](.*)/);
        const rejectionMatch = a.opinion.match(/\[驳回\](.*)/);
        if (correctionMatch) {
          correctionNotice = correctionMatch[1].trim();
        }
        if (rejectionMatch) {
          rejectionReason = rejectionMatch[1].trim();
        }
        if (a.action === 'REJECT' && !rejectionMatch) {
          rejectionReason = a.opinion;
        } else if (a.action !== 'REJECT' && !correctionMatch) {
          departmentOpinion = a.opinion;
        }
      }

      if (a.action === 'REJECT' && !rejectionReason) {
        rejectionReason = application.rejectionReason || null;
      }

      const signatureEvidence: SignatureEvidence = {
        signatureUrl: a.signatureUrl,
        signedAt: a.signedAt,
      };

      const transferChain = buildTransferChain(application.approvals, a, idx);

      return {
        nodeName: a.nodeName,
        approverName: a.approverName,
        department: deptLabel,
        action: actionLabel,
        opinion: a.opinion || '',
        signedAt: a.signedAt,
        signatureUrl: a.signatureUrl,
        departmentOpinion,
        correctionNotice,
        rejectionReason,
        signatureEvidence,
        transferChain,
      };
    });

    let certificateInfo: LifecycleTraceDetail['certificateInfo'] = undefined;
    if (application.certificate) {
      const cert = application.certificate;
      const certData = (cert.certData as Record<string, any>) || {};
      certificateInfo = {
        certNo: cert.certNo,
        certName: cert.certName,
        certType: cert.certType,
        issueDate: cert.issueDate,
        validFrom: cert.validFrom,
        validTo: cert.validTo,
        issuer: cert.issuer,
        qrCodeUrl: cert.qrCodeUrl,
        verifyCount: cert.verifyCount,
        issueEvidence: {
          issuedBy: certData.issuedBy || cert.issuer || null,
          issuedAt: certData.issuedAt || cert.issueDate || null,
          issuingSealUrl: certData.issuingSealUrl || null,
        },
        qrCodeVerifyUrl: certData.qrCodeVerifyUrl || null,
        digitalSeal: certData.digitalSeal || null,
      };
    }

    const pushReceipts: PushReceiptItem[] = application.notifications.map((n) => {
      const nParams = n.params as Record<string, any> | null;
      return {
        channel: CHANNEL_LABELS[n.channel] || n.channel,
        sentAt: n.sentAt,
        deliveredAt: nParams?.deliveredAt || null,
        readAt: n.readAt,
        status: NOTIFICATION_STATUS_LABELS[n.status] || n.status,
        failureCode: n.status === 'FAILED' ? nParams?.failureCode || 'UNKNOWN' : null,
        failureMessage: n.status === 'FAILED' ? n.failureReason : null,
        retryCount: n.retryCount,
      };
    });

    const notificationTrail = application.notifications.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      channel: CHANNEL_LABELS[n.channel] || n.channel,
      status: NOTIFICATION_STATUS_LABELS[n.status] || n.status,
      sentAt: n.sentAt,
      readAt: n.readAt,
      failureReason: n.failureReason,
      deliveryStatus: DELIVERY_STATUS_MAP[n.status] || '未知',
      deliveryTime: n.status === 'READ' ? n.readAt : n.status === 'SENT' ? n.sentAt : null,
      failureDetail: extractFailureDetail(n),
      retryAction: buildRetryAction(n),
    }));

    const timeoutDisposalChain = buildTimeoutDisposalChain(
      application.timeline,
      application.notifications,
      application.approvals,
    );

    const timeoutNodes = application.timeline.filter((t) => t.isTimeout);
    const timeoutHandlingInfo: TimeoutHandlingInfo[] = timeoutNodes.map((node) => {
      const metadata = (node.metadata as Record<string, any>) || {};
      const urgedRecords: UrgedRecord[] = (metadata.urgedRecords || []).map((r: any) => ({
        urgedAt: new Date(r.urgedAt),
        urgedBy: r.urgedBy || '',
        urgedByName: r.urgedByName || '',
        urgedOpinion: r.urgedOpinion || '',
      }));

      return {
        timeoutLevel: node.warningLevel
          ? WARNING_LEVEL_MAP[node.warningLevel] || `等级${node.warningLevel}`
          : null,
        handlerId: node.operatorId || null,
        handlerName: node.operatorName || null,
        handledAt: node.endTime || null,
        handlingOpinion: node.opinion || null,
        urgedRecords,
      };
    });

    return {
      basicInfo: {
        applicationNo: application.applicationNo,
        itemCode: application.serviceItem?.itemCode || '',
        itemName: application.serviceItem?.itemName || '',
        applicantName: application.user?.realName || '',
        applicantIdCard: application.user?.idCardNumber || '',
        applicantPhone: application.user?.phoneNumber || '',
        createdAt: application.createdAt,
        submittedAt: application.submittedAt,
        completedAt: application.completedAt,
        dueDate: application.dueDate,
        currentStatus: STATUS_LABELS[application.status] || application.status,
        currentNode: application.currentNode || '',
        isExpedited: application.isExpedited,
      },
      appointmentInfo: application.appointmentTime
        ? {
            time: application.appointmentTime,
            location: application.appointmentLocation,
            appointmentChannel: '线上预约',
          }
        : undefined,
      materialsInfo: {
        uploaded: application.materials.map((m) => ({
          materialName: m.template?.materialName || '',
          fileName: m.fileName,
          uploadTime: m.createdAt,
          isVerified: m.isVerified,
          verifiedBy: m.verifiedBy,
          verifiedAt: m.verifiedAt,
          ocrData: m.ocrData,
        })),
        missing: missingRequired,
        verifiedCount: application.materials.filter((m) => m.isVerified).length,
        totalRequired: requiredMaterials.length,
      },
      preReviewInfo: application.preReviewedAt
        ? {
            score: application.preReviewOpinion ? 85 : 0,
            passed: application.status !== 'PRE_REVIEW_REJECTED',
            issues: application.preReviewOpinion?.split(';') || [],
            suggestions: [],
            reviewer: application.preReviewedBy,
            reviewedAt: application.preReviewedAt,
          }
        : undefined,
      approvalFlow,
      certificateInfo,
      resultPushInfo: {
        pushTime: latestNotification?.sentAt || null,
        pushChannels: [
          ...new Set(application.notifications.map((n) => CHANNEL_LABELS[n.channel] || n.channel)),
        ],
        pushStatus: latestNotification
          ? NOTIFICATION_STATUS_LABELS[latestNotification.status] || latestNotification.status
          : '未推送',
        errorMessage: latestNotification?.failureReason || null,
        pushReceipts,
      },
      notificationTrail,
      timeoutHandlingInfo,
      fullTimeline,
      timeoutDisposalChain,
    };
  }

  async retryNotification(applicationId: string, notificationId: string) {
    this.logger.log(
      `重发通知: applicationId=${applicationId}, notificationId=${notificationId}`,
      'LifecycleTraceService',
    );

    const application = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) throw new NotFoundException('办件不存在');

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundException('通知不存在');

    if (notification.applicationId !== applicationId)
      throw new NotFoundException('通知不属于该办件');

    if (notification.status !== 'FAILED') {
      return {
        notificationId: notification.id,
        status: notification.status,
        message: '当前通知状态不允许重发，仅失败通知可重发',
        retried: false,
      };
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'PENDING',
        failureReason: null,
        retryCount: { increment: 1 },
      },
    });

    return {
      notificationId: updated.id,
      channel: CHANNEL_LABELS[updated.channel] || updated.channel,
      status: NOTIFICATION_STATUS_LABELS[updated.status] || updated.status,
      retryCount: updated.retryCount,
      retried: true,
      message: '通知已重新入队，等待发送',
      retriedAt: new Date(),
    };
  }

  async handleTimeoutWarning(
    timelineNodeId: string,
    handlerId: string,
    handlerName: string,
    handlingOpinion: string,
  ) {
    this.logger.log(
      `处理超时预警: timelineNodeId=${timelineNodeId}, handlerId=${handlerId}`,
      'LifecycleTraceService',
    );

    const node = await this.prisma.applicationTimeline.findUnique({
      where: { id: timelineNodeId },
    });
    if (!node) throw new NotFoundException('时间线节点不存在');

    const existingMetadata = (node.metadata as Record<string, any>) || {};
    const existingUrgedRecords: any[] = existingMetadata.urgedRecords || [];

    const updatedMetadata = {
      ...existingMetadata,
      handlerId,
      handlerName,
      handlingOpinion,
      handledAt: new Date().toISOString(),
    };

    await this.prisma.applicationTimeline.update({
      where: { id: timelineNodeId },
      data: {
        endTime: new Date(),
        opinion: handlingOpinion,
        operatorId: handlerId,
        operatorName: handlerName,
        metadata: updatedMetadata,
      },
    });

    const timeoutLevel = node.warningLevel
      ? WARNING_LEVEL_MAP[node.warningLevel] || `等级${node.warningLevel}`
      : null;

    return {
      timelineNodeId,
      timeoutLevel,
      handlerId,
      handlerName,
      handledAt: new Date(),
      handlingOpinion,
      urgedRecords: existingUrgedRecords.map((r: any) => ({
        urgedAt: new Date(r.urgedAt),
        urgedBy: r.urgedBy || '',
        urgedByName: r.urgedByName || '',
        urgedOpinion: r.urgedOpinion || '',
      })),
    };
  }

  async assignTimeoutDisposal(
    applicationId: string,
    disposerId: string,
    disposerName: string,
    disposerDept: string,
  ) {
    this.logger.log(
      `分配超时处置责任人: applicationId=${applicationId}, disposerId=${disposerId}, disposerName=${disposerName}`,
      'LifecycleTraceService',
    );

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { timeline: { orderBy: { createdAt: 'asc' } } },
    });
    if (!application) throw new NotFoundException('办件不存在');

    const timeoutNode = application.timeline.find((t) => t.isTimeout && t.endTime === null);
    if (!timeoutNode) throw new NotFoundException('该办件无待处置的超时预警');

    const existingMetadata = (timeoutNode.metadata as Record<string, any>) || {};
    const disposalAssignedAt = new Date();

    const updatedMetadata = {
      ...existingMetadata,
      disposerId,
      disposerName,
      disposerDept,
      disposalAssignedAt: disposalAssignedAt.toISOString(),
      disposalOpinion: `已分配处置责任人：${disposerName}（${DEPT_LABELS[disposerDept] || disposerDept}）`,
    };

    await this.prisma.applicationTimeline.update({
      where: { id: timeoutNode.id },
      data: {
        metadata: updatedMetadata,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        applicationId,
        action: 'TIMEOUT_DISPOSAL_ASSIGNED',
        module: 'LIFECYCLE_TRACE',
        description: `分配超时处置责任人：${disposerName}`,
        userId: disposerId,
        status: 'success',
      },
    });

    const warningLevel = timeoutNode.warningLevel || 1;
    const now = dayjs();
    const dueDate = dayjs(application.dueDate || timeoutNode.startTime);
    const overdueHours = Math.max(0, now.diff(dueDate, 'hour'));
    const warningIssuedAt = dayjs(timeoutNode.startTime);
    const disposalDeadline = warningIssuedAt.add(24, 'hour');
    const disposalCountdownMinutes = Math.max(0, disposalDeadline.diff(now, 'minute'));
    const disposalDeadlinePassed = now.isAfter(disposalDeadline);

    return {
      applicationId,
      timelineNodeId: timeoutNode.id,
      warningLevel: warningLevel as 1 | 2 | 3,
      warningLevelLabel: WARNING_LEVEL_LABEL[warningLevel] || '一级',
      overdueHours,
      dueDate: application.dueDate || timeoutNode.startTime,
      disposalDeadline: disposalDeadline.toDate(),
      disposalCountdownMinutes,
      disposalDeadlinePassed,
      disposerId,
      disposerName,
      disposerDept: DEPT_LABELS[disposerDept] || disposerDept,
      disposalAssignedAt,
      assigned: true,
      message: `超时处置责任人已分配：${disposerName}`,
    };
  }

  async getLifecycleList(params: {
    keyword?: string;
    status?: string;
    department?: string;
    startDate?: string;
    endDate?: string;
    hasTimeout?: boolean;
    hasNotifyFailure?: boolean;
    needsDisposal?: boolean;
    nodeDepartment?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: LifecycleTraceListItem[]; pagination: any }> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.keyword) {
      where.OR = [
        { applicationNo: { contains: params.keyword } },
        { user: { realName: { contains: params.keyword } } },
        { serviceItem: { itemName: { contains: params.keyword } } },
      ];
    }
    if (params.status) where.status = params.status;
    if (params.department) where.currentDepartment = params.department;
    if (params.startDate && params.endDate) {
      where.createdAt = { gte: new Date(params.startDate), lte: new Date(params.endDate) };
    }
    if (params.hasTimeout !== undefined) {
      where.timeline = { some: { isTimeout: true } };
    }
    if (params.hasNotifyFailure !== undefined) {
      where.notifications = { some: { status: 'FAILED' } };
    }
    if (params.needsDisposal !== undefined) {
      where.OR = [
        { timeline: { some: { isTimeout: true, endTime: null } } },
        { notifications: { some: { status: 'FAILED' } } },
      ];
    }
    if (params.nodeDepartment) {
      where.timeline = {
        some: {
          department: params.nodeDepartment,
          endTime: null,
        },
      };
    }

    const [list, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          serviceItem: { select: { itemCode: true, itemName: true, handlingDepartment: true } },
          user: { select: { realName: true, phoneNumber: true } },
          timeline: { orderBy: { createdAt: 'desc' } },
          approvals: { orderBy: { createdAt: 'desc' }, take: 5 },
          notifications: { orderBy: { createdAt: 'desc' } },
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { user: { select: { realName: true } } },
          },
          certificate: true,
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      list: list.map((app): LifecycleTraceListItem => {
        const activeTimeline = app.timeline.find((t) => t.endTime === null) || app.timeline[0];
        const allTimeline = app.timeline;

        const nodeHandler = activeTimeline?.operatorName || null;
        const nodeHandlerId = activeTimeline?.operatorId || null;
        const nodeDepartment = activeTimeline?.department
          ? DEPT_LABELS[activeTimeline.department] || activeTimeline.department
          : null;

        const latestApproval = app.approvals[0];
        let latestDeptOpinion: string | null = null;
        if (latestApproval?.opinion) {
          const correctionMatch = latestApproval.opinion.match(/\[补正\](.*)/);
          const rejectionMatch = latestApproval.opinion.match(/\[驳回\](.*)/);
          if (correctionMatch) {
            latestDeptOpinion = correctionMatch[1].trim();
          } else if (rejectionMatch) {
            latestDeptOpinion = rejectionMatch[1].trim();
          } else {
            latestDeptOpinion = latestApproval.opinion;
          }
        } else if (activeTimeline?.opinion) {
          latestDeptOpinion = activeTimeline.opinion;
        }

        const timeoutNodes = allTimeline.filter((t) => t.isTimeout);
        const handledTimeout = timeoutNodes.find((t) => t.endTime !== null);
        const timeoutHandled = !!handledTimeout;
        const timeoutHandler = handledTimeout?.operatorName || null;
        const timeoutHandledAt = handledTimeout?.endTime || null;

        const failedNotifications = app.notifications.filter((n) => n.status === 'FAILED');
        const notifyFailedCount = failedNotifications.length;
        const latestFailedNotification = failedNotifications[0];
        const notifyRetryAction: NotifyRetryAction = latestFailedNotification
          ? {
              canRetry: true,
              retryEndpoint: `/api/admin/lifecycle-trace/${app.id}/notifications/${latestFailedNotification.id}/retry`,
            }
          : { canRetry: false, retryEndpoint: '' };

        const resultPushNode = allTimeline.find((t) => t.nodeCode === 'result_pushed');
        const hasResultReceipt = !!(resultPushNode?.endTime && app.certificate);
        let resultReceipt: ResultReceipt | null = null;
        if (hasResultReceipt && resultPushNode) {
          const pushMetadata = (resultPushNode.metadata as Record<string, any>) || {};
          resultReceipt = {
            receivedAt: resultPushNode.endTime!,
            channel:
              pushMetadata.channel ||
              resultPushNode.opinion?.replace('推送渠道: ', '') ||
              '系统自动',
            operator: resultPushNode.operatorName || pushMetadata.operator || '系统',
          };
        }

        const auditLogs: AuditLogEntry[] = app.auditLogs.map((log) => ({
          action: log.action,
          operator: log.user?.realName || log.description || '系统',
          timestamp: log.createdAt,
        }));

        const hasTimeout = allTimeline.some((t) => t.isTimeout);
        const currentStatusLabel = STATUS_LABELS[app.status] || app.status;

        const timeoutChain = extractTimeoutDisposalChain(allTimeline);
        const deptApprovalChain = extractDeptApprovalChain(app.approvals);
        const notificationChain = extractNotificationChain(app.notifications);
        const applicantConfirmChain = extractApplicantConfirmChain(
          allTimeline,
          app.certificate,
          app,
        );
        const responsibilityChain = buildResponsibilityChain(
          allTimeline,
          app.approvals,
          app.notifications,
        );
        const quickActions = buildQuickActions(app, hasTimeout, currentStatusLabel, activeTimeline);
        const workflowNodeActions = buildWorkflowNodeActions(app, app.status, activeTimeline);
        const workflowNodeStatus = buildWorkflowNodeStatus(
          app,
          app.status,
          activeTimeline,
          allTimeline,
        );
        const responsibilitySummary = buildResponsibilitySummary(
          app,
          activeTimeline,
          allTimeline,
          app.approvals,
        );
        const closureStatus = buildClosureStatus(app, allTimeline, app.approvals);
        const timeoutWarning = buildTimeoutWarning(app, allTimeline, app.notifications);
        const applicantConfirmation = buildApplicantConfirmation(allTimeline, app.certificate, app);

        return {
          id: app.id,
          applicationNo: app.applicationNo,
          itemCode: app.serviceItem?.itemCode,
          itemName: app.serviceItem?.itemName,
          applicant: app.user?.realName,
          phone: app.user?.phoneNumber,
          department: app.serviceItem?.handlingDepartment
            ? DEPT_LABELS[app.serviceItem.handlingDepartment] || app.serviceItem.handlingDepartment
            : undefined,
          status: currentStatusLabel,
          currentNode: activeTimeline?.nodeName || '',
          isTimeout: hasTimeout,
          createdAt: app.createdAt,
          dueDate: app.dueDate,
          nodeHandler,
          nodeHandlerId,
          nodeDepartment,
          latestDeptOpinion,
          timeoutHandled,
          timeoutHandler,
          timeoutHandledAt,
          notifyFailedCount,
          notifyRetryAction,
          hasResultReceipt,
          resultReceipt,
          auditLogs,
          timeoutDisposedBy: timeoutChain.timeoutDisposedBy,
          timeoutDisposedById: timeoutChain.timeoutDisposedById,
          timeoutDisposedAt: timeoutChain.timeoutDisposedAt,
          timeoutDisposalOpinion: timeoutChain.timeoutDisposalOpinion,
          timeoutSupervised: timeoutChain.timeoutSupervised,
          timeoutSupervisor: timeoutChain.timeoutSupervisor,
          timeoutSupervisedAt: timeoutChain.timeoutSupervisedAt,
          deptApprovalOpinions: deptApprovalChain.deptApprovalOpinions,
          lastApprovalDept: deptApprovalChain.lastApprovalDept,
          lastApprover: deptApprovalChain.lastApprover,
          lastApprovalOpinion: deptApprovalChain.lastApprovalOpinion,
          lastApprovalAt: deptApprovalChain.lastApprovalAt,
          notificationRetryRecords: notificationChain.notificationRetryRecords,
          lastNotificationStatus: notificationChain.lastNotificationStatus,
          lastRetryAt: notificationChain.lastRetryAt,
          retryCount: notificationChain.retryCount,
          applicantConfirmed: applicantConfirmChain.applicantConfirmed,
          applicantConfirmedAt: applicantConfirmChain.applicantConfirmedAt,
          applicantConfirmMethod: applicantConfirmChain.applicantConfirmMethod,
          applicantConfirmRemark: applicantConfirmChain.applicantConfirmRemark,
          resultReceiptNo: applicantConfirmChain.resultReceiptNo,
          responsibilityChain,
          quickActions,
          workflowNodeActions,
          workflowNodeStatus,
          responsibilitySummary,
          closureStatus,
          timeoutWarning,
          applicantConfirmation,
        };
      }),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getNotificationDeliveryResults(applicationId: string) {
    const app = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('办件不存在');

    const notifications = await this.prisma.notification.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      applicationId: app.applicationNo,
      totalNotifications: notifications.length,
      deliveryDetails: notifications.map((n) => {
        const nParams = n.params as Record<string, any> | null;
        return {
          id: n.id,
          title: n.title,
          channel: n.channel,
          channelLabel: CHANNEL_LABELS[n.channel] || n.channel,
          status: n.status,
          statusLabel: NOTIFICATION_STATUS_LABELS[n.status] || n.status,
          sentAt: n.sentAt,
          readAt: n.readAt,
          failureReason: n.failureReason,
          recipientId: n.userId,
          createdAt: n.createdAt,
          deliveryAttempts: nParams?.deliveryAttempts || 0,
          lastAttemptAt: nParams?.lastAttemptAt || null,
          wechatMsgId: n.channel === 'WECHAT' ? nParams?.wechatMsgId || null : null,
          smsMsgId: n.channel === 'SMS' ? nParams?.smsMsgId || null : null,
        };
      }),
      summary: {
        smsTotal: notifications.filter((n) => n.channel === 'SMS').length,
        smsSuccess: notifications.filter((n) => n.channel === 'SMS' && n.status === 'SENT').length,
        smsRead: notifications.filter((n) => n.channel === 'SMS' && n.status === 'READ').length,
        wechatTotal: notifications.filter((n) => n.channel === 'WECHAT').length,
        wechatSuccess: notifications.filter((n) => n.channel === 'WECHAT' && n.status === 'SENT')
          .length,
        wechatRead: notifications.filter((n) => n.channel === 'WECHAT' && n.status === 'READ')
          .length,
      },
    };
  }

  async getAuditReviewDetail(applicationId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        approvals: { orderBy: { createdAt: 'asc' } },
        timeline: {
          orderBy: { createdAt: 'asc' },
          where: {
            nodeCode: {
              in: [
                'pre_review',
                'department_review',
                'quality_review',
                'supervision',
                'certificate_issued',
                'result_pushed',
              ],
            },
          },
        },
        certificate: true,
      },
    });
    if (!app) throw new NotFoundException('办件不存在');

    return {
      applicationId: app.applicationNo,
      currentStatus: app.status,
      auditNodes: app.timeline.map((t) => ({
        id: t.id,
        nodeCode: t.nodeCode,
        nodeName: t.nodeName,
        status: t.status,
        operatorId: t.operatorId,
        operatorName: t.operatorName,
        department: t.department,
        opinion: t.opinion,
        isTimeout: t.isTimeout,
        warningLevel: t.warningLevel,
        startTime: t.startTime,
        endTime: t.endTime,
        duration: t.duration,
        metadata: t.metadata,
        hasDisposal: !!t.endTime,
        disposalAction: t.endTime
          ? t.opinion?.startsWith('[督办催办]')
            ? 'SUPERVISE'
            : t.opinion?.startsWith('[延期处理]')
              ? 'EXTEND'
              : 'AUTO'
          : null,
      })),
      approvalRecords: app.approvals.map((a) => ({
        id: a.id,
        approverId: a.approverId,
        approverName: a.approverName,
        department: a.department,
        action: a.action,
        actionLabel: { APPROVE: '通过', REJECT: '驳回', TRANSFER: '转交' }[a.action] || a.action,
        opinion: a.opinion,
        nodeName: a.nodeName,
        signedAt: a.signedAt,
        signatureUrl: a.signatureUrl,
        isRejection: a.action === 'REJECT',
        isCorrection: a.action === 'TRANSFER',
      })),
      certificateRecord: app.certificate
        ? {
            certNo: app.certificate.certNo,
            certType: app.certificate.certType,
            certName: app.certificate.certName,
            issueDate: app.certificate.issueDate,
            validFrom: app.certificate.validFrom,
            validTo: app.certificate.validTo,
            issuer: app.certificate.issuer,
            issuerDept: app.certificate.issuerDept,
            status: app.certificate.status,
            qrCodeUrl: app.certificate.qrCodeUrl,
            verifyCount: app.certificate.verifyCount,
          }
        : null,
      pushReceipts: app.timeline
        .filter((t) => t.nodeCode === 'result_pushed')
        .map((t) => ({
          id: t.id,
          pushTime: t.endTime,
          channels: t.opinion?.replace('推送渠道: ', '').split(', ') || [],
          pushStatus: t.status,
          operatorName: t.operatorName,
        })),
    };
  }

  async getNodeWorkflowActions(applicationId: string): Promise<{
    applicationId: string;
    applicationNo: string;
    status: string;
    workflowNodeActions: WorkflowNodeAction[];
    workflowNodeStatus: WorkflowNodeStatus;
    responsibilitySummary: ResponsibilitySummary;
    closureStatus: ClosureStatus;
  }> {
    this.logger.log(`获取办件节点操作按钮: ${applicationId}`, 'LifecycleTraceService');

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        serviceItem: { select: { itemCode: true, itemName: true, handlingTimeLimit: true } },
        user: { select: { realName: true, phoneNumber: true } },
        materials: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        approvals: { orderBy: { createdAt: 'asc' } },
        certificate: true,
        notifications: true,
      },
    });

    if (!application) throw new NotFoundException('办件不存在');

    const activeTimeline =
      application.timeline.find((t) => t.endTime === null) || application.timeline[0];
    const allTimeline = application.timeline;
    const currentStatusLabel = STATUS_LABELS[application.status] || application.status;

    const workflowNodeActions = buildWorkflowNodeActions(
      application,
      application.status,
      activeTimeline,
    );
    const workflowNodeStatus = buildWorkflowNodeStatus(
      application,
      application.status,
      activeTimeline,
      allTimeline,
    );
    const responsibilitySummary = buildResponsibilitySummary(
      application,
      activeTimeline,
      allTimeline,
      application.approvals,
    );
    const closureStatus = buildClosureStatus(application, allTimeline, application.approvals);

    return {
      applicationId: application.id,
      applicationNo: application.applicationNo,
      status: currentStatusLabel,
      workflowNodeActions,
      workflowNodeStatus,
      responsibilitySummary,
      closureStatus,
    };
  }
}
