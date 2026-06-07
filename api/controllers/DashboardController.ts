import type { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService.js';
import { getLogs, getLogStats } from '../middleware/logger.js';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  public async stats(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.dashboardService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取统计数据失败',
      });
    }
  }

  public async quickStats(req: Request, res: Response): Promise<void> {
    try {
      const quickStats = this.dashboardService.getQuickStats();

      res.json({
        success: true,
        data: quickStats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取快速统计失败',
      });
    }
  }

  public async ticketTrend(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const trend = this.dashboardService.getTicketTrend(days);

      res.json({
        success: true,
        data: trend,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取工单趋势失败',
      });
    }
  }

  public async staffPerformance(req: Request, res: Response): Promise<void> {
    try {
      const performance = this.dashboardService.getStaffPerformance();

      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取人员绩效失败',
      });
    }
  }

  public async buildingStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.dashboardService.getBuildingStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取楼栋统计失败',
      });
    }
  }

  public async feeStats(req: Request, res: Response): Promise<void> {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const stats = this.dashboardService.getFeeStatsByMonth(months);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取费用统计失败',
      });
    }
  }

  public async accessLogs(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const logs = this.dashboardService.getAccessLogs(days);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取门禁日志失败',
      });
    }
  }

  public async systemHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = this.dashboardService.getSystemHealth();

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取系统健康状态失败',
      });
    }
  }

  public async requestLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = getLogs(limit);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取请求日志失败',
      });
    }
  }

  public async requestStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = getLogStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取请求统计失败',
      });
    }
  }
}

export default DashboardController;
