import { prisma } from '../lib/prisma';
import { WorkOrderStatus, QualityResult } from '../config';

export interface YieldStatistics {
  totalPassQty: number;
  totalFailQty: number;
  totalQty: number;
  yieldRate: number;
  firstPassYield?: number;
  reworkRate?: number;
}

export interface WorkOrderYield extends YieldStatistics {
  workOrderId: string;
  workOrderCode: string;
  productName: string;
  plannedQty: number;
  status: string;
  processes: ProcessYield[];
}

export interface ProcessYield extends YieldStatistics {
  processId: string;
  processName: string;
  sequence: number;
}

export interface DailyYield {
  date: string;
  totalPassQty: number;
  totalFailQty: number;
  yieldRate: number;
  workOrderCount: number;
}

export class YieldEngine {
  calculateYield(passQty: number, failQty: number): YieldStatistics {
    const totalQty = passQty + failQty;
    const yieldRate = totalQty > 0 ? (passQty / totalQty) * 100 : 0;

    return {
      totalPassQty: passQty,
      totalFailQty: failQty,
      totalQty,
      yieldRate,
    };
  }

  async getWorkOrderYield(workOrderId: string): Promise<WorkOrderYield | null> {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        processes: {
          orderBy: { sequence: 'asc' },
          include: { reports: true },
        },
        reports: true,
      },
    });

    if (!workOrder) {
      return null;
    }

    const totalPassQty = workOrder.reports.reduce((sum, r) => sum + r.passQty, 0);
    const totalFailQty = workOrder.reports.reduce((sum, r) => sum + r.failQty, 0);

    const processes: ProcessYield[] = workOrder.processes.map((p) => {
      const passQty = p.reports.reduce((sum, r) => sum + r.passQty, 0);
      const failQty = p.reports.reduce((sum, r) => sum + r.failQty, 0);
      const total = passQty + failQty;

      return {
        processId: p.id,
        processName: p.processName,
        sequence: p.sequence,
        totalPassQty: passQty,
        totalFailQty: failQty,
        totalQty: total,
        yieldRate: total > 0 ? (passQty / total) * 100 : 0,
      };
    });

    return {
      workOrderId: workOrder.id,
      workOrderCode: workOrder.workOrderNo,
      productName: workOrder.productName,
      plannedQty: workOrder.plannedQty,
      status: workOrder.status,
      ...this.calculateYield(totalPassQty, totalFailQty),
      processes,
    };
  }

  async getWorkOrdersYield(
    startDate?: Date,
    endDate?: Date,
    status?: string[]
  ): Promise<WorkOrderYield[]> {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        processes: {
          orderBy: { sequence: 'asc' },
          include: { reports: true },
        },
        reports: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const results: WorkOrderYield[] = [];

    for (const workOrder of workOrders) {
      const totalPassQty = workOrder.reports.reduce((sum, r) => sum + r.passQty, 0);
      const totalFailQty = workOrder.reports.reduce((sum, r) => sum + r.failQty, 0);

      const processes: ProcessYield[] = workOrder.processes.map((p) => {
        const passQty = p.reports.reduce((sum, r) => sum + r.passQty, 0);
        const failQty = p.reports.reduce((sum, r) => sum + r.failQty, 0);
        const total = passQty + failQty;

        return {
          processId: p.id,
          processName: p.processName,
          sequence: p.sequence,
          totalPassQty: passQty,
          totalFailQty: failQty,
          totalQty: total,
          yieldRate: total > 0 ? (passQty / total) * 100 : 0,
        };
      });

      results.push({
        workOrderId: workOrder.id,
        workOrderCode: workOrder.workOrderNo,
        productName: workOrder.productName,
        plannedQty: workOrder.plannedQty,
        status: workOrder.status,
        ...this.calculateYield(totalPassQty, totalFailQty),
        processes,
      });
    }

    return results;
  }

  async getDailyYield(days: number = 30): Promise<DailyYield[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results: DailyYield[] = [];

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const reports = await prisma.productionReport.findMany({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate,
          },
        },
      });

      const workOrders = await prisma.workOrder.findMany({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate,
          },
        },
      });

      const passQty = reports.reduce((sum, r) => sum + r.passQty, 0);
      const failQty = reports.reduce((sum, r) => sum + r.failQty, 0);
      const total = passQty + failQty;

      results.push({
        date: currentDate.toISOString().split('T')[0],
        totalPassQty: passQty,
        totalFailQty: failQty,
        yieldRate: total > 0 ? (passQty / total) * 100 : 0,
        workOrderCount: workOrders.length,
      });
    }

    return results;
  }

  async getQualityInspectionYield(workOrderId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (workOrderId) {
      where.workOrderId = workOrderId;
    }

    if (startDate || endDate) {
      where.inspectionAt = {};
      if (startDate) where.inspectionAt.gte = startDate;
      if (endDate) where.inspectionAt.lte = endDate;
    }

    const inspections = await prisma.qualityInspection.findMany({
      where,
    });

    const totalPassQty = inspections.reduce((sum, i) => sum + i.passQty, 0);
    const totalFailQty = inspections.reduce((sum, i) => sum + i.failQty, 0);
    const totalSampleQty = inspections.reduce((sum, i) => sum + (i.sampleQty || 0), 0);

    const passCount = inspections.filter((i) => i.result === QualityResult.PASS).length;
    const failCount = inspections.filter((i) => i.result === QualityResult.FAIL).length;
    const pendingCount = inspections.filter((i) => i.result === QualityResult.PENDING).length;

    return {
      summary: {
        totalInspections: inspections.length,
        passCount,
        failCount,
        pendingCount,
        totalPassQty,
        totalFailQty,
        totalSampleQty,
        qualityRate: inspections.length > 0 ? (passCount / inspections.length) * 100 : 0,
        passYield: totalPassQty + totalFailQty > 0 ? (totalPassQty / (totalPassQty + totalFailQty)) * 100 : 0,
      },
      inspections: inspections.map((i) => ({
        id: i.id,
        inspectionNo: i.inspectionNo,
        workOrderNo: i.workOrderNo,
        inspectorName: i.inspectorName,
        inspectionType: i.type,
        sampleQty: i.sampleQty,
        passQty: i.passQty,
        failQty: i.failQty,
        result: i.result,
        failReason: i.failReason,
        treatment: i.treatment,
        remark: i.remark,
        inspectionAt: i.inspectionAt,
      })),
    };
  }

  async calculateOEE(workOrderId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        processes: {
          include: {
            logs: true,
            assignments: true,
          },
        },
        reports: true,
      },
    });

    if (!workOrder) {
      return null;
    }

    const actualStartDate = workOrder.actualStartDate ? new Date(workOrder.actualStartDate) : null;
    const actualEndDate = workOrder.actualEndDate ? new Date(workOrder.actualEndDate) : null;

    const totalProductionTime = actualStartDate && actualEndDate
      ? Math.floor((actualEndDate.getTime() - actualStartDate.getTime()) / 60000)
      : 0;

    let totalDownTime = 0;
    let totalRunTime = 0;

    for (const process of workOrder.processes) {
      for (const log of process.logs) {
        if (log.workMinutes) {
          totalRunTime += log.workMinutes;
        }
      }
    }

    if (totalProductionTime > 0) {
      totalDownTime = totalProductionTime - totalRunTime;
    }

    const availability = totalProductionTime > 0 ? (totalRunTime / totalProductionTime) * 100 : 100;

    const totalQty = workOrder.actualQty + workOrder.failedQty;
    const theoreticalCycleTime = workOrder.processes.reduce(
      (sum, p) => sum + (p.plannedQty || 0),
      0
    );
    const theoreticalProduction = theoreticalCycleTime > 0 ? (totalRunTime / theoreticalCycleTime) * 100 : 100;

    const performance = theoreticalProduction > 0 ? Math.min(100, (totalQty / theoreticalProduction) * 100) : 100;

    const quality = totalQty > 0 ? (workOrder.actualQty / totalQty) * 100 : 100;

    const oee = (availability * performance * quality) / 10000 * 100;

    return {
      workOrderId: workOrder.id,
      workOrderNo: workOrder.workOrderNo,
      oee: Math.round(oee * 100) / 100,
      availability: Math.round(availability * 100) / 100,
      performance: Math.round(performance * 100) / 100,
      quality: Math.round(quality * 100) / 100,
      metrics: {
        totalProductionTime,
        totalRunTime,
        totalDownTime,
        totalQty,
        goodQty: workOrder.actualQty,
        badQty: workOrder.failedQty,
      },
    };
  }
}

export const yieldEngine = new YieldEngine();
