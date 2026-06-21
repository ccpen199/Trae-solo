import express from 'express';
import { generateDashboardMetrics, generateSupplyDemandData, generateFunnelData } from '../mock/data';
import type { ApiResponse, DashboardMetrics, DataPoint, FunnelStep } from '../../shared/types';

const router = express.Router();

router.get('/metrics', (_req, res) => {
  const metrics = generateDashboardMetrics();
  const response: ApiResponse<DashboardMetrics> = {
    success: true,
    data: metrics,
  };
  res.json(response);
});

router.get('/supply-demand', (req, res) => {
  const { period = 'month' } = req.query;
  const data = generateSupplyDemandData(period as string);
  
  const response: ApiResponse<{ supplyData: DataPoint[]; demandData: DataPoint[] }> = {
    success: true,
    data,
  };
  res.json(response);
});

router.get('/funnel', (req, res) => {
  const { period = 'month' } = req.query;
  const funnel = generateFunnelData();
  
  const response: ApiResponse<{ funnel: FunnelStep[]; period: string }> = {
    success: true,
    data: { funnel, period: period as string },
  };
  res.json(response);
});

router.get('/regional-stats', (_req, res) => {
  const regions = [
    { region: '华东', supply: 1850, demand: 2100, transaction: 3.2 },
    { region: '华南', supply: 1620, demand: 1780, transaction: 2.8 },
    { region: '华北', supply: 1380, demand: 1450, transaction: 2.3 },
    { region: '华中', supply: 980, demand: 1020, transaction: 1.6 },
    { region: '西南', supply: 760, demand: 820, transaction: 1.2 },
    { region: '西北', supply: 520, demand: 480, transaction: 0.8 },
    { region: '东北', supply: 680, demand: 720, transaction: 1.1 },
  ];
  
  const response: ApiResponse<typeof regions> = {
    success: true,
    data: regions,
  };
  res.json(response);
});

router.get('/category-stats', (_req, res) => {
  const categories = [
    { name: '废铜', volume: 35000, value: 20.3, growth: 12.5 },
    { name: '废铝', volume: 42000, value: 6.1, growth: 8.3 },
    { name: '不锈钢', volume: 28000, value: 3.6, growth: 5.2 },
    { name: '废钢铁', volume: 65000, value: 1.8, growth: -2.1 },
    { name: '电子废料', volume: 12000, value: 1.0, growth: 15.6 },
    { name: '废塑料', volume: 18000, value: 0.76, growth: 3.8 },
    { name: '废纸', volume: 25000, value: 0.41, growth: -1.5 },
    { name: '其他', volume: 8500, value: 0.53, growth: 4.2 },
  ];
  
  const response: ApiResponse<typeof categories> = {
    success: true,
    data: categories,
  };
  res.json(response);
});

export default router;
