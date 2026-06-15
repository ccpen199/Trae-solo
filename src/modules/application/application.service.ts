import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationStatus, Department } from '@prisma/client';
import { CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  ApplicationQueryDto,
} from './dto/application.dto';
import { generateApplicationNo } from '@/common/utils/id-generator.util';
import { BusinessException } from '@/common/exceptions/business.exception';
import { ApplicationTimelineService } from './application-timeline.service';
import { NotificationService } from '../notification/notification.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';

@Injectable()
export class ApplicationService {
  constructor(
    private prisma: PrismaService,
    private timelineService: ApplicationTimelineService,
    private notificationService: NotificationService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async create(user: CurrentUserPayload, dto: CreateApplicationDto) {
    this.logger.log(`创建办件申请: item=${dto.serviceItemId}`, 'ApplicationService');
    const serviceItem = await this.prisma.serviceItem.findUnique({
      where: { id: dto.serviceItemId },
      include: { materials: true, formTemplates: true },
    });
    if (!serviceItem) {
      throw new NotFoundException('服务事项不存在');
    }
    if (!serviceItem.status) {
      throw new BusinessException('该事项暂不可办理', 'ITEM_NOT_AVAILABLE');
    }

    const applicationNo = generateApplicationNo();
    const dueDate = dayjs().add(serviceItem.handlingTimeLimit, 'day').toDate();

    const application = await this.prisma.application.create({
      data: {
        applicationNo,
        serviceItemId: dto.serviceItemId,
        userId: user.userId,
        formTemplateId: dto.formTemplateId,
        formData: dto.formData,
        appointmentTime: dto.appointmentTime,
        appointmentLocation: dto.appointmentLocation,
        status: dto.appointmentTime ? ApplicationStatus.APPOINTED : ApplicationStatus.DRAFT,
        currentDepartment: serviceItem.handlingDepartment,
        currentNode: dto.appointmentTime ? 'appointment' : 'draft',
        dueDate,
      },
      include: {
        serviceItem: true,
        timeline: true,
      },
    });

    await this.timelineService.addNode(application.id, {
      nodeCode: dto.appointmentTime ? 'appointment' : 'draft',
      nodeName: dto.appointmentTime ? '已预约' : '草稿',
      status: 'completed',
      operatorId: user.userId,
      operatorName: user.realName || '用户',
    });

    if (dto.appointmentTime) {
      await this.notificationService.createNotification({
        userId: user.userId,
        applicationId: application.id,
        title: '预约成功',
        content: `您的${serviceItem.itemName}预约已成功，预约时间：${dayjs(dto.appointmentTime).format('YYYY-MM-DD HH:mm')}，办件编号：${applicationNo}`,
        channels: ['IN_APP', 'SMS', 'WECHAT'],
        templateCode: 'APPOINTMENT_SUCCESS',
      });
    }

    return application;
  }

  async submit(user: CurrentUserPayload, applicationId: string) {
    this.logger.log(`提交办件: ${applicationId}`, 'ApplicationService');
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { serviceItem: true, materials: true },
    });
    if (!application) throw new NotFoundException('办件不存在');
    if (application.userId !== user.userId)
      throw new BusinessException('无权操作此办件', 'PERMISSION_DENIED');
    if (
      !(
        [
          ApplicationStatus.DRAFT,
          ApplicationStatus.APPOINTED,
          ApplicationStatus.MATERIALS_UPLOADED,
        ] as ApplicationStatus[]
      ).includes(application.status)
    ) {
      throw new BusinessException('当前状态不允许提交', 'INVALID_STATUS');
    }

    const requiredMaterials = application.serviceItem
      ? await this.prisma.materialTemplate.findMany({
          where: { serviceItemId: application.serviceItemId, isRequired: true },
        })
      : [];

