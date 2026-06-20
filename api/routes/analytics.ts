import { Router, type Request, type Response } from 'express';
import repo from '../services/repository.js';

const router = Router();

// GET /api/warnings/resign - 获取异常离职预警列表
router.get('/warnings/resign', (_req: Request, res: Response) => {
  const data = repo.getResignWarnings();
  const summary = {
    total: data.length,
    highCount: data.filter(w => w.riskLevel === 'high').length,
    mediumCount: data.filter(w => w.riskLevel === 'medium').length,
    lowCount: data.filter(w => w.riskLevel === 'low').length,
    totalAffected: data.reduce((sum, w) => sum + w.recentResignCount, 0),
  };
  res.json({ success: true, data, summary });
});

// GET /api/heatmap/regions - 获取区域用工饱和度数据
router.get('/heatmap/regions', (_req: Request, res: Response) => {
  const regions = repo.getHeatmapData();
  const summary = {
    totalRegions: regions.length,
    totalVacancy: regions.reduce((s, r) => s + r.vacancyCount, 0),
    totalSeekers: regions.reduce((s, r) => s + r.jobSeekerCount, 0),
    avgSalary: Math.round(regions.reduce((s, r) => s + r.avgSalary, 0) / regions.length),
    avgSaturation: Math.round(regions.reduce((s, r) => s + r.saturation, 0) / regions.length),
  };
  res.json({ success: true, data: regions, summary });
});

// GET /api/dashboard/summary - 管理后台概览数据
router.get('/dashboard/summary', (_req: Request, res: Response) => {
  const factories = repo.getFactories();
  const jobs = repo.getJobs();
  const workers = repo.getWorkers();
  const orders = repo.getInterviewOrders();
  const brokers = repo.getBrokers();
  const heatmap = repo.getHeatmapData();
  const warnings = repo.getResignWarnings();

  res.json({
    success: true,
    data: {
      factories: {
        total: factories.length,
        whitelist: factories.filter(f => f.whitelistStatus === 'whitelist').length,
        graylist: factories.filter(f => f.whitelistStatus === 'graylist').length,
        blacklist: factories.filter(f => f.whitelistStatus === 'blacklist').length,
      },
      jobs: {
        total: jobs.length,
        published: jobs.filter(j => j.status === 'published').length,
        totalVacancy: jobs.reduce((s, j) => s + j.vacancy, 0),
      },
      workers: {
        total: workers.length,
        verified: workers.filter(w => w.idCardVerified).length,
        employed: workers.filter(w => w.status === 'employed').length,
        avgCreditScore: Math.round(workers.reduce((s, w) => s + w.creditScore, 0) / workers.length),
      },
      brokers: {
        total: brokers.length,
        avgRating: (brokers.reduce((s, b) => s + b.serviceRating, 0) / brokers.length).toFixed(1),
        totalOrders: brokers.reduce((s, b) => s + b.totalOrders, 0),
      },
      orders: {
        total: orders.length,
        today: orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length,
        employed: orders.filter(o => o.status === 'employed').length,
        passed: orders.filter(o => ['passed', 'employed'].includes(o.status)).length,
        successRate: Math.round((orders.filter(o => ['passed', 'employed'].includes(o.status)).length / orders.length) * 100),
      },
      market: {
        totalVacancy: heatmap.reduce((s, r) => s + r.vacancyCount, 0),
        totalSeekers: heatmap.reduce((s, r) => s + r.jobSeekerCount, 0),
        avgSaturation: Math.round(heatmap.reduce((s, r) => s + r.saturation, 0) / heatmap.length),
        avgSalary: Math.round(heatmap.reduce((s, r) => s + r.avgSalary, 0) / heatmap.length),
      },
      warnings: {
        total: warnings.length,
        high: warnings.filter(w => w.riskLevel === 'high').length,
        recentResignTotal: warnings.reduce((s, w) => s + w.recentResignCount, 0),
      },
    },
  });
});

export default router;
