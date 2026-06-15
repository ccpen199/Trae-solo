import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationStatus, AuthType, NotificationChannel } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';

export interface DashboardOverview {
  coreMetrics: {
    todayNewApplications: number;
    todayCompleted: number;
    processingApplications: number;
    timeoutApplications: number;
    totalUsers: number;
    totalServiceItems: number;
    avgProcessingTime: number;
    completionRate: number;
  };
  statusDistribution: Array<{ status: string; label: string; count: number }>;
  departmentDistribution: Array<{ department: string; count: number }>;
  todayTimeline: Array<{ hour: string; count: number }>;
  hotItems: Array<{ itemCode: string; itemName: string; count: number }>;
  latestApplications: Array<{
    applicationNo: string;
    itemName: string;
    applicant: string;
    status: string;
    createdAt: Date;
  }>;
  timeoutAlerts: Array<{
    applicationNo: string;
    itemName: string;
    currentNode: string;
    timeoutHours: number;
    warningLevel: number;
  }>;
}

@Injectable()
export class AdminConsoleService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async getDashboardOverview(): Promise<DashboardOverview> {
    const todayStart = dayjs().startOf('day').toDate();
    const sevenDaysAgo = dayjs().subtract(7, 'day').toDate();

    const [
      todayNew,
      todayCompleted,
      processing,
      timeout,
      totalUsers,
      totalItems,
      byStatus,
      byDept,
      hotItems,
      latestApps,
      timeoutNodes,
    ] = await Promise.all([
      this.prisma.application.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.application.count({
        where: {
          status: { in: [ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED] },
          completedAt: { gte: todayStart },
        },
      }),
      this.prisma.application.count({
        where: { status: { in: [ApplicationStatus.PRE_REVIEWING, ApplicationStatus.APPROVING] } },
      }),
      this.prisma.application.count({
        where: {
          status: { in: [ApplicationStatus.PRE_REVIEWING, ApplicationStatus.APPROVING] },
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.user.count(),
      this.prisma.serviceItem.count({ where: { status: true } }),
      this.prisma.application.groupBy({ by: ['status'], _count: true }),
      this.prisma.application.groupBy({
        by: ['currentDepartment'],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: true,
        orderBy: { _count: { currentDepartment: 'desc' } },
        take: 8,
      }),
      this.prisma.application.groupBy({
        by: ['serviceItemId'],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: true,
        orderBy: { _count: { serviceItemId: 'desc' } },
        take: 10,
      }),
      this.prisma.application.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          serviceItem: { select: { itemName: true } },
          user: { select: { realName: true } },
        },
      }),
      this.prisma.applicationTimeline.findMany({
        where: { isTimeout: true, endTime: null },
        include: {
          application: {
            include: { serviceItem: { select: { itemName: true } } },
          },
        },
        take: 10,
        orderBy: { warningLevel: 'desc' },
      }),
    ]);

    const completedApps = await this.prisma.application.findMany({
      where: {
        status: { in: [ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED] },
        createdAt: { gte: sevenDaysAgo },
        completedAt: { not: null },
      },
      select: { createdAt: true, completedAt: true },
      take: 500,
    });

    const avgTime = completedApps.length > 0
      ? completedApps.reduce((sum, a) => sum + dayjs(a.completedAt).diff(dayjs(a.createdAt), 'hour'), 0) / completedApps.length
      : 0;

