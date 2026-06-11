import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, ContentAuditStatus } from '@pet/db';
import { buildPaginationResult, calculateOffset } from '@pet/shared/utils';
import { CONTENT_AUTO_AUDIT_THRESHOLD } from '@pet/shared/constants';
import type { PaginationResult } from '@pet/shared/types';
import type { AuditActionDto, AuditQueryDto } from './dto';

@Injectable()
export class AuditService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findPaginated(query: AuditQueryDto): Promise<PaginationResult<unknown>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const where: Record<string, unknown> = {};
    if (query.contentType) where.contentType = query.contentType;
    if (query.status) where.status = query.status;

    const [total, items] = await Promise.all([
      this.prisma.contentAuditLog.count({ where }),
      this.prisma.contentAuditLog.findMany({
        where,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return buildPaginationResult(items, total, page, pageSize);
  }

  async auditAction(auditorId: string, dto: AuditActionDto) {
    const auditLog = await this.prisma.contentAuditLog.create({
      data: {
        contentId: dto.contentId,
        contentType: dto.contentType,
        auditorId,
        status: dto.status,
        reason: dto.reason,
        operation: dto.operation,
      },
    });
    if (dto.contentType === 'post') {
      await this.prisma.post.update({
        where: { id: dto.contentId },
        data: {
          auditStatus: dto.status,
          auditReason: dto.reason,
          status: dto.status === ContentAuditStatus.APPROVED ? 'PUBLISHED' : dto.status === ContentAuditStatus.REJECTED ? 'REJECTED' : undefined,
        },
      }).catch(() => {});
    }
    return auditLog;
  }

  async autoAudit(contentId: string, contentType: string, content: string) {
    const riskKeywords = CONTENT_AUTO_AUDIT_THRESHOLD.RISK_KEYWORDS;
    const detectedKeywords = riskKeywords.filter(keyword => content.includes(keyword));
    if (detectedKeywords.length > 0) {
      return this.prisma.contentAuditLog.create({
        data: {
          contentId,
          contentType,
          status: ContentAuditStatus.FLAGGED,
          operation: 'auto_flag',
          autoAuditResult: { detectedKeywords, riskLevel: 'high' },
        },
      });
    }
    return this.prisma.contentAuditLog.create({
      data: {
        contentId,
        contentType,
        status: ContentAuditStatus.APPROVED,
        operation: 'auto_approve',
        autoAuditResult: { riskLevel: 'low' },
      },
    });
  }

  async getPendingCount() {
    const count = await this.prisma.contentAuditLog.count({
      where: { status: ContentAuditStatus.PENDING },
    });
    return { pendingCount: count };
  }
}
