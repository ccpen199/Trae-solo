import { Response } from 'express';
import { ReportService } from '../services/ReportService.js';
import type { ApiResponse, AuthRequest } from '../../shared/types.js';

export class ReportController {
  private reportService: ReportService;

  constructor() {
    this.reportService = new ReportService();
  }

  getSummary(req: AuthRequest, res: Response) {
    try {
      const activityId = req.query.activityId ? parseInt(req.query.activityId as string) : undefined;
      
      let data;
      if (activityId) {
        data = this.reportService.getActivityReport(activityId);
        if (!data) {
          return res.status(404).json({
            code: 404,
            message: '活动不存在',
            data: null,
            timestamp: Date.now()
          } as ApiResponse<null>);
        }
      } else {
        data = this.reportService.getAllReports();
      }

      res.json({
        code: 200,
        message: 'success',
        data,
        timestamp: Date.now()
      } as ApiResponse<typeof data>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取报表数据失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getDashboard(req: AuthRequest, res: Response) {
    try {
      const data = this.reportService.getDashboardSummary();
      
      res.json({
        code: 200,
        message: 'success',
        data,
        timestamp: Date.now()
      } as ApiResponse<typeof data>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取仪表盘数据失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getTrendData(req: AuthRequest, res: Response) {
    try {
      const activityId = req.query.activityId ? parseInt(req.query.activityId as string) : undefined;
      const days = parseInt(req.query.days as string) || 7;

      const data = this.reportService.getTrendData(activityId, days);
      
      res.json({
        code: 200,
        message: 'success',
        data,
        timestamp: Date.now()
      } as ApiResponse<typeof data>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取趋势数据失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getPrizeDistribution(req: AuthRequest, res: Response) {
    try {
      const activityId = req.query.activityId ? parseInt(req.query.activityId as string) : undefined;

      const data = this.reportService.getPrizeDistribution(activityId);
      
      res.json({
        code: 200,
        message: 'success',
        data,
        timestamp: Date.now()
      } as ApiResponse<typeof data>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取奖品分布失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getChannelDistribution(req: AuthRequest, res: Response) {
    try {
      const activityId = req.query.activityId ? parseInt(req.query.activityId as string) : undefined;

      const data = this.reportService.getChannelDistribution(activityId);
      
      res.json({
        code: 200,
        message: 'success',
        data,
        timestamp: Date.now()
      } as ApiResponse<typeof data>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取渠道分布失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  exportReport(req: AuthRequest, res: Response) {
    try {
      const activityId = req.query.activityId ? parseInt(req.query.activityId as string) : undefined;

      const csv = this.reportService.exportReport(activityId);
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
      
      res.send('\uFEFF' + csv);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '导出报表失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }
}
