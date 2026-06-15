import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationStatus, Department, NotificationChannel } from '@prisma/client';
import { CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import { BusinessException } from '@/common/exceptions/business.exception';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import { ApplicationTimelineService } from './application-timeline.service';
import { PreReviewService } from './pre-review.service';
import { ApprovalService } from './approval.service';
import { CertificateService, IssueCertificateOptions } from '../certificate/certificate.service';
import { NotificationService } from '../notification/notification.service';
import * as dayjs from 'dayjs';

export interface NextActionInfo {
  actionCode: string;
  actionName: string;
  actionType: 'primary' | 'secondary' | 'warning';
  description: string;
  requiredFields: string[];
  enabled: boolean;
  disabledReason?: string;
}

export interface WorkflowActionResult {
  applicationId: string;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  action: string;
  operatorName: string;
  timestamp: Date;
  nextActions: NextActionInfo[];
}

export interface ReviewRecord {
  id: string;
  applicationId: string;
  reviewType: 'PRE_REVIEW' | 'APPROVAL_REVIEW' | 'RESULT_REVIEW' | 'SUPERVISION' | 'JOINT_SIGN';
  reviewer: string;
  reviewerDept: string;
  action: 'PASSED' | 'REJECTED' | 'RETURNED' | 'SUPERVISED';
  opinion: string;
  timestamp: Date;
  isTimeout: boolean;
  processingMinutes: number;
}

export interface JointSignRecord {
  id: string;
  applicationId: string;
  department: string;
  signer: string;
  signerId: string;
  opinion: string;
  signedAt: Date;
  status: 'PENDING' | 'SIGNED' | 'REJECTED';
}

export interface ApplicationConfirmInfo {
  confirmed: boolean;
  confirmedAt?: Date;
  confirmMethod?: string;
  confirmer?: string;
  confirmerId?: string;
}

export interface WorkflowDashboard {
  pendingCount: number;
  todayTodo: number;
  timeoutCount: number;
  myApprovalCount: number;
  quickActions: NextActionInfo[];
  recentApplications: Array<{
    id: string;
    applicationNo: string;
    itemName: string;
    applicant: string;
    status: ApplicationStatus;
    currentNode: string;
    dueDate: Date;
    isTimeout: boolean;
    nextAction: string;
  }>;
}

@Injectable()
export class WorkflowService {
  constructor(
    private prisma: PrismaService,
    private timelineService: ApplicationTimelineService,
    private preReviewService: PreReviewService,
    private approvalService: ApprovalService,
    private certificateService: CertificateService,
    private notificationService: NotificationService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async getWorkflowDashboard(user: CurrentUserPayload): Promise<WorkflowDashboard> {
    this.logger.log(`获取办件工作台: user=${user.userId}`, 'WorkflowService');

    const where: any = {};
    if (
      user.roles?.includes('USER') &&
      !user.roles?.some((r) => ['ADMIN', 'APPROVER'].includes(r))
    ) {
      where.userId = user.userId;
    }

    const [pendingCount, timeoutCount, recent] = await Promise.all([
      this.prisma.application.count({
        where: {
          ...where,
          status: {
            in: [
              ApplicationStatus.DRAFT,
              ApplicationStatus.APPOINTED,
              ApplicationStatus.MATERIALS_UPLOADED,
              ApplicationStatus.PRE_REVIEWING,
              ApplicationStatus.APPROVING,
            ],
          },
        },
      }),
      this.prisma.application.count({
        where: {
          ...where,
          status: { in: [ApplicationStatus.PRE_REVIEWING, ApplicationStatus.APPROVING] },
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.application.findMany({
        where,
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: {
          serviceItem: { select: { itemName: true } },
          user: { select: { realName: true } },
          timeline: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
    ]);

    const today = dayjs().startOf('day').toDate();
    const todayTodo = await this.prisma.application.count({
      where: {
        ...where,
        updatedAt: { gte: today },
        status: {
          in: [ApplicationStatus.PRE_REVIEWING, ApplicationStatus.APPROVING],
        },
      },
    });

    const myApprovalCount = user.roles?.includes('APPROVER')
      ? await this.prisma.application.count({
          where: {
            currentDepartment: ((user as any).department as Department) || Department.OTHER,
            status: ApplicationStatus.APPROVING,
          },
        })
      : 0;

    const quickActions = await this.getQuickActions(user);

    return {
      pendingCount,
      todayTodo,
      timeoutCount,
      myApprovalCount,
      quickActions,
      recentApplications: recent.map((app) => ({
        id: app.id,
        applicationNo: app.applicationNo,
        itemName: app.serviceItem?.itemName || '',
        applicant: app.user?.realName || '',
        status: app.status,
        currentNode: app.currentNode,
        dueDate: app.dueDate,
        isTimeout:
          app.dueDate < new Date() &&
          (
            [ApplicationStatus.PRE_REVIEWING, ApplicationStatus.APPROVING] as ApplicationStatus[]
          ).includes(app.status),
        nextAction: this.getNextActionName(app.status, app.currentNode),
      })),
    };
  }

  async getQuickActions(user: CurrentUserPayload): Promise<NextActionInfo[]> {
    const actions: NextActionInfo[] = [];

    actions.push({
      actionCode: 'create_application',
      actionName: '新建办件申请',
      actionType: 'primary',
      description: '发起新的政务服务事项办理申请',
      requiredFields: ['serviceItemId', 'formData'],
      enabled: true,
    });

    actions.push({
      actionCode: 'book_appointment',
      actionName: '预约办理',
      actionType: 'secondary',
      description: '选择事项和时间进行线下预约',
      requiredFields: ['serviceItemId', 'appointmentTime', 'appointmentLocation'],
      enabled: true,
    });

    if (user.roles?.includes('APPROVER') || user.roles?.includes('ADMIN')) {
      actions.push({
        actionCode: 'batch_approve',
        actionName: '批量审批',
        actionType: 'secondary',
        description: '对待审批办件进行批量处理',
        requiredFields: ['applicationIds', 'action', 'opinion'],
        enabled: true,
      });

      actions.push({
        actionCode: 'issue_certificate',
        actionName: '签发证照',
        actionType: 'primary',
        description: '对已审批通过的办件签发电子证照',
        requiredFields: ['applicationId', 'certType', 'certName'],
        enabled: true,
      });
    }

    if (user.roles?.includes('ADMIN')) {
      actions.push({
        actionCode: 'timeout_supervise',
        actionName: '超时督办',
        actionType: 'warning',
        description: '对超时未办结的办件发起督办',
        requiredFields: ['applicationId', 'supervisor', 'superviseOpinion'],
        enabled: true,
      });
    }

    return actions;
  }

  async getNextActions(applicationId: string): Promise<NextActionInfo[]> {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { serviceItem: true, materials: true, certificate: true },
    });
    if (!app) throw new NotFoundException('办件不存在');

    const actions: NextActionInfo[] = [];
    const status = app.status;

    switch (status) {
      case ApplicationStatus.DRAFT:
        actions.push({
          actionCode: 'edit',
          actionName: '编辑办件',
          actionType: 'secondary',
          description: '修改办件申请信息',
          requiredFields: ['formData'],
          enabled: true,
        });
        actions.push({
          actionCode: 'upload_materials',
          actionName: '上传材料',
          actionType: 'secondary',
          description: '上传办理所需的材料',
          requiredFields: ['templateId', 'file'],
          enabled: true,
        });
        actions.push({
          actionCode: 'submit',
          actionName: '提交预审',
          actionType: 'primary',
          description: '提交办件进入智能预审',
          requiredFields: [],
          enabled: app.materials.length > 0,
          disabledReason: app.materials.length === 0 ? '请先上传至少一份材料' : undefined,
        });
        break;

      case ApplicationStatus.APPOINTED:
        actions.push({
          actionCode: 'upload_materials',
          actionName: '上传材料',
          actionType: 'secondary',
          description: '提前上传办理材料',
          requiredFields: ['templateId', 'file'],
          enabled: true,
        });
        actions.push({
          actionCode: 'submit',
          actionName: '正式提交',
          actionType: 'primary',
          description: '提交办件进入预审流程',
          requiredFields: [],
          enabled: true,
        });
        actions.push({
          actionCode: 'reschedule_appointment',
          actionName: '预约改期',
          actionType: 'secondary',
          description: '修改预约时间或地点',
          requiredFields: ['appointmentTime', 'appointmentLocation'],
          enabled: true,
        });
        actions.push({
          actionCode: 'cancel_appointment',
          actionName: '取消预约',
          actionType: 'warning',
          description: '取消本次预约',
          requiredFields: ['reason'],
          enabled: true,
        });
        break;

      case ApplicationStatus.MATERIALS_UPLOADED:
        actions.push({
          actionCode: 'submit',
          actionName: '提交预审',
          actionType: 'primary',
          description: '提交办件进入智能预审',
          requiredFields: [],
          enabled: true,
        });
        break;

      case ApplicationStatus.PRE_REVIEWING:
        actions.push({
          actionCode: 'view_pr',
          actionName: '查看预审结果',
          actionType: 'secondary',
          description: '查看智能预审意见和评分',
          requiredFields: [],
          enabled: true,
        });
        break;

      case ApplicationStatus.PRE_REVIEW_REJECTED:
        actions.push({
          actionCode: 'return_to_applicant',
          actionName: '预审退回',
          actionType: 'warning',
          description: '将办件退回申请人，需补充材料或修改信息',
          requiredFields: ['rejectReason'],
          enabled: true,
        });
        actions.push({
          actionCode: 'supplement_materials',
          actionName: '材料补正',
          actionType: 'secondary',
          description: '通知申请人补充材料',
          requiredFields: ['supplementNotice'],
          enabled: true,
        });
        actions.push({
          actionCode: 'supplement',
          actionName: '补充材料/修改',
          actionType: 'warning',
          description: '根据预审意见补充材料或修改信息',
          requiredFields: [],
          enabled: true,
        });
        actions.push({
          actionCode: 're_submit',
          actionName: '重新提交',
          actionType: 'primary',
          description: '补充材料后重新提交预审',
          requiredFields: [],
          enabled: true,
        });
        break;

      case ApplicationStatus.APPROVING:
        actions.push({
          actionCode: 'approve',
          actionName: '审批通过',
          actionType: 'primary',
          description: '审批通过本办件',
          requiredFields: ['opinion', 'signatureUrl'],
          enabled: true,
        });
        actions.push({
          actionCode: 'reject',
          actionName: '审批驳回',
          actionType: 'warning',
          description: '驳回办件申请',
          requiredFields: ['reason', 'signatureUrl'],
          enabled: true,
        });
        actions.push({
          actionCode: 'transfer',
          actionName: '转办其他部门',
          actionType: 'secondary',
          description: '将办件转至其他部门处理',
          requiredFields: ['targetDepartment', 'transferReason'],
          enabled: true,
        });
        actions.push({
          actionCode: 'joint_sign',
          actionName: '部门会签',
          actionType: 'secondary',
          description: '发起部门联合审核会签',
          requiredFields: ['jointDepartments', 'signOpinion'],
          enabled: true,
        });
        break;

      case ApplicationStatus.APPROVED:
        actions.push({
          actionCode: 'issue_certificate',
          actionName: '签发电子证照',
          actionType: 'primary',
          description: '为通过的办件签发电子证照',
          requiredFields: ['certType', 'certName', 'issuer'],
          enabled: true,
        });
        actions.push({
          actionCode: 'mark_complete',
          actionName: '标记办结',
          actionType: 'secondary',
          description: '无需发证的办件标记为办结',
          requiredFields: ['resultDescription'],
          enabled: true,
        });
        break;

      case ApplicationStatus.CERTIFICATE_ISSUED:
        actions.push({
          actionCode: 'confirm_certificate',
          actionName: '证照签发确认',
          actionType: 'primary',
          description: '确认证照已正确签发',
          requiredFields: ['confirmer', 'confirmRemark'],
          enabled: true,
        });
        actions.push({
          actionCode: 'push_result',
          actionName: '推送结果通知',
          actionType: 'primary',
          description: '向用户推送办理结果和证照信息',
          requiredFields: ['channels'],
          enabled: true,
        });
        actions.push({
          actionCode: 'view_cert',
          actionName: '查看证照',
          actionType: 'secondary',
          description: '查看电子证照详情',
          requiredFields: [],
          enabled: true,
        });
        break;

      case ApplicationStatus.COMPLETED:
        actions.push({
          actionCode: 'applicant_confirm',
          actionName: '申请人确认',
          actionType: 'primary',
          description: '申请人确认收到办理结果',
          requiredFields: ['confirmMethod', 'confirmer'],
          enabled: true,
        });
        actions.push({
          actionCode: 'review_result',
          actionName: '结果复查',
          actionType: 'secondary',
          description: '对已办结的办件进行质量复查',
          requiredFields: ['reviewer', 'reviewOpinion'],
          enabled: true,
        });
        actions.push({
          actionCode: 'download_cert',
          actionName: '下载证照',
          actionType: 'secondary',
          description: '下载电子证照文件',
          requiredFields: [],
          enabled: !!app.certificate,
        });
        break;

      default:
        actions.push({
          actionCode: 'view_detail',
          actionName: '查看详情',
          actionType: 'secondary',
          description: '查看办件详细信息',
          requiredFields: [],
          enabled: true,
        });
    }

    return actions;
  }

  async performAction(
    applicationId: string,
    action: string,
    operator: CurrentUserPayload,
    data?: any,
  ): Promise<WorkflowActionResult> {
    this.logger.log(`执行办件流转动作: ${applicationId} - ${action}`, 'WorkflowService');

    const app = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('办件不存在');

    const previousStatus = app.status;
    let newStatus = previousStatus;

    switch (action) {
      case 'submit':
        await this.submitForReview(applicationId, operator);
        newStatus = ApplicationStatus.PRE_REVIEWING;
        break;

      case 'approve':
        await this.approvalService.approve({
          applicationId,
          approverId: operator.userId,
          approverName: operator.realName || '审批人',
          department: (operator as any).department as Department,
          action: 'APPROVE',
          opinion: data?.opinion || '同意',
          signatureUrl: data?.signatureUrl,
        });
        newStatus = ApplicationStatus.APPROVED;
        break;

      case 'reject':
        await this.approvalService.approve({
          applicationId,
          approverId: operator.userId,
          approverName: operator.realName || '审批人',
          department: (operator as any).department as Department,
          action: 'REJECT',
          opinion: data?.reason || '驳回',
          signatureUrl: data?.signatureUrl,
        });
        newStatus = ApplicationStatus.REJECTED;
        break;

      case 'transfer':
        await this.approvalService.approve({
          applicationId,
          approverId: operator.userId,
          approverName: operator.realName || '审批人',
          department: (operator as any).department as Department,
          action: 'TRANSFER',
          opinion: data?.transferReason || '转办',
          transferTo: data?.targetDepartment as Department,
        });
        newStatus = ApplicationStatus.APPROVING;
        break;

      case 'issue_certificate':
        await this.certificateService.issueCertificate({
          applicationId,
          certType: data?.certType || 'GENERAL',
          certName: data?.certName || '电子证照',
          holderName: data?.holderName || (app as any).holderName,
          holderIdCard: data?.holderIdCard || (app as any).holderIdCard,
          issuer: data?.issuer || operator.realName || '系统',
          issuerDept: (data?.issuerDept as Department) || Department.OTHER,
          validDays: data?.validDays || 365,
          certData: data?.certData,
        });
        newStatus = ApplicationStatus.CERTIFICATE_ISSUED;
        break;

      case 'mark_complete':
        await this.markComplete(applicationId, operator, data?.resultDescription);
        newStatus = ApplicationStatus.COMPLETED;
        break;

      case 'push_result':
        await this.pushResult(applicationId, data?.channels || ['IN_APP', 'SMS', 'WECHAT']);
        break;

      case 'review_result':
        await this.reviewResult(applicationId, operator, data);
        break;

      case 'timeout_supervise':
        await this.timeoutSupervise(applicationId, operator, data);
        break;

      case 'reschedule_appointment':
        await this.rescheduleAppointment(applicationId, operator, data);
        break;

      case 'return_to_applicant':
        await this.returnToApplicant(applicationId, operator, data);
        newStatus = ApplicationStatus.PRE_REVIEW_REJECTED;
        break;

      case 'supplement_materials':
        await this.supplementMaterials(applicationId, operator, data);
        newStatus = ApplicationStatus.MATERIALS_UPLOADED;
        break;

      case 'joint_sign':
        await this.jointSign(applicationId, operator, data);
        break;

      case 'confirm_certificate':
        await this.confirmCertificate(applicationId, operator, data);
        break;

      case 'applicant_confirm':
        await this.applicantConfirm(applicationId, operator, data);
        break;

      default:
        throw new BusinessException(`不支持的操作: ${action}`, 'INVALID_ACTION');
    }

    const nextActions = await this.getNextActions(applicationId);

    return {
      applicationId,
      previousStatus,
      newStatus,
      action,
      operatorName: operator.realName || '',
      timestamp: new Date(),
      nextActions,
    };
  }

  private async submitForReview(applicationId: string, user: CurrentUserPayload) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { serviceItem: true, materials: true },
    });
    if (!app) throw new NotFoundException('办件不存在');

    const requiredMaterials = app.serviceItem
      ? await this.prisma.materialTemplate.findMany({
          where: { serviceItemId: app.serviceItemId, isRequired: true },
        })
      : [];

    const uploadedTemplateIds = app.materials.map((m) => m.templateId);
    const missingRequired = requiredMaterials.filter((m) => !uploadedTemplateIds.includes(m.id));
    if (missingRequired.length > 0) {
      throw new BusinessException(
        `缺少必需材料: ${missingRequired.map((m) => m.materialName).join(', ')}`,
        'MISSING_REQUIRED_MATERIALS',
      );
    }

    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.PRE_REVIEWING,
        currentNode: 'pre_review',
        submittedAt: new Date(),
      },
    });

    await this.timelineService.addNode(applicationId, {
      nodeCode: 'submitted',
      nodeName: '已提交',
      status: 'completed',
      operatorId: user.userId,
      operatorName: user.realName || '用户',
    });
    await this.timelineService.addNode(applicationId, {
      nodeCode: 'pre_review',
      nodeName: '智能预审',
      status: 'processing',
    });

    try {
      await this.preReviewService.runPreReview(applicationId);
    } catch (e) {
      this.logger.error(`预审执行失败: ${(e as Error).message}`, 'WorkflowService');
    }
  }

  private async markComplete(
    applicationId: string,
    operator: CurrentUserPayload,
    description: string,
  ) {
    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.COMPLETED,
        currentNode: 'completed',
        completedAt: new Date(),
      },
    });

    await this.timelineService.addNode(applicationId, {
      nodeCode: 'completed',
      nodeName: '已办结',
      status: 'completed',
      operatorId: operator.userId,
      operatorName: operator.realName || '办理人',
      opinion: description,
    });
  }

  private async pushResult(applicationId: string, channels: string[]) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { user: true, serviceItem: true, certificate: true },
    });
    if (!app) throw new NotFoundException('办件不存在');

    await this.notificationService.createNotification({
      userId: app.userId,
      applicationId,
      title: '办理结果通知',
      content: `您的${app.serviceItem?.itemName || '办件'}已办理完成，${
        app.certificate ? `证照编号：${app.certificate.certNo}` : '请查收办理结果'
      }`,
      channels: channels as NotificationChannel[],
      templateCode: 'RESULT_NOTIFICATION',
    });

    await this.timelineService.addNode(applicationId, {
      nodeCode: 'result_pushed',
      nodeName: '结果已推送',
      status: 'completed',
      operatorName: '系统',
      opinion: `推送渠道: ${channels.join(', ')}`,
    });
  }

  private async reviewResult(applicationId: string, operator: CurrentUserPayload, data: any) {
    const app = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('办件不存在');

    await this.timelineService.addNode(applicationId, {
      nodeCode: 'quality_review',
      nodeName: '质量复查',
      status: 'completed',
      operatorId: operator.userId,
      operatorName: operator.realName || '复查人',
      opinion: data?.reviewOpinion || '',
    });
  }

  private async timeoutSupervise(applicationId: string, operator: CurrentUserPayload, data: any) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });
    if (!app) throw new NotFoundException('办件不存在');

    await this.timelineService.addNode(applicationId, {
      nodeCode: 'supervision',
      nodeName: '督办提醒',
      status: 'pending',
      operatorId: operator.userId,
      operatorName: data?.supervisor || operator.realName || '督办人',
      opinion: data?.superviseOpinion || '请尽快办理',
    });

    if (app.userId) {
      await this.notificationService.createNotification({
        userId: app.userId,
        applicationId,
        title: '办件超时提醒',
        content: `您的办件(${app.applicationNo})已超时，请耐心等待，我们将加快处理。`,
        channels: [NotificationChannel.SMS, NotificationChannel.WECHAT, NotificationChannel.IN_APP],
        templateCode: 'TIMEOUT_WARNING',
      });
    }
  }

  private async rescheduleAppointment(
    applicationId: string,
    operator: CurrentUserPayload,
    data: any,
  ) {
    const app = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('办件不存在');

    const appointmentTime = data?.appointmentTime ? new Date(data.appointmentTime) : null;
    const appointmentLocation = data?.appointmentLocation;

    if (!appointmentTime) {
      throw new BusinessException('请提供预约时间', 'MISSING_APPOINTMENT_TIME');
    }

    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        appointmentTime,
        appointmentLocation: appointmentLocation || app.appointmentLocation,
      },
    });

    await this.timelineService.addNode(applicationId, {
      nodeCode: 'reschedule_appointment',
      nodeName: '预约改期',
      status: 'completed',
      operatorId: operator.userId,
      operatorName: operator.realName || '办理人',
      opinion: `改期至${dayjs(appointmentTime).format('YYYY-MM-DD HH:mm')}${appointmentLocation ? `，地点：${appointmentLocation}` : ''}`,
    });
  }

  private async returnToApplicant(applicationId: string, operator: CurrentUserPayload, data: any) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });
    if (!app) throw new NotFoundException('办件不存在');

    const rejectReason = data?.rejectReason || '预审不通过，请补充材料';

    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.PRE_REVIEW_REJECTED,
        preReviewOpinion: rejectReason,
        preReviewedBy: operator.realName || '预审人',
        preReviewedAt: new Date(),
      },
    });

    await this.timelineService.addNode(applicationId, {
      nodeCode: 'return_to_applicant',
      nodeName: '预审退回',
      status: 'completed',
      operatorId: operator.userId,
      operatorName: operator.realName || '预审人',
      department: (operator as any).department as Department,
      opinion: rejectReason,
    });

    if (app.userId) {
      await this.notificationService.createNotification({
        userId: app.userId,
        applicationId,
        title: '预审退回通知',
        content: `您的办件(${app.applicationNo})预审不通过，请补充材料后重新提交。原因：${rejectReason}`,
        channels: [NotificationChannel.SMS, NotificationChannel.WECHAT, NotificationChannel.IN_APP],
        templateCode: 'PRE_REVIEW_REJECTED',
      });
    }
  }

  private async supplementMaterials(
    applicationId: string,
    operator: CurrentUserPayload,
    data: any,
  ) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });
    if (!app) throw new NotFoundException('办件不存在');

    const supplementNotice = data?.supplementNotice || '请补充相关材料';

    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.MATERIALS_UPLOADED,
        currentNode: 'material_supplement',
      },
    });

    await this.timelineService.addNode(applicationId, {
      nodeCode: 'supplement_materials',
      nodeName: '材料补正',
      status: 'pending',
      operatorId: operator.userId,
      operatorName: operator.realName || '办理人',
      department: (operator as any).department as Department,
      opinion: supplementNotice,
    });

    if (app.userId) {
      await this.notificationService.createNotification({
        userId: app.userId,
        applicationId,
        title: '材料补正通知',
        content: `您的办件(${app.applicationNo})需要补充材料。${supplementNotice}`,
        channels: [NotificationChannel.SMS, NotificationChannel.WECHAT, NotificationChannel.IN_APP],
        templateCode: 'MATERIAL_SUPPLEMENT',
      });
    }
  }

  private async jointSign(applicationId: string, operator: CurrentUserPayload, data: any) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });
    if (!app) throw new NotFoundException('办件不存在');

    const jointDepartments = data?.jointDepartments || [];
    const signOpinion = data?.signOpinion || '';

    if (jointDepartments.length === 0) {
      throw new BusinessException('请选择会签部门', 'MISSING_JOINT_DEPARTMENTS');
    }

    for (const dept of jointDepartments) {
      await this.prisma.approvalRecord.create({
        data: {
          applicationId,
          nodeName: '部门会签',
          approverId: operator.userId,
          approverName: operator.realName || '会签人',
          department: dept as Department,
          action: 'JOINT_SIGN',
          opinion: signOpinion,
        },
      });
    }

    await this.timelineService.addNode(applicationId, {
      nodeCode: 'joint_sign',
      nodeName: '部门会签',
      status: 'processing',
      operatorId: operator.userId,
      operatorName: operator.realName || '发起人',
      department: (operator as any).department as Department,
      opinion: `发起部门会签，涉及部门：${jointDepartments.join(', ')}。${signOpinion}`,
    });

    if (app.userId) {
      await this.notificationService.createNotification({
        userId: app.userId,
        applicationId,
        title: '部门会签通知',
        content: `您的办件(${app.applicationNo})已进入部门会签环节，请耐心等待。`,
        channels: [NotificationChannel.IN_APP],
        templateCode: 'JOINT_SIGN_NOTICE',
      });
    }
  }

  private async confirmCertificate(applicationId: string, operator: CurrentUserPayload, data: any) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { certificate: true, user: true },
    });
    if (!app) throw new NotFoundException('办件不存在');

    const confirmer = data?.confirmer || operator.realName || '确认人';
    const confirmRemark = data?.confirmRemark || '证照签发确认无误';

    await this.prisma.electronicCertificate.update({
      where: { id: app.certificate?.id },
      data: {
        status: 'confirmed',
      },
    });

    await this.timelineService.addNode(applicationId, {
      nodeCode: 'confirm_certificate',
      nodeName: '证照签发确认',
      status: 'completed',
      operatorId: operator.userId,
      operatorName: confirmer,
      department: (operator as any).department as Department,
      opinion: confirmRemark,
    });

    if (app.userId) {
      await this.notificationService.createNotification({
        userId: app.userId,
        applicationId,
        title: '证照签发确认通知',
        content: `您的办件(${app.applicationNo})证照已确认签发，请注意查收。`,
        channels: [NotificationChannel.SMS, NotificationChannel.WECHAT, NotificationChannel.IN_APP],
        templateCode: 'CERT_CONFIRMED',
      });
    }
  }

  private async applicantConfirm(applicationId: string, operator: CurrentUserPayload, data: any) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });
    if (!app) throw new NotFoundException('办件不存在');

    const confirmMethod = data?.confirmMethod || 'IN_APP';
    const confirmer = data?.confirmer || app.user?.realName || '申请人';

    await this.timelineService.addNode(applicationId, {
      nodeCode: 'applicant_confirm',
      nodeName: '申请人确认',
      status: 'completed',
      operatorId: app.userId,
      operatorName: confirmer,
      opinion: `确认方式：${confirmMethod}`,
      metadata: {
        confirmMethod,
        confirmer,
        confirmedAt: new Date().toISOString(),
      },
    });

    await this.notificationService.createNotification({
      userId: app.userId,
      applicationId,
      title: '办件确认回执',
      content: `您已确认收到办件(${app.applicationNo})的办理结果，感谢您的使用。`,
      channels: [NotificationChannel.IN_APP],
      templateCode: 'APPLICANT_CONFIRM',
    });
  }

  private getNextActionName(status: ApplicationStatus, currentNode: string): string {
    const actionMap: Partial<Record<ApplicationStatus, string>> = {
      [ApplicationStatus.DRAFT]: '完善材料并提交',
      [ApplicationStatus.APPOINTED]: '按时前往办理',
      [ApplicationStatus.MATERIALS_UPLOADED]: '提交预审',
      [ApplicationStatus.PRE_REVIEWING]: '等待智能预审',
      [ApplicationStatus.PRE_REVIEW_REJECTED]: '补充材料后重新提交',
      [ApplicationStatus.APPROVING]: '等待部门审批',
      [ApplicationStatus.APPROVED]: '等待证照签发',
      [ApplicationStatus.CERTIFICATE_ISSUED]: '查收电子证照',
      [ApplicationStatus.COMPLETED]: '办件已完成',
      [ApplicationStatus.REJECTED]: '查看驳回原因',
      [ApplicationStatus.CANCELLED]: '办件已取消',
      [ApplicationStatus.EXPIRED]: '办件已过期',
    };
    return actionMap[status] || '查看详情';
  }

  async getReviewRecords(applicationId: string): Promise<ReviewRecord[]> {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        approvals: { orderBy: { createdAt: 'asc' } },
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!app) throw new NotFoundException('办件不存在');

    const records: ReviewRecord[] = [];

    const preReviewNode = app.timeline.find((t) => t.nodeCode === 'pre_review');
    if (preReviewNode && preReviewNode.status === 'completed') {
      records.push({
        id: `pr-${preReviewNode.id}`,
        applicationId,
        reviewType: 'PRE_REVIEW',
        reviewer: '智能预审系统',
        reviewerDept: '系统',
        action: preReviewNode.opinion?.includes('通过') ? 'PASSED' : 'REJECTED',
        opinion: preReviewNode.opinion || '',
        timestamp: preReviewNode.createdAt,
        isTimeout: preReviewNode.isTimeout,
        processingMinutes: this.calcProcessingMinutes(preReviewNode),
      });
    }

    for (const approval of app.approvals) {
      const isJointSign = approval.action === 'JOINT_SIGN';
      records.push({
        id: approval.id,
        applicationId,
        reviewType: isJointSign ? 'JOINT_SIGN' : 'APPROVAL_REVIEW',
        reviewer: approval.approverName,
        reviewerDept: approval.department,
        action: isJointSign ? 'PASSED' : (approval.action as any),
        opinion: approval.opinion || '',
        timestamp: approval.createdAt,
        isTimeout: false,
        processingMinutes: 0,
      });
    }

    return records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private calcProcessingMinutes(node: any): number {
    if (!node.startedAt) return 0;
    const end = node.completedAt || node.createdAt;
    return Math.round((end.getTime() - node.startedAt.getTime()) / 60000);
  }

  async batchApprove(
    applicationIds: string[],
    action: 'APPROVE' | 'REJECT',
    operator: CurrentUserPayload,
    opinion: string,
  ) {
    this.logger.log(`批量审批: ${applicationIds.length}件 - ${action}`, 'WorkflowService');

    const results = [];
    for (const id of applicationIds) {
      try {
        const result = await this.performAction(
          id,
          action === 'APPROVE' ? 'approve' : 'reject',
          operator,
          { opinion },
        );
        results.push({ id, success: true, result });
      } catch (e) {
        results.push({ id, success: false, error: (e as Error).message });
      }
    }

    return {
      total: applicationIds.length,
      successCount: results.filter((r) => r.success).length,
      failCount: results.filter((r) => !r.success).length,
      results,
    };
  }

  async getApplicationConfirmInfo(applicationId: string): Promise<ApplicationConfirmInfo> {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        timeline: {
          where: { nodeCode: 'applicant_confirm' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!app) throw new NotFoundException('办件不存在');

    const confirmNode = app.timeline[0];

    if (!confirmNode) {
      return {
        confirmed: false,
      };
    }

    const metadata = confirmNode.metadata as any;

    return {
      confirmed: confirmNode.status === 'completed',
      confirmedAt: confirmNode.createdAt,
      confirmMethod: metadata?.confirmMethod,
      confirmer: confirmNode.operatorName,
      confirmerId: confirmNode.operatorId,
    };
  }

  async getJointSignRecords(applicationId: string): Promise<JointSignRecord[]> {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        approvals: {
          where: { action: 'JOINT_SIGN' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!app) throw new NotFoundException('办件不存在');

    return app.approvals.map((approval) => ({
      id: approval.id,
      applicationId,
      department: approval.department,
      signer: approval.approverName,
      signerId: approval.approverId,
      opinion: approval.opinion || '',
      signedAt: approval.signedAt || approval.createdAt,
      status: 'SIGNED' as const,
    }));
  }
}
