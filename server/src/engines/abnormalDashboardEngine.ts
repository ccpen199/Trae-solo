import { prisma } from '../lib/prisma';
import { AbnormalType, AbnormalStatus, OperationType, WorkOrderStatus, AbnormalTypeType, AbnormalStatusType } from '../config';

export interface AbnormalReportData {
  workOrderId?: string;
  type: string;
  title: string;
  description?: string;
}

export interface AbnormalAssignment {
  abnormalReportId: string;
  assigneeId: string;
}

export interface AbnormalResolution {
  abnormalReportId: string;
  resolution: string;
}

export interface AbnormalStatistics {
  totalCount: number;
  pendingCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  byType: Record<string, number>;
  avgHandleTime: number | null;
}

export class AbnormalDashboardEngine {
  async createAbnormalReport(reporterId: string, data: AbnormalReportData) {
    try {
      const { workOrderId, type, title, description } = data;

      if (workOrderId) {
        const workOrder = await prisma.workOrder.findUnique({
          where: { id: workOrderId },
        });

        if (!workOrder) {
          return { success: false, error: '工单不存在' };
        }

        if (workOrder.status !== WorkOrderStatus.IN_PRODUCTION) {
          return { success: false, error: '工单不在生产状态' };
        }
      }

      const abnormalCode = await this.generateAbnormalCode();
      const reporter = await prisma.user.findUnique({ where: { id: reporterId } });

      const abnormal = await prisma.$transaction(async (tx) => {
        const report = await tx.abnormalReport.create({
          data: {
            abnormalNo: abnormalCode,
            workOrderId,
            workOrderNo: undefined,
            type,
            title,
            description,
            status: AbnormalStatus.REPORTED,
            reporterId: reporterId,
            reporterName: reporter?.name,
          },
        });

        await tx.operationLog.create({
          data: {
            userId: reporterId,
            userName: reporter?.name,
            userRole: reporter?.role,
            operationType: OperationType.CREATE,
            action: '创建异常报告',
            details: JSON.stringify({ type, title, workOrderId }),
          },
        });

        return report;
      });

      return { success: true, abnormal };
    } catch (error) {
      console.error('创建异常报告失败:', error);
      return { success: false, error: '创建异常报告失败' };
    }
  }

  async assignAbnormal(assignerId: string, data: AbnormalAssignment) {
    try {
      const { abnormalReportId, assigneeId } = data;

      const abnormal = await prisma.abnormalReport.findUnique({
        where: { id: abnormalReportId },
      });

      if (!abnormal) {
        return { success: false, error: '异常报告不存在' };
      }

      if (abnormal.status !== AbnormalStatus.REPORTED) {
        return { success: false, error: '异常报告已被处理' };
      }

      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
      });

      if (!assignee) {
        return { success: false, error: '处理人不存在' };
      }

      const assigner = await prisma.user.findUnique({ where: { id: assignerId } });

      const updatedAbnormal = await prisma.$transaction(async (tx) => {
        const updated = await tx.abnormalReport.update({
          where: { id: abnormalReportId },
          data: {
            status: AbnormalStatus.ASSIGNED,
            assignedToId: assigneeId,
            assignedToName: assignee.name,
          },
        });

        await tx.operationLog.create({
          data: {
            userId: assignerId,
            userName: assigner?.name,
            userRole: assigner?.role,
            operationType: OperationType.STATUS_CHANGE,
            action: '分配异常报告处理人',
            details: JSON.stringify({ assigneeId }),
          },
        });

        return updated;
      });

