import { taskRepository } from '../repositories/task.repository';
import { orderRepository } from '../repositories/order.repository';
import { freightCalculator } from './freight-calculator';
import { AppError } from '../middleware/error';
import type { PickupTask, TaskStatus, PaymentMethod } from '../../../shared/types';

interface ListParams {
  userId?: string;
  role?: string;
  outletId?: string;
  courierId?: string;
  status?: TaskStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export const taskService = {
  list(params: ListParams): { list: PickupTask[]; total: number } {
    const { userId, role, outletId, courierId, status, startDate, endDate, page, pageSize } = params;

    let filters: Parameters<typeof taskRepository.findAll>[0] = {};

    if (role === 'courier') {
      filters.courierId = userId;
    } else if (role === 'admin' && outletId) {
      filters.outletId = outletId;
    }

    if (courierId) filters.courierId = courierId;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (page) filters.page = page;
    if (pageSize) filters.pageSize = pageSize;

    return taskRepository.findAll(filters);
  },

  get(id: string): PickupTask | null {
    return taskRepository.findById(id);
  },

  update(id: string, data: Partial<PickupTask>): PickupTask | null {
    const task = taskRepository.findById(id);
    if (!task) {
      throw new AppError('任务不存在', 404);
    }

    return taskRepository.update(id, data);
  },

  verifyPickupCode(taskId: string, pickupCode: string): boolean {
    const task = taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('任务不存在', 404);
    }

    if (task.status !== 'assigned') {
      throw new AppError('任务状态不正确，无法核验取件码', 400);
    }

    if (task.pickupCode !== pickupCode) {
      throw new AppError('取件码错误', 400);
    }

    return true;
  },

  weigh(taskId: string, actualWeight: number): PickupTask | null {
    const task = taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('任务不存在', 404);
    }

    if (actualWeight <= 0) {
      throw new AppError('重量必须大于0', 400);
    }

    if (task.weightCheckRule !== 'none') {
      const diff = Math.abs(actualWeight - task.estimatedWeight);
      const maxDiff = task.weightCheckRule === 'strict' ? 0.1 : (task.weightTolerance || 0.5);

      if (diff > maxDiff) {
        throw new AppError(`重量差异超过允许范围 (±${maxDiff}kg)，请核实后重新称重`, 400);
      }
    }

    const freight = freightCalculator.calculate({ weight: actualWeight }).total;

    return taskRepository.update(taskId, {
      actualWeight,
      freight,
      status: 'picked',
      pickedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });
  },

  calculateFreight(weight: number, itemType?: string, hasInsurance?: boolean, declaredValue?: number) {
    return freightCalculator.calculate({ weight, itemType, hasInsurance, declaredValue });
  },

  recordPrint(taskId: string, waybillNo: string, printerName: string, paperSize: string, printedBy: string): void {
    const task = taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('任务不存在', 404);
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    taskRepository.recordPrint(taskId, waybillNo, printerName, paperSize, printedBy);
    taskRepository.update(taskId, { waybillNo, printedAt: now, status: 'printed' });

    orderRepository.updateStatus(task.orderId, 'printed');
  },

  getStats(userId: string, role: string, outletId?: string) {
    const today = new Date().toISOString().slice(0, 10);
    let filters: any = { startDate: today, endDate: today };

    if (role === 'courier') {
      filters.courierId = userId;
    } else if (role === 'admin' && outletId) {
      filters.outletId = outletId;
    }

    const { list: todayTasks } = taskRepository.findAll({ ...filters, pageSize: 1000 });

    const { list: allTasks } = taskRepository.findAll({
      ...(role === 'courier' ? { courierId: userId } : {}),
      ...(role === 'admin' && outletId ? { outletId } : {}),
      pageSize: 1000,
    });

    return {
      todayTotal: todayTasks.length,
      todayCompleted: todayTasks.filter(t => t.status === 'completed').length,
      pending: allTasks.filter(t => ['pending', 'assigned'].includes(t.status)).length,
      exception: allTasks.filter(t => t.status === 'exception').length,
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === 'completed').length,
    };
  },

  getUnsynced(courierId?: string): PickupTask[] {
    return taskRepository.findUnsynced(courierId);
  },

  syncOffline(taskIds: string[]): void {
    taskRepository.bulkSync(taskIds);
  },
};
