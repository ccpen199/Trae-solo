import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async getDashboardOverview() {
    const today = dayjs().startOf('day').toDate();
    const last7Days = dayjs().subtract(7, 'day').startOf('day').toDate();
    const last30Days = dayjs().subtract(30, 'day').startOf('day').toDate();

    const [todayNew, totalUsers, totalItems, todayCompleted, processing, timeout] =
      await Promise.all([
        this.prisma.application.count({ where: { createdAt: { gte: today } } }),
        this.prisma.user.count(),
        this.prisma.serviceItem.count({ where: { status: true } }),
        this.prisma.application.count({
          where: {
            status: { in: [ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED] },
            completedAt: { gte: today },
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
      ]);

    return {
      todayNew,
      totalUsers,
      totalItems,
      todayCompleted,
      processing,
      timeout,
    };
  }

  async getHotServiceItems(limit = 10, days = 30) {
    const startDate = dayjs().subtract(days, 'day').startOf('day').toDate();
    const rawData = await this.prisma.application.groupBy({
      by: ['serviceItemId'],
      where: { createdAt: { gte: startDate } },
      _count: { serviceItemId: true },
      orderBy: { _count: { serviceItemId: 'desc' } },
      take: limit,
    });

    const items = await Promise.all(
      rawData.map(async (r) => {
        const item = await this.prisma.serviceItem.findUnique({
          where: { id: r.serviceItemId },
          select: {
            id: true,
            itemCode: true,
            itemName: true,
            category: true,
            handlingDepartment: true,
          },
        });
        return { ...item, count: r._count.serviceItemId };
      }),
    );
    return items.filter((i) => i.id);
  }

  async getApplicationTrend(days = 30) {
    const startDate = dayjs()
      .subtract(days - 1, 'day')
      .startOf('day')
      .toDate();
    const apps = await this.prisma.application.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true },
    });

    const dailyData: Record<
      string,
      { date: string; total: number; completed: number; rejected: number; processing: number }
    > = {};
    for (let i = 0; i < days; i++) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      dailyData[d] = { date: d, total: 0, completed: 0, rejected: 0, processing: 0 };
    }

    for (const app of apps) {
      const d = dayjs(app.createdAt).format('YYYY-MM-DD');
      if (!dailyData[d]) continue;
      dailyData[d].total++;
      if (
        (
          [
            ApplicationStatus.COMPLETED,
            ApplicationStatus.CERTIFICATE_ISSUED,
            ApplicationStatus.APPROVED,
          ] as ApplicationStatus[]
        ).includes(app.status)
      ) {
        dailyData[d].completed++;
      } else if (
        app.status === ApplicationStatus.REJECTED ||
        app.status === ApplicationStatus.PRE_REVIEW_REJECTED
      ) {
        dailyData[d].rejected++;
      } else {
        dailyData[d].processing++;
      }
    }

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getBottleneckAnalysis() {
    const timeouts = await this.prisma.applicationTimeline.findMany({
      where: { isTimeout: true },
      include: { application: { include: { serviceItem: true } } },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const nodeTimeouts: Record<string, number> = {};
    const deptTimeouts: Record<string, number> = {};
    for (const t of timeouts) {
      nodeTimeouts[t.nodeCode] = (nodeTimeouts[t.nodeCode] || 0) + 1;
      if (t.department) deptTimeouts[t.department] = (deptTimeouts[t.department] || 0) + 1;
    }

    const avgHandlingTime = await this.prisma.$queryRawUnsafe<
      Array<{ node_code: string; avg_duration: number }>
    >(`
      SELECT "nodeCode" as node_code, AVG("duration") as avg_duration
      FROM "ApplicationTimeline"
      WHERE "duration" IS NOT NULL
      GROUP BY "nodeCode"
      ORDER BY avg_duration DESC
      LIMIT 10
    `);

    return {
      nodeTimeouts: Object.entries(nodeTimeouts).map(([k, v]) => ({ node: k, count: v })),
      deptTimeouts: Object.entries(deptTimeouts).map(([k, v]) => ({ department: k, count: v })),
      slowestNodes: avgHandlingTime,
    };
  }

  async getDepartmentPerformance(days = 30) {
    const startDate = dayjs().subtract(days, 'day').startOf('day').toDate();
    const byDept = await this.prisma.application.groupBy({
      by: ['currentDepartment'],
      where: { createdAt: { gte: startDate } },
      _count: { currentDepartment: true },
    });

    const result = [];
    for (const d of byDept) {
      const apps = await this.prisma.application.findMany({
        where: { currentDepartment: d.currentDepartment, createdAt: { gte: startDate } },
        select: { status: true, createdAt: true, completedAt: true },
      });
      const completed = apps.filter((a) =>
        (
          [
            ApplicationStatus.COMPLETED,
            ApplicationStatus.CERTIFICATE_ISSUED,
            ApplicationStatus.APPROVED,
          ] as ApplicationStatus[]
        ).includes(a.status),
      ).length;
      const avgTime =
        apps
          .filter((a) => a.completedAt)
          .reduce((sum, a) => sum + dayjs(a.completedAt).diff(dayjs(a.createdAt), 'hour'), 0) /
        (completed || 1);
      result.push({
        department: d.currentDepartment,
        total: d._count.currentDepartment,
        completed,
        completionRate: completed / (d._count.currentDepartment || 1),
        avgHandlingHours: Math.round(avgTime * 10) / 10,
      });
    }
    return result.sort((a, b) => b.total - a.total);
  }

  async getRegionHeatmap(days = 30) {
    const startDate = dayjs().subtract(days, 'day').startOf('day').toDate();
    const hotspots = await this.prisma.serviceHotSpot.findMany({
      where: { createdAt: { gte: startDate } },
      select: { region: true, applyCount: true, serviceItemId: true },
    });
    const regionData: Record<string, number> = {};
    for (const h of hotspots) {
      if (h.region) {
        regionData[h.region] = (regionData[h.region] || 0) + h.applyCount;
      }
    }
    return Object.entries(regionData).map(([region, count]) => ({ region, count }));
  }
}
