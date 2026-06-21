import express from 'express';
import { generateMarketPrices, generatePriceHistory, generateRegionalPrices, generatePriceAlerts } from '../mock/data';
import type { ApiResponse, MarketPrice, PricePoint, RegionalPrice, PriceAlert } from '../../shared/types';

const router = express.Router();

router.get('/prices', (_req, res) => {
  const prices = generateMarketPrices();
  const response: ApiResponse<{ categories: MarketPrice[]; updateTime: string }> = {
    success: true,
    data: {
      categories: prices,
      updateTime: new Date().toISOString(),
    },
  };
  res.json(response);
});

router.get('/history', (req, res) => {
  const { category, startDate, endDate, region } = req.query;
  const categoryId = category as string || '1';
  const days = startDate && endDate 
    ? Math.ceil((new Date(endDate as string).getTime() - new Date(startDate as string).getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  const data = generatePriceHistory(categoryId, days);
  const response: ApiResponse<{ data: PricePoint[]; region?: string }> = {
    success: true,
    data: { data, region: region as string },
  };
  res.json(response);
});

router.get('/regional', (req, res) => {
  const { category } = req.query;
  const categoryId = category as string || '1';
  const regions = generateRegionalPrices(categoryId);
  const response: ApiResponse<{ regions: RegionalPrice[] }> = {
    success: true,
    data: { regions },
  };
  res.json(response);
});

router.get('/alerts', (_req, res) => {
  const alerts = generatePriceAlerts();
  const response: ApiResponse<{ alerts: PriceAlert[] }> = {
    success: true,
    data: { alerts },
  };
  res.json(response);
});

router.post('/alerts', (req, res) => {
  const { category, threshold, type, notifyType } = req.body;
  const response: ApiResponse<{ alertId: string }> = {
    success: true,
    data: { alertId: Math.random().toString(36).substring(2, 9) },
    message: `已成功订阅${category}价格预警，阈值${type === 'above' ? '高于' : '低于'}${threshold}元时通知`,
  };
  res.json(response);
});

router.delete('/alerts/:id', (req, res) => {
  const response: ApiResponse<null> = {
    success: true,
    message: '预警已取消',
  };
  res.json(response);
});

export default router;
