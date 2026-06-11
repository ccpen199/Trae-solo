import { Request, Response } from 'express';
import { SettlementService } from '../services/SettlementService';
import { success, error } from '../utils/response';

const settlementService = new SettlementService();

export class SettlementController {
  list(req: Request, res: Response) {
    const { page, pageSize } = req.query;
    const result = settlementService.list(Number(page) || 1, Number(pageSize) || 20);
    return success(res, result.data);
  }

  generate(req: Request, res: Response) {
    const { period, branch_id, courier_id, total_tasks, total_fee, bonus, deduction } = req.body;
    if (!period || !branch_id || !courier_id || total_tasks === undefined || total_fee === undefined) {
      return error(res, '缺少必要参数', 1000);
    }
    const result = settlementService.generate({ period, branch_id, courier_id, total_tasks, total_fee, bonus, deduction });
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  confirm(req: Request, res: Response) {
    const result = settlementService.confirm(Number(req.params.id));
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  pay(req: Request, res: Response) {
    const result = settlementService.pay(Number(req.params.id));
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }
}
