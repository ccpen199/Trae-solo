import { Router } from 'express';
import type { Request, Response } from 'express';
import { sendResponse, calcInsurance, generateId } from '../utils';
import { cityPolicies, cityRatePlans } from '../../shared/mockData';
import { CITIES } from '../../shared/types';
import type { CityCode, CompareResult, CalculatorResult } from '../../shared/types';

const router = Router();

router.post('/calculate', (req: Request, res: Response) => {
  const { cityCode, baseAmount, selectedItems, housingFundPercent } = req.body;
  if (!cityCode || !baseAmount || !selectedItems?.length) {
    return res.json(sendResponse(null, '参数不完整', 400));
  }
  if (!CITIES.includes(cityCode)) {
    return res.json(sendResponse(null, '城市代码无效', 400));
  }
  const result = calcInsurance(cityCode, baseAmount, selectedItems, housingFundPercent);
  res.json(sendResponse(result));
});

router.post('/compare', (req: Request, res: Response) => {
  const { baseAmount, selectedItems, housingFundPercent, cities } = req.body;
  if (!baseAmount || !selectedItems?.length || !cities?.length) {
    return res.json(sendResponse(null, '参数不完整', 400));
  }
  const results: Partial<Record<CityCode, CalculatorResult>> = {};
  for (const city of cities) {
    if (CITIES.includes(city)) {
      results[city] = calcInsurance(city, baseAmount, selectedItems, housingFundPercent);
    }
  }
  const entries = Object.entries(results) as [CityCode, CalculatorResult][];
  if (entries.length < 2) {
    return res.json(sendResponse({ results, summary: null }));
  }
  entries.sort((a, b) => a[1].grandTotal - b[1].grandTotal);
  const cheapestCity = entries[0][0];
  const mostExpensiveCity = entries[entries.length - 1][0];
  const maxDiffPersonal = entries[entries.length - 1][1].personalTotal - entries[0][1].personalTotal;
  const maxDiffCompany = entries[entries.length - 1][1].companyTotal - entries[0][1].companyTotal;

  const compareResult: CompareResult = {
    results,
    summary: {
      cheapestCity,
      mostExpensiveCity,
      maxDiffPersonal: Number(maxDiffPersonal.toFixed(2)),
      maxDiffCompany: Number(maxDiffCompany.toFixed(2)),
    },
  };
  res.json(sendResponse(compareResult));
});

router.get('/policy/:cityCode', (req: Request, res: Response) => {
  const { cityCode } = req.params;
  if (!CITIES.includes(cityCode as CityCode)) {
    return res.json(sendResponse(null, '城市代码无效', 400));
  }
  res.json(sendResponse(cityPolicies[cityCode as CityCode]));
});

router.get('/policies', (_req: Request, res: Response) => {
  res.json(sendResponse(cityPolicies));
});

router.get('/rates/:cityCode', (req: Request, res: Response) => {
  const { cityCode } = req.params;
  if (!CITIES.includes(cityCode as CityCode)) {
    return res.json(sendResponse(null, '城市代码无效', 400));
  }
  res.json(sendResponse(cityRatePlans[cityCode as CityCode]));
});

router.get('/rates', (_req: Request, res: Response) => {
  res.json(sendResponse(cityRatePlans));
});

router.post('/save-plan', (req: Request, res: Response) => {
  const { cityCode, baseAmount, selectedItems, housingFundPercent, basePercent } = req.body;
  if (!cityCode || !baseAmount || !selectedItems?.length) {
    return res.json(sendResponse(null, '参数不完整', 400));
  }
  const result = calcInsurance(cityCode, baseAmount, selectedItems, housingFundPercent);
  const planId = generateId('PLAN');
  const certificateId = generateId('CERT');
  const savedAt = new Date().toISOString();
  const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

  res.json(
    sendResponse({
      planId,
      certificateId,
      cityCode,
      baseAmount,
      basePercent: basePercent || 100,
      selectedItems,
      housingFundPercent: housingFundPercent || 12,
      result,
      savedAt,
      ipAddress,
      userAgent: req.headers['user-agent'] || '',
    })
  );
});

export default router;
