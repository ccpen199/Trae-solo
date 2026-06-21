import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getInvestorProfile, getInvestorByUserId, getRevenueRecords, getInvestorDashboard, getWaterUsageTrend, getDeviceDiagnosis, generateDiagnosisReport, settleRevenue } from '../services/investorService.js';
import { getDevicesByInvestor, getAllDevices } from '../services/deviceService.js';

const router = Router();

router.get('/profile', authMiddleware(['investor']), (req, res): void => {
  const profile = getInvestorProfile(req.auth!.userId);
  if (!profile) {
    res.status(404).json({ code: 404, message: '投资商档案不存在', data: null });
    return;
  }
  res.json({ code: 200, message: 'success', data: profile });
});

router.get('/dashboard', authMiddleware(['investor']), (req, res): void => {
  const investor = getInvestorByUserId(req.auth!.userId);
  if (!investor) {
    res.status(404).json({ code: 404, message: '投资商档案不存在', data: null });
    return;
  }
  const data = getInvestorDashboard(investor.id);
  res.json({ code: 200, message: 'success', data });
});

router.get('/devices', authMiddleware(['investor', 'admin']), (req, res): void => {
  let devices;
  if (req.auth!.role === 'admin') {
    devices = getAllDevices();
  } else {
    const investor = getInvestorByUserId(req.auth!.userId);
    if (!investor) {
      res.status(404).json({ code: 404, message: '投资商档案不存在', data: null });
      return;
    }
    devices = getDevicesByInvestor(investor.id);
  }
  res.json({ code: 200, message: 'success', data: devices });
});

router.get('/revenue', authMiddleware(['investor']), (req, res): void => {
  const investor = getInvestorByUserId(req.auth!.userId);
  if (!investor) {
    res.status(404).json({ code: 404, message: '投资商档案不存在', data: null });
    return;
  }
  const period = req.query.period as string | undefined;
  const records = getRevenueRecords(investor.id, period);
  res.json({ code: 200, message: 'success', data: records });
});

router.post('/revenue/settle', authMiddleware(['investor']), (req, res): void => {
  const investor = getInvestorByUserId(req.auth!.userId);
  if (!investor) {
    res.status(404).json({ code: 404, message: '投资商档案不存在', data: null });
    return;
  }
  const { period } = req.body as { period: string };
  const records = settleRevenue(investor.id, period);
  res.json({ code: 200, message: '结算完成', data: records });
});

router.get('/devices/:id/trend', authMiddleware(['investor']), (req, res): void => {
  const days = Number(req.query.days) || 7;
  const trend = getWaterUsageTrend(req.params.id, days);
  res.json({ code: 200, message: 'success', data: trend });
});

router.get('/devices/:id/diagnosis', authMiddleware(['investor', 'admin']), (req, res): void => {
  const diagnosis = getDeviceDiagnosis(req.params.id);
  res.json({ code: 200, message: 'success', data: diagnosis });
});

router.get('/devices/:id/diagnosis/report', authMiddleware(['investor', 'admin']), (req, res): void => {
  const report = generateDiagnosisReport(req.params.id);
  res.json({ code: 200, message: 'success', data: report });
});

export default router;
