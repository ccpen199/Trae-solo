import { Response } from 'express';
import { MetricsService } from '../services/MetricsService.js';
import { ApiResourceRepository } from '../repositories/ApiResourceRepository.js';
import { AuthRequest } from '../middleware/auth.js';

const metricsService = new MetricsService();
const apiResourceRepository = new ApiResourceRepository();

export class MonitorController {
  static getOverview(req: AuthRequest, res: Response) {
    const overview = metricsService.getOverview();
    res.json(overview);
  }

  static getBottlenecks(req: AuthRequest, res: Response) {
    const bottlenecks = metricsService.getBottleneckNodes();
    res.json(bottlenecks);
  }

  static getDailyTrend(req: AuthRequest, res: Response) {
    const days = parseInt(req.query.days as string) || 7;
    const trend = metricsService.getDailyTrend(days);
    res.json(trend);
  }

  static getDepartmentStats(req: AuthRequest, res: Response) {
    const stats = metricsService.getDepartmentStats();
    res.json(stats);
  }

  static getApiResources(req: AuthRequest, res: Response) {
    const keyword = (req.query.keyword as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = apiResourceRepository.search(keyword, page, pageSize);
    res.json(result);
  }

  static getApiCallLogs(req: AuthRequest, res: Response) {
    const id = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的ID' });
    }

    const result = apiResourceRepository.getCallLogs(id, page, pageSize);
    res.json(result);
  }
}
