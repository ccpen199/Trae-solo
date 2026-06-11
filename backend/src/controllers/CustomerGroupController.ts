import { Request, Response } from 'express';
import { CustomerGroupService } from '../services/CustomerGroupService';
import { success, error } from '../utils/response';

const customerGroupService = new CustomerGroupService();

export class CustomerGroupController {
  list(req: Request, res: Response) {
    const branchId = req.query.branch_id ? Number(req.query.branch_id) : undefined;
    const result = customerGroupService.list(branchId);
    return success(res, result.data);
  }

  getById(req: Request, res: Response) {
    const result = customerGroupService.getById(Number(req.params.id));
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data);
  }

  create(req: Request, res: Response) {
    const { name, type, customer_count, total_orders, avg_fee, branch_id, tags } = req.body;
    if (!name || !type || !branch_id) {
      return error(res, '缺少必要参数', 1000);
    }
    const result = customerGroupService.create({ name, type, customer_count: customer_count || 0, total_orders: total_orders || 0, avg_fee: avg_fee || 0, branch_id, tags });
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }
}
