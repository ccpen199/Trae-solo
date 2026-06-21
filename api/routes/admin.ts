import { Router } from 'express';
import type { Request, Response } from 'express';
import { sendResponse } from '../utils';
import { mockTransactions, mockTickets, mockCertificates, mockEmployees, cityRatePlans } from '../../shared/mockData';
import { CITIES, CITY_NAMES } from '../../shared/types';

const router = Router();

router.get('/dashboard', (_req: Request, res: Response) => {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const txThisMonth = mockTransactions.filter(t => new Date(t.submittedAt) >= monthStart);
  const ticketsThisMonth = mockTickets.filter(t => new Date(t.createdAt) >= monthStart);
  const pendingTx = mockTransactions.filter(t =>
    ['SUBMITTED', 'AI_REVIEWING', 'MANUAL_REVIEWING', 'PROCESSING'].includes(t.status)
  );
  const pendingTickets = mockTickets.filter(t =>
    ['NEW', 'AI_PROCESSING', 'PENDING_AGENT', 'ASSIGNED', 'PROCESSING', 'PENDING_USER'].includes(t.status)
  );
  let monthlyAmount = 0;
  mockEmployees.forEach(emp => {
    const plan = cityRatePlans[emp.cityCode];
    if (plan) {
      const total = plan.items.reduce((s, it) => {
        const base = it.type === 'HOUSING_FUND' ? emp.housingFundBase : emp.insuranceBase;
        const pRate = it.type === 'HOUSING_FUND' ? emp.housingFundPercent : it.personalRate;
        const cRate = it.type === 'HOUSING_FUND' ? emp.housingFundPercent : it.companyRate;
        return s + (base * pRate / 100) + (base * cRate / 100);
      }, 0);
      monthlyAmount += total;
    }
  });
  const cityBreakdown = CITIES.map(code => {
    const emps = mockEmployees.filter(e => e.cityCode === code);
    let amt = 0;
    emps.forEach(emp => {
      const plan = cityRatePlans[emp.cityCode];
      if (plan) {
        amt += plan.items.reduce((s, it) => {
          const base = it.type === 'HOUSING_FUND' ? emp.housingFundBase : emp.insuranceBase;
          const pRate = it.type === 'HOUSING_FUND' ? emp.housingFundPercent : it.personalRate;
          const cRate = it.type === 'HOUSING_FUND' ? emp.housingFundPercent : it.companyRate;
          return s + (base * pRate / 100) + (base * cRate / 100);
        }, 0);
      }
    });
    return { code, name: CITY_NAMES[code], employeeCount: emps.length, amount: Number(amt.toFixed(2)) };
  });
  res.json(sendResponse({
    kpi: {
      activePlans: mockEmployees.filter(e => e.status === 'INSURED').length,
      monthlyAmount: Number(monthlyAmount.toFixed(2)),
      pendingTransactions: pendingTx.length,
      pendingTickets: pendingTickets.length,
      totalCertificates: mockCertificates.length,
      txThisMonthCount: txThisMonth.length,
      ticketsThisMonthCount: ticketsThisMonth.length,
      todayDate: todayStr,
    },
    cityBreakdown,
    txTypeBreakdown: [
      { type: 'SUPPLEMENTARY_PAY', name: '社保补缴', count: mockTransactions.filter(t => t.type === 'SUPPLEMENTARY_PAY').length },
      { type: 'BASE_ADJUSTMENT', name: '基数调整', count: mockTransactions.filter(t => t.type === 'BASE_ADJUSTMENT').length },
      { type: 'HOSPITAL_CHANGE', name: '医院变更', count: mockTransactions.filter(t => t.type === 'HOSPITAL_CHANGE').length },
      { type: 'TRANSFER', name: '转移接续', count: mockTransactions.filter(t => t.type === 'TRANSFER').length },
      { type: 'INFO_MODIFY', name: '信息修改', count: mockTransactions.filter(t => t.type === 'INFO_MODIFY').length },
    ],
    recent7DaysTrend: Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().slice(0, 10);
      return {
        date: ds,
        txCount: mockTransactions.filter(t => t.submittedAt.slice(0, 10) === ds).length,
        ticketCount: mockTickets.filter(t => t.createdAt.slice(0, 10) === ds).length,
        amount: 50000 + Math.random() * 100000,
      };
    }),
  }));
});

