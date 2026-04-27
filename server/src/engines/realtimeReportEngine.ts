import { prisma } from '../lib/prisma';
import { ProcessStatus, WorkOrderStatus, OperationType, QualityResult, AbnormalStatus } from '../config';

export interface ReportData {
  workOrderId: string;
  workOrderProcessId?: string;
  passQty: number;
  failQty: number;
  workMinutes?: number;
  remark?: string;
}

export interface ReportResult {
  success: boolean;
  reportId?: string;
  error?: string;
}

export class RealtimeReportEngine {
  async submitReport(reporterId: string, data: ReportData): Promise<ReportResult> {
    try {
      const { workOrderId, workOrderProcessId, passQty, failQty, workMinutes, remark } = data;

      if (passQty < 0 || failQty < 0) {
        return { success: false, error: '数量不能为负数' };
      }

      if (passQty === 0 && failQty === 0) {
        return { success: false, error: '请至少输入合格数或不合格数' };
      }

      const workOrder = await prisma.workOrder.findUnique({
        where: { id: workOrderId },
        include: { processes: true },
      });

      if (!workOrder) {
        return { success: false, error: '工单不存在' };
      }

      if (workOrder.status !== WorkOrderStatus.IN_PRODUCTION) {
        return { success: false, error: '工单不在生产状态' };
      }

      let workOrderProcess = null;
      if (workOrderProcessId) {
        workOrderProcess = await prisma.workOrderProcess.findUnique({
          where: { id: workOrderProcessId },
          include: { assignments: true },
        });

        if (!workOrderProcess) {
          return { success: false, error: '工序不存在' };
        }

        if (workOrderProcess.status !== ProcessStatus.IN_PROGRESS) {
          return { success: false, error: '工序未在进行中' };
        }
      }

      const reporter = await prisma.user.findUnique({
        where: { id: reporterId },
      });

      const result = await prisma.$transaction(async (tx) => {
        const report = await tx.productionReport.create({
          data: {
            workOrderProcessId,
            reporterId: parseInt(reporterId),
            reporterName: reporter?.name,
            passQty,
            failQty,
            workMinutes,
            yieldRate: passQty + failQty > 0 ? (passQty / (passQty + failQty)) * 100 : 0,
            remark,
          },
        });

        const newActualQty = workOrder.actualQty + passQty;
        const newFailedQty = workOrder.failedQty + failQty;

        await tx.workOrder.update({
          where: { id: workOrderId },
          data: {
            actualQty: newActualQty,
            failedQty: newFailedQty,
          },
        });

        if (workOrderProcessId && workOrderProcess) {
          const newProcessActualQty = workOrderProcess.actualQty + passQty;
          const newProcessPassQty = workOrderProcess.passQty + passQty;
          const newProcessFailQty = workOrderProcess.failQty + failQty;

          await tx.workOrderProcess.update({
            where: { id: workOrderProcessId },
            data: {
              actualQty: newProcessActualQty,
              passQty: newProcessPassQty,
              failQty: newProcessFailQty,
            },
          });
        }

        await tx.operationLog.create({
          data: {
            userId: parseInt(reporterId),
            userName: reporter?.name,
            userRole: reporter?.role,
            operationType: OperationType.REPORT,
            action: '生产报工',
            details: JSON.stringify({
              passQty,
              failQty,
              workMinutes,
              workOrderId,
              workOrderProcessId,
            }),
          },
        });

        const totalQty = passQty + failQty;

        await tx.productionHistory.create({
          data: {
            workOrderId,
            workOrderNo: workOrder.workOrderNo,
            productName: workOrder.productName,
            productSpec: workOrder.productSpec,
            processName: workOrderProcess?.processName,
            operatorName: reporter?.name,
            plannedQty: workOrder.plannedQty,
            actualQty: totalQty,
            passQty,
            failQty,
            yieldRate: totalQty > 0 ? (passQty / totalQty) * 100 : null,
            workMinutes,
            status: workOrder.status,
          },
        });

        return report;
      });

      return { success: true, reportId: result.id };
    } catch (error) {
      console.error('报工失败:', error);
      return { success: false, error: '报工失败' };
    }
  }

  async getRealtimeStatus() {
    const activeWorkOrders = await prisma.workOrder.findMany({
      where: {
        status: { in: [WorkOrderStatus.IN_PRODUCTION, WorkOrderStatus.PENDING_PRODUCTION] },
      },
      include: {
        processes: {
          orderBy: { sequence: 'asc' },
          include: {
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const equipmentStatus = await prisma.equipment.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        status: true,
        location: true,
      },
    });

    const activeAbnormals = await prisma.abnormalReport.findMany({
      where: {
        status: { notIn: [AbnormalStatus.CLOSED, AbnormalStatus.RESOLVED] },
      },
      orderBy: { reportedAt: 'desc' },
    });

    return {
      workOrders: activeWorkOrders,
      equipment: equipmentStatus,
      activeAbnormals,
      timestamp: new Date(),
    };
  }

  async getProcessDashboard(workOrderProcessId: string) {
    const process = await prisma.workOrderProcess.findUnique({
      where: { id: workOrderProcessId },
      include: {
        workOrder: true,
        assignments: true,
        reports: {
          orderBy: { createdAt: 'desc' },
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!process) {
      return null;
    }

    const totalPassQty = process.reports.reduce((sum, r) => sum + r.passQty, 0);
    const totalFailQty = process.reports.reduce((sum, r) => sum + r.failQty, 0);
    const totalWorkTime = process.reports.reduce((sum, r) => sum + (r.workMinutes || 0), 0);

    return {
      process: {
        id: process.id,
        name: process.processName,
        status: process.status,
        sequence: process.sequence,
        plannedQty: process.plannedQty,
        actualQty: process.actualQty,
        isQualityCheck: process.isQualityCheck,
      },
      workOrder: {
        id: process.workOrder.id,
        workOrderNo: process.workOrder.workOrderNo,
        productName: process.workOrder.productName,
        productSpec: process.workOrder.productSpec,
        plannedQty: process.workOrder.plannedQty,
      },
      summary: {
        totalPassQty,
        totalFailQty,
        totalQty: totalPassQty + totalFailQty,
        yieldRate: totalPassQty + totalFailQty > 0 ? (totalPassQty / (totalPassQty + totalFailQty)) * 100 : 0,
        totalWorkTime,
      },
      assignments: process.assignments,
      recentReports: process.reports.slice(0, 10),
      recentLogs: process.logs,
    };
  }
}

export const realtimeReportEngine = new RealtimeReportEngine();
