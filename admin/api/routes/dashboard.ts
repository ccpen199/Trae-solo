/**
 * 仪表板API路由
 */
import { Router, type Request, type Response } from 'express';
import { getData } from '../data/mockData.js';

const router = Router();

/**
 * 获取仪表板数据
 * GET /api/dashboard
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const data = getData();
  
  res.json({
    success: true,
    data: data.mockDashboardData,
  });
});

/**
 * 获取区县统计
 * GET /api/dashboard/district-stats
 */
router.get('/district-stats', async (req: Request, res: Response): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const data = getData();
  
  res.json({
    success: true,
    data: data.mockDashboardData.districtStats,
  });
});

/**
 * 获取景区热力图数据
 * GET /api/dashboard/scenic-heatmap
 */
router.get('/scenic-heatmap', async (req: Request, res: Response): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const data = getData();
  
  res.json({
    success: true,
    data: data.mockDashboardData.scenicHeatmap,
  });
});

/**
 * 获取交通卡异地使用排行
 * GET /api/dashboard/transport-top-cities
 */
router.get('/transport-top-cities', async (req: Request, res: Response): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const data = getData();
  
  res.json({
    success: true,
    data: data.mockDashboardData.transportTopCities,
  });
});

/**
 * 获取周趋势数据
 * GET /api/dashboard/weekly-trend
 */
router.get('/weekly-trend', async (req: Request, res: Response): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const data = getData();
  
  res.json({
    success: true,
    data: data.mockDashboardData.weeklyTrend,
  });
});

export default router;