      return { success: true, abnormal: updatedAbnormal };
    } catch (error) {
      console.error('分配异常报告失败:', error);
      return { success: false, error: '分配异常报告失败' };
    }
  }

  async startProcessing(processorId: string, abnormalReportId: string) {
    try {
      const abnormal = await prisma.abnormalReport.findUnique({
        where: { id: abnormalReportId },
      });

      if (!abnormal) {
        return { success: false, error: '异常报告不存在' };
      }

      if (abnormal.assignedToId !== processorId) {
        return { success: false, error: '您不是该异常报告的处理人' };
      }

      if (abnormal.status !== AbnormalStatus.ASSIGNED) {
        return { success: false, error: '异常报告状态不正确' };
      }

      const processor = await prisma.user.findUnique({ where: { id: processorId } });

      const updatedAbnormal = await prisma.$transaction(async (tx) => {
        const updated = await tx.abnormalReport.update({
          where: { id: abnormalReportId },
          data: {
            status: AbnormalStatus.IN_PROGRESS,
          },
        });

        await tx.operationLog.create({
          data: {
            userId: processorId,
            userName: processor?.name,
            userRole: processor?.role,
            operationType: OperationType.STATUS_CHANGE,
            action: '开始处理异常',
            details: JSON.stringify({ status: AbnormalStatus.IN_PROGRESS }),
          },
        });

        return updated;
      });

      return { success: true, abnormal: updatedAbnormal };
    } catch (error) {
      console.error('开始处理异常失败:', error);
      return { success: false, error: '开始处理异常失败' };
    }
  }

  async resolveAbnormal(processorId: string, data: AbnormalResolution) {
    try {
      const { abnormalReportId, resolution } = data;

      const abnormal = await prisma.abnormalReport.findUnique({
        where: { id: abnormalReportId },
      });

      if (!abnormal) {
        return { success: false, error: '异常报告不存在' };
      }

      if (abnormal.assignedToId !== processorId) {
        return { success: false, error: '您不是该异常报告的处理人' };
      }

      if (abnormal.status !== AbnormalStatus.IN_PROGRESS) {
        return { success: false, error: '异常报告未在处理中' };
      }

      const resolvedAt = new Date();
      let handleDuration: number | null = null;

      if (abnormal.reportedAt) {
        handleDuration = Math.floor((resolvedAt.getTime() - abnormal.reportedAt.getTime()) / 60000);
      }

      const processor = await prisma.user.findUnique({ where: { id: processorId } });

      const updatedAbnormal = await prisma.$transaction(async (tx) => {
        const updated = await tx.abnormalReport.update({
          where: { id: abnormalReportId },
          data: {
            status: AbnormalStatus.RESOLVED,
            resolvedAt,
            treatment: resolution,
            handleDuration,
          },
        });

        await tx.operationLog.create({
          data: {
            userId: processorId,
            userName: processor?.name,
            userRole: processor?.role,
            operationType: OperationType.RESOLVED,
            action: '完成异常处理',
            details: JSON.stringify({ resolution }),
          },
        });

        return updated;
      });

      return { success: true, abnormal: updatedAbnormal };
    } catch (error) {
      console.error('解决异常失败:', error);
      return { success: false, error: '解决异常失败' };
    }
  }

  async closeAbnormal(closerId: string, abnormalReportId: string) {
    try {
      const abnormal = await prisma.abnormalReport.findUnique({
        where: { id: abnormalReportId },
      });

      if (!abnormal) {
        return { success: false, error: '异常报告不存在' };
      }

      if (abnormal.status !== AbnormalStatus.RESOLVED) {
        return { success: false, error: '异常报告尚未解决' };
      }

      const closer = await prisma.user.findUnique({ where: { id: closerId } });

      const updatedAbnormal = await prisma.$transaction(async (tx) => {
        const updated = await tx.abnormalReport.update({
          where: { id: abnormalReportId },
          data: {
            status: AbnormalStatus.CLOSED,
            closedAt: new Date(),
          },
        });

        await tx.operationLog.create({
          data: {
            userId: closerId,
            userName: closer?.name,
            userRole: closer?.role,
            operationType: OperationType.CLOSE,
            action: '关闭异常报告',
            details: JSON.stringify({ status: AbnormalStatus.CLOSED }),
          },
        });

        return updated;
      });

      return { success: true, abnormal: updatedAbnormal };
    } catch (error) {
      console.error('关闭异常失败:', error);
      return { success: false, error: '关闭异常失败' };
    }
  }

  async getStatistics(startDate?: Date, endDate?: Date): Promise<AbnormalStatistics> {
    const where: any = {};

    if (startDate || endDate) {
      where.reportedAt = {};
      if (startDate) where.reportedAt.gte = startDate;
      if (endDate) where.reportedAt.lte = endDate;
    }

    const abnormals = await prisma.abnormalReport.findMany({
      where,
    });

    const totalCount = abnormals.length;
    const pendingCount = abnormals.filter((a) => a.status === AbnormalStatus.REPORTED || a.status === AbnormalStatus.PENDING).length;
    const inProgressCount = abnormals.filter(
      (a) => a.status === AbnormalStatus.ASSIGNED || a.status === AbnormalStatus.IN_PROGRESS
    ).length;
    const resolvedCount = abnormals.filter((a) => a.status === AbnormalStatus.RESOLVED).length;
    const closedCount = abnormals.filter((a) => a.status === AbnormalStatus.CLOSED).length;

    const byType: Record<string, number> = {};
    for (const abnormal of abnormals) {
      byType[abnormal.type] = (byType[abnormal.type] || 0) + 1;
    }

    const resolvedAbnormals = abnormals.filter((a) => a.handleDuration !== null);
    const totalHandleTime = resolvedAbnormals.reduce((sum, a) => sum + (a.handleDuration || 0), 0);
    const avgHandleTime = resolvedAbnormals.length > 0 ? totalHandleTime / resolvedAbnormals.length : null;

    return {
      totalCount,
      pendingCount,
      inProgressCount,
      resolvedCount,
      closedCount,
      byType,
      avgHandleTime,
    };
  }

  async getRealtimeDashboard() {
    const activeAbnormals = await prisma.abnormalReport.findMany({
      where: {
        status: { notIn: [AbnormalStatus.CLOSED, AbnormalStatus.RESOLVED] },
      },
      orderBy: { reportedAt: 'desc' },
    });

    const statistics = await this.getStatistics();

    const recentResolved = await prisma.abnormalReport.findMany({
      where: {
        status: AbnormalStatus.RESOLVED,
      },
      orderBy: { resolvedAt: 'desc' },
      take: 10,
    });

    return {
      activeAbnormals: activeAbnormals.map((a) => ({
        id: a.id,
        abnormalNo: a.abnormalNo,
        type: a.type,
        title: a.title,
        description: a.description,
        status: a.status,
        workOrderNo: a.workOrderNo,
        reporterName: a.reporterName,
        assignedToName: a.assignedToName,
        reportedAt: a.reportedAt,
        elapsedMinutes: a.reportedAt
          ? Math.floor((Date.now() - a.reportedAt.getTime()) / 60000)
          : null,
      })),
      statistics,
      recentResolved: recentResolved.map((a) => ({
        id: a.id,
        abnormalNo: a.abnormalNo,
        type: a.type,
        title: a.title,
        status: a.status,
        workOrderNo: a.workOrderNo,
        reporterName: a.reporterName,
        assignedToName: a.assignedToName,
        resolvedAt: a.resolvedAt,
        handleDuration: a.handleDuration,
      })),
    };
  }

  private async generateAbnormalCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const count = await prisma.abnormalReport.count({
      where: {
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });

    const seq = (count + 1).toString().padStart(4, '0');
    return `ABN${dateStr}${seq}`;
  }
}

export const abnormalDashboardEngine = new AbnormalDashboardEngine();
