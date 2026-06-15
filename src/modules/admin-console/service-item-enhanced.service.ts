import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';

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
  formTemplates: FormTemplateVersionDetail[];
  materialTemplates: MaterialVersionDetail[];
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

export interface ServiceItemEnhancedList {
  list: Array<{
    id: string;
    itemCode: string;
    itemName: string;
    category: string;
    handlingDepartment: string;
    handlingTimeLimit: number;
    version: number;
    status: boolean;
    reviewStatus: string;
    formTemplateCount: number;
    materialTemplateCount: number;
    totalApplications: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ServiceItemEnhancedService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async getEnhancedList(params: {
    keyword?: string;
    category?: string;
    department?: string;
    reviewStatus?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ServiceItemEnhancedList> {
    this.logger.log('获取事项标准化增强列表', 'ServiceItemEnhancedService');

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.keyword) {
      where.OR = [
        { itemName: { contains: params.keyword } },
        { itemCode: { contains: params.keyword } },
        { description: { contains: params.keyword } },
      ];
    }
    if (params.category) where.category = params.category;
    if (params.department) where.handlingDepartment = params.department;

    const [items, total] = await Promise.all([
      this.prisma.serviceItem.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          formTemplates: true,
          materials: true,
          applications: { take: 1 },
        },
      }),
      this.prisma.serviceItem.count({ where }),
    ]);

    const appCounts = await this.prisma.application.groupBy({
      by: ['serviceItemId'],
      where: { serviceItemId: { in: items.map((i) => i.id) } },
      _count: true,
    });

    const countMap: Record<string, number> = {};
    for (const ac of appCounts) {
      countMap[ac.serviceItemId] = ac._count;
    }

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

