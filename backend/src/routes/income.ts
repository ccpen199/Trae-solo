import { Router } from 'express';
import {
  getRiderIncomeList,
  getRiderBalance,
  getRiderIncomeSummary,
} from '../services/incomeService';

const router = Router();

router.get('/rider/:riderId', (req, res) => {
  const riderId = parseInt(req.params.riderId);
  const { type, startDate, endDate, page, pageSize } = req.query;

  const result = getRiderIncomeList({
    rider_id: riderId,
    type: type as any,
    startDate: startDate as string,
    endDate: endDate as string,
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
  });

  res.json({ code: 0, data: result });
});

router.get('/rider/:riderId/balance', (req, res) => {
  const riderId = parseInt(req.params.riderId);
  const balance = getRiderBalance(riderId);
  res.json({ code: 0, data: { balance } });
});

router.get('/rider/:riderId/summary', (req, res) => {
  const riderId = parseInt(req.params.riderId);
  const days = req.query.days ? parseInt(req.query.days as string) : 7;
  const summary = getRiderIncomeSummary(riderId, days);
  res.json({ code: 0, data: summary });
});

export default router;
