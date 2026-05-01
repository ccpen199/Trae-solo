import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, SensitiveWordLog } from './entities/audit-log.entity';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';

export interface LogActionInput {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceTitle?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
  statusCode?: number;
  username?: string;
}

const SENSITIVE_WORDS = [
  '敏感词1',
  '敏感词2',
  '违禁词',
  '违规内容',
  '违法信息',
];

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(SensitiveWordLog)
    private sensitiveWordLogRepository: Repository<SensitiveWordLog>,
  ) {}

  async logAction(input: LogActionInput): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      userId: input.userId,
      username: input.username,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      resourceTitle: input.resourceTitle,
      oldValue: input.oldValue,
      newValue: input.newValue,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      requestPath: input.requestPath,
      requestMethod: input.requestMethod,
      statusCode: input.statusCode,
    });

    return this.auditLogRepository.save(log);
  }

  async findAllLogs(
    paginationDto: PaginationDto,
    userId?: string,
    action?: string,
    resourceType?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PaginatedResponseDto<AuditLog>> {
    const { page, limit, sortBy, sortOrder } = paginationDto;
    const queryBuilder = this.auditLogRepository.createQueryBuilder('log');

    if (userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId });
    }

    if (action) {
      queryBuilder.andWhere('log.action = :action', { action });
    }

    if (resourceType) {
      queryBuilder.andWhere('log.resourceType = :resourceType', { resourceType });
    }

    if (startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', { endDate });
    }

    if (sortBy) {
      queryBuilder.orderBy(`log.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('log.createdAt', 'DESC');
    }

    const [logs, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return new PaginatedResponseDto(logs, total, page, limit);
  }

  async findLogById(id: string): Promise<AuditLog> {
    const log = await this.auditLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new Error(`Audit log with ID ${id} not found`);
    }
    return log;
  }

  async checkSensitiveWords(
    content: string,
    contentId?: string,
    contentVersionId?: string,
    userId?: string,
  ): Promise<{ hasSensitiveWords: boolean; matchedWords: string[] }> {
    const matchedWords: string[] = [];
    const contextSnippets: string[] = [];

    for (const word of SENSITIVE_WORDS) {
      if (content.toLowerCase().includes(word.toLowerCase())) {
        matchedWords.push(word);

        const regex = new RegExp(`(.{0,30})${word}(.{0,30})`, 'gi');
        let match;
        while ((match = regex.exec(content)) !== null) {
          contextSnippets.push(`...${match[0]}...`);
        }
      }
    }

    if (matchedWords.length > 0) {
      const log = this.sensitiveWordLogRepository.create({
        contentId,
        contentVersionId,
        matchedWords,
        contextSnippets,
        filteredBy: userId || 'system',
      });
      await this.sensitiveWordLogRepository.save(log);
    }

    return {
      hasSensitiveWords: matchedWords.length > 0,
      matchedWords,
    };
  }

  async findAllSensitiveWordLogs(
    paginationDto: PaginationDto,
    contentId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PaginatedResponseDto<SensitiveWordLog>> {
    const { page, limit, sortBy, sortOrder } = paginationDto;
    const queryBuilder = this.sensitiveWordLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.content', 'content');

    if (contentId) {
      queryBuilder.andWhere('log.contentId = :contentId', { contentId });
    }

    if (startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', { endDate });
    }

    if (sortBy) {
      queryBuilder.orderBy(`log.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('log.createdAt', 'DESC');
    }

    const [logs, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return new PaginatedResponseDto(logs, total, page, limit);
  }

  async getAuditStatistics(startDate?: Date, endDate?: Date) {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('log');

    if (startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', { endDate });
    }

    const totalLogs = await queryBuilder.getCount();

    const actionCounts = await queryBuilder
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action')
      .getRawMany();

    const resourceTypeCounts = await queryBuilder
      .select('log.resourceType', 'resourceType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.resourceType')
      .getRawMany();

    const userCounts = await queryBuilder
      .select('log.userId', 'userId')
      .addSelect('log.username', 'username')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.userId, log.username')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalLogs,
      byAction: actionCounts,
      byResourceType: resourceTypeCounts,
      topUsers: userCounts,
    };
  }

  async getContentAuditTrail(contentId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { resourceId: contentId, resourceType: 'CONTENT' },
      order: { createdAt: 'ASC' },
    });
  }

  async getUserActivityLog(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<AuditLog>> {
    return this.findAllLogs(paginationDto, userId);
  }
}
