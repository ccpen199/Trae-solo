import { Router, type Request, type Response } from 'express';
import {
  MOCK_CHANNEL_ROI,
  generateFunnelMetrics,
  generateRetentionAnalysis,
  TOWNSHIP_DATA,
  getJobsByTownship,
  getEnterprisesByTownship,
  MOCK_JOBS,
} from '../mock/mockData.js';
import {
  calculateChannelROIData,
  aggregateChannelROI,
  calculateFunnelMetrics,
  calculateRetentionCohorts,
  calculateAttritionReasons,
  calculateCostPerHireTrend,
  calculateTownshipRecruitmentHeatmap,
  calculateInterviewConversionRates,
} from '../services/analyticsService.js';
import { ApiResponse, ChannelROI, FunnelMetrics, RetentionAnalysis } from '../../shared/types/index.js';

const router = Router();

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

router.get('/channel-roi', async (req: Request, res: Response): Promise<void> => {
  const channels = (req.query.channels as string)?.split(',').filter(Boolean);
  const startMonth = req.query.startMonth as string;
  const endMonth = req.query.endMonth as string;
  const aggregate = req.query.aggregate === 'true';

  const rawData = calculateChannelROIData(MOCK_CHANNEL_ROI, { channels, startMonth, endMonth });

  if (aggregate) {
    const agg = aggregateChannelROI(rawData);
    res.json(ok({ channels: agg, monthlyTrend: rawData }));
  } else {
    res.json(ok<ChannelROI[]>(rawData));
  }
});

router.get('/funnel', async (req: Request, res: Response): Promise<void> => {
  const periods = parseInt(req.query.periods as string) || 6;
  const funnelData: FunnelMetrics[] = generateFunnelMetrics(periods);
  const analysis = calculateFunnelMetrics(funnelData);
  const conversionRates = calculateInterviewConversionRates(funnelData);
  const costTrend = calculateCostPerHireTrend(MOCK_CHANNEL_ROI).slice(0, periods);

  res.json(ok({
    metrics: funnelData,
    summary: analysis,
    conversionRates,
    costTrend,
  }));
});

router.get('/retention', async (req: Request, res: Response): Promise<void> => {
  const count = parseInt(req.query.count as string) || 8;
  const channels = (req.query.channels as string)?.split(',').filter(Boolean);
  const townships = (req.query.townships as string)?.split(',').filter(Boolean);
  const positionTypes = (req.query.positionTypes as string)?.split(',').filter(Boolean);

  const rawData: RetentionAnalysis[] = generateRetentionAnalysis(count);
  const cohorts = calculateRetentionCohorts(rawData, { channels, townships, positionTypes });
  const attritionReasons = calculateAttritionReasons(rawData);

  res.json(ok({
    cohorts: rawData,
    analysis: cohorts,
    attritionReasons,
  }));
});

router.get('/township-heatmap', async (req: Request, res: Response): Promise<void> => {
  const townshipData = TOWNSHIP_DATA.map(t => {
    const jobs = getJobsByTownship(t.code);
    const enterprises = getEnterprisesByTownship(t.code);
    return {
      code: t.code,
      name: t.name,
      jobs: jobs.length,
      enterprises: enterprises.length,
      applications: jobs.reduce((s, j) => s + j.applicationsCount, 0),
      hires: Math.round(jobs.length * (0.08 + Math.random() * 0.15)),
    };
  });

  const heatmap = calculateTownshipRecruitmentHeatmap(townshipData);
  res.json(ok(heatmap));
});

