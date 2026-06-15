import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';

export interface BottleneckReport {
  summary: {
    totalApplications: number;
    totalTimeouts: number;
    timeoutRate: number;
    avgHandlingTime: number;
    avgNodeDuration: Record<string, number>;
  };
  nodeBottlenecks: Array<{
    nodeCode: string;
    nodeName: string;
    totalCount: number;
    timeoutCount: number;
    timeoutRate: number;
    avgDuration: number;
    maxDuration: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  departmentBottlenecks: Array<{
    department: string;
    departmentLabel: string;
    totalCount: number;
    timeoutCount: number;
    timeoutRate: number;
    avgHandlingTime: number;
  }>;
  hotItemBottlenecks: Array<{
    itemCode: string;
    itemName: string;
    category: string;
    totalCount: number;
    timeoutCount: number;
    timeoutRate: number;
    avgHandlingTime: number;
    mainBottleneckNode: string;
  }>;
  hourlyDistribution: Array<{
    hour: string;
    applicationCount: number;
    avgDuration: number;
  }>;
  regionalBottlenecks: Array<{
    region: string;
    count: number;
    avgDuration: number;
  }>;
  recommendations: string[];
}

@Injectable()
export class BottleneckAnalysisService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async generateBottleneckReport(days = 30): Promise<BottleneckReport> {
    this.logger.log(`生成堵点分析报告: ${days}天`, 'BottleneckAnalysisService');

    const startDate = dayjs().subtract(days, 'day').toDate();

