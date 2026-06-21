import { Router } from 'express';
import type { Request, Response } from 'express';
import { sendResponse, calcInsurance } from '../utils';
import { mockTransactions, mockTickets, policyDocuments, mockEmployees, cityRatePlans, cityPolicies } from '../../shared/mockData';
import { CITIES, CITY_NAMES } from '../../shared/types';
import type { DashboardStats, CityCode, InsuranceType } from '../../shared/types';

const router = Router();

router.get('/stats', (_req: Request, res: Response) => {
  let monthlyAmount = 0;
  mockEmployees.forEach(emp => {
    const items: InsuranceType[] = ['PENSION','MEDICAL','UNEMPLOYMENT','INJURY','MATERNITY','HOUSING_FUND'];
    const r = calcInsurance(emp.cityCode, emp.insuranceBase, items, emp.housingFundPercent);
    monthlyAmount += r.grandTotal;
  });
  const pendingTransactions = mockTransactions.filter(t =>
    ['SUBMITTED', 'AI_REVIEWING', 'MANUAL_REVIEWING', 'PROCESSING'].includes(t.status)
  );
  const pendingTickets = mockTickets.filter(t =>
    ['NEW', 'AI_PROCESSING', 'PENDING_AGENT', 'ASSIGNED', 'PROCESSING', 'PENDING_USER'].includes(t.status)
  );
  const recentTransactions = [...mockTransactions]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5);
  const policyUpdates = policyDocuments
    .filter(p => p.cityCode !== 'NATIONAL')
    .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      cityCode: p.cityCode as CityCode,
      title: p.title,
      effectiveDate: p.effectiveDate,
    }));
  const stats: DashboardStats = {
    activePlans: mockEmployees.filter(e => e.status === 'INSURED').length,
    monthlyAmount: Number(monthlyAmount.toFixed(2)),
    pendingTransactions: pendingTransactions.length,
    pendingTickets: pendingTickets.length,
    currentCity: 'BJ',
    recentTransactions,
    policyUpdates,
  };
  res.json(sendResponse(stats));
});

router.get('/overview', (_req: Request, res: Response) => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const txThisMonth = mockTransactions.filter(t => new Date(t.submittedAt) >= monthStart);
  const ticketsThisMonth = mockTickets.filter(t => new Date(t.createdAt) >= monthStart);
  const successTx = mockTransactions.filter(t => t.status === 'SUCCESS').length;
  const successRate = mockTransactions.length ? Number((successTx / mockTransactions.length * 100).toFixed(1)) : 0;
  const avgResolveHours = ticketsThisMonth.length ? Number((2.5 + Math.random() * 5).toFixed(1)) : 0;
  res.json(sendResponse({
    keyStats: {
      totalUsers: 12580,
      activeUsersToday: 3842,
      totalTransactions: mockTransactions.length + 856,
      successRate: successRate + '%',
      avgResolveTime: avgResolveHours + '小时',
      totalAmount: Number((4892350.68 + Math.random() * 100000).toFixed(2)),
    },
    monthlyProgress: {
      txCount: txThisMonth.length + 156,
      txTarget: 500,
      ticketCount: ticketsThisMonth.length + 89,
      ticketTarget: 200,
      amountTarget: 5000000,
      amountCurrent: Number((2856420.50 + Math.random() * 500000).toFixed(2)),
    },
    notifications: [
      { id: 'N1', type: 'INFO', title: '2025年7月社保基数调整即将生效', time: new Date(Date.now() - 3600000).toISOString(), link: '/policy/P001' },
      { id: 'N2', type: 'WARNING', title: pendingTransactions.length + '笔事务待处理', time: new Date(Date.now() - 7200000).toISOString(), link: '/transaction' },
      { id: 'N3', type: 'TASK', title: pendingTickets.length + '个工单待响应', time: new Date(Date.now() - 10800000).toISOString(), link: '/support' },
    ],
    shortcuts: [
      { id: 'S1', name: '社保测算', icon: 'Calculator', path: '/calculator' },
      { id: 'S2', name: '发起补缴', icon: 'Clock', path: '/transaction/new?type=SUPPLEMENTARY_PAY' },
      { id: 'S3', name: '定点医院', icon: 'Hospital', path: '/hospitals' },
      { id: 'S4', name: '政策查询', icon: 'BookOpen', path: '/policy' },
      { id: 'S5', name: '凭证中心', icon: 'FileCheck', path: '/certificate' },
      { id: 'S6', name: '联系客服', icon: 'Headphones', path: '/support' },
    ],
  }));
});

router.get('/city-comparison', (_req: Request, res: Response) => {
  const base = 12000;
  const items: InsuranceType[] = ['PENSION','MEDICAL','UNEMPLOYMENT','INJURY','MATERNITY','HOUSING_FUND'];
  const data = CITIES.map(code => {
    const r = calcInsurance(code, base, items);
    return {
      code,
      name: CITY_NAMES[code],
      socialAvgSalary: cityPolicies[code].socialAvgSalary,
      minBase: cityPolicies[code].minBase,
      maxBase: cityPolicies[code].maxBase,
      personalTotal: r.personalTotal,
      companyTotal: r.companyTotal,
      grandTotal: r.grandTotal,
      personalPercent: Number((r.personalTotal / base * 100).toFixed(2)),
      companyPercent: Number((r.companyTotal / base * 100).toFixed(2)),
      highlights: cityPolicies[code].highlights,
    };
  });
  res.json(sendResponse({
    referenceBase: base,
    cities: data,
    ranking: {
      byGrandTotal: [...data].sort((a, b) => a.grandTotal - b.grandTotal).map(d => ({ code: d.code, name: d.name, amount: d.grandTotal })),
      byPersonal: [...data].sort((a, b) => a.personalTotal - b.personalTotal).map(d => ({ code: d.code, name: d.name, amount: d.personalTotal })),
      byCompany: [...data].sort((a, b) => a.companyTotal - b.companyTotal).map(d => ({ code: d.code, name: d.name, amount: d.companyTotal })),
    },
  }));
});

export default router;
