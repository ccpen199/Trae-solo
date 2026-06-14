import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class AuditLogService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async create(params: {
    userId?: string;
    applicationId?: string;
    action: string;
    module: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    requestData?: any;
    responseData?: any;
    status?: string;
  }) {
    return this.prisma.auditLog.create({ data: params });
  }

  async query(params: {
    userId?: string;
    module?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(200, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.userId) where.userId = params.userId;
    if (params.module) where.module = params.module;
    if (params.action) where.action = params.action;
    if (params.startDate && params.endDate) {
      where.createdAt = { gte: new Date(params.startDate), lte: new Date(params.endDate) };
    }

    const [list, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { list, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }
}
