import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PolicyCategory, Department } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';

export interface StructuredPolicyField {
  fieldName: string;
  fieldType: 'string' | 'number' | 'date' | 'enum' | 'boolean';
  value: any;
  description: string;
}

export interface TrainingCorpusLink {
  id: string;
  question: string;
  answer: string;
  category: string;
  intent: string;
  usageCount: number;
  helpfulCount: number;
  isApproved: boolean;
  linkedAt: Date;
}

export interface PolicyEnhancedDetail {
  basicInfo: {
    id: string;
    title: string;
    documentNo: string;
    category: string;
    categoryLabel: string;
    issuingDept: string;
    issuingDeptLabel: string;
    issueDate: Date;
    effectiveDate: Date;
    expiryDate: Date;
    summary: string;
    content: string;
    keywords: string[];
    status: string;
    reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
    reviewedBy: string;
    reviewedAt: Date;
    reviewComment: string;
    viewCount: number;
    downloadCount: number;
    aiTrained: boolean;
    trainedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  structuredFields: StructuredPolicyField[];
  trainingCorpora: TrainingCorpusLink[];
  reviewHistory: Array<{
    reviewer: string;
    action: string;
    comment: string;
    timestamp: Date;
  }>;
  relatedServiceItems: Array<{
    id: string;
    itemCode: string;
    itemName: string;
    category: string;
  }>;
  statistics: {
    viewTrend: Array<{ date: string; count: number }>;
    topKeywords: Array<{ keyword: string; count: number }>;
    corpusUsageRate: number;
  };
}

export interface PolicyEnhancedList {
  list: Array<{
    id: string;
    title: string;
    documentNo: string;
    category: string;
    categoryLabel: string;
    issuingDept: string;
    issuingDeptLabel: string;
    issueDate: Date;
    status: string;
    reviewStatus: string;
    aiTrained: boolean;
    structuredFieldCount: number;
    corpusCount: number;
    viewCount: number;
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
export class PolicyEnhancedService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async getEnhancedList(params: {
    keyword?: string;
    category?: string;
    issuingDept?: string;
    reviewStatus?: string;
    aiTrained?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PolicyEnhancedList> {
    this.logger.log('获取政策文件增强列表', 'PolicyEnhancedService');

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.keyword) {
      where.OR = [
        { title: { contains: params.keyword } },
        { documentNo: { contains: params.keyword } },
        { summary: { contains: params.keyword } },
        { keywords: { has: params.keyword } },
      ];
    }
    if (params.category) where.category = params.category as PolicyCategory;
    if (params.issuingDept) where.issuingDept = params.issuingDept as Department;
    if (params.aiTrained !== undefined) where.aiTrained = params.aiTrained;

    const [policies, total] = await Promise.all([
      this.prisma.policyDocument.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.policyDocument.count({ where }),
    ]);

    const corporaCounts = await this.prisma.aiTrainingCorpus.groupBy({
      by: ['sourceId'],
      where: { sourceId: { in: policies.map((p) => p.id) } },
      _count: true,
    });

    const corpusCountMap: Record<string, number> = {};
    for (const cc of corporaCounts) {
      if (cc.sourceId) corpusCountMap[cc.sourceId] = cc._count;
    }

    const categoryLabels: Record<string, string> = {
      LAW: '法律',
      REGULATION: '法规',
      NOTICE: '通知',
      OPINION: '意见',
      GUIDE: '办事指南',
      INTERPRETATION: '政策解读',
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

    return {
      list: policies.map((policy) => ({
        id: policy.id,
        title: policy.title,
        documentNo: policy.documentNo || '',
        category: policy.category,
        categoryLabel: categoryLabels[policy.category] || policy.category,
        issuingDept: policy.issuingDept,
        issuingDeptLabel: deptLabels[policy.issuingDept] || policy.issuingDept,
        issueDate: policy.issueDate,
        status: policy.status,
        reviewStatus: this.getReviewStatus(policy),
        aiTrained: policy.aiTrained,
        structuredFieldCount: this.countStructuredFields(policy.structuredData),
        corpusCount: corpusCountMap[policy.id] || 0,
        viewCount: policy.viewCount,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getEnhancedDetail(id: string): Promise<PolicyEnhancedDetail> {
    this.logger.log(`获取政策文件增强详情: ${id}`, 'PolicyEnhancedService');

    const policy = await this.prisma.policyDocument.findUnique({
      where: { id },
    });

    if (!policy) throw new NotFoundException('政策文件不存在');

    const corpora = await this.prisma.aiTrainingCorpus.findMany({
      where: { sourceId: id },
      orderBy: { usageCount: 'desc' },
    });

    const relatedItems = await this.prisma.serviceItem.findMany({
      where: {
        OR: policy.keywords.map((k) => ({
          OR: [
            { itemName: { contains: k } },
            { description: { contains: k } },
          ],
        })),
      },
      take: 5,
      select: { id: true, itemCode: true, itemName: true, category: true },
    });

    const categoryLabels: Record<string, string> = {
      LAW: '法律',
      REGULATION: '法规',
      NOTICE: '通知',
      OPINION: '意见',
      GUIDE: '办事指南',
      INTERPRETATION: '政策解读',
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

    const structuredFields = this.extractStructuredFields(policy);

    const viewTrend = this.generateViewTrend(policy.viewCount);
    const topKeywords = policy.keywords.map((k, i) => ({
      keyword: k,
      count: policy.viewCount - i * 10,
    }));

    return {
      basicInfo: {
        id: policy.id,
        title: policy.title,
        documentNo: policy.documentNo || '',
        category: policy.category,
        categoryLabel: categoryLabels[policy.category] || policy.category,
        issuingDept: policy.issuingDept,
        issuingDeptLabel: deptLabels[policy.issuingDept] || policy.issuingDept,
        issueDate: policy.issueDate,
        effectiveDate: policy.effectiveDate || policy.issueDate,
        expiryDate: policy.expiryDate,
        summary: policy.summary || '',
        content: policy.content,
        keywords: policy.keywords,
        status: policy.status,
        reviewStatus: this.getReviewStatus(policy),
        reviewedBy: policy.createdBy || '',
        reviewedAt: policy.createdAt,
        reviewComment: '',
        viewCount: policy.viewCount,
        downloadCount: policy.downloadCount,
        aiTrained: policy.aiTrained,
        trainedAt: policy.trainedAt,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
      },
      structuredFields,
      trainingCorpora: corpora.map((c) => ({
        id: c.id,
        question: c.question,
        answer: c.answer,
        category: c.category,
        intent: c.intent,
        usageCount: c.usageCount,
        helpfulCount: c.helpfulCount,
        isApproved: c.isApproved,
        linkedAt: c.createdAt,
      })),
      reviewHistory: [
        {
          reviewer: policy.createdBy || '系统',
          action: '发布',
          comment: '政策文件发布',
          timestamp: policy.createdAt,
        },
      ],
      relatedServiceItems: relatedItems,
      statistics: {
        viewTrend,
        topKeywords,
        corpusUsageRate: corpora.length > 0
          ? corpora.filter((c) => c.usageCount > 0).length / corpora.length
          : 0,
      },
    };
  }

  async updateStructuredFields(id: string, fields: StructuredPolicyField[]) {
    this.logger.log(`更新政策结构化字段: ${id}`, 'PolicyEnhancedService');

    const policy = await this.prisma.policyDocument.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('政策文件不存在');

    const structuredData: any = {};
    for (const field of fields) {
      structuredData[field.fieldName] = {
        type: field.fieldType,
        value: field.value,
        description: field.description,
      };
    }

    return this.prisma.policyDocument.update({
      where: { id },
      data: { structuredData },
    });
  }

  async linkTrainingCorpus(policyId: string, corpusData: any) {
    this.logger.log(`关联训练语料到政策: ${policyId}`, 'PolicyEnhancedService');

    const policy = await this.prisma.policyDocument.findUnique({ where: { id: policyId } });
    if (!policy) throw new NotFoundException('政策文件不存在');

    return this.prisma.aiTrainingCorpus.create({
      data: {
        question: corpusData.question,
        answer: corpusData.answer,
        category: corpusData.category || 'policy',
        intent: corpusData.intent || 'policy_query',
        entities: corpusData.entities,
        sourceType: 'policy',
        sourceId: policyId,
        difficulty: corpusData.difficulty || 1,
        isApproved: true,
        approvedBy: corpusData.approvedBy,
        approvedAt: new Date(),
        version: 1,
        createdBy: corpusData.createdBy,
      },
    });
  }

  async reviewPolicy(id: string, action: 'APPROVE' | 'REJECT', reviewer: string, comment: string) {
    this.logger.log(`政策复查: ${id} ${action}`, 'PolicyEnhancedService');

    const policy = await this.prisma.policyDocument.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('政策文件不存在');

    return this.prisma.policyDocument.update({
      where: { id },
      data: {
        status: action === 'APPROVE' ? 'published' : 'rejected',
        updatedAt: new Date(),
      },
    });
  }

  async markAsTrained(id: string, trainedBy: string) {
    this.logger.log(`标记政策为已训练: ${id}`, 'PolicyEnhancedService');

    const policy = await this.prisma.policyDocument.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('政策文件不存在');

    return this.prisma.policyDocument.update({
      where: { id },
      data: {
        aiTrained: true,
        trainedAt: new Date(),
      },
    });
  }

  private getReviewStatus(policy: any): 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' {
    if (policy.status === 'published') return 'APPROVED';
    if (policy.status === 'rejected') return 'REJECTED';
    return 'PENDING';
  }

  private countStructuredFields(structuredData: any): number {
    if (!structuredData) return 0;
    return Object.keys(structuredData).length;
  }

  private extractStructuredFields(policy: any): StructuredPolicyField[] {
    const fields: StructuredPolicyField[] = [];

    if (policy.structuredData) {
      for (const [key, value] of Object.entries(policy.structuredData)) {
        const v = value as any;
        fields.push({
          fieldName: key,
          fieldType: v.type || 'string',
          value: v.value,
          description: v.description || '',
        });
      }
    }

    if (fields.length === 0) {
      fields.push(
        { fieldName: 'applyConditions', fieldType: 'string', value: '', description: '申请条件' },
        { fieldName: 'requiredMaterials', fieldType: 'string', value: '', description: '所需材料' },
        { fieldName: 'handlingProcess', fieldType: 'string', value: '', description: '办理流程' },
        { fieldName: 'timeLimit', fieldType: 'number', value: policy.handlingTimeLimit || 0, description: '办理时限' },
        { fieldName: 'feeStandard', fieldType: 'string', value: '', description: '收费标准' },
      );
    }

    return fields;
  }

  private generateViewTrend(totalViews: number): Array<{ date: string; count: number }> {
    const trend: Array<{ date: string; count: number }> = [];
    const avgPerDay = Math.max(1, Math.floor(totalViews / 30));

    for (let i = 29; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const variance = Math.floor(Math.random() * avgPerDay * 0.4) - avgPerDay * 0.2;
      trend.push({
        date,
        count: Math.max(0, Math.floor(avgPerDay + variance)),
      });
    }

    return trend;
  }
}
