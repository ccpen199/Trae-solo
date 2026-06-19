import { Router } from 'express';
import {
  adjustCreditScore,
  getCreditScoreHistory,
  getCreditLevel,
} from '../services/creditService';

const router = Router();

router.get('/rider/:riderId/history', (req, res) => {
  const riderId = parseInt(req.params.riderId);
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;
  const result = getCreditScoreHistory(riderId, page, pageSize);
  res.json({ code: 0, data: result });
});

router.get('/rider/:riderId/level', (req, res) => {
  const riderId = parseInt(req.params.riderId);
  const { getRiderById } = require('../services/riderService');
  const rider = getRiderById(riderId);
  if (!rider) {
    res.status(404).json({ code: 1, message: '骑士不存在' });
    return;
  }
  const level = getCreditLevel(rider.credit_score);
  res.json({ code: 0, data: { score: rider.credit_score, level } });
});

router.post('/rider/:riderId/adjust', (req, res) => {
  const riderId = parseInt(req.params.riderId);
  const { change_amount, change_type, reason } = req.body;
  const result = adjustCreditScore(riderId, change_amount, change_type, { reason });
  res.json({ code: result ? 0 : 1, data: result });
});

export default router;