router.get('/api-metrics', (_req: Request, res: Response) => {
  const routes = [
    { path: '/api/auth/login', method: 'POST', name: '用户登录' },
    { path: '/api/calculator/calculate', method: 'POST', name: '社保测算' },
    { path: '/api/calculator/compare', method: 'POST', name: '六地对比' },
    { path: '/api/transaction/', method: 'GET', name: '事务列表' },
    { path: '/api/transaction/supplementary-pay', method: 'POST', name: '补缴申请' },
    { path: '/api/transaction/base-adjustment', method: 'POST', name: '基数调整' },
    { path: '/api/policy/search', method: 'GET', name: '政策搜索' },
    { path: '/api/support/ai/intent', method: 'POST', name: 'AI意图识别' },
    { path: '/api/finance/salary/calc', method: 'POST', name: '薪资计算' },
    { path: '/api/certificate/verify', method: 'POST', name: '凭证验真' },
    { path: '/api/dashboard/stats', method: 'GET', name: '首页统计' },
  ];
  const metrics = routes.map(r => ({
    ...r,
    callCount: Math.floor(Math.random() * 5000) + 200,
    avgLatency: (Math.random() * 200 + 20).toFixed(1) + 'ms',
    p99Latency: (Math.random() * 500 + 100).toFixed(1) + 'ms',
    errorRate: (Math.random() * 0.5).toFixed(2) + '%',
    successRate: (99 + Math.random()).toFixed(2) + '%',
    uptime: '99.' + Math.floor(Math.random() * 99) + '%',
  }));
  res.json(sendResponse({
    overview: {
      totalRequests: 125680,
      avgResponseTime: '85ms',
      errorRate: '0.12%',
      uptime: '99.97%',
      qps: 42,
    },
    routes: metrics,
    hourlyTrend: Array.from({ length: 24 }, (_, i) => ({
      hour: String(i).padStart(2, '0') + ':00',
      requests: Math.floor(Math.random() * 300) + 50,
      errors: Math.floor(Math.random() * 3),
      avgLatency: (Math.random() * 150 + 30).toFixed(0) + 'ms',
    })),
  }));
});

router.get('/audit-logs', (req: Request, res: Response) => {
  const { userId, action, module, page = 1, pageSize = 20 } = req.query;
  const actions = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'APPROVE', 'REJECT', 'EXPORT', 'VERIFY'];
  const modules = ['AUTH', 'CALCULATOR', 'TRANSACTION', 'CERTIFICATE', 'POLICY', 'SUPPORT', 'FINANCE', 'ADMIN'];
  const now = Date.now();
  const logs = Array.from({ length: 150 }, (_, i) => {
    const d = new Date(now - i * 3600000 * Math.random() * 5);
    return {
      id: 'LOG' + String(100000 + i),
      userId: 'U' + String(Math.floor(Math.random() * 10) + 1).padStart(3, '0'),
      userName: ['张伟', '李娜', '王强', '赵敏', '陈刚', '李明', '王芳', '陈静'][Math.floor(Math.random() * 8)],
      action: actions[Math.floor(Math.random() * actions.length)],
      module: modules[Math.floor(Math.random() * modules.length)],
      ipAddress: ['103.27.25.108', '124.64.18.55', '58.33.12.88', '116.25.36.77'][Math.floor(Math.random() * 4)],
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      targetId: Math.random() > 0.5 ? 'T' + (100 + Math.floor(Math.random() * 50)) : null,
      detail: '用户执行了' + actions[Math.floor(Math.random() * actions.length)] + '操作',
      result: Math.random() > 0.05 ? 'SUCCESS' : 'FAILED',
      timestamp: d.toISOString(),
    };
  });
  let filtered = logs;
  if (userId) filtered = filtered.filter(l => l.userId === userId);
  if (action) filtered = filtered.filter(l => l.action === action);
  if (module) filtered = filtered.filter(l => l.module === module);
  const start = (Number(page) - 1) * Number(pageSize);
  const paged = filtered.slice(start, start + Number(pageSize));
  res.json(sendResponse({
    list: paged,
    total: filtered.length,
    page: Number(page),
    pageSize: Number(pageSize),
    filters: { actions, modules },
  }));
});

export default router;
