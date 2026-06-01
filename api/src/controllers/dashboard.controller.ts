import type { Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { success, error, paginated } from '../utils/response';
import type { AuthRequest } from '../middleware/auth';

export class DashboardController {
  private dashboardService = new DashboardService();

  getSummary(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const summary = this.dashboardService.getSummary(userId);
      res.json(success(summary));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取汇总数据失败'));
    }
  }

  getTrend(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const { months = 12 } = req.query;
      const trend = this.dashboardService.getTrend(userId, parseInt(months as string));
      res.json(success(trend));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取趋势数据失败'));
    }
  }

  getStructure(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const structure = this.dashboardService.getStructure(userId);
      res.json(success(structure));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取资产结构失败'));
    }
  }

  getMonthlyReview(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const { year, month } = req.params;
      
      const review = this.dashboardService.getMonthlyReview(
        userId,
        parseInt(year),
        parseInt(month)
      );
      
      res.json(success(review));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取月度复盘失败'));
    }
  }

  getAdminStats(req: AuthRequest, res: Response): void {
    try {
      const stats = this.dashboardService.getAdminStats();
      res.json(success(stats));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取运营统计失败'));
    }
  }

  getOperationLogs(req: AuthRequest, res: Response): void {
    try {
      const { page = 1, pageSize = 50 } = req.query;
      
      const result = this.dashboardService.getOperationLogs(
        parseInt(page as string),
        parseInt(pageSize as string)
      );
      
      res.json(paginated(result.items, result.total, result.page, result.pageSize));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取操作日志失败'));
    }
  }
}
