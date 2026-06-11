import { ShopOrderRepository } from '../repositories/ShopOrderRepository';

const shopOrderRepo = new ShopOrderRepository();

export class ShopOrderService {
  list(filters: { status?: string; branch_id?: number; source?: string }, page: number = 1, pageSize: number = 20) {
    const result = shopOrderRepo.findAll(filters, page, pageSize);
    const statusStats = shopOrderRepo.countByStatus();
    const amountTotal = shopOrderRepo.sumAmount();
    return { code: 0, message: 'ok', data: { list: result.list, total: result.total, page, pageSize, statusStats, amountTotal: amountTotal.total } };
  }

  create(data: { order_no: string; customer_name: string; customer_phone: string; product_name: string; quantity: number; amount: number; branch_id: number; courier_id?: number; source: string }) {
    const id = shopOrderRepo.create(data);
    return { code: 0, message: '微店订单创建成功', data: { id } };
  }

  updateStatus(id: number, status: string, trackingNo?: string) {
    const order = shopOrderRepo.findById(id);
    if (!order) {
      return { code: 1300, message: '微店订单不存在', data: null };
    }
    shopOrderRepo.updateStatus(id, status, trackingNo);
    return { code: 0, message: '订单状态已更新', data: null };
  }

  syncFromSource(source: string) {
    return { code: 0, message: `从${source}同步订单成功`, data: { synced: 0 } };
  }
}