    const [apps, allTimelines, byDept, byItem, timeoutNodes] = await Promise.all([
      this.prisma.application.findMany({
        where: { createdAt: { gte: startDate } },
        include: { timeline: true },
      }),
      this.prisma.applicationTimeline.findMany({
        where: { startTime: { gte: startDate } },
      }),
      this.prisma.application.groupBy({
        by: ['currentDepartment'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.application.groupBy({
        by: ['serviceItemId'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        orderBy: { _count: { serviceItemId: 'desc' } },
        take: 15,
      }),
      this.prisma.applicationTimeline.findMany({
        where: { startTime: { gte: startDate }, isTimeout: true },
      }),
    ]);

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

    const nodeNameMap: Record<string, string> = {
      draft: '草稿',
      appointment: '预约',
      appointed: '已预约',
      materials_uploaded: '材料上传',
      pre_review: '智能预审',
      pre_review_passed: '预审通过',
      pre_review_rejected: '预审驳回',
      approving: '部门审批',
      approved: '审批通过',
      rejected: '审批驳回',
      certificate_issued: '证照签发',
      completed: '已完成',
      cancelled: '已取消',
      expired: '已超时',
      transferred: '部门转交',
    };

    const completedApps = apps.filter((a) =>
      ([ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED, ApplicationStatus.APPROVED] as ApplicationStatus[]).includes(a.status),
    );

    const avgHandlingTime = completedApps.length > 0
      ? completedApps.reduce((sum, a) => {
          const t = a.timeline.find((tl) => tl.nodeCode === 'completed' || tl.nodeCode === 'certificate_issued');
          if (t?.duration) return sum + t.duration;
          if (a.completedAt) return sum + dayjs(a.completedAt).diff(dayjs(a.createdAt), 'minute');
          return sum;
        }, 0) / completedApps.length
      : 0;

    const nodeStats: Record<string, { total: number; timeout: number; durations: number[] }> = {};
    for (const t of allTimelines) {
      if (!nodeStats[t.nodeCode]) {
        nodeStats[t.nodeCode] = { total: 0, timeout: 0, durations: [] };
      }
      nodeStats[t.nodeCode].total++;
      if (t.isTimeout) nodeStats[t.nodeCode].timeout++;
      if (t.duration) nodeStats[t.nodeCode].durations.push(t.duration);
    }

    const nodeBottlenecks = Object.entries(nodeStats)
      .map(([nodeCode, stats]) => {
        const avgDuration = stats.durations.length > 0
          ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
          : 0;
        const maxDuration = stats.durations.length > 0 ? Math.max(...stats.durations) : 0;
        return {
          nodeCode,
          nodeName: nodeNameMap[nodeCode] || nodeCode,
          totalCount: stats.total,
          timeoutCount: stats.timeout,
          timeoutRate: stats.total > 0 ? stats.timeout / stats.total : 0,
          avgDuration: Math.round(avgDuration),
          maxDuration,
          trend: 'stable' as const,
        };
      })
      .sort((a, b) => b.timeoutRate - a.timeoutRate);

    const deptBottlenecks = await Promise.all(
      byDept.map(async (d) => {
        const deptApps = apps.filter((a) => a.currentDepartment === d.currentDepartment);
        const deptTimeouts = deptApps.filter((a) =>
          a.timeline.some((t) => t.isTimeout),
        ).length;
        const deptCompleted = deptApps.filter((a) =>
          ([ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED] as ApplicationStatus[]).includes(a.status),
        );
        const avgDeptTime = deptCompleted.length > 0
          ? deptCompleted.reduce((sum, a) => {
            if (a.completedAt) return sum + dayjs(a.completedAt).diff(dayjs(a.createdAt), 'minute');
            return sum;
          }, 0) / deptCompleted.length
          : 0;
        return {
          department: d.currentDepartment,
          departmentLabel: deptLabels[d.currentDepartment] || d.currentDepartment,
          totalCount: d._count,
          timeoutCount: deptTimeouts,
          timeoutRate: d._count > 0 ? deptTimeouts / d._count : 0,
          avgHandlingTime: Math.round(avgDeptTime),
        };
      }),
    );

    const hotItemBottlenecks = await Promise.all(
      byItem.map(async (item) => {
        const serviceItem = await this.prisma.serviceItem.findUnique({
          where: { id: item.serviceItemId },
          select: { itemCode: true, itemName: true, category: true },
        });
        const itemApps = apps.filter((a) => a.serviceItemId === item.serviceItemId);
        const itemTimeouts = itemApps.filter((a) => a.timeline.some((t) => t.isTimeout)).length;
        const itemCompleted = itemApps.filter((a) =>
          ([ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED] as ApplicationStatus[]).includes(a.status),
        );
        const avgItemTime = itemCompleted.length > 0
          ? itemCompleted.reduce((sum, a) => {
            if (a.completedAt) return sum + dayjs(a.completedAt).diff(dayjs(a.createdAt), 'minute');
            return sum;
          }, 0) / itemCompleted.length
          : 0;

        const nodeCounts: Record<string, number> = {};
        for (const a of itemApps) {
          for (const t of a.timeline) {
            if (t.isTimeout) nodeCounts[t.nodeCode] = (nodeCounts[t.nodeCode] || 0) + 1;
          }
        }
        const mainBottleneck = Object.entries(nodeCounts).sort((a, b) => b[1] - a[1])[0];

        return {
          itemCode: serviceItem?.itemCode || '',
          itemName: serviceItem?.itemName || '',
          category: serviceItem?.category || '',
          totalCount: item._count,
          timeoutCount: itemTimeouts,
          timeoutRate: item._count > 0 ? itemTimeouts / item._count : 0,
          avgHandlingTime: Math.round(avgItemTime),
          mainBottleneckNode: nodeNameMap[mainBottleneck?.[0]] || mainBottleneck?.[0] || '',
        };
      }),
    );

    const hourlyData: Record<string, { count: number; durations: number[] }> = {};
    for (let h = 0; h < 24; h++) {
      hourlyData[`${h.toString().padStart(2, '0')}:00`] = { count: 0, durations: [] };
    }
    for (const a of apps) {
      const hour = dayjs(a.createdAt).format('HH:00');
      if (!hourlyData[hour]) hourlyData[hour] = { count: 0, durations: [] };
      hourlyData[hour].count++;
      if (a.completedAt) {
        hourlyData[hour].durations.push(dayjs(a.completedAt).diff(dayjs(a.createdAt), 'minute'));
      }
    }
    const hourlyDistribution = Object.entries(hourlyData).map(([hour, data]) => ({
      hour,
      applicationCount: data.count,
      avgDuration: data.durations.length > 0
        ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
        : 0,
    }));

    const hotspots = await this.prisma.serviceHotSpot.findMany({
      where: { createdAt: { gte: startDate } },
    });
    const regionData: Record<string, { count: number; durations: number[] }> = {};
    for (const h of hotspots) {
      if (h.region) {
        if (!regionData[h.region]) regionData[h.region] = { count: 0, durations: [] };
        regionData[h.region].count += h.applyCount;
        if (h.avgHandlingTime) regionData[h.region].durations.push(h.avgHandlingTime);
      }
    }
    const regionalBottlenecks = Object.entries(regionData).map(([region, data]) => ({
      region,
      count: data.count,
      avgDuration: data.durations.length > 0
        ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
        : 0,
    }));

    const recommendations: string[] = [];
    if (nodeBottlenecks[0]?.timeoutRate > 0.2) {
      recommendations.push(`节点"${nodeBottlenecks[0].nodeName}"超时率较高(${Math.round(nodeBottlenecks[0].timeoutRate * 100)}%)，建议优化审批流程或增加人员配置`);
    }
    if (deptBottlenecks[0]?.timeoutRate > 0.2) {
      recommendations.push(`${deptBottlenecks[0].departmentLabel}超时率较高，建议加强督办`);
    }
    if (avgHandlingTime > 1440) {
      recommendations.push(`平均办理时长较长(${Math.round(avgHandlingTime / 60)}小时)，建议优化流程`);
    }
    if (hourlyDistribution.some((h) => h.applicationCount > 50)) {
      recommendations.push('存在办件高峰时段明显，建议引导错峰办理');
    }
    if (recommendations.length === 0) {
      recommendations.push('系统运行状态良好，继续保持');
    }

    const avgNodeDuration: Record<string, number> = {};
    for (const [code, stats] of Object.entries(nodeStats)) {
      if (stats.durations.length > 0) {
        avgNodeDuration[nodeNameMap[code] || code] = Math.round(
          stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
        );
      }
    }

    return {
      summary: {
        totalApplications: apps.length,
        totalTimeouts: timeoutNodes.length,
        timeoutRate: apps.length > 0 ? timeoutNodes.length / apps.length : 0,
        avgHandlingTime: Math.round(avgHandlingTime),
        avgNodeDuration,
      },
      nodeBottlenecks: nodeBottlenecks.slice(0, 10),
      departmentBottlenecks: deptBottlenecks.sort((a, b) => b.timeoutRate - a.timeoutRate),
      hotItemBottlenecks: hotItemBottlenecks.filter((i) => i.itemCode),
      hourlyDistribution,
      regionalBottlenecks,
      recommendations,
    };
  }

  async getHeatmapData(days = 30) {
    const startDate = dayjs().subtract(days, 'day').toDate();

    const hotspots = await this.prisma.serviceHotSpot.findMany({
      where: { createdAt: { gte: startDate } },
    });

    const heatmap: Record<string, Record<string, number>> = {};
    for (const h of hotspots) {
      const date = dayjs(h.date).format('YYYY-MM-DD');
      if (!heatmap[date]) heatmap[date] = {};
      heatmap[date][h.serviceItemId] = h.applyCount;
    }

    const regionData: Record<string, { count: number; durations: number[] }> = {};
    for (const h of hotspots) {
      if (h.region) {
        if (!regionData[h.region]) regionData[h.region] = { count: 0, durations: [] };
        regionData[h.region].count += h.applyCount;
        if (h.avgHandlingTime) regionData[h.region].durations.push(h.avgHandlingTime);
      }
    }
    const regionalBottlenecks = Object.entries(regionData).map(([region, data]) => ({
      region,
      count: data.count,
      avgDuration: data.durations.length > 0
        ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
        : 0,
    }));

    return {
      periodDays: days,
      heatmapData: heatmap,
      total: hotspots.length,
      regions: regionalBottlenecks,
    };
  }
}
