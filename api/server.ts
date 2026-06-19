import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import {
  databaseExists,
  dbPath,
  findTraceBatch,
  getCounts,
  getDashboard,
  initializeDatabase,
  listProducts,
  listRows,
  listTraceBatches,
  verifyUnionMember,
  getUnionMemberById,
  listUnionMembers,
  getUnionOrgHierarchy,
  listUnionOrgs,
  listWelfareBudgets,
  listWelfareCoupons,
  getPointsAccount,
  listPointsRecords,
  listUnionCards,
  listSupplierAssessments,
  listMemberBenefits,
  listTravelBookings,
  listLegalConsults,
  getFunnelAnalysis,
  getUnionDashboard,
} from './db';

dotenv.config();
initializeDatabase();

const app = express();
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || 59141);

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'may-89141 traceability-api',
    host,
    port,
    database: {
      path: dbPath,
      exists: databaseExists(),
      counts: getCounts(),
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/dashboard', (_req, res) => {
  res.json(getDashboard());
});

app.get('/api/trace', (req, res) => {
  const code = String(req.query.code || '');
  if (!code) {
    res.json({ batches: listTraceBatches() });
    return;
  }

  const result = findTraceBatch(code);
  if (!result) {
    res.status(404).json({ error: 'TRACE_CODE_NOT_FOUND', message: '未找到该溯源码' });
    return;
  }

  res.json(result);
});

app.get('/api/trace/:code', (req, res) => {
  const result = findTraceBatch(req.params.code);
  if (!result) {
    res.status(404).json({ error: 'TRACE_CODE_NOT_FOUND', message: '未找到该溯源码' });
    return;
  }

  res.json(result);
});

app.get('/api/products', (req, res) => {
  const channel = req.query.channel ? String(req.query.channel) : undefined;
  res.json({ products: listProducts(channel) });
});

app.get('/api/orders', (_req, res) => {
  res.json({ orders: listRows('orders') });
});

app.get('/api/contracts', (_req, res) => {
  res.json({ contracts: listRows('contracts') });
});

app.get('/api/agtech/questions', (_req, res) => {
  res.json({ questions: listRows('questions') });
});

app.get('/api/weather', (_req, res) => {
  res.json({ alerts: listRows('weather_alerts') });
});

app.get('/api/regulatory', (_req, res) => {
  res.json({
    trends: getDashboard().qualityTrend,
    reports: [
      { id: 'rp-2026-06', title: '2026年6月区域质量趋势分析', risk: '低', sampleCount: 1846, passRate: 98.7 },
      { id: 'rp-2026-q2', title: '2026年二季度农残抽检报告', risk: '中低', sampleCount: 5172, passRate: 98.4 },
    ],
  });
});

app.get('/api/union/dashboard', (_req, res) => {
  res.json(getUnionDashboard());
});

app.post('/api/union/members/verify', (req, res) => {
  const { idCard, employeeNo } = req.body;
  if (!idCard || !employeeNo) {
    res.status(400).json({ error: 'MISSING_PARAMS', message: '身份证号和工号不能为空' });
    return;
  }
  const member = verifyUnionMember(idCard, employeeNo);
  if (!member) {
    res.status(404).json({ error: 'VERIFICATION_FAILED', message: '会员信息核验失败，请检查身份证号和工号' });
    return;
  }
  res.json({ member, orgHierarchy: getUnionOrgHierarchy(member.parentUnionId) });
});

app.get('/api/union/members', (req, res) => {
  const level = req.query.level ? String(req.query.level) : undefined;
  res.json({ members: listUnionMembers(level) });
});

app.get('/api/union/members/:id', (req, res) => {
  const member = getUnionMemberById(req.params.id);
  if (!member) {
    res.status(404).json({ error: 'NOT_FOUND' });
    return;
  }
  res.json(member);
});

app.get('/api/union/orgs', (_req, res) => {
  res.json({ orgs: listUnionOrgs() });
});

app.get('/api/union/orgs/:id/hierarchy', (req, res) => {
  res.json({ hierarchy: getUnionOrgHierarchy(req.params.id) });
});

app.get('/api/union/welfare/budgets', (req, res) => {
  const status = req.query.status ? String(req.query.status) : undefined;
  res.json({ budgets: listWelfareBudgets(status) });
});

app.get('/api/union/welfare/coupons', (req, res) => {
  const memberId = req.query.memberId ? String(req.query.memberId) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;
  res.json({ coupons: listWelfareCoupons(memberId, status) });
});

app.get('/api/union/points/account/:memberId', (req, res) => {
  const account = getPointsAccount(req.params.memberId);
  if (!account) {
    res.status(404).json({ error: 'NOT_FOUND' });
    return;
  }
  res.json({ account, records: listPointsRecords(account.id) });
});

app.get('/api/union/cards', (req, res) => {
  const memberId = req.query.memberId ? String(req.query.memberId) : undefined;
  res.json({ cards: listUnionCards(memberId) });
});

app.get('/api/union/supplier/assessments', (req, res) => {
  const supplierId = req.query.supplierId ? String(req.query.supplierId) : undefined;
  res.json({ assessments: listSupplierAssessments(supplierId) });
});

app.get('/api/union/benefits', (req, res) => {
  const category = req.query.category ? String(req.query.category) : undefined;
  res.json({ benefits: listMemberBenefits(category) });
});

app.get('/api/union/travel/bookings', (req, res) => {
  const memberId = req.query.memberId ? String(req.query.memberId) : undefined;
  res.json({ bookings: listTravelBookings(memberId) });
});

app.get('/api/union/legal/consults', (req, res) => {
  const memberId = req.query.memberId ? String(req.query.memberId) : undefined;
  res.json({ consults: listLegalConsults(memberId) });
});

app.get('/api/union/analysis/funnel', (_req, res) => {
  res.json({ funnel: getFunnelAnalysis() });
});

app.post('/api/union/legal/consults', (req, res) => {
  const { memberId, memberName, category, title, content } = req.body;
  res.json({
    id: `lc-${Date.now()}`,
    memberId,
    memberName,
    category,
    title,
    content,
    lawyerName: '',
    reply: '',
    status: '待处理',
    createdAt: new Date().toLocaleString('zh-CN'),
    repliedAt: '',
  });
});

app.post('/api/union/travel/bookings', (req, res) => {
  const { memberId, memberName, type, travelDate, departure, destination, price } = req.body;
  res.json({
    id: `tb-${Date.now()}`,
    memberId,
    memberName,
    type,
    travelDate,
    departure,
    destination,
    price,
    status: '待支付',
    bookedAt: new Date().toLocaleString('zh-CN'),
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

app.listen(port, host, () => {
  console.log(`may-89141 backend listening on http://${host}:${port}`);
});
