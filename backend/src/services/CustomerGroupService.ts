import { CustomerGroupRepository } from '../repositories/CustomerGroupRepository';

const customerGroupRepo = new CustomerGroupRepository();

export class CustomerGroupService {
  list(branchId?: number) {
    const list = customerGroupRepo.findAll(branchId);
    const typeStats = customerGroupRepo.countByType();
    return { code: 0, message: 'ok', data: { list, typeStats } };
  }

  getById(id: number) {
    const group = customerGroupRepo.findById(id);
    if (!group) {
      return { code: 1200, message: '客户分群不存在', data: null };
    }
    return { code: 0, message: 'ok', data: group };
  }

  create(data: { name: string; type: string; customer_count: number; total_orders: number; avg_fee: number; branch_id: number; tags?: string }) {
    const id = customerGroupRepo.create(data);
    return { code: 0, message: '客户分群创建成功', data: { id } };
  }
}
