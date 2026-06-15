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
  };
  resultPushInfo: {
    pushTime: Date | null;
    pushChannels: string[];
    pushStatus: string;
    errorMessage: string | null;
  };
  notificationTrail: Array<{
    title: string;
    content: string;
    channel: string;
    status: string;
    sentAt: Date | null;
    readAt: Date | null;
    failureReason: string | null;
  }>;
  fullTimeline: LifecycleNode[];
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

    const channelLabels: Record<string, string> = {
      SMS: '短信',
      WECHAT: '微信',
      IN_APP: '站内消息',
      EMAIL: '邮件',
    };

    const notificationStatusLabels: Record<string, string> = {
      PENDING: '待发送',
      SENT: '已发送',
      FAILED: '发送失败',
      READ: '已读',
    };

    const fullTimeline: LifecycleNode[] = application.timeline.map((t) => ({
      nodeCode: t.nodeCode,
      nodeName: t.nodeName,
      status: t.status,
      startTime: t.startTime,
      endTime: t.endTime,
      duration: t.duration,
      operatorName: t.operatorName,
      department: t.department ? deptLabels[t.department] : null,
      opinion: t.opinion,
      isTimeout: t.isTimeout,
      warningLevel: t.warningLevel,
      metadata: t.metadata,
    }));

    const latestNotification = application.notifications[application.notifications.length - 1];

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
        currentStatus: statusLabels[application.status] || application.status,
        currentNode: application.currentNode || '',
        isExpedited: application.isExpedited,
      },
      appointmentInfo: application.appointmentTime ? {
        time: application.appointmentTime,
        location: application.appointmentLocation,
        appointmentChannel: '线上预约',
      } : undefined,
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
      preReviewInfo: application.preReviewedAt ? {
        score: application.preReviewOpinion ? 85 : 0,
        passed: application.status !== 'PRE_REVIEW_REJECTED',
        issues: application.preReviewOpinion?.split(';') || [],
        suggestions: [],
        reviewer: application.preReviewedBy,
        reviewedAt: application.preReviewedAt,
      } : undefined,
      approvalFlow: application.approvals.map((a) => ({
        nodeName: a.nodeName,
        approverName: a.approverName,
        department: deptLabels[a.department] || a.department,
        action: a.action === 'APPROVE' ? '通过' : a.action === 'REJECT' ? '驳回' : '转交',
        opinion: a.opinion || '',
        signedAt: a.signedAt,
        signatureUrl: a.signatureUrl,
      })),
      certificateInfo: application.certificate ? {
        certNo: application.certificate.certNo,
        certName: application.certificate.certName,
        certType: application.certificate.certType,
        issueDate: application.certificate.issueDate,
        validFrom: application.certificate.validFrom,
        validTo: application.certificate.validTo,
        issuer: application.certificate.issuer,
        qrCodeUrl: application.certificate.qrCodeUrl,
        verifyCount: application.certificate.verifyCount,
      } : undefined,
      resultPushInfo: {
        pushTime: latestNotification?.sentAt || null,
        pushChannels: [...new Set(application.notifications.map((n) => channelLabels[n.channel] || n.channel))],
        pushStatus: latestNotification ? notificationStatusLabels[latestNotification.status] || latestNotification.status : '未推送',
        errorMessage: latestNotification?.failureReason || null,
      },
      notificationTrail: application.notifications.map((n) => ({
        title: n.title,
        content: n.content,
        channel: channelLabels[n.channel] || n.channel,
        status: notificationStatusLabels[n.status] || n.status,
        sentAt: n.sentAt,
        readAt: n.readAt,
        failureReason: n.failureReason,
      })),
      fullTimeline,
    };
  }

  async getLifecycleList(params: {
    keyword?: string;
    status?: string;
    department?: string;
    startDate?: string;
    endDate?: string;
    hasTimeout?: boolean;
    page?: number;
    pageSize?: number;
  }) {
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

    const [list, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          serviceItem: { select: { itemCode: true, itemName: true, handlingDepartment: true } },
          user: { select: { realName: true, phoneNumber: true } },
          timeline: { where: { endTime: null } },
        },
      }),
      this.prisma.application.count({ where }),
    ]);

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

    return {
      list: list.map((app) => ({
        id: app.id,
        applicationNo: app.applicationNo,
        itemCode: app.serviceItem?.itemCode,
        itemName: app.serviceItem?.itemName,
        applicant: app.user?.realName,
        phone: app.user?.phoneNumber,
        department: app.serviceItem?.handlingDepartment,
        status: statusLabels[app.status] || app.status,
        currentNode: app.timeline[0]?.nodeName || '',
        isTimeout: app.timeline.some((t) => t.isTimeout),
        createdAt: app.createdAt,
        dueDate: app.dueDate,
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }
}