router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  const channelAgg = aggregateChannelROI(MOCK_CHANNEL_ROI);
  const funnelData = generateFunnelMetrics(6);
  const funnelSummary = calculateFunnelMetrics(funnelData);
  const retentionData = generateRetentionAnalysis(5);
  const retentionSummary = calculateRetentionCohorts(retentionData);

  const totalHires = channelAgg.reduce((s, c) => s + c.totalHires, 0);
  const totalCost = channelAgg.reduce((s, c) => s + c.totalCost, 0);
  const totalApplications = channelAgg.reduce((s, c) => s + c.totalApplications, 0);

  const topChannel = channelAgg[0];
  const bestTownship = TOWNSHIP_DATA
    .map(t => ({ code: t.code, name: t.name, jobs: getJobsByTownship(t.code).length }))
    .sort((a, b) => b.jobs - a.jobs)[0];

  const kpis = [
    { name: '总招聘费用', value: totalCost, unit: '元', change: 8.5, trend: 'down' },
    { name: '总入职人数', value: totalHires, unit: '人', change: 12.3, trend: 'up' },
    { name: '平均入职成本', value: totalHires > 0 ? Math.round(totalCost / totalHires) : 0, unit: '元/人', change: -15.2, trend: 'up' },
    { name: '投递总数', value: totalApplications, unit: '份', change: 22.8, trend: 'up' },
    { name: '平均到面率', value: funnelSummary.stageRates[4], unit: '%', change: 3.2, trend: 'up' },
    { name: '90天留存率', value: retentionSummary.avgRetention90d, unit: '%', change: -2.1, trend: 'down' },
  ];

  res.json(ok({
    kpis,
    topChannel: topChannel?.channel || '镇街',
    bestTownship: bestTownship?.name || '小榄镇',
    channelROI: channelAgg.slice(0, 6),
    funnelSummary,
    retentionSummary: {
      avg30d: retentionSummary.avgRetention30d,
      avg90d: retentionSummary.avgRetention90d,
      avg180d: retentionSummary.avgRetention180d,
    },
  }));
});

router.get('/position-analysis', async (req: Request, res: Response): Promise<void> => {
  const positionGroups = new Map<string, { count: number; avgSalary: number; totalApplications: number }>();

  MOCK_JOBS.forEach(job => {
    const key = job.township;
    const existing = positionGroups.get(key) || { count: 0, avgSalary: 0, totalApplications: 0 };
    existing.count++;
    existing.avgSalary += (job.salaryRange[0] + job.salaryRange[1]) / 2;
    existing.totalApplications += job.applicationsCount;
    positionGroups.set(key, existing);
  });

  const data = TOWNSHIP_DATA.map(t => {
    const stat = positionGroups.get(t.code) || { count: 0, avgSalary: 0, totalApplications: 0 };
    return {
      code: t.code,
      name: t.name,
      positionCount: stat.count,
      avgSalary: stat.count > 0 ? Math.round(stat.avgSalary / stat.count) : 0,
      applicationsPerJob: stat.count > 0 ? Math.round(stat.totalApplications / stat.count) : 0,
      industries: t.industries,
    };
  });

  const salaryRanges = [
    { label: '4K以下', count: MOCK_JOBS.filter(j => j.salaryRange[1] < 4000).length },
    { label: '4K-6K', count: MOCK_JOBS.filter(j => j.salaryRange[0] >= 4000 && j.salaryRange[1] < 6000).length },
    { label: '6K-8K', count: MOCK_JOBS.filter(j => j.salaryRange[0] >= 6000 && j.salaryRange[1] < 8000).length },
    { label: '8K-12K', count: MOCK_JOBS.filter(j => j.salaryRange[0] >= 8000 && j.salaryRange[1] < 12000).length },
    { label: '12K以上', count: MOCK_JOBS.filter(j => j.salaryRange[0] >= 12000).length },
  ];

  res.json(ok({ byTownship: data, salaryDistribution: salaryRanges }));
});

router.get('/export', async (req: Request, res: Response): Promise<void> => {
  const type = req.query.type as string;
  res.json(ok({
    exportId: `EXP_${Date.now()}`,
    type: type || 'full',
    status: 'processing',
    downloadUrl: `https://api.example.com/exports/${Date.now()}.xlsx`,
    estimatedTime: 15,
  }, '导出任务已创建'));
});

export default router;
