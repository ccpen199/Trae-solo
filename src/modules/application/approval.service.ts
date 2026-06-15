import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationStatus, Department } from '@prisma/client';
import { ApplicationTimelineService } from './application-timeline.service';
import { NotificationService } from '../notification/notification.service';
import { BusinessException } from '@/common/exceptions/business.exception';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

export interface ApproveOptions {
  applicationId: string;
  approverId: string;
  approverName: string;
  department: Department;
  action: 'APPROVE' | 'REJECT' | 'TRANSFER';
  opinion?: string;
  signatureUrl?: string;
  transferTo?: Department;
}

@Injectable()
export class ApprovalService {
  constructor(
    private prisma: PrismaService,
    private timelineService: ApplicationTimelineService,
    private notificationService: NotificationService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async approve(options: ApproveOptions) {
    this.logger.log(
      `审批操作: app=${options.applicationId} action=${options.action} approver=${options.approverName}`,
      'ApprovalService',
    );

    const application = await this.prisma.application.findUnique({
      where: { id: options.applicationId },
      include: { serviceItem: true },
    });
    if (!application) throw new NotFoundException('办件不存在');

    if (
      !(
        [ApplicationStatus.APPROVING, ApplicationStatus.PRE_REVIEW_PASSED] as ApplicationStatus[]
      ).includes(application.status)
    ) {
      throw new BusinessException('当前状态不允许审批', 'INVALID_STATUS');
    }

    await this.prisma.approvalRecord.create({
      data: {
        applicationId: options.applicationId,
        nodeName: application.currentNode || '审批',
        approverId: options.approverId,
        approverName: options.approverName,
        department: options.department,
        action: options.action,
        opinion: options.opinion,
        signatureUrl: options.signatureUrl,
      },
    });

    if (options.action === 'REJECT') {
      const updated = await this.prisma.application.update({
        where: { id: options.applicationId },
        data: {
          status: ApplicationStatus.REJECTED,
          currentNode: 'rejected',
          rejectionReason: options.opinion,
          approvedAt: new Date(),
          approvedBy: options.approverId,
          approvalOpinion: options.opinion,
        },
      });

      await this.timelineService.addNode(options.applicationId, {
        nodeCode: 'rejected',
        nodeName: '审批驳回',
        status: 'completed',
        operatorId: options.approverId,
        operatorName: options.approverName,
        department: options.department,
        opinion: options.opinion,
      });

      await this.notificationService.createNotification({
        userId: application.userId,
        applicationId: options.applicationId,
        title: '办件审批驳回',
        content: `您的${application.serviceItem?.itemName || '办件'}已被驳回：${options.opinion || '不符合办理条件'}，办件编号：${application.applicationNo}`,
        channels: ['IN_APP', 'SMS', 'WECHAT'],
        templateCode: 'APPROVAL_REJECTED',
      });

      return updated;
    }

    if (options.action === 'TRANSFER' && options.transferTo) {
      const updated = await this.prisma.application.update({
        where: { id: options.applicationId },
        data: {
          currentDepartment: options.transferTo,
          currentNode: `transfer_${options.transferTo}`,
        },
      });

      await this.timelineService.addNode(options.applicationId, {
        nodeCode: 'transferred',
        nodeName: `转至${options.transferTo}`,
        status: 'completed',
        operatorId: options.approverId,
        operatorName: options.approverName,
        department: options.department,
        opinion: options.opinion,
      });

      return updated;
    }

    const updated = await this.prisma.application.update({
      where: { id: options.applicationId },
      data: {
        status: ApplicationStatus.APPROVED,
        currentNode: 'approved',
        approvedAt: new Date(),
        approvedBy: options.approverId,
        approvalOpinion: options.opinion,
      },
    });

    await this.timelineService.addNode(options.applicationId, {
      nodeCode: 'approved',
      nodeName: '审批通过',
      status: 'completed',
      operatorId: options.approverId,
      operatorName: options.approverName,
      department: options.department,
      opinion: options.opinion,
    });

    await this.notificationService.createNotification({
      userId: application.userId,
      applicationId: options.applicationId,
      title: '审批通过',
      content: `您的${application.serviceItem?.itemName || '办件'}已审批通过，正在生成电子证照，办件编号：${application.applicationNo}`,
      channels: ['IN_APP', 'SMS', 'WECHAT'],
      templateCode: 'APPROVAL_PASSED',
    });

    return updated;
  }
}
