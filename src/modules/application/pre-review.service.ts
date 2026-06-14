import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';
import { ApplicationTimelineService } from './application-timeline.service';
import { NotificationService } from '../notification/notification.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

export interface PreReviewResult {
  passed: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  autoApproveThreshold: number;
}

@Injectable()
export class PreReviewService {
  constructor(
    private prisma: PrismaService,
    private timelineService: ApplicationTimelineService,
    private notificationService: NotificationService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async runPreReview(applicationId: string): Promise<PreReviewResult> {
    this.logger.log(`开始智能预审: ${applicationId}`, 'PreReviewService');

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        serviceItem: true,
        materials: { include: { template: true } },
        user: true,
      },
    });

    if (!application) {
      return { passed: false, score: 0, issues: ['办件不存在'], suggestions: [], autoApproveThreshold: 80 };
    }

    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    if (!application.user?.isVerified) {
      issues.push('用户身份未实名认证');
      score -= 20;
      suggestions.push('建议完成实名认证以加快审核速度');
    }

    const requiredTemplates = await this.prisma.materialTemplate.findMany({
      where: { serviceItemId: application.serviceItemId, isRequired: true },
    });
    const uploadedTemplateIds = application.materials.map((m) => m.templateId);

    for (const tpl of requiredTemplates) {
      if (!uploadedTemplateIds.includes(tpl.id)) {
        issues.push(`缺少必需材料: ${tpl.materialName}`);
        score -= 15;
      }
    }

    for (const material of application.materials) {
      if (material.fileSize < 1024) {
        issues.push(`材料"${material.fileName}"文件过小，可能不完整`);
        score -= 5;
      }
    }

    if (application.formData) {
      const fieldCount = Object.keys(application.formData).filter(
        (k) => application.formData[k] !== null && application.formData[k] !== undefined && application.formData[k] !== '',
      ).length;
      if (fieldCount < 5) {
        suggestions.push('建议填写更多表单字段以提高审核通过率');
        score -= 5;
      }
    }

    const passed = score >= 60;
    const autoApproveThreshold = 90;

    this.logger.log(
      `预审完成: app=${applicationId} score=${score} passed=${passed}`,
      'PreReviewService',
    );

    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        preReviewOpinion: issues.length > 0 ? issues.join('; ') : '预审通过',
        preReviewedAt: new Date(),
        preReviewedBy: 'AUTO_SYSTEM',
      },
    });

    if (passed) {
      await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          status:
            score >= autoApproveThreshold
              ? ApplicationStatus.APPROVED
              : ApplicationStatus.APPROVING,
          currentNode: score >= autoApproveThreshold ? 'auto_approved' : 'approving',
        },
      });

      await this.timelineService.addNode(applicationId, {
        nodeCode: 'pre_review_passed',
        nodeName: score >= autoApproveThreshold ? '预审通过(自动核准)' : '预审通过',
        status: 'completed',
        operatorName: '智能预审系统',
        opinion: `预审得分: ${score}分，${issues.length > 0 ? issues.join('; ') : '无异常'}`,
        metadata: { score, autoApproved: score >= autoApproveThreshold },
      });

      await this.notificationService.createNotification({
        userId: application.userId,
        applicationId,
        title: '预审通过',
        content: `您的${application.serviceItem?.itemName || '办件'}已通过智能预审${score >= autoApproveThreshold ? '，系统已自动核准' : '，等待部门审核'}，办件编号：${application.applicationNo}`,
        channels: ['IN_APP', 'SMS', 'WECHAT'],
        templateCode: 'PRE_REVIEW_PASSED',
      });
    } else {
      await this.prisma.application.update({
        where: { id: applicationId },
        data: { status: ApplicationStatus.PRE_REVIEW_REJECTED, currentNode: 'pre_review_rejected' },
      });

      await this.timelineService.addNode(applicationId, {
        nodeCode: 'pre_review_rejected',
        nodeName: '预审驳回',
        status: 'completed',
        operatorName: '智能预审系统',
        opinion: issues.join('; '),
        metadata: { score, issues, suggestions },
      });

      await this.notificationService.createNotification({
        userId: application.userId,
        applicationId,
        title: '预审未通过',
        content: `您的${application.serviceItem?.itemName || '办件'}预审未通过：${issues.join('; ')}，请修改后重新提交。`,
        channels: ['IN_APP', 'SMS', 'WECHAT'],
        templateCode: 'PRE_REVIEW_REJECTED',
      });
    }

    return { passed, score, issues, suggestions, autoApproveThreshold };
  }
}
