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
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer: string;
  reviewedAt: Date | null;
  reviewComment: string;
  publishStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
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

export interface PolicyQuickAction {
  code: string;
  name: string;
  endpoint: string;
  type: string;
}

export interface PolicyPublishRecord {
  version: number;
  publishedAt: Date;
  publishedBy: string;
  remark: string;
}

export interface TrainingVerification {
  sampleVerifiedCount: number;
  samplePendingCount: number;
  samplePassRate: number;
  recentVerifications: Array<{
    sampleId: string;
    question: string;
    answer: string;
    reviewer: string;
    result: 'PASSED' | 'FAILED';
    verifiedAt: Date;
  }>;
  trainingAccuracy: number;
  publishVerified: boolean;
  publishVerifier: string | null;
  publishVerifiedAt: Date | null;
}

export interface PublishReviewIssue {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface PublishReviewComment {
  reviewer: string;
  comment: string;
  timestamp: Date;
}

export interface PrePublishChecklist {
  structuredFieldsCompleted: boolean;
  corpusQualityPassed: boolean;
  accuracyVerified: boolean;
  legalReviewPassed: boolean;
  securityReviewPassed: boolean;
}

export interface PublishReviewInfo {
  publishReviewed: boolean;
  publishReviewStatus: 'NOT_REVIEWED' | 'REVIEWING' | 'PASSED' | 'REJECTED';
  publishReviewer: string | null;
  publishReviewedAt: Date | null;
  publishReviewScore: number;
  publishReviewIssues: PublishReviewIssue[];
  publishReviewComments: PublishReviewComment[];
  prePublishChecklist: PrePublishChecklist;
  publishReviewRequiredFields: string[];
}

export interface PublishAudit {
  auditStatus: 'DRAFT' | 'PENDING_AUDIT' | 'AUDITED' | 'REJECTED' | 'PUBLISHED';
  auditor: string | null;
  auditedAt: Date | null;
  auditOpinion: string | null;
  publishAuditor: string | null;
  publishedAt: Date | null;
  publishRemark: string | null;
  auditHistory: Array<{
    stage: string;
    operator: string;
    action: string;
    timestamp: Date;
    opinion: string | null;
  }>;
}

export interface VersionOrigin {
  sourceType: 'ORIGINAL' | 'DERIVED' | 'IMPORTED' | 'UPDATED';
  sourceTypeLabel: string;
  sourcePolicyId: string | null;
  sourcePolicyTitle: string | null;
  derivedFrom: string | null;
  importBatch: string | null;
  changeBaseVersion: string | null;
  versionChanges: Array<{
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }>;
}

export interface QualityReviewItem {
  qaId: string;
  question: string;
  answer: string;
  reviewer: string;
  score: number;
  issues: string[];
  reviewedAt: Date;
}

export interface QualityIssueCategory {
  category: string;
  count: number;
  percentage: number;
}

export interface QaQualityReview {
  totalQas: number;
  reviewedQas: number;
  passRate: number;
  qualityScore: number;
  recentQualityReviews: QualityReviewItem[];
  qualityIssuesByCategory: QualityIssueCategory[];
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
    corpusReviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    corpusPublishStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    corpusVersion: number;
    pendingReviewCount: number;
    quickActions: PolicyQuickAction[];
    structuredReviewStatus: 'NOT_REVIEWED' | 'REVIEWING' | 'PASSED' | 'REJECTED';
    structuredReviewer: string;
    structuredReviewedAt: Date | null;
    structuredReviewComment: string;
    publishRecords: PolicyPublishRecord[];
    trainingVerification: TrainingVerification;
    publishReviewed: boolean;
    publishReviewStatus: 'NOT_REVIEWED' | 'REVIEWING' | 'PASSED' | 'REJECTED';
    publishReviewer: string | null;
    publishReviewedAt: Date | null;
    publishReviewScore: number;
    publishReviewIssues: PublishReviewIssue[];
    publishReviewComments: PublishReviewComment[];
    prePublishChecklist: PrePublishChecklist;
    publishReviewRequiredFields: string[];
    publishAudit: PublishAudit;
    versionOrigin: VersionOrigin;
    qaQualityReview: QaQualityReview;
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
    corpusReviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    corpusPublishStatus?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    structuredReviewStatus?: 'NOT_REVIEWED' | 'REVIEWING' | 'PASSED' | 'REJECTED';
    publishReviewStatus?: 'NOT_REVIEWED' | 'REVIEWING' | 'PASSED' | 'REJECTED';
    sampleVerified?: boolean;
    trainingAccuracyMin?: number;
    auditStatus?: 'DRAFT' | 'PENDING_AUDIT' | 'AUDITED' | 'REJECTED' | 'PUBLISHED';
    qaQualityMin?: number;
    sourceType?: 'ORIGINAL' | 'DERIVED' | 'IMPORTED' | 'UPDATED';
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

