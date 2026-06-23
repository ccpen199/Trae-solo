import { taskRepository } from '../repositories/task.repository';
import { orderRepository } from '../repositories/order.repository';
import { userRepository } from '../repositories/user.repository';
import { waybillRepository } from '../repositories/waybill.repository';
import { freightCalculator } from './freight-calculator';
import { AppError } from '../middleware/error';
import { db } from '../database/connection';
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

  scanPickupCode(pickupCode: string, courierId: string, courierName: string): PickupTask | null {
    const task = db.prepare(`
      SELECT * FROM pickup_tasks WHERE pickup_code = ?
    `).get(pickupCode) as any;

    if (!task) {
      throw new AppError('任务不存在', 404);
    }

    if (task.status !== 'pending' && task.status !== 'assigned') {
      throw new AppError('任务状态不正确，无法扫码', 400);
    }

    if (task.courier_id && task.courier_id !== courierId) {
      const user = userRepository.findById(courierId);
      if (!user || (user.role !== 'admin' && user.role !== 'operator')) {
        throw new AppError('该任务已分配给其他快递员', 403);
      }
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return taskRepository.update(task.id, {
      status: 'picked',
      pickedAt: now,
      courierId,
      courierName,
    });
  },

  weigh(taskId: string, actualWeight: number, photos?: string[]): PickupTask | null {
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
      photos,
      freight,
      status: 'weighed',
    });
  },

  pay(taskId: string, method: PaymentMethod, amount: number): PickupTask | null {
    const task = taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('任务不存在', 404);
    }

    if (amount <= 0) {
      throw new AppError('金额必须大于0', 400);
    }

    return taskRepository.update(taskId, {
      paymentMethod: method,
      freight: amount,
      status: 'paid',
    });
  },

  calculateFreight(weight: number, itemType?: string, hasInsurance?: boolean, declaredValue?: number) {
    return freightCalculator.calculate({ weight, itemType, hasInsurance, declaredValue });
  },

  getOperationLogs(taskId: string): any[] {
    const logs = db.prepare(`
      SELECT * FROM operation_logs WHERE task_id = ? ORDER BY created_at DESC
    `).all(taskId) as any[];

    return logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      operator: log.operator,
      time: log.created_at,
      remark: log.remark,
    }));
  },

  recordPrint(taskId: string, waybillNo: string, printerName: string, paperSize: string, printedBy: string): { waybillNo: string; printedAt: string; balance: number } {
    const task = taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('任务不存在', 404);
    }
    if (task.status === 'printed' || task.status === 'in_transit' || task.status === 'completed') {
      throw new AppError('该任务面单已打印，请勿重复操作', 400);
    }

    const waybillFee = 2;
    const waybillAccount = waybillRepository.findByOutletId(task.outletId);
    if (!waybillAccount) {
      throw new AppError('网点面单账户不存在，请先开通', 400);
    }
    if (waybillAccount.balance < waybillFee) {
      throw new AppError(`面单余额不足（当前余额 ¥${waybillAccount.balance.toFixed(2)}），请先充值后再打印`, 402);
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const transaction = db.transaction(() => {
      taskRepository.recordPrint(taskId, waybillNo, printerName, paperSize, printedBy);
      taskRepository.update(taskId, { waybillNo, printedAt: now, status: 'printed' });

      db.prepare(`
        UPDATE waybill_accounts
        SET balance = balance - ?, total_used = total_used + ?, updated_at = ?
        WHERE outlet_id = ?
      `).run(waybillFee, waybillFee, now, task.outletId);

      orderRepository.updateStatus(task.orderId, 'printed');
    });
    transaction();

    const updated = waybillRepository.findByOutletId(task.outletId);
    return {
      waybillNo,
      printedAt: now,
      balance: updated?.balance ?? waybillAccount.balance - waybillFee,
    };
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

  batchAssign(taskIds: string[], courierId: string, operatorRole?: string, operatorOutletId?: string): number {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      throw new AppError('请选择要分配的任务', 400);
    }
    if (!courierId) {
      throw new AppError('请选择快递员', 400);
    }

    const courier = userRepository.findById(courierId);
    if (!courier) {
      throw new AppError('快递员不存在', 404);
    }

    let count = 0;
    for (const id of taskIds) {
      const task = taskRepository.findById(id);
      if (!task) continue;

      if (operatorRole === 'admin' && operatorOutletId && task.outletId !== operatorOutletId) {
        continue;
      }

      taskRepository.update(id, {
        courierId,
        courierName: courier.name,
        status: 'assigned',
      });
      count++;
    }
    return count;
  },

  intervene(taskId: string, action: 'mark_completed' | 'mark_exception' | 'cancel' | 'reassign', operatorId: string, operatorName: string, payload?: { reason?: string; courierId?: string }): PickupTask | null {
    const task = taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('任务不存在', 404);
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    switch (action) {
      case 'mark_completed':
        return taskRepository.update(taskId, {
          status: 'completed',
          completedAt: now,
          exceptionReason: payload?.reason || task.exceptionReason,
        });
      case 'mark_exception':
        return taskRepository.update(taskId, {
          status: 'exception',
          exceptionReason: payload?.reason || '平台运营标记异常',
        });
      case 'cancel':
        return taskRepository.update(taskId, {
          status: 'cancelled',
          exceptionReason: payload?.reason || '平台运营取消任务',
        });
      case 'reassign': {
        if (!payload?.courierId) {
          throw new AppError('请选择新的快递员', 400);
        }
        const courier = userRepository.findById(payload.courierId);
        if (!courier) {
          throw new AppError('快递员不存在', 404);
        }
        return taskRepository.update(taskId, {
          courierId: courier.id,
          courierName: courier.name,
          status: 'assigned',
          exceptionReason: undefined,
        });
      }
      default:
        throw new AppError('无效的干预操作', 400);
    }
  },
};
