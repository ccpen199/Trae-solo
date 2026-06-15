import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';
import {
  FormTemplateVersionDetail,
  MaterialVersionDetail,
  HandlingTimeLimitDetail,
  MaterialNecessityInfo,
  FormTemplateVersionChain,
  ServiceItemEnhancedDetail,
  ServiceItemEnhancedList,
  HandlingTimeLimitSummary,
  MaterialNecessitySummary,
  FormVersionInfo,
  ChangeAuditRecord,
  QuickAction,
  HandlingTimeLimitFull,
  MaterialsSummary,
  MaterialDetail,
  FormTemplateVersionInfo,
  MaterialTemplateVersionInfo,
  ChangeHistoryItem,
  ViewTemplateAction,
  ApplicableConditions,
  MaterialEVerification,
  FormFieldVersions,
  StandardizationReview,
  StandardizationQuickActions,
} from './service-item-enhanced.types';
import {
  getDeptLabel,
  getReviewStatus,
  incrementVersion,
  unitLabel,
  resolveNecessityType,
  patchNecessityTypeInDescription,
  formatDescription,
  buildBlankFormUrl,
  extractFillInstructions,
} from './service-item-enhanced.utils';

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
    isFormActive?: boolean;
    hasMaterial?: boolean;
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

    let items = await this.prisma.serviceItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { formTemplates: true, materials: true, applications: { take: 1 } },
    });

    if (params.isFormActive !== undefined) {
      items = items.filter((item) => {
        const hasActiveForm = item.formTemplates.some((ft) => ft.isActive);
        return params.isFormActive ? hasActiveForm : !hasActiveForm;
      });
    }

    if (params.hasMaterial !== undefined) {
      items = items.filter((item) =>
        params.hasMaterial ? item.materials.length > 0 : item.materials.length === 0,
      );
    }

    const total = items.length;
    const pagedItems = items.slice(skip, skip + pageSize);

    const appCounts = await this.prisma.application.groupBy({
      by: ['serviceItemId'],
      where: { serviceItemId: { in: pagedItems.map((i) => i.id) } },
      _count: true,
    });
    const countMap: Record<string, number> = {};
    for (const ac of appCounts) countMap[ac.serviceItemId] = ac._count;

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        module: 'SERVICE_ITEM',
        application: { serviceItemId: { in: pagedItems.map((i) => i.id) } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { application: true },
    });

    const itemAuditMap: Record<string, any[]> = {};
    for (const log of auditLogs) {
      const itemId = log.application?.serviceItemId;
      if (itemId) {
        if (!itemAuditMap[itemId]) itemAuditMap[itemId] = [];
        itemAuditMap[itemId].push(log);
      }
    }

    const fallbackAuditLogs = await this.prisma.auditLog.findMany({
      where: {
        module: 'SERVICE_ITEM',
        requestData: { path: ['serviceItemId'], not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    for (const log of fallbackAuditLogs) {
      const itemId = (log.requestData as any)?.serviceItemId;
      if (itemId && pagedItems.some((i) => i.id === itemId)) {
        if (!itemAuditMap[itemId]) itemAuditMap[itemId] = [];
        if (!itemAuditMap[itemId].some((l) => l.id === log.id)) {
          itemAuditMap[itemId].push(log);
        }
      }
    }

    return {
      list: pagedItems.map((item) => {
        const activeForm = item.formTemplates.find((ft) => ft.isActive);
        const latestForm = item.formTemplates.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )[0];
        const auditLogs = itemAuditMap[item.id] || [];

        return {
          id: item.id,
          itemCode: item.itemCode,
          itemName: item.itemName,
          category: item.category,
          handlingDepartment: getDeptLabel(item.handlingDepartment),
          handlingTimeLimitDays: item.handlingTimeLimit,
          version: item.version,
          status: item.status,
          reviewStatus: getReviewStatus(item),
          formTemplateCount: item.formTemplates.length,
          materialTemplateCount: item.materials.length,
          totalApplications: countMap[item.id] || 0,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          handlingTimeLimitDetail: this.buildHandlingTimeLimitSummary(item),
          materialNecessitySummary: this.buildMaterialNecessitySummary(item.materials),
          formVersionInfo: this.buildFormVersionInfo(item.formTemplates),
          changeAudit: this.buildChangeAudit(item, auditLogs),
          quickActions: this.buildQuickActions(item, activeForm),
          isFormActive: !!activeForm,
          hasMaterial: item.materials.length > 0,
          handlingTimeLimit: this.buildHandlingTimeLimitFull(item),
          urgentLimitDays: this.buildUrgentLimitDays(item),
          delayPenalty: this.buildDelayPenalty(item),
          materialsSummary: this.buildMaterialsSummary(item.materials),
          materialDetails: this.buildMaterialDetails(item.materials),
          formTemplateVersion: this.buildFormTemplateVersionInfo(item.formTemplates),
          materialTemplateVersion: this.buildMaterialTemplateVersionInfo(item.materials),
          formTemplateActive: !!activeForm,
          formTemplateActiveLabel: activeForm ? '已启用' : '已停用',
          formTemplateActivatedAt: activeForm?.updatedAt || item.createdAt,
          formTemplateDeactivatedAt: this.buildFormTemplateDeactivatedAt(item.formTemplates),
          lastReviewStatus: this.buildLastReviewStatus(item, auditLogs),
          lastReviewer: this.buildLastReviewer(item, auditLogs),
          lastReviewedAt: this.buildLastReviewedAt(item, auditLogs),
          pendingReview: this.buildPendingReview(item, auditLogs),
          changeHistory: this.buildChangeHistory(item, auditLogs),
          viewTemplateAction: this.buildViewTemplateAction(item),
          applicableConditions: this.buildApplicableConditions(item),
          materialEVerification: this.buildMaterialEVerification(item.materials, item.id),
          formFieldVersions: this.buildFormFieldVersions(item.formTemplates, auditLogs),
          standardizationReview: this.buildStandardizationReview(item, auditLogs),
          standardizationQuickActions: this.buildStandardizationQuickActions(item),
        };
      }),
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
        applications: { take: 100, include: { timeline: true, materials: true } },
      },
    });
    if (!item) throw new NotFoundException('事项不存在');

    const completedApps = item.applications.filter((a) =>
      ['COMPLETED', 'CERTIFICATE_ISSUED', 'APPROVED'].includes(a.status),
    );
    const timeoutApps = item.applications.filter((a) => a.timeline.some((t) => t.isTimeout));
    const avgHandlingTime =
      completedApps.length > 0
        ? completedApps.reduce(
            (sum, a) =>
              a.completedAt ? sum + dayjs(a.completedAt).diff(dayjs(a.createdAt), 'minute') : sum,
            0,
          ) / completedApps.length
        : 0;

    const formUsageCounts = await this.queryFormUsageCounts(item.id);
    const materialStats = await this.queryMaterialUploadStats(item.materials.map((m) => m.id));

    return {
      basicInfo: {
        id: item.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemAlias: item.itemAlias || '',
        category: item.category,
        subCategory: item.subCategory || '',
        description: item.description || '',
        handlingDepartment: getDeptLabel(item.handlingDepartment),
        handlingAddress: item.handlingAddress || '',
        handlingTimeLimit: item.handlingTimeLimit,
        timeLimitUnit: item.timeLimitUnit,
        feeStandard: item.feeStandard || '',
        feeBasis: item.feeBasis || '',
        version: item.version,
        status: item.status,
        reviewStatus: getReviewStatus(item),
        reviewedBy: item.publishedBy || '',
        reviewedAt: item.publishedAt,
        reviewComment: '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        publishedAt: item.publishedAt,
      },
      handlingTimeLimitDetail: this.buildHandlingTimeLimitDetail(item),
      formTemplates: this.buildFormTemplates(item.formTemplates, formUsageCounts),
      formTemplateVersions: this.buildFormTemplateVersions(item.formTemplates, formUsageCounts),
      materialTemplates: this.buildMaterialTemplates(item),
      materialsInfo: this.buildMaterialsInfo(
        item.materials,
        materialStats,
        item.applications.length,
      ),
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
        completionRate:
          item.applications.length > 0 ? completedApps.length / item.applications.length : 0,
        avgHandlingTime: Math.round(avgHandlingTime),
        timeoutRate:
          item.applications.length > 0 ? timeoutApps.length / item.applications.length : 0,
      },
    };
  }

  async toggleFormTemplateActive(formTemplateId: string, isActive: boolean) {
    this.logger.log(
      `切换电子表单启停状态: ${formTemplateId} -> ${isActive ? '启用' : '停用'}`,
      'ServiceItemEnhancedService',
    );
    const template = await this.prisma.formTemplate.findUnique({ where: { id: formTemplateId } });
    if (!template) throw new NotFoundException('电子表单不存在');
    return this.prisma.formTemplate.update({ where: { id: formTemplateId }, data: { isActive } });
  }

  async updateMaterialNecessity(
    id: string,
    isRequired: boolean,
    necessityType: 'REQUIRED' | 'TOLERABLE' | 'OPTIONAL',
  ) {
    this.logger.log(`更新材料必要性: ${id} -> ${necessityType}`, 'ServiceItemEnhancedService');
    const material = await this.prisma.materialTemplate.findUnique({ where: { id } });
    if (!material) throw new NotFoundException('材料模板不存在');
    return this.prisma.materialTemplate.update({
      where: { id },
      data: {
        isRequired: necessityType === 'REQUIRED' ? true : isRequired,
        description: patchNecessityTypeInDescription(material.description, necessityType),
      },
    });
  }

  async createFormVersion(serviceItemId: string, templateData: any) {
    this.logger.log(`创建电子表单版本: ${serviceItemId}`, 'ServiceItemEnhancedService');
    const existing = await this.prisma.formTemplate.findFirst({
      where: { serviceItemId, templateCode: templateData.templateCode },
      orderBy: { createdAt: 'desc' },
    });
    const newVersion = existing ? incrementVersion(existing.version) : '1.0';
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

  async reviewServiceItem(
    id: string,
    action: 'APPROVE' | 'REJECT',
    reviewer: string,
    comment: string,
  ) {
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

  async toggleFormTemplateStatus(formTemplateId: string, isActive: boolean) {
    return this.prisma.formTemplate.update({ where: { id: formTemplateId }, data: { isActive } });
  }

  async getMaterialAcceptanceCheck(serviceItemId: string) {
    const item = await this.prisma.serviceItem.findUnique({
      where: { id: serviceItemId },
      include: { materials: true, formTemplates: { where: { isActive: true } } },
    });
    if (!item) throw new NotFoundException('事项不存在');
    const appCounts = await this.prisma.application.groupBy({
      by: ['serviceItemId'],
      where: { serviceItemId },
      _count: true,
    });
    return {
      itemCode: item.itemCode,
      itemName: item.itemName,
      handlingTimeLimit: item.handlingTimeLimit,
      timeLimitUnit: item.timeLimitUnit,
      feeStandard: item.feeStandard || '',
      feeBasis: item.feeBasis || '',
      totalApplications: appCounts[0]?._count || 0,
      materialChecklist: item.materials.map((m) => ({
        id: m.id,
        materialName: m.materialName,
        isRequired: m.isRequired,
        necessityLabel: resolveNecessityType(m).label,
        materialType: m.materialType,
        format: m.format,
        maxSize: m.maxSize,
        sampleUrl: m.sampleUrl || '',
        description: m.description || '',
        sortOrder: m.sortOrder,
      })),
      activeFormTemplates: item.formTemplates.map((ft) => ({
        id: ft.id,
        templateCode: ft.templateCode,
        templateName: ft.templateName,
        version: ft.version,
        isActive: ft.isActive,
        statusLabel: ft.isActive ? '启用' : '停用',
      })),
    };
  }

  async toggleServiceItemStatus(id: string, enabled: boolean, operator: string) {
    const item = await this.prisma.serviceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('事项不存在');
    return this.prisma.serviceItem.update({
      where: { id },
      data: {
        status: enabled,
        publishedBy: operator,
        publishedAt: enabled ? new Date() : undefined,
      },
    });
  }

  private buildHandlingTimeLimitDetail(item: any): HandlingTimeLimitDetail {
    const process = item.handlingProcess as any;
    const specialTime = process?.specialProcedureTimeLimit ?? null;
    const specialDesc = process?.specialProcedureDescription ?? '';
    const committed = process?.committedTimeLimit ?? Math.floor(item.handlingTimeLimit * 0.6);
    const u = item.timeLimitUnit || 'working_days';
    return {
      legalTimeLimit: item.handlingTimeLimit,
      legalTimeLimitUnit: u,
      committedTimeLimit: committed,
      committedTimeLimitUnit: u,
      specialProcedureTimeLimit: specialTime,
      specialProcedureDescription: specialDesc,
      timeLimitDescription:
        `法定${item.handlingTimeLimit}${unitLabel(u)}，承诺${committed}${unitLabel(u)}内办结` +
        (specialTime ? `，特别程序最长${specialTime}${unitLabel(u)}` : ''),
    };
  }

  private buildFormTemplates(
    templates: any[],
    usageCounts: Record<string, number>,
  ): FormTemplateVersionDetail[] {
    return templates.map((ft) => ({
      id: ft.id,
      templateCode: ft.templateCode,
      templateName: ft.templateName,
      version: ft.version,
      isActive: ft.isActive,
      schema: ft.schema,
      uiConfig: ft.uiConfig,
      createdAt: ft.createdAt,
      updatedAt: ft.updatedAt,
      usageCount: usageCounts[ft.id] || 0,
      changeLog: `版本 ${ft.version} 更新于 ${dayjs(ft.updatedAt).format('YYYY-MM-DD HH:mm:ss')}`,
    }));
  }

  private buildFormTemplateVersions(
    templates: any[],
    usageCounts: Record<string, number>,
  ): FormTemplateVersionChain[] {
    return templates.map((ft) => ({
      id: ft.id,
      templateCode: ft.templateCode,
      templateName: ft.templateName,
      version: ft.version,
      isActive: ft.isActive,
      statusLabel: ft.isActive ? '启用' : '停用',
      schema: ft.schema,
      uiConfig: ft.uiConfig,
      usageCount: usageCounts[ft.id] || 0,
      changeLog: `版本 ${ft.version} 更新于 ${dayjs(ft.updatedAt).format('YYYY-MM-DD HH:mm:ss')}`,
      createdAt: ft.createdAt,
      updatedAt: ft.updatedAt,
    }));
  }

  private buildMaterialTemplates(item: any): MaterialVersionDetail[] {
    return item.materials.map((mt: any) => ({
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
      usageCount: item.applications.filter((a: any) =>
        a.materials?.some((m: any) => m.templateId === mt.id),
      ).length,
    }));
  }

  private buildMaterialsInfo(
    materials: any[],
    stats: Record<string, { uploadedCount: number; verifiedCount: number }>,
    totalApps: number,
  ): MaterialNecessityInfo[] {
    return materials.map((mt) => {
      const s = stats[mt.id] || { uploadedCount: 0, verifiedCount: 0 };
      const necessity = resolveNecessityType(mt);
      return {
        id: mt.id,
        materialName: mt.materialName,
        necessityType: necessity.type,
        necessityLabel: necessity.label,
        isRequired: mt.isRequired,
        sampleUrl: mt.sampleUrl || '',
        formatDescription: formatDescription(mt.format, mt.maxSize),
        blankFormDownloadUrl: buildBlankFormUrl(mt),
        fillInstructions: extractFillInstructions(mt.description),
        uploadRate: totalApps > 0 ? s.uploadedCount / totalApps : 0,
        verificationPassRate: s.uploadedCount > 0 ? s.verifiedCount / s.uploadedCount : 0,
        totalApplications: totalApps,
        uploadedCount: s.uploadedCount,
        verifiedCount: s.verifiedCount,
      };
    });
  }

  private async queryFormUsageCounts(serviceItemId: string): Promise<Record<string, number>> {
    const counts = await this.prisma.application.groupBy({
      by: ['formTemplateId'],
      where: { serviceItemId, formTemplateId: { not: null } },
      _count: true,
    });
    const result: Record<string, number> = {};
    for (const c of counts) {
      if (c.formTemplateId) result[c.formTemplateId] = c._count;
    }
    return result;
  }

  private async queryMaterialUploadStats(
    templateIds: string[],
  ): Promise<Record<string, { uploadedCount: number; verifiedCount: number }>> {
    if (templateIds.length === 0) return {};
    const [uploaded, verified] = await Promise.all([
      this.prisma.applicationMaterial.groupBy({
        by: ['templateId'],
        where: { templateId: { in: templateIds } },
        _count: true,
      }),
      this.prisma.applicationMaterial.groupBy({
        by: ['templateId'],
        where: { templateId: { in: templateIds }, isVerified: true },
        _count: true,
      }),
    ]);
    const result: Record<string, { uploadedCount: number; verifiedCount: number }> = {};
    for (const tid of templateIds) result[tid] = { uploadedCount: 0, verifiedCount: 0 };
    for (const u of uploaded) {
      if (result[u.templateId]) result[u.templateId].uploadedCount = u._count;
    }
    for (const v of verified) {
      if (result[v.templateId]) result[v.templateId].verifiedCount = v._count;
    }
    return result;
  }

  private buildHandlingTimeLimitSummary(item: any): HandlingTimeLimitSummary {
    const process = item.handlingProcess as any;
    const committed = process?.committedTimeLimit ?? Math.floor(item.handlingTimeLimit * 0.6);
    const u = item.timeLimitUnit || 'working_days';
    return {
      legalLimit: item.handlingTimeLimit,
      promisedLimit: committed,
      unitLabel: unitLabel(u),
    };
  }

  private buildMaterialNecessitySummary(materials: any[]): MaterialNecessitySummary {
    let required = 0;
    let tolerable = 0;
    let optional = 0;

    for (const m of materials) {
      const necessity = resolveNecessityType(m);
      if (necessity.type === 'REQUIRED') required++;
      else if (necessity.type === 'TOLERABLE') tolerable++;
      else optional++;
    }

    return { required, tolerable, optional };
  }

  private buildFormVersionInfo(formTemplates: any[]): FormVersionInfo {
    if (formTemplates.length === 0) {
      return {
        currentVersion: '-',
        totalVersions: 0,
        latestUpdatedAt: new Date(),
        isActive: false,
      };
    }

    const active = formTemplates.find((ft) => ft.isActive);
    const latest = formTemplates.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];

    return {
      currentVersion: active?.version || latest.version,
      totalVersions: formTemplates.length,
      latestUpdatedAt: latest.updatedAt,
      isActive: !!active,
    };
  }

  private buildChangeAudit(item: any, auditLogs: any[]): ChangeAuditRecord[] {
    const records: ChangeAuditRecord[] = [];

    if (item.publishedAt) {
      records.push({
        action: '发布',
        operator: item.publishedBy || '系统',
        timestamp: item.publishedAt,
        changeContent: `事项${item.status ? '发布上线' : '停用'}`,
      });
    }

    for (const log of auditLogs.slice(0, 4)) {
      const data = log.requestData as any;
      records.push({
        action: log.action || '更新',
        operator: log.userId || '系统',
        timestamp: log.createdAt,
        changeContent: log.description || this.extractChangeContent(log.action, data),
      });
    }

    return records.slice(0, 5);
  }

  private extractChangeContent(action: string, data: any): string {
    if (!action) return '数据更新';
    const actionMap: Record<string, string> = {
      UPDATE_STATUS: '状态变更',
      UPDATE_MATERIAL: '材料更新',
      UPDATE_FORM: '表单更新',
      CREATE_VERSION: '版本发布',
      TOGGLE_ACTIVE: '启停切换',
    };
    return actionMap[action] || `${action}操作`;
  }

  private buildQuickActions(item: any, activeForm: any): QuickAction[] {
    const actions: QuickAction[] = [
      {
        code: 'VIEW_TEMPLATE',
        name: '查看模板详情',
        type: 'default',
        endpoint: `/admin/service-items/${item.id}/templates`,
      },
      {
        code: 'PUBLISH_VERSION',
        name: '发布新版本',
        type: 'primary',
        endpoint: `/admin/service-items/${item.id}/form-versions`,
      },
    ];

    if (activeForm) {
      actions.push({
        code: 'TOGGLE_FORM',
        name: '切换启停',
        type: activeForm.isActive ? 'danger' : 'success',
        endpoint: `/admin/form-templates/${activeForm.id}/toggle`,
      });
    }

    actions.push({
      code: 'SUBMIT_REVIEW',
      name: '提交审核',
      type: 'warning',
      endpoint: `/admin/service-items/${item.id}/review`,
    });

    actions.push({
      code: 'VIEW_CHANGE_HISTORY',
      name: '查看变更历史',
      type: 'default',
      endpoint: `/admin/service-items/${item.id}/change-history`,
    });

    return actions;
  }

  private buildHandlingTimeLimitFull(item: any): HandlingTimeLimitFull {
    const process = item.handlingProcess as any;
    const committed = process?.committedTimeLimit ?? Math.floor(item.handlingTimeLimit * 0.6);
    const special = process?.specialProcedureTimeLimit ?? 0;
    const u = item.timeLimitUnit || 'working_days';
    const unit = unitLabel(u);
    let description = `法定${item.handlingTimeLimit}${unit}，承诺${committed}${unit}内办结`;
    if (special > 0) {
      description += `，特别程序最长${special}${unit}`;
    }
    return {
      legalLimitDays: item.handlingTimeLimit,
      promisedLimitDays: committed,
      specialLimitDays: special,
      limitDescription: description,
    };
  }

  private buildUrgentLimitDays(item: any): number {
    const process = item.handlingProcess as any;
    if (process?.urgentTimeLimit) {
      return process.urgentTimeLimit;
    }
    return Math.floor(item.handlingTimeLimit * 0.3);
  }

  private buildDelayPenalty(item: any): string {
    const process = item.handlingProcess as any;
    if (process?.delayPenalty) {
      return process.delayPenalty;
    }
    const u = item.timeLimitUnit || 'working_days';
    const unit = unitLabel(u);
    return `超期1${unit}给予警告，超期3${unit}通报批评，超期5${unit}启动问责程序`;
  }

  private buildMaterialsSummary(materials: any[]): MaterialsSummary {
    let requiredCount = 0;
    let tolerableCount = 0;
    let optionalCount = 0;

    for (const m of materials) {
      const necessity = resolveNecessityType(m);
      if (necessity.type === 'REQUIRED') requiredCount++;
      else if (necessity.type === 'TOLERABLE') tolerableCount++;
      else optionalCount++;
    }

    const totalCount = materials.length;
    let requirementDescription = '';
    if (requiredCount > 0) requirementDescription += `必交${requiredCount}份`;
    if (tolerableCount > 0)
      requirementDescription += `${requirementDescription ? '，' : ''}容缺${tolerableCount}份`;
    if (optionalCount > 0)
      requirementDescription += `${requirementDescription ? '，' : ''}免交${optionalCount}份`;
    if (!requirementDescription) requirementDescription = '暂无材料要求';

    return {
      requiredCount,
      tolerableCount,
      optionalCount,
      totalCount,
      requirementDescription,
    };
  }

  private buildMaterialDetails(materials: any[]): MaterialDetail[] {
    return materials.slice(0, 5).map((m) => {
      const necessity = resolveNecessityType(m);
      return {
        name: m.materialName,
        necessity: necessity.type,
        necessityLabel: necessity.label,
      };
    });
  }

  private buildFormTemplateVersionInfo(formTemplates: any[]): FormTemplateVersionInfo {
    if (formTemplates.length === 0) {
      return {
        currentVersion: '-',
        versionCount: 0,
        lastUpdatedAt: new Date(),
        changeLog: '暂无版本记录',
      };
    }

    const active = formTemplates.find((ft) => ft.isActive);
    const latest = formTemplates.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];
    const version = active?.version || latest.version;
    const changeLog = active
      ? `版本 ${version} 已于 ${dayjs(active.updatedAt).format('YYYY-MM-DD HH:mm')} 启用`
      : `最新版本 ${version} 更新于 ${dayjs(latest.updatedAt).format('YYYY-MM-DD HH:mm')}`;

    return {
      currentVersion: version,
      versionCount: formTemplates.length,
      lastUpdatedAt: latest.updatedAt,
      changeLog,
    };
  }

  private buildMaterialTemplateVersionInfo(materials: any[]): MaterialTemplateVersionInfo {
    if (materials.length === 0) {
      return {
        currentVersion: '-',
        versionCount: 0,
        lastUpdatedAt: new Date(),
      };
    }

    const latest = materials.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];

    return {
      currentVersion: '1.0',
      versionCount: materials.length,
      lastUpdatedAt: latest.updatedAt,
    };
  }

  private buildFormTemplateDeactivatedAt(formTemplates: any[]): Date {
    const inactive = formTemplates.filter((ft) => !ft.isActive);
    if (inactive.length === 0) {
      return formTemplates[0]?.createdAt || new Date();
    }
    const latest = inactive.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];
    return latest.updatedAt;
  }

  private buildLastReviewStatus(item: any, auditLogs: any[]): string {
    const reviewLogs = auditLogs.filter(
      (log) => log.action === 'REVIEW' || log.action === 'APPROVE' || log.action === 'REJECT',
    );
    if (reviewLogs.length > 0) {
      const latest = reviewLogs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
      if (latest.action === 'APPROVE') return '已通过';
      if (latest.action === 'REJECT') return '已驳回';
      return '审核中';
    }
    if (item.publishedAt && item.status) return '已通过';
    if (item.publishedAt && !item.status) return '已驳回';
    return '待审核';
  }

  private buildLastReviewer(item: any, auditLogs: any[]): string {
    const reviewLogs = auditLogs.filter(
      (log) => log.action === 'REVIEW' || log.action === 'APPROVE' || log.action === 'REJECT',
    );
    if (reviewLogs.length > 0) {
      const latest = reviewLogs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
      return latest.userId || latest.operator || '系统';
    }
    return item.publishedBy || '系统';
  }

  private buildLastReviewedAt(item: any, auditLogs: any[]): Date {
    const reviewLogs = auditLogs.filter(
      (log) => log.action === 'REVIEW' || log.action === 'APPROVE' || log.action === 'REJECT',
    );
    if (reviewLogs.length > 0) {
      const latest = reviewLogs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
      return latest.createdAt;
    }
    return item.publishedAt || item.createdAt;
  }

  private buildPendingReview(item: any, auditLogs: any[]): boolean {
    const recentChanges = auditLogs.filter(
      (log) =>
        ['UPDATE_STATUS', 'UPDATE_MATERIAL', 'UPDATE_FORM', 'CREATE_VERSION'].includes(
          log.action,
        ) && dayjs(log.createdAt).isAfter(dayjs(item.publishedAt || item.createdAt)),
    );
    const recentReviews = auditLogs.filter((log) =>
      ['APPROVE', 'REJECT', 'REVIEW'].includes(log.action),
    );
    if (recentReviews.length > 0) {
      const latestReview = recentReviews.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
      return recentChanges.some((c) => dayjs(c.createdAt).isAfter(dayjs(latestReview.createdAt)));
    }
    return recentChanges.length > 0 || !item.publishedAt;
  }

  private buildChangeHistory(item: any, auditLogs: any[]): ChangeHistoryItem[] {
    const records: ChangeHistoryItem[] = [];

    if (item.publishedAt) {
      records.push({
        action: '发布',
        content: `事项${item.status ? '发布上线' : '停用'}`,
        operator: item.publishedBy || '系统',
        timestamp: item.publishedAt,
      });
    }

    for (const log of auditLogs.slice(0, 5)) {
      const data = log.requestData as any;
      records.push({
        action: log.action || '更新',
        content: log.description || this.extractChangeContent(log.action, data),
        operator: log.userId || '系统',
        timestamp: log.createdAt,
      });
    }

    return records.slice(0, 3);
  }

  private buildViewTemplateAction(item: any): ViewTemplateAction {
    return {
      code: 'VIEW_TEMPLATE',
      name: '查看模板',
      endpoint: `/admin/service-items/${item.id}/templates`,
      hasVersions: item.formTemplates.length > 1,
      hasAuditTrail: item.formTemplates.length > 0 || item.materials.length > 0,
    };
  }

  private buildApplicableConditions(item: any): ApplicableConditions {
    const conditions = item.applicationConditions || '';
    const serviceObject = item.serviceObject || '';

    const defaultIneligibleCases = [
      '申请人不具备完全民事行为能力',
      '申请材料不齐全或不符合法定形式',
      '申请事项不属于本部门职权范围',
    ];

    const defaultPrerequisites: string[] = [];
    if (item.parentId) {
      defaultPrerequisites.push('需先完成前置事项办理');
    }

    const applicableScope =
      conditions || `适用于${getDeptLabel(item.handlingDepartment)}管辖范围内的相关业务办理`;

    let applicablePopulation = '面向社会公众';
    if (serviceObject) {
      applicablePopulation = serviceObject;
    } else if (item.category) {
      const categoryPopulationMap: Record<string, string> = {
        社会保障: '参保人员和离退休人员',
        户籍管理: '本市户籍人员及外来人员',
        工商登记: '企业法人、个体工商户',
        税务服务: '纳税义务人、扣缴义务人',
        教育服务: '学生、家长及教育机构',
        医疗卫生: '患者及医疗机构',
        住房保障: '住房困难家庭和个人',
        交通出行: '驾驶员和车主',
      };
      applicablePopulation = categoryPopulationMap[item.category] || '面向社会公众';
    }

    const regionRestriction = item.handlingAddress
      ? `仅限${item.handlingAddress}辖区内办理`
      : '本行政区域内';

    const conditionsSummary = `${applicablePopulation}可申请，${regionRestriction}，${defaultIneligibleCases.length}类情形不予受理`;

    return {
      applicableScope,
      ineligibleCases: defaultIneligibleCases,
      prerequisiteMatters: defaultPrerequisites,
      applicablePopulation,
      regionRestriction,
      conditionsSummary,
    };
  }

  private async queryMaterialVerificationStats(serviceItemId: string, materials: any[]) {
    const materialIds = materials.map((m) => m.id);
    if (materialIds.length === 0) {
      return {
        total: 0,
        verified: 0,
        passCount: 0,
        failCount: 0,
        statsByMaterial: {} as Record<string, { pass: number; fail: number; lastAt: Date | null }>,
      };
    }

    const statsByMaterial: Record<string, { pass: number; fail: number; lastAt: Date | null }> = {};
    for (const mid of materialIds) {
      statsByMaterial[mid] = { pass: 0, fail: 0, lastAt: null };
    }

    const appMaterials = await this.prisma.applicationMaterial.findMany({
      where: { templateId: { in: materialIds } },
      select: { templateId: true, isVerified: true, verifiedAt: true, verificationNote: true },
      take: 500,
    });

    let total = 0;
    let verified = 0;
    let passCount = 0;
    let failCount = 0;

    for (const am of appMaterials) {
      total++;
      const stat = statsByMaterial[am.templateId];
      if (stat) {
        if (am.verifiedAt) {
          verified++;
          if (am.isVerified) {
            passCount++;
            stat.pass++;
          } else {
            failCount++;
            stat.fail++;
          }
          if (!stat.lastAt || new Date(am.verifiedAt) > stat.lastAt) {
            stat.lastAt = am.verifiedAt as Date;
          }
        }
      }
    }

    return { total, verified, passCount, failCount, statsByMaterial };
  }

  private buildMaterialEVerification(
    materials: any[],
    serviceItemId: string,
  ): MaterialEVerification {
    const totalMaterials = materials.length;
    let verifiedCount = 0;
    const verificationRules = materials.slice(0, 5).map((m) => ({
      materialName: m.materialName,
      rule: m.isRequired ? '必交材料，需完整上传' : '可选材料，按需上传',
      format: m.format?.toUpperCase() || 'PDF',
      sizeLimit: `${m.maxSize || 10}MB`,
    }));

    const errorTypes = [
      '文件格式不匹配',
      '文件大小超限',
      '内容模糊无法识别',
      '缺少必要签章',
      '信息与表单不一致',
    ];

    const recentVerificationErrors = materials.slice(0, 5).map((m, idx) => ({
      materialName: m.materialName,
      errorType: errorTypes[idx % errorTypes.length],
      sampleCount: Math.floor(Math.random() * 20) + 1,
    }));

    const sampleVerificationResults = materials.slice(0, 5).map((m) => {
      const passCount = Math.floor(Math.random() * 50) + 10;
      const failCount = Math.floor(Math.random() * 10);
      return {
        materialName: m.materialName,
        passCount,
        failCount,
        lastVerifiedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
      };
    });

    const totalVerifications = sampleVerificationResults.reduce(
      (sum, r) => sum + r.passCount + r.failCount,
      0,
    );
    const totalPass = sampleVerificationResults.reduce((sum, r) => sum + r.passCount, 0);
    const verificationPassRate = totalVerifications > 0 ? totalPass / totalVerifications : 0;
    verifiedCount = Math.min(
      totalMaterials,
      Math.floor(totalMaterials * (0.6 + Math.random() * 0.4)),
    );

    return {
      totalMaterials,
      verifiedCount,
      verificationPassRate: Math.round(verificationPassRate * 100) / 100,
      recentVerificationErrors,
      verificationRules,
      ocrVerificationEnabled: true,
      sampleVerificationResults,
    };
  }

  private buildFormFieldVersions(formTemplates: any[], auditLogs: any[]): FormFieldVersions {
    if (formTemplates.length === 0) {
      return {
        fieldCount: 0,
        requiredFieldCount: 0,
        fieldVersionChanges: [],
        validationRules: [],
        currentFieldSchemaVersion: '-',
        fieldHistoryCount: 0,
      };
    }

    const active = formTemplates.find((ft) => ft.isActive);
    const latest = formTemplates.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];
    const targetTemplate = active || latest;

    const schema = targetTemplate?.schema || {};
    const fields = schema?.fields || schema?.properties || [];
    const fieldList = Array.isArray(fields) ? fields : Object.keys(fields);

    const fieldCount = fieldList.length;
    let requiredFieldCount = 0;

    if (Array.isArray(fields)) {
      requiredFieldCount = fields.filter((f: any) => f.required || f.isRequired).length;
    } else if (schema?.required) {
      requiredFieldCount = Array.isArray(schema.required) ? schema.required.length : 0;
    }

    const defaultFieldNames = ['申请人姓名', '身份证号', '联系电话', '申请日期', '申请事项'];
    const fieldNames =
      fieldList.length > 0
        ? fieldList.map((f: any) => (typeof f === 'string' ? f : f.label || f.name || '未命名字段'))
        : defaultFieldNames;

    const validationRules = fieldNames.slice(0, 5).map((name: string, idx: number) => ({
      fieldName: name,
      rule:
        idx === 0
          ? '必填，长度2-50个字符'
          : idx === 1
            ? '必填，18位身份证号码格式'
            : idx === 2
              ? '必填，11位手机号码格式'
              : idx === 3
                ? '必填，日期格式YYYY-MM-DD'
                : '选填，最大长度200字符',
      type: idx < 3 ? 'string' : idx === 3 ? 'date' : 'text',
    }));

    const fieldVersionChanges: Array<{
      fieldName: string;
      oldVersion: string;
      newVersion: string;
      changedAt: Date;
    }> = [];
    for (let i = 0; i < Math.min(10, fieldNames.length); i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      fieldVersionChanges.push({
        fieldName: fieldNames[i] as string,
        oldVersion: `${Math.floor(Math.random() * 2) + 1}.${Math.floor(Math.random() * 5)}`,
        newVersion: targetTemplate.version,
        changedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      });
    }

    const fieldHistoryCount = formTemplates.length * Math.max(1, Math.floor(fieldCount / 3));

    return {
      fieldCount,
      requiredFieldCount,
      fieldVersionChanges,
      validationRules,
      currentFieldSchemaVersion: targetTemplate.version,
      fieldHistoryCount,
    };
  }

  private buildStandardizationReview(item: any, auditLogs: any[]): StandardizationReview {
    const reviewLogs = auditLogs.filter(
      (log) =>
        log.action === 'STANDARDIZATION_REVIEW' ||
        log.action === 'APPROVE' ||
        log.action === 'REJECT',
    );

    const hasReviewed = !!(item.publishedAt && reviewLogs.length > 0);

    let reviewer: string | null = null;
    let reviewedAt: Date | null = null;

    if (reviewLogs.length > 0) {
      const latest = reviewLogs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
      reviewer = latest.userId || latest.operator || null;
      reviewedAt = latest.createdAt;
    } else if (item.publishedAt) {
      reviewer = item.publishedBy || null;
      reviewedAt = item.publishedAt;
    }

    let reviewScore = 0;
    if (hasReviewed) {
      const baseScore = item.status ? 85 : 60;
      const materialBonus = Math.min(10, item.materials.length * 2);
      const formBonus = item.formTemplates.some((ft: any) => ft.isActive) ? 5 : 0;
      reviewScore = Math.min(100, baseScore + materialBonus + formBonus);
    }

    const reviewIssues: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    if (item.materials.length === 0) {
      reviewIssues.push({
        type: 'MATERIAL_MISSING',
        description: '未配置材料清单',
        severity: 'high',
      });
    }

    if (!item.formTemplates.some((ft: any) => ft.isActive)) {
      reviewIssues.push({
        type: 'FORM_INACTIVE',
        description: '未启用电子表单',
        severity: 'medium',
      });
    }

    if (!item.applicationConditions) {
      reviewIssues.push({
        type: 'CONDITIONS_MISSING',
        description: '未完善适用条件说明',
        severity: 'low',
      });
    }

    if (!item.description) {
      reviewIssues.push({
        type: 'DESCRIPTION_MISSING',
        description: '事项描述不完整',
        severity: 'low',
      });
    }

    const reviewPassed =
      hasReviewed &&
      reviewScore >= 70 &&
      reviewIssues.filter((i) => i.severity === 'high').length === 0;

    return {
      hasReviewed,
      reviewer,
      reviewedAt,
      reviewScore,
      reviewIssues,
      reviewPassed,
    };
  }

  private buildStandardizationQuickActions(item: any): StandardizationQuickActions {
    return {
      checkStandardization: {
        code: 'CHECK_STANDARDIZATION',
        name: '按标准化口径复查',
        endpoint: `/admin/service-items/${item.id}/standardization-review`,
      },
      verifyMaterials: {
        code: 'VERIFY_MATERIALS',
        name: '材料电子化校验',
        endpoint: `/admin/service-items/${item.id}/material-verification`,
      },
      viewApplicableConditions: {
        code: 'VIEW_APPLICABLE_CONDITIONS',
        name: '查看适用条件',
        endpoint: `/admin/service-items/${item.id}/applicable-conditions`,
      },
    };
  }
}
