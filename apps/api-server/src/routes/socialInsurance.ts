import { Router } from 'express';
import type { InsuranceType, QueryRange } from '@gx-rs/shared';
import { authMiddleware } from '../middleware/auth.js';
import {
  getAccountBalance,
  getPaymentDetails,
  getBenefitRecords,
  getCompareData,
} from '../mock/socialInsurance.js';

const router = Router();

const validTypes: InsuranceType[] = ['PENSION', 'UNEMPLOYMENT', 'INJURY', 'MATERNITY'];
const validRanges: QueryRange[] = ['MONTHLY', 'QUARTERLY', 'YEARLY'];

function validateType(type: string): type is InsuranceType {
  return validTypes.includes(type as InsuranceType);
}

function getInsuranceType(req: any): InsuranceType | null {
  const type = (req.params.type || req.query.insuranceType || '') as string;
  return validateType(type) ? type : null;
}

router.use(authMiddleware);

router.get(['/balance', '/:type/balance'], (req, res) => {
  const type = getInsuranceType(req);

  if (!type) {
    res.status(400).json({ code: 400, message: '无效的险种类型，支持：PENSION/UNEMPLOYMENT/INJURY/MATERNITY' });
    return;
  }

  const userId = req.userId!;
  const data = getAccountBalance(userId, type);
  res.json({ code: 0, data });
});

router.get(['/payments', '/:type/payments'], (req, res) => {
  const type = getInsuranceType(req);

  if (!type) {
    res.status(400).json({ code: 400, message: '无效的险种类型' });
    return;
  }

  const userId = req.userId!;
  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.min(50, Math.max(1, Number(req.query.size) || 10));
  const range = validRanges.includes(req.query.range as QueryRange)
    ? (req.query.range as QueryRange)
    : 'MONTHLY';

  const data = getPaymentDetails(userId, type, range, page, size);
  res.json({ code: 0, data });
});

router.get(['/benefits', '/:type/benefits'], (req, res) => {
  const type = getInsuranceType(req);

  if (!type) {
    res.status(400).json({ code: 400, message: '无效的险种类型' });
    return;
  }

  const userId = req.userId!;
  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.min(50, Math.max(1, Number(req.query.size) || 10));

  const data = getBenefitRecords(userId, type, page, size);
  res.json({ code: 0, data });
});

router.get(['/compare-chart', '/compare', '/:type/compare'], (req, res) => {
  const type = getInsuranceType(req);

  if (!type) {
    res.status(400).json({ code: 400, message: '无效的险种类型' });
    return;
  }

  const userId = req.userId!;
  const year = Number(req.query.year) || new Date().getFullYear();

  const data = getCompareData(userId, type, year);
  res.json({ code: 0, data });
});

export default router;
