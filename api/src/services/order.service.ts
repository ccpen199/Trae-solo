import { orderRepository } from '../repositories/order.repository';
import { taskRepository } from '../repositories/task.repository';
import { AppError } from '../middleware/error';
import type { Order, OrderStatus } from '../../../shared/types';

export const orderService = {
  list(
    role?: string,
    outletId?: string,
    status?: OrderStatus,
    page: number = 1,
    pageSize: number = 10
  ): { list: Order[]; total: number } {
    let filters: Parameters<typeof orderRepository.findAll>[0] = {};

    if (role === 'admin' && outletId) {
      filters.outletId = outletId;
    }
    if (status) filters.status = status;
    if (page) filters.page = page;
    if (pageSize) filters.pageSize = pageSize;

    return orderRepository.findAll(filters);
  },

  get(id: string): Order | null {
    const order = orderRepository.findById(id);
    if (!order) {
      throw new AppError('订单不存在', 404);
    }
    return order;
  },

  getWithTask(id: string): { order: Order; task?: any } | null {
    const order = orderRepository.findById(id);
    if (!order) {
      throw new AppError('订单不存在', 404);
    }

    const task = taskRepository.findAll({
      pageSize: 1,
    }).list.find(t => t.orderId === id);

    return { order, task };
  },
};
