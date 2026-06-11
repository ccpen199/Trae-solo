import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';
import { success } from '../utils/response';

const dashboardService = new DashboardService();

export class DashboardController {
  getStats(req: Request, res: Response) {
    const { branch_id } = req.query;
    const result = dashboardService.getStats(branch_id ? Number(branch_id) : undefined);
    return success(res, result.data);
  }
}
