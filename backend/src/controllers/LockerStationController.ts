import { Request, Response } from 'express';
import { LockerStationService } from '../services/LockerStationService';
import { success, error } from '../utils/response';

const lockerStationService = new LockerStationService();

export class LockerStationController {
  list(req: Request, res: Response) {
    const branchId = req.query.branch_id ? Number(req.query.branch_id) : undefined;
    const result = lockerStationService.list(branchId);
    return success(res, result.data);
  }

  getById(req: Request, res: Response) {
    const result = lockerStationService.getById(Number(req.params.id));
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data);
  }

  create(req: Request, res: Response) {
    const { name, code, type, address, total_slots, used_slots, branch_id } = req.body;
    if (!name || !code || !type || !branch_id) {
      return error(res, '缺少必要参数', 1000);
    }
    const result = lockerStationService.create({ name, code, type, address, total_slots: total_slots || 0, used_slots: used_slots || 0, branch_id });
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  updateSlots(req: Request, res: Response) {
    const { total_slots, used_slots } = req.body;
    if (total_slots === undefined || used_slots === undefined) {
      return error(res, '缺少必要参数', 1000);
    }
    const result = lockerStationService.updateSlots(Number(req.params.id), total_slots, used_slots);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }
}