    const total7Days = await this.prisma.application.count({ where: { createdAt: { gte: sevenDaysAgo } } });
    const completed7Days = await this.prisma.application.count({
      where: {
        status: { in: [ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED, ApplicationStatus.APPROVED] },
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const hotItemsWithNames = await Promise.all(
      hotItems.map(async (h) => {
        const item = await this.prisma.serviceItem.findUnique({
          where: { id: h.serviceItemId },
          select: { itemCode: true, itemName: true },
        });
        return { ...item, count: h._count };
      }),
    );

    const todayApps = await this.prisma.application.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { createdAt: true },
    });

    const hourlyCounts: Record<string, number> = {};
    for (let h = 0; h < 24; h++) {
      hourlyCounts[`${h.toString().padStart(2, '0')}:00`] = 0;
    }
    for (const app of todayApps) {
      const hour = dayjs(app.createdAt).format('HH:00');
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    }

    const statusLabels: Record<string, string> = {
      DRAFT: '草稿',
      APPOINTED: '已预约',
      MATERIALS_UPLOADED: '材料已上传',
      PRE_REVIEWING: '预审中',
      PRE_REVIEW_PASSED: '预审通过',
      PRE_REVIEW_REJECTED: '预审驳回',
      APPROVING: '审批中',
      APPROVED: '审批通过',
      REJECTED: '审批驳回',
      CERTIFICATE_ISSUED: '证照已签发',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
      EXPIRED: '已超时',
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
      coreMetrics: {
        todayNewApplications: todayNew,
        todayCompleted,
        processingApplications: processing,
        timeoutApplications: timeout,
        totalUsers,
        totalServiceItems: totalItems,
        avgProcessingTime: Math.round(avgTime * 10) / 10,
        completionRate: total7Days > 0 ? Math.round((completed7Days / total7Days) * 100) / 100 : 0,
      },
      statusDistribution: byStatus.map((s) => ({
        status: s.status,
        label: statusLabels[s.status] || s.status,
        count: s._count,
      })),
      departmentDistribution: byDept.map((d) => ({
        department: deptLabels[d.currentDepartment] || d.currentDepartment,
        count: d._count,
      })),
      todayTimeline: Object.entries(hourlyCounts).map(([hour, count]) => ({ hour, count })),
      hotItems: hotItemsWithNames.filter((i) => i.itemCode),
      latestApplications: latestApps.map((a) => ({
        applicationNo: a.applicationNo,
        itemName: a.serviceItem?.itemName || '',
        applicant: a.user?.realName || '',
        status: statusLabels[a.status] || a.status,
        createdAt: a.createdAt,
      })),
      timeoutAlerts: timeoutNodes.map((t) => ({
        applicationNo: t.application.applicationNo,
        itemName: t.application.serviceItem?.itemName || '',
        currentNode: t.nodeName,
        timeoutHours: Math.round(dayjs().diff(dayjs(t.startTime), 'hour')),
        warningLevel: t.warningLevel || 0,
      })),
    };
  }

  async getPlatformOperationReport(days = 30) {
    const startDate = dayjs().subtract(days - 1, 'day').toDate();

    const [apps, byAuthType, notifications, certs] = await Promise.all([
      this.prisma.application.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, status: true },
      }),
      this.prisma.user.groupBy({
        by: ['authType'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.notification.groupBy({
        by: ['channel', 'status'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.electronicCertificate.count({ where: { issueDate: { gte: startDate } } }),
    ]);

    const total = apps.length;
    const completed = apps.filter((a) =>
      ([ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED, ApplicationStatus.APPROVED] as ApplicationStatus[]).includes(a.status),
    ).length;

    const authTypeLabels: Record<string, string> = {
      YUE_SHENGSHI: '粤省事',
      FACE_RECOGNITION: '人脸识别',
      SOCIAL_CARD_NFC: '社保卡NFC',
      ID_CARD: '身份证',
      PASSWORD: '密码',
    };

    return {
      periodDays: days,
      startDate,
      endDate: new Date(),
      totalApplications: total,
      completedApplications: completed,
      completionRate: total > 0 ? completed / total : 0,
      issuedCertificates: certs,
      userRegistrationByAuthType: byAuthType.map((a) => ({
        authType: a.authType,
        authTypeLabel: authTypeLabels[a.authType] || a.authType,
        count: a._count,
      })),
      notificationStats: notifications.map((n) => ({
        channel: n.channel,
        status: n.status,
        count: n._count,
      })),
    };
  }
}