    const uploadedTemplateIds = application.materials.map((m) => m.templateId);
    const missingRequired = requiredMaterials.filter((m) => !uploadedTemplateIds.includes(m.id));
    if (missingRequired.length > 0) {
      throw new BusinessException(
        `缺少必需材料: ${missingRequired.map((m) => m.materialName).join(', ')}`,
        'MISSING_REQUIRED_MATERIALS',
      );
    }

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.PRE_REVIEWING,
        currentNode: 'pre_review',
        submittedAt: new Date(),
      },
      include: { serviceItem: true },
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

    await this.notificationService.createNotification({
      userId: user.userId,
      applicationId,
      title: '办件已提交',
      content: `您的${updated.serviceItem?.itemName || '办件'}已提交成功，办件编号：${updated.applicationNo}，正在进行智能预审。`,
      channels: ['IN_APP', 'SMS', 'WECHAT'],
      templateCode: 'APPLICATION_SUBMITTED',
    });

    return updated;
  }

  async findAll(query: ApplicationQueryDto) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.serviceItemId) where.serviceItemId = query.serviceItemId;
    if (query.status) where.status = query.status as ApplicationStatus;
    if (query.currentDepartment) where.currentDepartment = query.currentDepartment as Department;
    if (query.keyword) {
      where.OR = [
        { applicationNo: { contains: query.keyword } },
        { user: { realName: { contains: query.keyword } } },
        { serviceItem: { itemName: { contains: query.keyword } } },
      ];
    }
    if (query.startDate && query.endDate) {
      where.createdAt = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }

    const [list, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          serviceItem: { select: { itemCode: true, itemName: true, handlingDepartment: true } },
          user: { select: { id: true, realName: true, phoneNumber: true } },
          timeline: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      list,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        serviceItem: true,
        user: { select: { id: true, realName: true, phoneNumber: true, idCardNumber: true } },
        formTemplate: true,
        materials: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        approvals: { orderBy: { createdAt: 'asc' } },
        certificate: true,
        notifications: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!application) throw new NotFoundException('办件不存在');
    return application;
  }

  async update(id: string, dto: UpdateApplicationDto) {
    const app = await this.prisma.application.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('办件不存在');
    return this.prisma.application.update({ where: { id }, data: dto });
  }

  async cancel(user: CurrentUserPayload, id: string, reason: string) {
    const application = await this.prisma.application.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('办件不存在');
    if (application.userId !== user.userId)
      throw new BusinessException('无权操作', 'PERMISSION_DENIED');
    if (
      (
        [
          ApplicationStatus.APPROVED,
          ApplicationStatus.COMPLETED,
          ApplicationStatus.CERTIFICATE_ISSUED,
          ApplicationStatus.CANCELLED,
        ] as ApplicationStatus[]
      ).includes(application.status)
    ) {
      throw new BusinessException('当前状态无法取消', 'INVALID_STATUS');
    }

    const updated = await this.prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.CANCELLED, rejectionReason: reason },
    });

    await this.timelineService.addNode(id, {
      nodeCode: 'cancelled',
      nodeName: '已取消',
      status: 'completed',
      operatorId: user.userId,
      operatorName: user.realName || '用户',
      opinion: reason,
    });

    return updated;
  }

  async getStatistics() {
    const today = dayjs().startOf('day').toDate();
    const [todayCount, totalCount, processingCount, timeoutCount] = await Promise.all([
      this.prisma.application.count({ where: { createdAt: { gte: today } } }),
      this.prisma.application.count(),
      this.prisma.application.count({
        where: { status: { in: [ApplicationStatus.PRE_REVIEWING, ApplicationStatus.APPROVING] } },
      }),
      this.prisma.application.count({
        where: {
          status: { in: [ApplicationStatus.PRE_REVIEWING, ApplicationStatus.APPROVING] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    const byStatus = await this.prisma.application.groupBy({
      by: ['status'],
      _count: true,
    });

    const byDept = await this.prisma.application.groupBy({
      by: ['currentDepartment'],
      _count: true,
      orderBy: { _count: { currentDepartment: 'desc' } },
      take: 10,
    });

    return {
      todayCount,
      totalCount,
      processingCount,
      timeoutCount,
      byStatus,
      byDept,
    };
  }
}
