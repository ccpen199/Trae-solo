import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthType } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';

export interface AuthChainRecord {
  userId: string;
  authType: string;
  authTypeLabel: string;
  authOpenId: string | null;
  realName: string | null;
  idCardNumber: string | null;
  socialCardNo: string | null;
  isVerified: boolean;
  verifiedAt: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  loginCount: number;
  authChainSteps: Array<{
    step: string;
    timestamp: Date;
    status: string;
    details: any;
  }>;
}

@Injectable()
export class AuthChainMonitorService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async getAuthTypeDistribution(days = 30) {
    const startDate = dayjs().subtract(days, 'day').toDate();

    const authTypeCounts = await this.prisma.user.groupBy({
      by: ['authType'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

    const lastLogins = await this.prisma.user.groupBy({
      by: ['authType'],
      where: { lastLoginAt: { gte: startDate } },
      _count: true,
    });

    const authTypeLabels: Record<string, string> = {
      YUE_SHENGSHI: '粤省事认证',
      FACE_RECOGNITION: '人脸识别',
      SOCIAL_CARD_NFC: '社保卡NFC',
      ID_CARD: '身份证核验',
      PASSWORD: '密码登录',
    };

    const loginCounts: Record<string, number> = {};
    for (const l of lastLogins) {
      loginCounts[l.authType] = l._count;
    }

    return authTypeCounts.map((a) => ({
      authType: a.authType,
      authTypeLabel: authTypeLabels[a.authType] || a.authType,
      registrationCount: a._count,
      loginCount: loginCounts[a.authType] || 0,
      percentage: 0,
    }));
  }

  async getAuthChainDetails(userId: string): Promise<AuthChainRecord> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error('用户不存在');

    const auditLogs = await this.prisma.auditLog.findMany({
      where: { userId, module: 'AUTH' },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    const authTypeLabels: Record<string, string> = {
      YUE_SHENGSHI: '粤省事认证',
      FACE_RECOGNITION: '人脸识别',
      SOCIAL_CARD_NFC: '社保卡NFC',
      ID_CARD: '身份证核验',
      PASSWORD: '密码登录',
    };

    const authChainSteps: Array<{ step: string; timestamp: Date; status: string; details: any }> = [];

    if (user.createdAt) {
      authChainSteps.push({
        step: '用户注册',
        timestamp: user.createdAt,
        status: 'success',
        details: { authType: user.authType },
      });
    }

    if (user.verifiedAt) {
      authChainSteps.push({
        step: '实名认证',
        timestamp: user.verifiedAt,
        status: 'success',
        details: { method: user.authType },
      });
    }

    if (user.lastLoginAt) {
      authChainSteps.push({
        step: '最近登录',
        timestamp: user.lastLoginAt,
        status: 'success',
        details: { ip: user.lastLoginIp },
      });
    }

    const loginCount = auditLogs.filter((l) => l.action === 'LOGIN').length;

    return {
      userId: user.id,
      authType: user.authType || 'UNKNOWN',
      authTypeLabel: authTypeLabels[user.authType] || user.authType || '未知',
      authOpenId: user.authOpenId,
      realName: user.realName,
      idCardNumber: user.idCardNumber,
      socialCardNo: user.socialCardNo,
      isVerified: user.isVerified,
      verifiedAt: user.verifiedAt,
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp,
      loginCount,
      authChainSteps: authChainSteps.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    };
  }

  async getTimeoutDisposalRecords(params: {
    startDate?: string;
    endDate?: string;
    department?: string;
    disposalStatus?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {
      timeline: { some: { isTimeout: true } },
    };

    if (params.startDate && params.endDate) {
      where.createdAt = { gte: new Date(params.startDate), lte: new Date(params.endDate) };
    }
    if (params.department) where.currentDepartment = params.department;

    const timeoutNodes = await this.prisma.applicationTimeline.findMany({
      where: { isTimeout: true },
      include: {
        application: {
          include: {
            serviceItem: { select: { itemName: true, handlingDepartment: true } },
            user: { select: { realName: true } },
          },
        },
      },
      orderBy: { warningLevel: 'desc' },
      skip,
      take: pageSize,
    });

    const total = await this.prisma.applicationTimeline.count({ where: { isTimeout: true } });

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
      list: timeoutNodes.map((t) => ({
        id: t.id,
        applicationNo: t.application.applicationNo,
        itemName: t.application.serviceItem?.itemName || '',
        applicant: t.application.user?.realName || '',
        nodeName: t.nodeName,
        department: deptLabels[t.application.serviceItem?.handlingDepartment] || t.application.serviceItem?.handlingDepartment || '',
        warningLevel: t.warningLevel,
        timeoutMinutes: t.duration || Math.round(dayjs().diff(dayjs(t.startTime), 'minute')),
        startTime: t.startTime,
        endTime: t.endTime,
        operatorName: t.operatorName,
        opinion: t.opinion,
        disposalStatus: t.endTime ? '已处置' : '待处置',
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }
}