    return {
      list: items.map((item) => ({
        id: item.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        category: item.category,
        handlingDepartment: deptLabels[item.handlingDepartment] || item.handlingDepartment,
        handlingTimeLimit: item.handlingTimeLimit,
        version: item.version,
        status: item.status,
        reviewStatus: this.getReviewStatus(item),
        formTemplateCount: item.formTemplates.length,
        materialTemplateCount: item.materials.length,
        totalApplications: countMap[item.id] || 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getEnhancedDetail(id: string): Promise<ServiceItemEnhancedDetail> {
    this.logger.log(`获取事项标准化增强详情: ${id}`, 'ServiceItemEnhancedService');

    const item = await this.prisma.serviceItem.findUnique({
      where: { id },
      include: {
        formTemplates: { orderBy: { createdAt: 'desc' } },
        materials: { orderBy: { sortOrder: 'asc' } },
        applications: {
          take: 100,
          include: { timeline: true, materials: true },
        },
      },
    });

    if (!item) throw new NotFoundException('事项不存在');

    const completedApps = item.applications.filter((a) =>
      ['COMPLETED', 'CERTIFICATE_ISSUED', 'APPROVED'].includes(a.status),
    );
    const timeoutApps = item.applications.filter((a) =>
      a.timeline.some((t) => t.isTimeout),
    );

    const avgHandlingTime = completedApps.length > 0
      ? completedApps.reduce((sum, a) => {
          if (a.completedAt) return sum + dayjs(a.completedAt).diff(dayjs(a.createdAt), 'minute');
          return sum;
        }, 0) / completedApps.length
      : 0;

    const formUsageCounts: Record<string, number> = {};
    for (const app of item.applications) {
      if (app.formTemplateId) {
        formUsageCounts[app.formTemplateId] = (formUsageCounts[app.formTemplateId] || 0) + 1;
      }
    }

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

    return {
      basicInfo: {
        id: item.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemAlias: item.itemAlias || '',
        category: item.category,
        subCategory: item.subCategory || '',
        description: item.description || '',
        handlingDepartment: deptLabels[item.handlingDepartment] || item.handlingDepartment,
        handlingAddress: item.handlingAddress || '',
        handlingTimeLimit: item.handlingTimeLimit,
        timeLimitUnit: item.timeLimitUnit,
        feeStandard: item.feeStandard || '',
        feeBasis: item.feeBasis || '',
        version: item.version,
        status: item.status,
        reviewStatus: this.getReviewStatus(item),
        reviewedBy: item.publishedBy || '',
        reviewedAt: item.publishedAt,
        reviewComment: '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        publishedAt: item.publishedAt,
      },
      formTemplates: item.formTemplates.map((ft) => ({
        id: ft.id,
        templateCode: ft.templateCode,
        templateName: ft.templateName,
        version: ft.version,
        isActive: ft.isActive,
        schema: ft.schema,
        uiConfig: ft.uiConfig,
        createdAt: ft.createdAt,
        updatedAt: ft.updatedAt,
        usageCount: formUsageCounts[ft.id] || 0,
        changeLog: this.generateChangeLog(ft),
      })),
      materialTemplates: item.materials.map((mt) => ({
        id: mt.id,
        materialName: mt.materialName,
        materialType: mt.materialType,
        version: '1.0',
        isRequired: mt.isRequired,
        format: mt.format,
        maxSize: mt.maxSize,
        description: mt.description || '',
        sampleUrl: mt.sampleUrl || '',
        createdAt: mt.createdAt,
        updatedAt: mt.updatedAt,
        usageCount: item.applications.filter((a) =>
          a.materials?.some((m) => m.templateId === mt.id),
        ).length,
      })),
      reviewHistory: [
        {
          reviewer: item.publishedBy || '系统',
          action: '发布',
          comment: '事项发布上线',
          timestamp: item.publishedAt || item.createdAt,
        },
      ],
      statistics: {
        totalApplications: item.applications.length,
        completionRate: item.applications.length > 0 ? completedApps.length / item.applications.length : 0,
        avgHandlingTime: Math.round(avgHandlingTime),
        timeoutRate: item.applications.length > 0 ? timeoutApps.length / item.applications.length : 0,
      },
    };
  }

  async createFormVersion(serviceItemId: string, templateData: any) {
    this.logger.log(`创建电子表单版本: ${serviceItemId}`, 'ServiceItemEnhancedService');

    const existing = await this.prisma.formTemplate.findFirst({
      where: { serviceItemId, templateCode: templateData.templateCode },
      orderBy: { createdAt: 'desc' },
    });

    const newVersion = existing
      ? this.incrementVersion(existing.version)
      : '1.0';

    if (existing) {
      await this.prisma.formTemplate.update({
        where: { id: existing.id },
        data: { isActive: false },
      });
    }

    return this.prisma.formTemplate.create({
      data: {
        serviceItemId,
        templateCode: templateData.templateCode,
        templateName: templateData.templateName,
        version: newVersion,
        schema: templateData.schema,
        uiConfig: templateData.uiConfig,
        isActive: true,
      },
    });
  }

  async createMaterialVersion(serviceItemId: string, materialData: any) {
    this.logger.log(`创建材料版本: ${serviceItemId}`, 'ServiceItemEnhancedService');
    return this.prisma.materialTemplate.create({
      data: {
        serviceItemId,
        materialName: materialData.materialName,
        materialType: materialData.materialType,
        isRequired: materialData.isRequired ?? true,
        format: materialData.format || 'pdf',
        maxSize: materialData.maxSize || 10,
        description: materialData.description,
        sampleUrl: materialData.sampleUrl,
        sortOrder: materialData.sortOrder || 0,
      },
    });
  }

  async reviewServiceItem(id: string, action: 'APPROVE' | 'REJECT', reviewer: string, comment: string) {
    this.logger.log(`事项复查: ${id} ${action}`, 'ServiceItemEnhancedService');

    const item = await this.prisma.serviceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('事项不存在');

    return this.prisma.serviceItem.update({
      where: { id },
      data: {
        status: action === 'APPROVE',
        publishedBy: reviewer,
        publishedAt: new Date(),
        version: { increment: 1 },
      },
    });
  }

  private getReviewStatus(item: any): 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' {
    if (!item.publishedAt) return 'PENDING';
    if (item.status) return 'APPROVED';
    return 'REJECTED';
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length >= 2) {
      parts[1] = String(parseInt(parts[1]) + 1);
      return parts.join('.');
    }
    return '1.1';
  }

  private generateChangeLog(template: any): string {
    return `版本 ${template.version} 更新于 ${dayjs(template.updatedAt).format('YYYY-MM-DD HH:mm:ss')}`;
  }
}