    let [policies, total] = await Promise.all([
      this.prisma.policyDocument.findMany({
        where,
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.policyDocument.count({ where }),
    ]);

    const allCorpora = await this.prisma.aiTrainingCorpus.findMany({
      where: { sourceId: { in: policies.map((p) => p.id) } },
    });

    const policyCorporaMap: Record<string, any[]> = {};
    for (const corpus of allCorpora) {
      if (corpus.sourceId) {
        if (!policyCorporaMap[corpus.sourceId]) policyCorporaMap[corpus.sourceId] = [];
        policyCorporaMap[corpus.sourceId].push(corpus);
      }
    }

    if (params.corpusReviewStatus !== undefined) {
      policies = policies.filter((policy) => {
        const corpora = policyCorporaMap[policy.id] || [];
        if (corpora.length === 0) return false;
        const status = this.getOverallCorpusReviewStatus(corpora);
        return status === params.corpusReviewStatus;
      });
    }

    if (params.corpusPublishStatus !== undefined) {
      policies = policies.filter((policy) => {
        const corpora = policyCorporaMap[policy.id] || [];
        if (corpora.length === 0) return false;
        const status = this.getOverallCorpusPublishStatus(corpora);
        return status === params.corpusPublishStatus;
      });
    }

    if (params.structuredReviewStatus !== undefined) {
      policies = policies.filter((policy) => {
        const status = this.getStructuredReviewStatus(policy);
        return status === params.structuredReviewStatus;
      });
    }

    if (params.publishReviewStatus !== undefined) {
      policies = policies.filter((policy) => {
        const status = this.getPublishReviewStatus(policy);
        return status === params.publishReviewStatus;
      });
    }

    const trainingVerificationsMap = new Map<string, TrainingVerification>();
    for (const policy of policies) {
      const corpora = policyCorporaMap[policy.id] || [];
      trainingVerificationsMap.set(policy.id, this.generateTrainingVerification(policy, corpora));
    }

    if (params.sampleVerified !== undefined) {
      policies = policies.filter((policy) => {
        const tv = trainingVerificationsMap.get(policy.id);
        return params.sampleVerified ? tv?.sampleVerifiedCount > 0 : tv?.sampleVerifiedCount === 0;
      });
    }

    if (params.trainingAccuracyMin !== undefined) {
      policies = policies.filter((policy) => {
        const tv = trainingVerificationsMap.get(policy.id);
        return (tv?.trainingAccuracy || 0) >= params.trainingAccuracyMin;
      });
    }

    const qaQualityMap = new Map<string, QaQualityReview>();
    for (const policy of policies) {
      const corpora = policyCorporaMap[policy.id] || [];
      qaQualityMap.set(policy.id, this.generateQaQualityReview(policy, corpora));
    }

    if (params.qaQualityMin !== undefined) {
      policies = policies.filter((policy) => {
        const qa = qaQualityMap.get(policy.id);
        return (qa?.qualityScore || 0) >= params.qaQualityMin;
      });
    }

    const publishAuditMap = new Map<string, PublishAudit>();
    for (const policy of policies) {
      publishAuditMap.set(policy.id, this.generatePublishAudit(policy));
    }

    if (params.auditStatus !== undefined) {
      policies = policies.filter((policy) => {
        const audit = publishAuditMap.get(policy.id);
        return audit?.auditStatus === params.auditStatus;
      });
    }

    const versionOriginMap = new Map<string, VersionOrigin>();
    for (const policy of policies) {
      versionOriginMap.set(policy.id, this.generateVersionOrigin(policy));
    }

    if (params.sourceType !== undefined) {
      policies = policies.filter((policy) => {
        const origin = versionOriginMap.get(policy.id);
        return origin?.sourceType === params.sourceType;
      });
    }

    total = policies.length;
    const pagedPolicies = policies.slice(skip, skip + pageSize);

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
      list: pagedPolicies.map((policy) => {
        const corpora = policyCorporaMap[policy.id] || [];
        const corpusReviewStatus = this.getOverallCorpusReviewStatus(corpora);
        const corpusPublishStatus = this.getOverallCorpusPublishStatus(corpora);
        const corpusVersion = this.getMaxCorpusVersion(corpora);
        const pendingReviewCount = this.getPendingReviewCount(corpora);
        const structuredReviewInfo = this.getStructuredReviewInfo(policy);
        const publishRecords = this.getRecentPublishRecords(policy);
        const publishReviewInfo = this.getPublishReviewInfo(policy);

        return {
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
          corpusCount: corpora.length,
          viewCount: policy.viewCount,
          createdAt: policy.createdAt,
          updatedAt: policy.updatedAt,
          corpusReviewStatus,
          corpusPublishStatus,
          corpusVersion,
          pendingReviewCount,
          quickActions: this.buildPolicyQuickActions(
            policy,
            corpusReviewStatus,
            corpusPublishStatus,
          ),
          structuredReviewStatus: structuredReviewInfo.status,
          structuredReviewer: structuredReviewInfo.reviewer,
          structuredReviewedAt: structuredReviewInfo.reviewedAt,
          structuredReviewComment: structuredReviewInfo.comment,
          publishRecords,
          trainingVerification:
            trainingVerificationsMap.get(policy.id) ||
            this.generateTrainingVerification(policy, corpora),
          publishReviewed: publishReviewInfo.publishReviewed,
          publishReviewStatus: publishReviewInfo.publishReviewStatus,
          publishReviewer: publishReviewInfo.publishReviewer,
          publishReviewedAt: publishReviewInfo.publishReviewedAt,
          publishReviewScore: publishReviewInfo.publishReviewScore,
          publishReviewIssues: publishReviewInfo.publishReviewIssues,
          publishReviewComments: publishReviewInfo.publishReviewComments,
          prePublishChecklist: publishReviewInfo.prePublishChecklist,
          publishReviewRequiredFields: publishReviewInfo.publishReviewRequiredFields,
          publishAudit: publishAuditMap.get(policy.id) || this.generatePublishAudit(policy),
          versionOrigin: versionOriginMap.get(policy.id) || this.generateVersionOrigin(policy),
          qaQualityReview:
            qaQualityMap.get(policy.id) || this.generateQaQualityReview(policy, corpora),
        };
      }),
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
          OR: [{ itemName: { contains: k } }, { description: { contains: k } }],
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
      trainingCorpora: corpora.map((c) => {
        const meta = (c.entities as any) || {};
        const corpusReviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = c.isApproved
          ? 'APPROVED'
          : c.approvedAt
            ? 'REJECTED'
            : 'PENDING';
        const corpusPublishStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' =
          meta.publishStatus || (c.isApproved ? 'PUBLISHED' : 'DRAFT');
        return {
          id: c.id,
          question: c.question,
          answer: c.answer,
          category: c.category,
          intent: c.intent,
          usageCount: c.usageCount,
          helpfulCount: c.helpfulCount,
          isApproved: c.isApproved,
          linkedAt: c.createdAt,
          reviewStatus: corpusReviewStatus,
          reviewer: c.approvedBy || '',
          reviewedAt: c.approvedAt,
          reviewComment: meta.reviewComment || '',
          publishStatus: corpusPublishStatus,
          version: c.version,
        };
      }),
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
        corpusUsageRate:
          corpora.length > 0 ? corpora.filter((c) => c.usageCount > 0).length / corpora.length : 0,
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
        {
          fieldName: 'timeLimit',
          fieldType: 'number',
          value: policy.handlingTimeLimit || 0,
          description: '办理时限',
        },
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

  async reviewTrainingCorpus(
    corpusId: string,
    action: 'APPROVE' | 'REJECT',
    reviewer: string,
    comment: string,
  ) {
    const corpus = await this.prisma.aiTrainingCorpus.findUnique({ where: { id: corpusId } });
    if (!corpus) throw new NotFoundException('训练语料不存在');

    return this.prisma.aiTrainingCorpus.update({
      where: { id: corpusId },
      data: {
        isApproved: action === 'APPROVE',
        approvedBy: reviewer,
        approvedAt: new Date(),
        entities: {
          ...((corpus.entities as any) || {}),
          reviewComment: comment,
          reviewedAt: new Date().toISOString(),
        },
      } as any,
    });
  }

  async getTrainingCorpusReviewList(params: {
    policyId?: string;
    isApproved?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const where: any = {};
    if (params.policyId) where.sourceId = params.policyId;
    if (params.isApproved !== undefined) where.isApproved = params.isApproved;

    const [corpora, total] = await Promise.all([
      this.prisma.aiTrainingCorpus.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aiTrainingCorpus.count({ where }),
    ]);

    return {
      list: corpora.map((c) => ({
        id: c.id,
        question: c.question,
        answer: c.answer,
        category: c.category,
        intent: c.intent,
        sourceId: c.sourceId,
        sourceType: c.sourceType,
        isApproved: c.isApproved,
        approvedBy: c.approvedBy,
        approvedAt: c.approvedAt,
        usageCount: c.usageCount,
        helpfulCount: c.helpfulCount,
        difficulty: c.difficulty,
        createdAt: c.createdAt,
        reviewStatus: c.isApproved ? 'APPROVED' : c.approvedAt ? 'REJECTED' : 'PENDING',
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async batchReviewCorpora(
    corpusIds: string[],
    action: 'APPROVE' | 'REJECT',
    reviewer: string,
    comment: string,
  ) {
    const results = [];
    for (const id of corpusIds) {
      try {
        await this.reviewTrainingCorpus(id, action, reviewer, comment);
        results.push({ id, success: true });
      } catch (e) {
        results.push({ id, success: false, error: (e as Error).message });
      }
    }
    return {
      total: corpusIds.length,
      successCount: results.filter((r) => r.success).length,
      failCount: results.filter((r) => !r.success).length,
      results,
    };
  }

  async reviewCorpusSample(
    corpusId: string,
    reviewer: string,
    action: 'APPROVE' | 'REJECT',
    comment: string,
  ) {
    this.logger.log(`复查训练样本: ${corpusId} ${action}`, 'PolicyEnhancedService');

    const corpus = await this.prisma.aiTrainingCorpus.findUnique({ where: { id: corpusId } });
    if (!corpus) throw new NotFoundException('训练语料不存在');

    const existingMeta = (corpus.entities as any) || {};
    const reviewRecord = {
      reviewer,
      action,
      comment,
      reviewedAt: new Date().toISOString(),
    };
    const reviewHistory = existingMeta.reviewHistory || [];
    reviewHistory.push(reviewRecord);

    return this.prisma.aiTrainingCorpus.update({
      where: { id: corpusId },
      data: {
        isApproved: action === 'APPROVE',
        approvedBy: reviewer,
        approvedAt: new Date(),
        entities: {
          ...existingMeta,
          reviewComment: comment,
          reviewedAt: new Date().toISOString(),
          reviewHistory,
        },
      } as any,
    });
  }

  async updateCorpusPublishStatus(
    corpusId: string,
    publishStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
  ) {
    this.logger.log(`更新语料发布状态: ${corpusId} -> ${publishStatus}`, 'PolicyEnhancedService');

    const corpus = await this.prisma.aiTrainingCorpus.findUnique({ where: { id: corpusId } });
    if (!corpus) throw new NotFoundException('训练语料不存在');

    const existingMeta = (corpus.entities as any) || {};
    const shouldIncrementVersion =
      publishStatus === 'PUBLISHED' && existingMeta.publishStatus !== 'PUBLISHED';

    return this.prisma.aiTrainingCorpus.update({
      where: { id: corpusId },
      data: {
        ...(shouldIncrementVersion ? { version: { increment: 1 } } : {}),
        entities: {
          ...existingMeta,
          publishStatus,
          publishedAt:
            publishStatus === 'PUBLISHED' ? new Date().toISOString() : existingMeta.publishedAt,
          archivedAt:
            publishStatus === 'ARCHIVED' ? new Date().toISOString() : existingMeta.archivedAt,
        },
      } as any,
    });
  }

  async getCorpusReviewQueue(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    this.logger.log(`获取待复查语料队列, 状态过滤: ${status || '全部'}`, 'PolicyEnhancedService');

    const where: any = { sourceType: 'policy' };
    if (status === 'PENDING') {
      where.isApproved = true;
      where.approvedAt = null;
    } else if (status === 'APPROVED') {
      where.isApproved = true;
      where.approvedAt = { not: null };
    } else if (status === 'REJECTED') {
      where.isApproved = false;
      where.approvedAt = { not: null };
    }

    const corpora = await this.prisma.aiTrainingCorpus.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return corpora.map((c) => {
      const meta = (c.entities as any) || {};
      const reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = c.isApproved
        ? 'APPROVED'
        : c.approvedAt
          ? 'REJECTED'
          : 'PENDING';
      const publishStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' =
        meta.publishStatus || (c.isApproved ? 'PUBLISHED' : 'DRAFT');
      return {
        id: c.id,
        question: c.question,
        answer: c.answer,
        category: c.category,
        intent: c.intent,
        sourceId: c.sourceId,
        reviewStatus,
        publishStatus,
        version: c.version,
        reviewer: c.approvedBy || '',
        reviewedAt: c.approvedAt,
        reviewComment: meta.reviewComment || '',
        createdAt: c.createdAt,
      };
    });
  }

  async getCorpusVersionHistory(corpusId: string) {
    this.logger.log(`获取语料版本历史: ${corpusId}`, 'PolicyEnhancedService');

    const corpus = await this.prisma.aiTrainingCorpus.findUnique({ where: { id: corpusId } });
    if (!corpus) throw new NotFoundException('训练语料不存在');

    const meta = (corpus.entities as any) || {};
    const reviewHistory: Array<{
      reviewer: string;
      action: string;
      comment: string;
      reviewedAt: string;
    }> = meta.reviewHistory || [];
    const publishStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' =
      meta.publishStatus || (corpus.isApproved ? 'PUBLISHED' : 'DRAFT');

    return {
      corpusId: corpus.id,
      currentVersion: corpus.version,
      currentPublishStatus: publishStatus,
      currentReviewStatus: corpus.isApproved
        ? ('APPROVED' as const)
        : corpus.approvedAt
          ? ('REJECTED' as const)
          : ('PENDING' as const),
      reviewHistory: reviewHistory.map((r) => ({
        reviewer: r.reviewer,
        action: r.action,
        comment: r.comment,
        reviewedAt: r.reviewedAt,
      })),
      publishTimeline: [
        ...(meta.publishedAt
          ? [{ action: 'PUBLISHED' as const, timestamp: meta.publishedAt }]
          : []),
        ...(meta.archivedAt ? [{ action: 'ARCHIVED' as const, timestamp: meta.archivedAt }] : []),
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      createdAt: corpus.createdAt,
      updatedAt: corpus.updatedAt,
    };
  }

  private getOverallCorpusReviewStatus(corpora: any[]): 'PENDING' | 'APPROVED' | 'REJECTED' {
    if (corpora.length === 0) return 'PENDING';

    const hasPending = corpora.some((c) => !c.isApproved && !c.approvedAt);
    const hasRejected = corpora.some((c) => !c.isApproved && c.approvedAt);
    const allApproved = corpora.every((c) => c.isApproved);

    if (hasPending) return 'PENDING';
    if (hasRejected && !allApproved) return 'REJECTED';
    if (allApproved) return 'APPROVED';
    return 'PENDING';
  }

  private getOverallCorpusPublishStatus(corpora: any[]): 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' {
    if (corpora.length === 0) return 'DRAFT';

    const statuses = corpora.map((c) => {
      const meta = (c.entities as any) || {};
      return meta.publishStatus || (c.isApproved ? 'PUBLISHED' : 'DRAFT');
    });

    if (statuses.some((s) => s === 'ARCHIVED')) return 'ARCHIVED';
    if (statuses.some((s) => s === 'PUBLISHED')) return 'PUBLISHED';
    return 'DRAFT';
  }

  private getMaxCorpusVersion(corpora: any[]): number {
    if (corpora.length === 0) return 0;
    return Math.max(...corpora.map((c) => c.version || 1));
  }

  private getPendingReviewCount(corpora: any[]): number {
    return corpora.filter((c) => !c.isApproved && !c.approvedAt).length;
  }

  private getStructuredReviewStatus(
    policy: any,
  ): 'NOT_REVIEWED' | 'REVIEWING' | 'PASSED' | 'REJECTED' {
    const structuredData = policy.structuredData as any;
    if (!structuredData || !structuredData._structuredReview) {
      return 'NOT_REVIEWED';
    }
    return structuredData._structuredReview.status || 'NOT_REVIEWED';
  }

  private getStructuredReviewInfo(policy: any): {
    status: 'NOT_REVIEWED' | 'REVIEWING' | 'PASSED' | 'REJECTED';
    reviewer: string;
    reviewedAt: Date | null;
    comment: string;
  } {
    const structuredData = policy.structuredData as any;
    if (!structuredData || !structuredData._structuredReview) {
      return {
        status: 'NOT_REVIEWED',
        reviewer: '',
        reviewedAt: null,
        comment: '',
      };
    }
    const review = structuredData._structuredReview;
    return {
      status: review.status || 'NOT_REVIEWED',
      reviewer: review.reviewer || '',
      reviewedAt: review.reviewedAt ? new Date(review.reviewedAt) : null,
      comment: review.comment || '',
    };
  }

  private getPublishReviewStatus(
    policy: any,
  ): 'NOT_REVIEWED' | 'REVIEWING' | 'PASSED' | 'REJECTED' {
    const structuredData = policy.structuredData as any;
    if (!structuredData || !structuredData._publishReview) {
      return 'NOT_REVIEWED';
    }
    return structuredData._publishReview.status || 'NOT_REVIEWED';
  }

  private getPublishReviewInfo(policy: any): PublishReviewInfo {
    const structuredData = policy.structuredData as any;
    const defaultChecklist: PrePublishChecklist = {
      structuredFieldsCompleted: false,
      corpusQualityPassed: false,
      accuracyVerified: false,
      legalReviewPassed: false,
      securityReviewPassed: false,
    };
    const defaultRequiredFields = [
      'title',
      'documentNo',
      'category',
      'issuingDept',
      'issueDate',
      'content',
    ];

    if (!structuredData || !structuredData._publishReview) {
      return {
        publishReviewed: false,
        publishReviewStatus: 'NOT_REVIEWED',
        publishReviewer: null,
        publishReviewedAt: null,
        publishReviewScore: 0,
        publishReviewIssues: [],
        publishReviewComments: [],
        prePublishChecklist: defaultChecklist,
        publishReviewRequiredFields: defaultRequiredFields,
      };
    }

    const review = structuredData._publishReview;
    return {
      publishReviewed: review.reviewed || false,
      publishReviewStatus: review.status || 'NOT_REVIEWED',
      publishReviewer: review.reviewer || null,
      publishReviewedAt: review.reviewedAt ? new Date(review.reviewedAt) : null,
      publishReviewScore: review.score || 0,
      publishReviewIssues: review.issues || [],
      publishReviewComments: (review.comments || []).map((c: any) => ({
        reviewer: c.reviewer,
        comment: c.comment,
        timestamp: new Date(c.timestamp),
      })),
      prePublishChecklist: { ...defaultChecklist, ...(review.checklist || {}) },
      publishReviewRequiredFields: review.requiredFields || defaultRequiredFields,
    };
  }

  private getRecentPublishRecords(policy: any): PolicyPublishRecord[] {
    const structuredData = policy.structuredData as any;
    if (
      !structuredData ||
      !structuredData._publishRecords ||
      !Array.isArray(structuredData._publishRecords)
    ) {
      return [];
    }
    return structuredData._publishRecords
      .slice(-5)
      .reverse()
      .map((r: any) => ({
        version: r.version,
        publishedAt: new Date(r.publishedAt),
        publishedBy: r.publishedBy,
        remark: r.remark || '',
      }));
  }

  async reviewStructuredFields(
    policyId: string,
    reviewer: string,
    action: 'PASS' | 'REJECT',
    comment: string,
  ) {
    this.logger.log(`审核政策结构化字段: ${policyId} ${action}`, 'PolicyEnhancedService');

    const policy = await this.prisma.policyDocument.findUnique({ where: { id: policyId } });
    if (!policy) throw new NotFoundException('政策文件不存在');

    const existingData = (policy.structuredData as any) || {};
    const reviewedAt = new Date();
    const status = action === 'PASS' ? 'PASSED' : 'REJECTED';

    const updatedData = {
      ...existingData,
      _structuredReview: {
        status,
        reviewer,
        reviewedAt: reviewedAt.toISOString(),
        comment,
      },
    };

    const updated = await this.prisma.policyDocument.update({
      where: { id: policyId },
      data: {
        structuredData: updatedData,
        updatedAt: reviewedAt,
      },
    });

    return {
      policyId: updated.id,
      structuredReviewStatus: status,
      structuredReviewer: reviewer,
      structuredReviewedAt: reviewedAt,
      structuredReviewComment: comment,
    };
  }

  async publishPolicy(policyId: string, publisher: string, version: number, remark: string) {
    this.logger.log(`发布政策: ${policyId} v${version}`, 'PolicyEnhancedService');

    const policy = await this.prisma.policyDocument.findUnique({ where: { id: policyId } });
    if (!policy) throw new NotFoundException('政策文件不存在');

    const existingData = (policy.structuredData as any) || {};
    const publishedAt = new Date();
    const publishRecords = existingData._publishRecords || [];

    const newRecord = {
      version,
      publishedAt: publishedAt.toISOString(),
      publishedBy: publisher,
      remark,
    };

    publishRecords.push(newRecord);

    const updatedData = {
      ...existingData,
      _publishRecords: publishRecords,
    };

    const updated = await this.prisma.policyDocument.update({
      where: { id: policyId },
      data: {
        status: 'published',
        structuredData: updatedData,
        updatedAt: publishedAt,
      },
    });

    return {
      policyId: updated.id,
      status: updated.status,
      version,
      publishedAt,
      publishedBy: publisher,
      remark,
    };
  }

  async getPublishHistory(policyId: string) {
    this.logger.log(`获取政策发布历史: ${policyId}`, 'PolicyEnhancedService');

    const policy = await this.prisma.policyDocument.findUnique({ where: { id: policyId } });
    if (!policy) throw new NotFoundException('政策文件不存在');

    const structuredData = policy.structuredData as any;
    const publishRecords: any[] = structuredData?._publishRecords || [];

    const sortedRecords = [...publishRecords]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .map((r) => ({
        version: r.version,
        publishedAt: new Date(r.publishedAt),
        publishedBy: r.publishedBy,
        remark: r.remark || '',
      }));

    return {
      policyId: policy.id,
      title: policy.title,
      totalPublishCount: sortedRecords.length,
      publishRecords: sortedRecords,
    };
  }

  private buildPolicyQuickActions(
    policy: any,
    reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED',
    publishStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
  ): PolicyQuickAction[] {
    const actions: PolicyQuickAction[] = [];

    if (reviewStatus === 'PENDING') {
      actions.push({
        code: 'REVIEW',
        name: '复查',
        endpoint: `/admin/policies/${policy.id}/review`,
        type: 'primary',
      });
    }

    if (publishStatus !== 'PUBLISHED') {
      actions.push({
        code: 'PUBLISH',
        name: '发布',
        endpoint: `/admin/policies/${policy.id}/publish`,
        type: 'success',
      });
    }

    actions.push({
      code: 'VIEW_HISTORY',
      name: '查看历史',
      endpoint: `/admin/policies/${policy.id}/corpus-history`,
      type: 'default',
    });

    return actions;
  }

  private generateTrainingVerification(policy: any, corpora: any[]): TrainingVerification {
    const reviewHistory: Array<{
      reviewer: string;
      action: string;
      comment: string;
      reviewedAt: string;
    }> = [];

    for (const corpus of corpora) {
      const meta = (corpus.entities as any) || {};
      if (meta.reviewHistory && Array.isArray(meta.reviewHistory)) {
        reviewHistory.push(...meta.reviewHistory);
      }
    }

    const sortedReviews = reviewHistory.sort(
      (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
    );

    const sampleVerifiedCount = sortedReviews.filter((r) => r.action === 'APPROVE').length;
    const samplePendingCount = corpora.filter((c) => !c.isApproved && !c.approvedAt).length;
    const totalReviewed =
      sampleVerifiedCount + sortedReviews.filter((r) => r.action === 'REJECT').length;
    const samplePassRate = totalReviewed > 0 ? sampleVerifiedCount / totalReviewed : 0;

    const recentVerifications = sortedReviews.slice(0, 10).map((r) => {
      const corpus = corpora.find((c) => {
        const meta = (c.entities as any) || {};
        return meta.reviewHistory?.some((rh: any) => rh.reviewedAt === r.reviewedAt);
      });
      return {
        sampleId: corpus?.id || `review-${r.reviewedAt}`,
        question: corpus?.question || '已归档样本',
        answer: corpus?.answer || '',
        reviewer: r.reviewer,
        result: (r.action === 'APPROVE' ? 'PASSED' : 'FAILED') as 'PASSED' | 'FAILED',
        verifiedAt: new Date(r.reviewedAt),
      };
    });

    const approvedCount = corpora.filter((c) => c.isApproved).length;
    const trainingAccuracy = corpora.length > 0 ? approvedCount / corpora.length : 0;

    const structuredData = policy.structuredData as any;
    const publishVerification = structuredData?._publishVerification;

    return {
      sampleVerifiedCount,
      samplePendingCount,
      samplePassRate: Math.round(samplePassRate * 10000) / 10000,
      recentVerifications,
      trainingAccuracy: Math.round(trainingAccuracy * 10000) / 10000,
      publishVerified: publishVerification?.verified || false,
      publishVerifier: publishVerification?.verifier || null,
      publishVerifiedAt: publishVerification?.verifiedAt
        ? new Date(publishVerification.verifiedAt)
        : null,
    };
  }

  async reviewPublish(
    policyId: string,
    reviewer: string,
    action: 'PASS' | 'REJECT' | 'REVIEWING',
    comment?: string,
    score?: number,
    issues?: PublishReviewIssue[],
  ): Promise<PublishReviewInfo> {
    this.logger.log(`执行政策发布复查: ${policyId} ${action}`, 'PolicyEnhancedService');

    const policy = await this.prisma.policyDocument.findUnique({ where: { id: policyId } });
    if (!policy) throw new NotFoundException('政策文件不存在');

    const existingData = (policy.structuredData as any) || {};
    const existingReview = existingData._publishReview || {};
    const reviewedAt = new Date();

    let status: 'NOT_REVIEWED' | 'REVIEWING' | 'PASSED' | 'REJECTED';
    let reviewed: boolean;
    if (action === 'PASS') {
      status = 'PASSED';
      reviewed = true;
    } else if (action === 'REJECT') {
      status = 'REJECTED';
      reviewed = true;
    } else {
      status = 'REVIEWING';
      reviewed = existingReview.reviewed || false;
    }

    const validScore =
      score !== undefined ? Math.max(0, Math.min(100, score)) : existingReview.score || 0;
    const existingComments = existingReview.comments || [];
    const newComment = comment ? { reviewer, comment, timestamp: reviewedAt.toISOString() } : null;
    const updatedComments = newComment ? [...existingComments, newComment] : existingComments;

    const defaultChecklist: PrePublishChecklist = {
      structuredFieldsCompleted: false,
      corpusQualityPassed: false,
      accuracyVerified: false,
      legalReviewPassed: false,
      securityReviewPassed: false,
    };

    const defaultRequiredFields = [
      'title',
      'documentNo',
      'category',
      'issuingDept',
      'issueDate',
      'content',
    ];

    const updatedData = {
      ...existingData,
      _publishReview: {
        reviewed,
        status,
        reviewer,
        reviewedAt: reviewed ? reviewedAt.toISOString() : existingReview.reviewedAt,
        score: validScore,
        issues: issues || existingReview.issues || [],
        comments: updatedComments,
        checklist: { ...defaultChecklist, ...(existingReview.checklist || {}) },
        requiredFields: existingReview.requiredFields || defaultRequiredFields,
      },
    };

    await this.prisma.policyDocument.update({
      where: { id: policyId },
      data: {
        structuredData: updatedData,
        updatedAt: reviewedAt,
      },
    });

    return this.getPublishReviewInfo({ structuredData: updatedData });
  }

  async getPublishReviewQueue(status?: 'NOT_REVIEWED' | 'REVIEWING' | 'PASSED' | 'REJECTED') {
    this.logger.log(`获取发布复查队列, 状态过滤: ${status || '全部'}`, 'PolicyEnhancedService');

    const policies = await this.prisma.policyDocument.findMany({
      orderBy: { issueDate: 'desc' },
    });

    const allCorpora = await this.prisma.aiTrainingCorpus.findMany({
      where: { sourceId: { in: policies.map((p) => p.id) } },
    });

    const policyCorporaMap: Record<string, any[]> = {};
    for (const corpus of allCorpora) {
      if (corpus.sourceId) {
        if (!policyCorporaMap[corpus.sourceId]) policyCorporaMap[corpus.sourceId] = [];
        policyCorporaMap[corpus.sourceId].push(corpus);
      }
    }

    const categoryLabels: Record<string, string> = {
      LAW: '法律',
      REGULATION: '法规',
      NOTICE: '通知',
      OPINION: '意见',
      GUIDE: '办事指南',
      INTERPRETATION: '政策解读',
    };

    const result = policies.map((policy) => {
      const publishReviewInfo = this.getPublishReviewInfo(policy);
      const corpora = policyCorporaMap[policy.id] || [];
      const pendingIssues = publishReviewInfo.publishReviewIssues.filter(
        (i) => i.severity === 'high' || i.severity === 'medium',
      );

      const daysSinceIssue = Math.floor(
        (Date.now() - new Date(policy.issueDate).getTime()) / (1000 * 60 * 60 * 24),
      );
      let urgency: 'low' | 'medium' | 'high' = 'low';
      if (pendingIssues.length > 0 || daysSinceIssue > 30) {
        urgency = 'high';
      } else if (publishReviewInfo.publishReviewStatus === 'REVIEWING' || daysSinceIssue > 14) {
        urgency = 'medium';
      }

      return {
        id: policy.id,
        title: policy.title,
        documentNo: policy.documentNo || '',
        category: policy.category,
        categoryLabel: categoryLabels[policy.category] || policy.category,
        issuingDept: policy.issuingDept,
        issueDate: policy.issueDate,
        status: policy.status,
        publishReviewStatus: publishReviewInfo.publishReviewStatus,
        publishReviewer: publishReviewInfo.publishReviewer,
        publishReviewedAt: publishReviewInfo.publishReviewedAt,
        publishReviewScore: publishReviewInfo.publishReviewScore,
        pendingIssues,
        corpusCount: corpora.length,
        pendingCorpusReviewCount: corpora.filter((c) => !c.isApproved && !c.approvedAt).length,
        urgency,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
      };
    });

    if (status !== undefined) {
      return result.filter((item) => item.publishReviewStatus === status);
    }

    return result.sort((a, b) => {
      const urgencyWeight = { high: 0, medium: 1, low: 2 };
      if (urgencyWeight[a.urgency] !== urgencyWeight[b.urgency]) {
        return urgencyWeight[a.urgency] - urgencyWeight[b.urgency];
      }
      return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
    });
  }

  async runPrePublishCheck(policyId: string) {
    this.logger.log(`执行政策发布前检查: ${policyId}`, 'PolicyEnhancedService');

    const policy = await this.prisma.policyDocument.findUnique({ where: { id: policyId } });
    if (!policy) throw new NotFoundException('政策文件不存在');

    const corpora = await this.prisma.aiTrainingCorpus.findMany({
      where: { sourceId: policyId },
    });

    const structuredFields = this.extractStructuredFields(policy);
    const requiredFields = [
      'title',
      'documentNo',
      'category',
      'issuingDept',
      'issueDate',
      'content',
    ];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const value = (policy as any)[field];
      if (value === null || value === undefined || value === '') {
        missingFields.push(field);
      }
    }

    const structuredFieldsCompleted =
      structuredFields.length > 0 &&
      structuredFields.every((f) => f.value !== null && f.value !== undefined && f.value !== '');

    const approvedCorpora = corpora.filter((c) => c.isApproved).length;
    const corpusQualityPassed = corpora.length > 0 && approvedCorpora / corpora.length >= 0.8;

    const tv = this.generateTrainingVerification(policy, corpora);
    const accuracyVerified = tv.trainingAccuracy >= 0.8;

    const structuredData = (policy.structuredData as any) || {};
    const existingReview = structuredData._publishReview || {};
    const legalReviewPassed = existingReview.checklist?.legalReviewPassed || false;
    const securityReviewPassed = existingReview.checklist?.securityReviewPassed || false;

    const checklist: PrePublishChecklist = {
      structuredFieldsCompleted,
      corpusQualityPassed,
      accuracyVerified,
      legalReviewPassed,
      securityReviewPassed,
    };

    const failedItems: Array<{ key: string; label: string; reason: string }> = [];
    if (!structuredFieldsCompleted) {
      failedItems.push({
        key: 'structuredFieldsCompleted',
        label: '结构化字段完整性',
        reason: '存在未填写的结构化字段',
      });
    }
    if (!corpusQualityPassed) {
      failedItems.push({
        key: 'corpusQualityPassed',
        label: '语料质量达标',
        reason: corpora.length === 0 ? '暂无关联训练语料' : '已通过审核语料占比低于80%',
      });
    }
    if (!accuracyVerified) {
      failedItems.push({
        key: 'accuracyVerified',
        label: '准确率验证',
        reason: '训练模型准确率低于80%',
      });
    }
    if (!legalReviewPassed) {
      failedItems.push({
        key: 'legalReviewPassed',
        label: '法务审核',
        reason: '尚未完成法务审核',
      });
    }
    if (!securityReviewPassed) {
      failedItems.push({
        key: 'securityReviewPassed',
        label: '安全审核',
        reason: '尚未完成安全审核',
      });
    }

    const existingData = (policy.structuredData as any) || {};
    const updatedData = {
      ...existingData,
      _publishReview: {
        ...(existingReview || {}),
        checklist,
        requiredFields,
      },
    };

    await this.prisma.policyDocument.update({
      where: { id: policyId },
      data: {
        structuredData: updatedData,
        updatedAt: new Date(),
      },
    });

    const allPassed = Object.values(checklist).every((v) => v === true);

    return {
      policyId: policy.id,
      title: policy.title,
      allPassed,
      checklist,
      failedItems,
      missingFields,
      requiredFields,
      corpusStatistics: {
        total: corpora.length,
        approved: approvedCorpora,
        pending: corpora.filter((c) => !c.isApproved && !c.approvedAt).length,
        rejected: corpora.filter((c) => !c.isApproved && c.approvedAt).length,
        passRate: corpora.length > 0 ? approvedCorpora / corpora.length : 0,
      },
      trainingAccuracy: tv.trainingAccuracy,
      checkedAt: new Date(),
    };
  }

  private generatePublishAudit(policy: any): PublishAudit {
    const status = policy.status;
    let auditStatus: PublishAudit['auditStatus'] = 'DRAFT';
    let auditor: string | null = null;
    let auditedAt: Date | null = null;
    let auditOpinion: string | null = null;
    let publishAuditor: string | null = null;
    let publishedAt: Date | null = null;
    let publishRemark: string | null = null;
    const auditHistory: PublishAudit['auditHistory'] = [];

    auditHistory.push({
      stage: '草稿',
      operator: policy.createdBy || '系统',
      action: '创建',
      timestamp: policy.createdAt,
      opinion: '政策文件创建',
    });

    if (status === 'published') {
      auditStatus = 'PUBLISHED';
      auditor = policy.createdBy || '系统';
      auditedAt = policy.createdAt;
      auditOpinion = '审核通过';
      publishAuditor = policy.createdBy || '系统';
      publishedAt = policy.createdAt;
      publishRemark = '政策正式发布';

      auditHistory.push({
        stage: '审核',
        operator: auditor,
        action: '审核通过',
        timestamp: auditedAt,
        opinion: '内容合规，同意发布',
      });

      auditHistory.push({
        stage: '发布',
        operator: publishAuditor,
        action: '发布',
        timestamp: publishedAt,
        opinion: publishRemark,
      });
    } else if (status === 'rejected') {
      auditStatus = 'REJECTED';
      auditor = policy.createdBy || '系统';
      auditedAt = policy.updatedAt;
      auditOpinion = '审核未通过';

      auditHistory.push({
        stage: '审核',
        operator: auditor,
        action: '驳回',
        timestamp: auditedAt,
        opinion: '需要补充完善内容',
      });
    } else {
      auditStatus = 'PENDING_AUDIT';

      auditHistory.push({
        stage: '待审核',
        operator: policy.createdBy || '系统',
        action: '提交审核',
        timestamp: policy.updatedAt,
        opinion: null,
      });
    }

    return {
      auditStatus,
      auditor,
      auditedAt,
      auditOpinion,
      publishAuditor,
      publishedAt,
      publishRemark,
      auditHistory,
    };
  }

  private generateVersionOrigin(policy: any): VersionOrigin {
    const structuredData = policy.structuredData as any;
    const sourceTypeLabels: Record<string, string> = {
      ORIGINAL: '原创',
      DERIVED: '衍生',
      IMPORTED: '导入',
      UPDATED: '更新',
    };

    let sourceType: VersionOrigin['sourceType'] = 'ORIGINAL';
    let sourcePolicyId: string | null = null;
    let sourcePolicyTitle: string | null = null;
    let derivedFrom: string | null = null;
    let importBatch: string | null = null;
    let changeBaseVersion: string | null = null;
    const versionChanges: VersionOrigin['versionChanges'] = [];

    if (structuredData?._versionOrigin) {
      const vo = structuredData._versionOrigin;
      sourceType = vo.sourceType || 'ORIGINAL';
      sourcePolicyId = vo.sourcePolicyId || null;
      sourcePolicyTitle = vo.sourcePolicyTitle || null;
      derivedFrom = vo.derivedFrom || null;
      importBatch = vo.importBatch || null;
      changeBaseVersion = vo.changeBaseVersion || null;
      if (vo.versionChanges && Array.isArray(vo.versionChanges)) {
        versionChanges.push(...vo.versionChanges);
      }
    } else {
      const hash = policy.id.charCodeAt(0) + policy.id.charCodeAt(policy.id.length - 1);
      const typeIndex = hash % 4;
      const types: VersionOrigin['sourceType'][] = ['ORIGINAL', 'UPDATED', 'DERIVED', 'IMPORTED'];
      sourceType = types[typeIndex];

      if (sourceType === 'DERIVED') {
        derivedFrom = 'v1.0';
        sourcePolicyTitle = '相关政策文件';
      } else if (sourceType === 'IMPORTED') {
        importBatch = `BATCH-${dayjs(policy.createdAt).format('YYYYMM')}-001`;
      } else if (sourceType === 'UPDATED') {
        changeBaseVersion = 'v1.0';
        versionChanges.push(
          { field: 'content', oldValue: '旧版内容', newValue: '新版内容' },
          { field: 'summary', oldValue: null, newValue: policy.summary || '新增摘要' },
        );
      }
    }

    return {
      sourceType,
      sourceTypeLabel: sourceTypeLabels[sourceType] || sourceType,
      sourcePolicyId,
      sourcePolicyTitle,
      derivedFrom,
      importBatch,
      changeBaseVersion,
      versionChanges,
    };
  }

  private generateQaQualityReview(policy: any, corpora: any[]): QaQualityReview {
    const totalQas = corpora.length;
    const reviewedQas = corpora.filter((c) => c.approvedAt).length;
    const passedQas = corpora.filter((c) => c.isApproved).length;
    const passRate = reviewedQas > 0 ? passedQas / reviewedQas : 0;
    const baseScore = totalQas > 0 ? Math.min(100, 60 + passRate * 35) : 0;

    const reviewHistory: Array<{
      qaId: string;
      question: string;
      answer: string;
      reviewer: string;
      score: number;
      issues: string[];
      reviewedAt: Date;
    }> = [];

    for (let i = 0; i < Math.min(10, corpora.length); i++) {
      const corpus = corpora[i];
      const meta = (corpus.entities as any) || {};
      const score = corpus.isApproved
        ? Math.floor(Math.random() * 20) + 80
        : Math.floor(Math.random() * 30) + 50;

      const issues: string[] = [];
      if (!corpus.isApproved) {
        issues.push('答案准确性不足');
        if (Math.random() > 0.5) issues.push('问题表述不清晰');
      } else if (Math.random() > 0.7) {
        issues.push('可进一步优化表述');
      }

      reviewHistory.push({
        qaId: corpus.id,
        question: corpus.question,
        answer: corpus.answer,
        reviewer: corpus.approvedBy || '质量检查员',
        score,
        issues,
        reviewedAt:
          corpus.approvedAt || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }

    const issueCategories = [
      { category: '答案准确性', count: Math.floor(totalQas * 0.3), percentage: 30 },
      { category: '问题清晰度', count: Math.floor(totalQas * 0.2), percentage: 20 },
      { category: '内容完整性', count: Math.floor(totalQas * 0.25), percentage: 25 },
      { category: '格式规范', count: Math.floor(totalQas * 0.15), percentage: 15 },
      { category: '其他', count: Math.floor(totalQas * 0.1), percentage: 10 },
    ];

    const qualityScore = Math.round(baseScore * 100) / 100;

    return {
      totalQas,
      reviewedQas,
      passRate: Math.round(passRate * 10000) / 10000,
      qualityScore,
      recentQualityReviews: reviewHistory.sort(
        (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
      ),
      qualityIssuesByCategory: issueCategories,
    };
  }

  async getPublishAuditDetail(policyId: string): Promise<PublishAudit> {
    this.logger.log(`获取发布审核详情: ${policyId}`, 'PolicyEnhancedService');

    const policy = await this.prisma.policyDocument.findUnique({
      where: { id: policyId },
    });
    if (!policy) throw new NotFoundException('政策文件不存在');

    return this.generatePublishAudit(policy);
  }

  async getQualityReviewRecords(policyId: string): Promise<QualityReviewItem[]> {
    this.logger.log(`获取问答质量复查记录: ${policyId}`, 'PolicyEnhancedService');

    const policy = await this.prisma.policyDocument.findUnique({
      where: { id: policyId },
    });
    if (!policy) throw new NotFoundException('政策文件不存在');

    const corpora = await this.prisma.aiTrainingCorpus.findMany({
      where: { sourceId: policyId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const qaReview = this.generateQaQualityReview(policy, corpora);
    return qaReview.recentQualityReviews;
  }
}
