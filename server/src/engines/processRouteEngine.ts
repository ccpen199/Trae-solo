import { prisma } from '../lib/prisma';
import { WorkOrderStatus, ProcessStatus, QualityResult } from '../config';

export interface ProcessRouteResult {
  success: boolean;
  processes?: any[];
  error?: string;
}

export interface ProcessTransition {
  workOrderProcessId: string;
  fromStatus: string;
  toStatus: string;
}

export class ProcessRouteEngine {
  async createWorkOrderProcesses(workOrderId: string, processRouteId: string): Promise<ProcessRouteResult> {
    try {
      const processRoute = await prisma.processRoute.findUnique({
        where: { id: processRouteId },
        include: { processes: { orderBy: { sequence: 'asc' } } },
      });

      if (!processRoute) {
        return { success: false, error: '工艺路线不存在' };
      }

      if (processRoute.processes.length === 0) {
        return { success: false, error: '工艺路线未定义工序' };
      }

      const workOrderProcesses = await prisma.$transaction(
        processRoute.processes.map((proc) =>
          prisma.workOrderProcess.create({
            data: {
              workOrderId,
              sequence: proc.sequence,
              processName: proc.name,
              processDesc: proc.description,
              plannedQty: 0,
              status: ProcessStatus.PENDING,
            },
          })
        )
      );

      return { success: true, processes: workOrderProcesses };
    } catch (error) {
      console.error('创建工单工序失败:', error);
      return { success: false, error: '创建工序失败' };
    }
  }

  async getNextProcess(workOrderId: string, currentSequence?: number): Promise<any | null> {
    const processes = await prisma.workOrderProcess.findMany({
      where: { workOrderId },
      orderBy: { sequence: 'asc' },
    });

    if (processes.length === 0) return null;

    if (currentSequence === undefined) {
      return processes[0];
    }

    const nextProcess = processes.find((p) => p.sequence > currentSequence);
    return nextProcess || null;
  }

  async canTransitionToNext(workOrderProcessId: string): Promise<boolean> {
    const process = await prisma.workOrderProcess.findUnique({
      where: { id: workOrderProcessId },
      include: { workOrder: true },
    });

    if (!process) return false;

    if (process.sequence !== undefined) {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: process.workOrderId },
        include: { processes: true },
      });

      if (workOrder) {
        const nextProcess = workOrder.processes.find((p) => p.sequence === process.sequence + 1);
        if (nextProcess && nextProcess.isQualityCheck !== undefined && nextProcess.isQualityCheck) {
          const hasPendingInspection = await prisma.qualityInspection.findFirst({
            where: {
              workOrderProcessId,
              result: { not: QualityResult.PASS },
            },
          });
          if (hasPendingInspection) return false;
        }
      }
    }

    const allAssignments = await prisma.processAssignment.findMany({
      where: { workOrderProcessId },
    });

    const totalAssigned = allAssignments.reduce((sum, a) => sum + a.plannedQty, 0);
    const totalCompleted = allAssignments.reduce((sum, a) => sum + a.completedQty, 0);

    return totalCompleted >= totalAssigned;
  }

  async startProcess(workOrderProcessId: string, userId: string): Promise<ProcessRouteResult> {
    try {
      const process = await prisma.workOrderProcess.findUnique({
        where: { id: workOrderProcessId },
        include: { workOrder: true },
      });

      if (!process) {
        return { success: false, error: '工序不存在' };
      }

      if (process.status !== ProcessStatus.ASSIGNED) {
        return { success: false, error: '工序未分配，无法开始' };
      }

      const updatedProcess = await prisma.workOrderProcess.update({
        where: { id: workOrderProcessId },
        data: {
          status: ProcessStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });

      if (process.workOrder.status === WorkOrderStatus.PENDING_PRODUCTION) {
        await prisma.workOrder.update({
          where: { id: process.workOrderId },
          data: {
            status: WorkOrderStatus.IN_PRODUCTION,
            actualStartDate: new Date().toISOString(),
          },
        });
      }

      return { success: true, processes: [updatedProcess] };
    } catch (error) {
      console.error('开始工序失败:', error);
      return { success: false, error: '开始工序失败' };
    }
  }

  async completeProcess(workOrderProcessId: string): Promise<ProcessRouteResult> {
    try {
      const process = await prisma.workOrderProcess.findUnique({
        where: { id: workOrderProcessId },
        include: { workOrder: { include: { processes: { orderBy: { sequence: 'asc' } } } } },
      });

      if (!process) {
        return { success: false, error: '工序不存在' };
      }

      if (process.status !== ProcessStatus.IN_PROGRESS) {
        return { success: false, error: '工序未在进行中' };
      }

      const canTransition = await this.canTransitionToNext(workOrderProcessId);
      if (!canTransition) {
        return { success: false, error: '工序未完成所有任务' };
      }

      const updatedProcess = await prisma.workOrderProcess.update({
        where: { id: workOrderProcessId },
        data: {
          status: ProcessStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      const nextProcess = await this.getNextProcess(process.workOrderId, process.sequence);
      
      if (nextProcess) {
        await prisma.workOrderProcess.update({
          where: { id: nextProcess.id },
          data: { status: ProcessStatus.PENDING },
        });
      } else {
        await prisma.workOrder.update({
          where: { id: process.workOrderId },
          data: {
            status: WorkOrderStatus.COMPLETED,
            actualEndDate: new Date().toISOString(),
          },
        });
      }

      return { success: true, processes: [updatedProcess] };
    } catch (error) {
      console.error('完成工序失败:', error);
      return { success: false, error: '完成工序失败' };
    }
  }

  async getProcessRouteStatus(workOrderId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        processes: {
          orderBy: { sequence: 'asc' },
          include: { assignments: true },
        },
      },
    });

    if (!workOrder) {
      return null;
    }

    const totalProcesses = workOrder.processes.length;
    const completedProcesses = workOrder.processes.filter(
      (p) => p.status === ProcessStatus.COMPLETED
    ).length;

    const processStatuses = workOrder.processes.map((p) => ({
      id: p.id,
      sequence: p.sequence,
      name: p.processName,
      status: p.status,
      completedQty: p.actualQty,
      failedQty: p.failQty,
      isQualityCheck: p.isQualityCheck,
      assignmentCount: p.assignments.length,
      startTime: p.startedAt,
      endTime: p.completedAt,
    }));

    return {
      workOrderId,
      workOrderCode: workOrder.workOrderNo,
      workOrderStatus: workOrder.status,
      totalProcesses,
      completedProcesses,
      progress: totalProcesses > 0 ? completedProcesses / totalProcesses : 0,
      processes: processStatuses,
    };
  }
}

export const processRouteEngine = new ProcessRouteEngine();
