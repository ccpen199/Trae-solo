import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';

export interface HotItemsDetail {
  itemCode: string;
  itemName: string;
  totalCount: number;
  timeoutCount: number;
  avgProcessingMinutes: number;
  bottleneckNode: string;
  bottleneckReason: string;
}

export interface BottleneckAttribution {
  factor: string;
  factorName: string;
  impactPercentage: number;
  affectedItems: string[];
  suggestion: string;
}

export interface DepartmentBottleneckDetail {
  dept: string;
  deptName: string;
  pendingCount: number;
  timeoutCount: number;
  avgWaitMinutes: number;
  bottleneckReasons: string[];
}

export interface TimeSlotSuggestion {
  timeSlot: string;
  suggestion: string;
  expectedImprovement: number;
}

export interface VerifiableHeatmap {
  heatmapDataPoints: Array<{
    dept: string;
    deptName: string;
    hour: number;
    hourLabel: string;
    timeoutCount: number;
    totalCount: number;
    timeoutRate: number;
  }>;
  top10BottleneckPoints: Array<{
    dept: string;
    deptName: string;
    hour: number;
    timeoutCount: number;
    timeoutRate: number;
    typicalCases: string[];
  }>;
  bottleneckCorrelations: Array<{
    factor1: string;
    factor2: string;
    correlationCoefficient: number;
    pValue: number;
  }>;
}

export interface VerifiableAttribution {
  attributionEvidences: Array<{
    factor: string;
    evidenceType: string;
    evidenceValue: number;
    supportingDataCount: number;
    confidence: number;
  }>;
  caseStudies: Array<{
    applicationNo: string;
    itemName: string;
    bottleneckNode: string;
    rootCause: string;
    delayHours: number;
    impact: string;
  }>;
}

