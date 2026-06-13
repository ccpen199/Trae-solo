import { Router } from 'express';
import type { InsuranceType } from '@gx-rs/shared';
import { authMiddleware } from '../middleware/auth.js';
import {
  getAccountBalance,
  getPaymentDetails,
  getBenefitRecords,
  getCompareData,
} from '../mock/socialInsurance.js';

const router = Router();

const validTypes: InsuranceType[] = ['PENSION', 'UNEMPLOYMENT', 'INJURY', 'MATERNITY'];

function validateType(type: string): type is InsuranceType {
  return validTypes.includes(type as InsuranceType);
}

router.use(authMiddleware);

router.get('/:type/balance', (req, res) => {
  const { type } = req.params;

  if (!validateType(type)) {
    res.status(400).json({ code: 400, message: '无效的险种类型，支持：PENSION/UNEMPLOYMENT/INJURY/MATERNITY' });
    return;
  }

  const userId = req.userId!;
  const data = getAccountBalance(userId, type);
  res.json({ code: 0, data });
});

router.get('/:type/payments', (req, res) => {
  const { type } = req.params;

  if (!validateType(type)) {
    res.status(400).json({ code: 400, message: '无效的险种类型' });
    return;
  }

  const userId = req.userId!;
  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.min(50, Math.max(1, Number(req.query.size) || 10));

  const data = getPaymentDetails(userId, type, page, size);
  res.json({ code: 0, data });
});

router.get('/:type/benefits', (req, res) => {
  const { type } = req.params;

  if (!validateType(type)) {
    res.status(400).json({ code: 400, message: '无效的险种类型' });
    return;
  }

  const userId = req.userId!;
  const data = getBenefitRecords(userId, type);
  res.json({ code: 0, data });
});

router.get('/:type/compare', (req, res) => {
  const { type } = req.params;

  if (!validateType(type)) {
    res.status(400).json({ code: 400, message: '无效的险种类型' });
    return;
  }

  const userId = req.userId!;
  const data = getCompareData(userId, type);
  res.json({ code: 0, data });
});

export default router;
