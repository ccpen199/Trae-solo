import { Request, Response } from 'express';
import { PerformanceService } from '../services/PerformanceService';
import { success, error } from '../utils/response';

const performanceService = new PerformanceService();

export class PerformanceController {
  list(req: Request, res: Response) {
    const { page, pageSize } = req.query;
    const result = performanceService.list(Number(page) || 1, Number(pageSize) || 20);
    return success(res, result.data);
  }

  getByUser(req: Request, res: Response) {
    const { page, pageSize } = req.query;
    const result = performanceService.getByUser(Number(req.params.userId), Number(page) || 1, Number(pageSize) || 20);
    return success(res, result.data);
  }

  getByPeriod(req: Request, res: Response) {
    const { page, pageSize } = req.query;
    const result = performanceService.getByPeriod(req.params.period, Number(page) || 1, Number(pageSize) || 20);
    return success(res, result.data);
  }

  create(req: Request, res: Response) {
    const { user_id, period, total_tasks, completed_tasks, failed_tasks, on_time_rate, customer_score, total_fee, bonus, deduction, branch_id } = req.body;
    if (!user_id || !period || !branch_id) {
      return error(res, '缺少必要参数', 1000);
    }
    const result = performanceService.create({ user_id, period, total_tasks: total_tasks || 0, completed_tasks: completed_tasks || 0, failed_tasks: failed_tasks || 0, on_time_rate: on_time_rate || 0, customer_score: customer_score || 0, total_fee: total_fee || 0, bonus: bonus || 0, deduction: deduction || 0, branch_id });
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }
}