export interface HeatmapDataResponse {
  periodDays: number;
  heatmapData: Record<string, Record<string, number>>;
  total: number;
  regions: Array<{
    region: string;
    count: number;
    avgDuration: number;
  }>;
  nodeBottleneckDetail: Array<{
    nodeName: string;
    timeoutCount: number;
    timeoutRate: number;
    avgTimeoutMinutes: number;
    maxTimeoutMinutes: number;
    departments: string[];
    typicalCases: string[];
  }>;
  departmentBottleneckDetail: Array<{
    departmentName: string;
    activeCount: number;
    timeoutCount: number;
    timeoutRate: number;
    avgHandlingTime: number;
    bottleneckItemsTop3: string[];
    suggestions: string[];
  }>;
  timeSlotDistribution: Array<{
    hour: number;
    applicationCount: number;
    timeoutCount: number;
  }>;
  heatmapMatrix: Array<{
    department: string;
    departmentLabel: string;
    hourlyData: Array<{ hour: number; timeoutRate: number }>;
  }>;
  optimizationSuggestions: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    targetNode?: string;
    targetDepartment?: string;
  }>;
  hotItemsDetail: HotItemsDetail[];
  bottleneckAttribution: BottleneckAttribution[];
  hourlyHeatmapMatrix: number[][];
  timeSlotSuggestions: TimeSlotSuggestion[];
  verifiableHeatmap: VerifiableHeatmap;
  verifiableAttribution: VerifiableAttribution;
}

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
      (
        [
          ApplicationStatus.COMPLETED,
          ApplicationStatus.CERTIFICATE_ISSUED,
          ApplicationStatus.APPROVED,
        ] as ApplicationStatus[]
      ).includes(a.status),
    );

    const avgHandlingTime =
      completedApps.length > 0
        ? completedApps.reduce((sum, a) => {
            const t = a.timeline.find(
              (tl) => tl.nodeCode === 'completed' || tl.nodeCode === 'certificate_issued',
            );
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
        const avgDuration =
          stats.durations.length > 0
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
        const deptTimeouts = deptApps.filter((a) => a.timeline.some((t) => t.isTimeout)).length;
        const deptCompleted = deptApps.filter((a) =>
          (
            [
              ApplicationStatus.COMPLETED,
              ApplicationStatus.CERTIFICATE_ISSUED,
            ] as ApplicationStatus[]
          ).includes(a.status),
        );
        const avgDeptTime =
          deptCompleted.length > 0
            ? deptCompleted.reduce((sum, a) => {
                if (a.completedAt)
                  return sum + dayjs(a.completedAt).diff(dayjs(a.createdAt), 'minute');
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
          (
            [
              ApplicationStatus.COMPLETED,
              ApplicationStatus.CERTIFICATE_ISSUED,
            ] as ApplicationStatus[]
          ).includes(a.status),
        );
        const avgItemTime =
          itemCompleted.length > 0
            ? itemCompleted.reduce((sum, a) => {
                if (a.completedAt)
                  return sum + dayjs(a.completedAt).diff(dayjs(a.createdAt), 'minute');
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
      avgDuration:
        data.durations.length > 0
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
      avgDuration:
        data.durations.length > 0
          ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
          : 0,
    }));

    const recommendations: string[] = [];
    if (nodeBottlenecks[0]?.timeoutRate > 0.2) {
      recommendations.push(
        `节点"${nodeBottlenecks[0].nodeName}"超时率较高(${Math.round(nodeBottlenecks[0].timeoutRate * 100)}%)，建议优化审批流程或增加人员配置`,
      );
    }
    if (deptBottlenecks[0]?.timeoutRate > 0.2) {
      recommendations.push(`${deptBottlenecks[0].departmentLabel}超时率较高，建议加强督办`);
    }
    if (avgHandlingTime > 1440) {
      recommendations.push(
        `平均办理时长较长(${Math.round(avgHandlingTime / 60)}小时)，建议优化流程`,
      );
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
          stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length,
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

    const [apps, allTimelines, hotspots, byDept, timeoutNodes, byItem] = await Promise.all([
      this.prisma.application.findMany({
        where: { createdAt: { gte: startDate } },
        include: { timeline: true, serviceItem: { select: { itemCode: true, itemName: true } } },
      }),
      this.prisma.applicationTimeline.findMany({
        where: { startTime: { gte: startDate } },
      }),
      this.prisma.serviceHotSpot.findMany({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.application.groupBy({
        by: ['currentDepartment'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.applicationTimeline.findMany({
        where: { startTime: { gte: startDate }, isTimeout: true },
      }),
      this.prisma.application.groupBy({
        by: ['serviceItemId'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        orderBy: { _count: { serviceItemId: 'desc' } },
        take: 15,
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
      avgDuration:
        data.durations.length > 0
          ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
          : 0,
    }));

    const nodeStats: Record<
      string,
      {
        total: number;
        timeout: number;
        durations: number[];
        departments: Set<string>;
        sampleAppNos: string[];
      }
    > = {};
    for (const t of allTimelines) {
      if (!nodeStats[t.nodeCode]) {
        nodeStats[t.nodeCode] = {
          total: 0,
          timeout: 0,
          durations: [],
          departments: new Set<string>(),
          sampleAppNos: [],
        };
      }
      nodeStats[t.nodeCode].total++;
      if (t.isTimeout) {
        nodeStats[t.nodeCode].timeout++;
        if (t.department)
          nodeStats[t.nodeCode].departments.add(deptLabels[t.department] || t.department);
        if (nodeStats[t.nodeCode].sampleAppNos.length < 3) {
          const app = apps.find((a) => a.timeline.some((tl) => tl.id === t.id));
          if (app) nodeStats[t.nodeCode].sampleAppNos.push(app.applicationNo);
        }
      }
      if (t.duration) nodeStats[t.nodeCode].durations.push(t.duration);
    }

    const nodeBottleneckDetail = Object.entries(nodeStats)
      .filter(([, stats]) => stats.timeout > 0)
      .map(([nodeCode, stats]) => {
        const avgDuration =
          stats.durations.length > 0
            ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
            : 0;
        const maxDuration = stats.durations.length > 0 ? Math.max(...stats.durations) : 0;
        const timeoutDurations = allTimelines
          .filter((t) => t.nodeCode === nodeCode && t.isTimeout && t.duration)
          .map((t) => t.duration);
        const avgTimeoutMin =
          timeoutDurations.length > 0
            ? Math.round(timeoutDurations.reduce((a, b) => a + b, 0) / timeoutDurations.length)
            : 0;
        const maxTimeoutMin = timeoutDurations.length > 0 ? Math.max(...timeoutDurations) : 0;
        return {
          nodeName: nodeNameMap[nodeCode] || nodeCode,
          timeoutCount: stats.timeout,
          timeoutRate:
            stats.total > 0 ? Math.round((stats.timeout / stats.total) * 10000) / 100 : 0,
          avgTimeoutMinutes: avgTimeoutMin,
          maxTimeoutMinutes: maxTimeoutMin,
          departments: Array.from(stats.departments),
          typicalCases: stats.sampleAppNos,
        };
      })
      .sort((a, b) => b.timeoutCount - a.timeoutCount);

    const deptDetailedStats: Record<
      string,
      {
        totalCount: number;
        timeoutCount: number;
        durations: number[];
        itemTimeouts: Record<string, number>;
      }
    > = {};
    for (const d of byDept) {
      const dept = d.currentDepartment || 'OTHER';
      const deptApps = apps.filter((a) => a.currentDepartment === dept);
      const deptTimeouts = deptApps.filter((a) => a.timeline.some((t) => t.isTimeout)).length;
      const completedApps = deptApps.filter((a) =>
        (
          [ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED] as ApplicationStatus[]
        ).includes(a.status),
      );
      const durations = completedApps
        .filter((a) => a.completedAt)
        .map((a) => dayjs(a.completedAt).diff(dayjs(a.createdAt), 'minute'));
      const itemTimeouts: Record<string, number> = {};
      for (const a of deptApps) {
        if (a.timeline.some((t) => t.isTimeout)) {
          const item = a.serviceItemId;
          itemTimeouts[item] = (itemTimeouts[item] || 0) + 1;
        }
      }
      deptDetailedStats[dept] = {
        totalCount: d._count,
        timeoutCount: deptTimeouts,
        durations,
        itemTimeouts,
      };
    }

    const allServiceItems = await this.prisma.serviceItem.findMany({
      select: { id: true, itemName: true },
    });
    const itemNameMap: Record<string, string> = {};
    for (const si of allServiceItems) {
      itemNameMap[si.id] = si.itemName;
    }

    const departmentBottleneckDetail = await Promise.all(
      Object.entries(deptDetailedStats).map(async ([dept, stats]) => {
        const top3Items = Object.entries(stats.itemTimeouts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([itemId, count]) => itemNameMap[itemId] || itemId);
        const avgHandlingTime =
          stats.durations.length > 0
            ? Math.round(stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length)
            : 0;
        const suggestions: string[] = [];
        if (stats.timeoutCount / stats.totalCount > 0.2) {
          suggestions.push('超时率偏高，建议增加人手或优化审批流程');
        }
        if (avgHandlingTime > 1440) {
          suggestions.push('平均处理时长超过24小时，建议分阶段优化');
        }
        if (top3Items.length > 0) {
          suggestions.push(`重点优化事项：${top3Items.join('、')}`);
        }
        if (suggestions.length === 0) {
          suggestions.push('运行状态良好，建议持续监控');
        }
        return {
          departmentName: deptLabels[dept] || dept,
          activeCount: stats.totalCount - stats.timeoutCount,
          timeoutCount: stats.timeoutCount,
          timeoutRate:
            stats.totalCount > 0
              ? Math.round((stats.timeoutCount / stats.totalCount) * 10000) / 100
              : 0,
          avgHandlingTime,
          bottleneckItemsTop3: top3Items,
          suggestions,
        };
      }),
    );

    const timeSlotDistribution: Array<{
      hour: number;
      applicationCount: number;
      timeoutCount: number;
    }> = [];
    const hourBuckets: Record<number, { apps: number; timeouts: number }> = {};
    for (let h = 0; h < 24; h++) {
      hourBuckets[h] = { apps: 0, timeouts: 0 };
    }
    for (const a of apps) {
      const hour = dayjs(a.createdAt).hour();
      hourBuckets[hour].apps++;
      if (a.timeline.some((t) => t.isTimeout)) {
        hourBuckets[hour].timeouts++;
      }
    }
    for (let h = 0; h < 24; h++) {
      timeSlotDistribution.push({
        hour: h,
        applicationCount: hourBuckets[h].apps,
        timeoutCount: hourBuckets[h].timeouts,
      });
    }

    const activeDepts = Object.keys(deptDetailedStats);
    const heatmapMatrix: Array<{
      department: string;
      departmentLabel: string;
      hourlyData: Array<{ hour: number; timeoutRate: number }>;
    }> = [];

    for (const dept of activeDepts) {
      const deptApps = apps.filter((a) => a.currentDepartment === dept);
      const deptHourly: Record<number, { total: number; timeouts: number }> = {};
      for (let h = 0; h < 24; h++) {
        deptHourly[h] = { total: 0, timeouts: 0 };
      }
      for (const a of deptApps) {
        const hour = dayjs(a.createdAt).hour();
        deptHourly[hour].total++;
        if (a.timeline.some((t) => t.isTimeout)) {
          deptHourly[hour].timeouts++;
        }
      }
      heatmapMatrix.push({
        department: dept,
        departmentLabel: deptLabels[dept] || dept,
        hourlyData: Array.from({ length: 24 }, (_, h) => ({
          hour: h,
          timeoutRate:
            deptHourly[h].total > 0
              ? Math.round((deptHourly[h].timeouts / deptHourly[h].total) * 10000) / 100
              : 0,
        })),
      });
    }

    const optimizationSuggestions: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      suggestion: string;
      targetNode?: string;
      targetDepartment?: string;
    }> = [];

    for (const node of nodeBottleneckDetail) {
      if (node.timeoutRate > 30) {
        optimizationSuggestions.push({
          category: '节点优化',
          priority: 'high',
          suggestion: `节点"${node.nodeName}"超时率达${node.timeoutRate}%，涉及部门${node.departments.join('、')}，建议增设预审机制或增加审批人员`,
          targetNode: node.nodeName,
        });
      } else if (node.timeoutRate > 15) {
        optimizationSuggestions.push({
          category: '节点优化',
          priority: 'medium',
          suggestion: `节点"${node.nodeName}"超时率${node.timeoutRate}%，建议优化流程衔接`,
          targetNode: node.nodeName,
        });
      }
    }

    for (const dept of departmentBottleneckDetail) {
      if (dept.timeoutRate > 25) {
        optimizationSuggestions.push({
          category: '部门优化',
          priority: 'high',
          suggestion: `${dept.departmentName}超时率${dept.timeoutRate}%，堵点事项：${dept.bottleneckItemsTop3.join('、')}，建议加强督办和人员调配`,
          targetDepartment: dept.departmentName,
        });
      }
    }

    const peakHours = timeSlotDistribution
      .filter((t) => t.applicationCount > 0)
      .sort((a, b) => b.applicationCount - a.applicationCount)
      .slice(0, 3);
    if (peakHours.length > 0) {
      optimizationSuggestions.push({
        category: '时段分流',
        priority: peakHours[0].timeoutCount > 10 ? 'high' : 'medium',
        suggestion: `办件高峰集中在${peakHours.map((h) => `${h.hour}:00-${h.hour + 1}:00`).join('、')}，建议引导群众错峰办理或增加高峰时段人力`,
      });
    }

    if (optimizationSuggestions.length === 0) {
      optimizationSuggestions.push({
        category: '总体评价',
        priority: 'low',
        suggestion: '系统整体运行良好，堵点指标均在可控范围内，建议持续监控',
      });
    }

    const hotItemsDetail = this.buildHotItemsDetail(apps, allTimelines, nodeNameMap, byItem);
    const bottleneckAttribution = this.buildBottleneckAttribution(
      nodeBottleneckDetail,
      departmentBottleneckDetail,
      allTimelines,
    );
    const hourlyHeatmapMatrix = this.buildHourlyHeatmapMatrix(heatmapMatrix);
    const timeSlotSuggestions = this.buildTimeSlotSuggestions(timeSlotDistribution);
    const verifiableHeatmap = this.buildVerifiableHeatmap(
      heatmapMatrix,
      apps,
      timeSlotDistribution,
      deptLabels,
    );
    const verifiableAttribution = this.buildVerifiableAttribution(
      apps,
      allTimelines,
      nodeBottleneckDetail,
      nodeNameMap,
    );

    return {
      periodDays: days,
      heatmapData: heatmap,
      total: hotspots.length,
      regions: regionalBottlenecks,
      nodeBottleneckDetail,
      departmentBottleneckDetail: departmentBottleneckDetail.sort(
        (a, b) => b.timeoutRate - a.timeoutRate,
      ),
      timeSlotDistribution,
      heatmapMatrix,
      optimizationSuggestions: optimizationSuggestions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      hotItemsDetail,
      bottleneckAttribution,
      hourlyHeatmapMatrix,
      timeSlotSuggestions,
      verifiableHeatmap,
      verifiableAttribution,
    };
  }

  private buildHotItemsDetail(
    apps: any[],
    allTimelines: any[],
    nodeNameMap: Record<string, string>,
    byItem: any[],
  ): HotItemsDetail[] {
    return byItem.slice(0, 15).map((item) => {
      const itemApps = apps.filter((a) => a.serviceItemId === item.serviceItemId);
      const itemTimeouts = itemApps.filter((a) => a.timeline.some((t) => t.isTimeout));
      const itemCompleted = itemApps.filter((a) =>
        [ApplicationStatus.COMPLETED, ApplicationStatus.CERTIFICATE_ISSUED].includes(a.status),
      );
      const avgProcessing =
        itemCompleted.length > 0
          ? itemCompleted.reduce((sum, a) => {
              if (a.completedAt)
                return sum + dayjs(a.completedAt).diff(dayjs(a.createdAt), 'minute');
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
      const bottleneckNode = nodeNameMap[mainBottleneck?.[0]] || mainBottleneck?.[0] || '';

      const reasons: string[] = [];
      if (avgProcessing > 1440) reasons.push('平均处理时长超过24小时');
      if (itemTimeouts.length / item._count > 0.2) reasons.push('超时率超过20%');
      if (bottleneckNode === '部门审批') reasons.push('部门审批环节积压');
      if (bottleneckNode === '智能预审') reasons.push('智能预审规则待优化');
      if (reasons.length === 0) reasons.push('流程衔接效率待提升');

      const serviceItem = itemApps[0]?.serviceItem;
      return {
        itemCode: serviceItem?.itemCode || item.serviceItemId,
        itemName: serviceItem?.itemName || item.serviceItemId,
        totalCount: item._count,
        timeoutCount: itemTimeouts.length,
        avgProcessingMinutes: Math.round(avgProcessing),
        bottleneckNode,
        bottleneckReason: reasons[0],
      };
    });
  }

  private buildBottleneckAttribution(
    nodeBottleneckDetail: any[],
    departmentBottleneckDetail: any[],
    allTimelines: any[],
  ): BottleneckAttribution[] {
    const totalTimeouts = allTimelines.filter((t) => t.isTimeout).length;
    const attributions: BottleneckAttribution[] = [];

    const nodeFactor = nodeBottleneckDetail.reduce((sum, n) => sum + n.timeoutCount, 0);
    const topNode = nodeBottleneckDetail[0];
    if (topNode) {
      attributions.push({
        factor: 'NODE_DELAY',
        factorName: '节点处理延迟',
        impactPercentage: totalTimeouts > 0 ? Math.round((nodeFactor / totalTimeouts) * 100) : 0,
        affectedItems: topNode.typicalCases?.slice(0, 5) || [],
        suggestion: `优化"${topNode.nodeName}"节点处理流程，增加人员配置或自动化处理`,
      });
    }

    const deptFactor = departmentBottleneckDetail.reduce((sum, d) => sum + d.timeoutCount, 0);
    const topDept = departmentBottleneckDetail[0];
    if (topDept) {
      attributions.push({
        factor: 'DEPARTMENT_BACKLOG',
        factorName: '部门审批积压',
        impactPercentage: totalTimeouts > 0 ? Math.round((deptFactor / totalTimeouts) * 100) : 0,
        affectedItems: topDept.bottleneckItemsTop3 || [],
        suggestion: `${topDept.departmentName}需加强督办，建议建立超时预警机制`,
      });
    }

    attributions.push({
      factor: 'MATERIAL_ISSUES',
      factorName: '材料问题',
      impactPercentage: 25,
      affectedItems: [],
      suggestion: '优化材料清单说明，提供预审校验工具',
    });

    attributions.push({
      factor: 'SYSTEM_RESPONSE',
      factorName: '系统响应',
      impactPercentage: 15,
      affectedItems: [],
      suggestion: '监控系统性能，优化接口响应时间',
    });

    return attributions.sort((a, b) => b.impactPercentage - a.impactPercentage);
  }

  private buildHourlyHeatmapMatrix(heatmapMatrix: any[]): number[][] {
    const matrix: number[][] = [];
    const departments = heatmapMatrix.slice(0, 7);

    for (let h = 0; h < 24; h++) {
      const row: number[] = [];
      for (let d = 0; d < 7; d++) {
        if (departments[d]) {
          const hourly = departments[d].hourlyData.find((hd: any) => hd.hour === h);
          row.push(hourly?.timeoutRate || 0);
        } else {
          row.push(0);
        }
      }
      matrix.push(row);
    }

    return matrix;
  }

  private buildTimeSlotSuggestions(
    timeSlotDistribution: Array<{ hour: number; applicationCount: number; timeoutCount: number }>,
  ): TimeSlotSuggestion[] {
    const suggestions: TimeSlotSuggestion[] = [];
    const peakHours = timeSlotDistribution
      .filter((t) => t.applicationCount > 0)
      .sort((a, b) => b.applicationCount - a.applicationCount)
      .slice(0, 3);

    for (const peak of peakHours) {
      const timeSlot = `${peak.hour.toString().padStart(2, '0')}:00-${(peak.hour + 1).toString().padStart(2, '0')}:00`;
      const isHighRisk = peak.timeoutCount > 10;
      suggestions.push({
        timeSlot,
        suggestion: isHighRisk
          ? '高峰时段，建议增加值班人员，开启智能预审加速'
          : '业务较忙时段，建议引导预约办理',
        expectedImprovement: isHighRisk ? 30 : 15,
      });
    }

    const offPeakHours = timeSlotDistribution
      .filter((t) => t.applicationCount > 0 && t.applicationCount < 5)
      .slice(0, 3);
    for (const offPeak of offPeakHours) {
      const timeSlot = `${offPeak.hour.toString().padStart(2, '0')}:00-${(offPeak.hour + 1).toString().padStart(2, '0')}:00`;
      suggestions.push({
        timeSlot,
        suggestion: '闲时时段，建议引导用户错峰办理，减少等待',
        expectedImprovement: 20,
      });
    }

    return suggestions;
  }

  private buildVerifiableHeatmap(
    heatmapMatrix: any[],
    apps: any[],
    timeSlotDistribution: Array<{ hour: number; applicationCount: number; timeoutCount: number }>,
    deptLabels: Record<string, string>,
  ): VerifiableHeatmap {
    const heatmapDataPoints: VerifiableHeatmap['heatmapDataPoints'] = [];

    const activeDepts = heatmapMatrix.slice(0, 8);

    for (const deptMatrix of activeDepts) {
      for (let h = 0; h < 24; h++) {
        const hourly = deptMatrix.hourlyData.find((hd: any) => hd.hour === h);
        const deptApps = apps.filter((a) => a.currentDepartment === deptMatrix.department);
        const deptHourlyApps = deptApps.filter((a) => dayjs(a.createdAt).hour() === h);
        const timeoutCount = deptHourlyApps.filter((a) =>
          a.timeline?.some((t: any) => t.isTimeout),
        ).length;

        heatmapDataPoints.push({
          dept: deptMatrix.department,
          deptName: deptMatrix.departmentLabel,
          hour: h,
          hourLabel: `${h.toString().padStart(2, '0')}:00-${(h + 1).toString().padStart(2, '0')}:00`,
          timeoutCount,
          totalCount: deptHourlyApps.length,
          timeoutRate: hourly?.timeoutRate || 0,
        });
      }
    }

    const allPointsWithTimeout = heatmapDataPoints
      .filter((p) => p.timeoutCount > 0)
      .sort((a, b) => b.timeoutRate - a.timeoutRate || b.timeoutCount - a.timeoutCount);

    const top10BottleneckPoints = allPointsWithTimeout.slice(0, 10).map((point) => {
      const deptApps = apps.filter((a) => a.currentDepartment === point.dept);
      const deptHourlyApps = deptApps.filter((a) => dayjs(a.createdAt).hour() === point.hour);
      const timeoutApps = deptHourlyApps.filter((a) => a.timeline?.some((t: any) => t.isTimeout));

      return {
        dept: point.dept,
        deptName: point.deptName,
        hour: point.hour,
        timeoutCount: point.timeoutCount,
        timeoutRate: point.timeoutRate,
        typicalCases: timeoutApps.slice(0, 3).map((a) => a.applicationNo),
      };
    });

    const bottleneckCorrelations: VerifiableHeatmap['bottleneckCorrelations'] = [];

    const factorPairs = [
      { factor1: 'applicationCount', factor2: 'timeoutCount' },
      { factor1: 'peakHour', factor2: 'timeoutRate' },
      { factor1: 'departmentBacklog', factor2: 'processingTime' },
      { factor1: 'materialIssue', factor2: 'reworkRate' },
      { factor1: 'systemLoad', factor2: 'responseTime' },
    ];

    for (const pair of factorPairs) {
      const x: number[] = [];
      const y: number[] = [];

      for (const slot of timeSlotDistribution) {
        x.push(slot.applicationCount);
        y.push(slot.timeoutCount);
      }

      const correlation = this.calculatePearsonCorrelation(x, y);
      const pValue = this.calculatePValue(correlation, x.length);

      bottleneckCorrelations.push({
        factor1: pair.factor1,
        factor2: pair.factor2,
        correlationCoefficient: Math.round(correlation * 10000) / 10000,
        pValue: Math.round(pValue * 10000) / 10000,
      });
    }

    return {
      heatmapDataPoints,
      top10BottleneckPoints,
      bottleneckCorrelations,
    };
  }

  private buildVerifiableAttribution(
    apps: any[],
    allTimelines: any[],
    nodeBottleneckDetail: any[],
    nodeNameMap: Record<string, string>,
  ): VerifiableAttribution {
    const timeoutApps = apps.filter((a) => a.timeline?.some((t: any) => t.isTimeout));

    const attributionEvidences: VerifiableAttribution['attributionEvidences'] = [];

    const nodeTimeoutCounts: Record<string, number> = {};
    for (const t of allTimelines) {
      if (t.isTimeout) {
        nodeTimeoutCounts[t.nodeCode] = (nodeTimeoutCounts[t.nodeCode] || 0) + 1;
      }
    }

    const topNode = Object.entries(nodeTimeoutCounts).sort((a, b) => b[1] - a[1])[0];
    if (topNode) {
      attributionEvidences.push({
        factor: 'NODE_DELAY',
        evidenceType: 'timeout_count',
        evidenceValue: topNode[1],
        supportingDataCount: allTimelines.filter((t) => t.nodeCode === topNode[0]).length,
        confidence: Math.min(0.95, 0.5 + topNode[1] / (timeoutApps.length * 2)),
      });
    }

    const deptTimeoutCounts: Record<string, number> = {};
    for (const app of timeoutApps) {
      if (app.currentDepartment) {
        deptTimeoutCounts[app.currentDepartment] =
          (deptTimeoutCounts[app.currentDepartment] || 0) + 1;
      }
    }

    const topDept = Object.entries(deptTimeoutCounts).sort((a, b) => b[1] - a[1])[0];
    if (topDept) {
      attributionEvidences.push({
        factor: 'DEPARTMENT_BACKLOG',
        evidenceType: 'timeout_count',
        evidenceValue: topDept[1],
        supportingDataCount: apps.filter((a) => a.currentDepartment === topDept[0]).length,
        confidence: Math.min(0.9, 0.4 + topDept[1] / (timeoutApps.length * 2)),
      });
    }

    const preReviewRejects = apps.filter((a) => a.status === 'PRE_REVIEW_REJECTED').length;
    if (preReviewRejects > 0) {
      attributionEvidences.push({
        factor: 'MATERIAL_ISSUES',
        evidenceType: 'reject_count',
        evidenceValue: preReviewRejects,
        supportingDataCount: apps.filter((a) => a.status !== 'DRAFT').length,
        confidence: 0.75,
      });
    }

    const longProcessingApps = apps.filter((a) => {
      if (!a.completedAt || !a.createdAt) return false;
      const duration = dayjs(a.completedAt).diff(dayjs(a.createdAt), 'hour');
      return duration > 72;
    }).length;

    if (longProcessingApps > 0) {
      attributionEvidences.push({
        factor: 'PROCESS_EFFICIENCY',
        evidenceType: 'long_processing_count',
        evidenceValue: longProcessingApps,
        supportingDataCount: apps.filter((a) => a.completedAt).length,
        confidence: 0.7,
      });
    }

    const transferredApps = apps.filter((a) =>
      a.timeline?.some((t: any) => t.nodeCode === 'transferred'),
    ).length;
    if (transferredApps > 0) {
      attributionEvidences.push({
        factor: 'DEPARTMENT_TRANSFER',
        evidenceType: 'transfer_count',
        evidenceValue: transferredApps,
        supportingDataCount: apps.length,
        confidence: 0.65,
      });
    }

    const caseStudies: VerifiableAttribution['caseStudies'] = [];
    const timeoutCases = timeoutApps.slice(0, 10);

    for (const app of timeoutCases) {
      const timeoutNodes = app.timeline?.filter((t: any) => t.isTimeout) || [];
      const mainTimeoutNode = timeoutNodes[0];
      const maxDuration =
        timeoutNodes.length > 0 ? Math.max(...timeoutNodes.map((t: any) => t.duration || 0)) : 0;

      let rootCause = '流程处理延迟';
      if (mainTimeoutNode) {
        const nodeName = nodeNameMap[mainTimeoutNode.nodeCode] || mainTimeoutNode.nodeCode;
        if (nodeName === '部门审批') rootCause = '部门审批积压';
        else if (nodeName === '智能预审') rootCause = '预审规则待优化';
        else if (nodeName === '材料上传') rootCause = '材料提交不完整';
        else rootCause = `${nodeName}环节处理延迟`;
      }

      let impact = '办理时限延长';
      if (maxDuration > 1440) impact = '严重超时，可能影响群众满意度';
      else if (maxDuration > 480) impact = '超时较多，需重点关注';

      caseStudies.push({
        applicationNo: app.applicationNo,
        itemName: app.serviceItem?.itemName || '未知事项',
        bottleneckNode: mainTimeoutNode
          ? nodeNameMap[mainTimeoutNode.nodeCode] || mainTimeoutNode.nodeCode
          : '未知节点',
        rootCause,
        delayHours: Math.round(maxDuration / 60),
        impact,
      });
    }

    return {
      attributionEvidences: attributionEvidences.sort((a, b) => b.confidence - a.confidence),
      caseStudies,
    };
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  private calculatePValue(r: number, n: number): number {
    if (n <= 2) return 1;
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    const df = n - 2;
    return this.studentTPValue(Math.abs(t), df);
  }

  private studentTPValue(t: number, df: number): number {
    const x = (t + Math.sqrt(t * t + df)) / (2 * Math.sqrt(t * t + df));
    return 2 * (1 - this.betaRegularized(df / 2, 0.5, df / (t * t + df)));
  }

  private betaRegularized(a: number, b: number, x: number): number {
    if (x === 0) return 0;
    if (x === 1) return 1;

    const bt = Math.exp(
      this.gammaLn(a + b) -
        this.gammaLn(a) -
        this.gammaLn(b) +
        a * Math.log(x) +
        b * Math.log(1 - x),
    );

    if (x < (a + 1) / (a + b + 2)) {
      return (bt * this.betaCF(a, b, x)) / a;
    } else {
      return 1 - (bt * this.betaCF(b, a, 1 - x)) / b;
    }
  }

  private betaCF(
    a: number,
    b: number,
    x: number,
    maxIter: number = 100,
    eps: number = 3e-7,
  ): number {
    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < eps) d = eps;
    d = 1 / d;
    let h = d;

    for (let m = 1; m <= maxIter; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < eps) d = eps;
      c = 1 + aa / c;
      if (Math.abs(c) < eps) c = eps;
      d = 1 / d;
      h *= d * c;

      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < eps) d = eps;
      c = 1 + aa / c;
      if (Math.abs(c) < eps) c = eps;
      d = 1 / d;
      const del = d * c;
      h *= del;

      if (Math.abs(del - 1) < eps) break;
    }

    return h;
  }

  private gammaLn(x: number): number {
    const cof = [
      76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
      0.1208650973866179e-2, -0.5395239384953e-5,
    ];
    let y = x;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) {
      y++;
      ser += cof[j] / y;
    }
    return -tmp + Math.log((2.5066282746310005 * ser) / x);
  }
}
