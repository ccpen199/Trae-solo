import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ApiScope } from '@prisma/client';
import { generateAppId, generateAppSecret } from '@/common/utils/id-generator.util';
import { BusinessException } from '@/common/exceptions/business.exception';
import * as crypto from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

export interface CreateThirdPartyAppDto {
  appName: string;
  description?: string;
  developer: string;
  contactPhone?: string;
  scopes: ApiScope[];
  ipWhitelist?: string[];
}

@Injectable()
export class OpenApiService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async createApp(dto: CreateThirdPartyAppDto) {
    this.logger.log(`创建第三方应用: ${dto.appName}`, 'OpenApiService');
    const appId = generateAppId();
    const appSecret = generateAppSecret();
    return this.prisma.thirdPartyApp.create({
      data: {
        ...dto,
        appId,
        appSecret,
        ipWhitelist: dto.ipWhitelist || [],
        scopes: dto.scopes,
      },
    });
  }

  async listApps(params: { page?: number; pageSize?: number; keyword?: string }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (params.keyword) where.appName = { contains: params.keyword };

    const [list, total] = await Promise.all([
      this.prisma.thirdPartyApp.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          appId: true,
          appName: true,
          description: true,
          developer: true,
          scopes: true,
          isActive: true,
          lastUsedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.thirdPartyApp.count({ where }),
    ]);
    return { list, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async validateSignature(
    appId: string,
    timestamp: string,
    nonce: string,
    signature: string,
    body: string,
  ): Promise<boolean> {
    const app = await this.prisma.thirdPartyApp.findUnique({ where: { appId } });
    if (!app || !app.isActive) return false;
    const payload = `${appId}${timestamp}${nonce}${body}${app.appSecret}`;
    const computed = crypto.createHash('sha256').update(payload).digest('hex');
    return computed === signature;
  }

  async checkRateLimit(appId: string): Promise<boolean> {
    const app = await this.prisma.thirdPartyApp.findUnique({ where: { appId } });
    if (!app) return false;
    const hourAgo = new Date(Date.now() - 3600 * 1000);
    const calls = await this.prisma.apiCallLog.count({
      where: { appId, createdAt: { gte: hourAgo } },
    });
    return calls < app.rateLimit;
  }

  async logApiCall(data: {
    appId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    requestIp?: string;
    userId?: string;
    requestData?: any;
    responseData?: any;
    errorMessage?: string;
  }) {
    return this.prisma.apiCallLog.create({ data });
  }

  async regenerateSecret(appId: string) {
    const app = await this.prisma.thirdPartyApp.findUnique({ where: { appId } });
    if (!app) throw new NotFoundException('应用不存在');
    const newSecret = generateAppSecret();
    await this.prisma.thirdPartyApp.update({ where: { appId }, data: { appSecret: newSecret } });
    return { appId, appSecret: newSecret };
  }

  async toggleAppActive(appId: string, isActive: boolean) {
    return this.prisma.thirdPartyApp.update({ where: { appId }, data: { isActive } });
  }

  async getAppUsageStats(appId: string, days = 7) {
    const start = new Date(Date.now() - days * 86400 * 1000);
    const logs = await this.prisma.apiCallLog.findMany({
      where: { appId, createdAt: { gte: start } },
      select: { createdAt: true, statusCode: true, responseTime: true, endpoint: true },
    });
    const totalCalls = logs.length;
    const failedCalls = logs.filter((l) => l.statusCode >= 400).length;
    const avgResponse = logs.reduce((s, l) => s + l.responseTime, 0) / (totalCalls || 1);
    return {
      appId,
      totalCalls,
      failedCalls,
      successRate: totalCalls > 0 ? (totalCalls - failedCalls) / totalCalls : 0,
      avgResponseTime: Math.round(avgResponse),
    };
  }
}
