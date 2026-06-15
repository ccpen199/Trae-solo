import { Router, type Request, type Response } from 'express';
import {
  MOCK_ENTERPRISES,
  MOCK_SUBSIDY_APPS,
  TOWNSHIP_DATA,
} from '../mock/mockData.js';
import {
  ApiResponse,
  Enterprise,
  SubsidyApplication,
} from '../../shared/types/index.js';

const router = Router();

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

function fail(error: string): ApiResponse {
  return { success: false, error };
}

router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  const totalEnterprises = MOCK_ENTERPRISES.length;
  const pendingEnterprises = MOCK_ENTERPRISES.filter(e => !e.verified).length;
  const totalSubsidies = MOCK_SUBSIDY_APPS.length;
  const pendingSubsidies = MOCK_SUBSIDY_APPS.filter(s => s.status === '审核中').length;
  const totalSubsidyAmount = MOCK_SUBSIDY_APPS
    .filter(s => s.status === '已发放')
    .reduce((s, a) => s + a.amount, 0);

  const kpis = [
    { name: '企业总数', value: totalEnterprises, unit: '家' },
    { name: '待审核企业', value: pendingEnterprises, unit: '家' },
    { name: '补贴申请总数', value: totalSubsidies, unit: '件' },
    { name: '待审核补贴', value: pendingSubsidies, unit: '件' },
    { name: '已发放补贴', value: totalSubsidyAmount, unit: '元' },
    { name: '平台用户数', value: 28600, unit: '人' },
  ];

  const recentActivities = [
    { type: '企业审核', content: '中山市XX五金有限公司提交审核申请', time: '10分钟前', status: 'pending' },
    { type: '补贴审批', content: '员工张三技能提升补贴通过镇街复核', time: '30分钟前', status: 'approved' },
    { type: '企业审核', content: '中山市YY灯饰有限公司审核通过', time: '1小时前', status: 'approved' },
    { type: '补贴审批', content: 'ZZ企业吸纳就业补贴申请被驳回', time: '2小时前', status: 'rejected' },
    { type: '系统', content: '系统自动完成技能图谱季度更新', time: '3小时前', status: 'info' },
    { type: '企业审核', content: '新增8家企业提交注册申请', time: '5小时前', status: 'pending' },
  ];

  const enterpriseByTownship = TOWNSHIP_DATA.map(t => ({
    code: t.code,
    name: t.name,
    total: MOCK_ENTERPRISES.filter(e => e.township === t.code).length,
    verified: MOCK_ENTERPRISES.filter(e => e.township === t.code && e.verified).length,
    pending: MOCK_ENTERPRISES.filter(e => e.township === t.code && !e.verified).length,
  }));

  res.json(ok({ kpis, recentActivities, enterpriseByTownship }));
});

router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  const verifiedEnterprises = MOCK_ENTERPRISES.filter(e => e.verified).length;
  const pendingEnterprises = MOCK_ENTERPRISES.length - verifiedEnterprises;
  const activeJobs = MOCK_ENTERPRISES.reduce((sum, enterprise) => sum + enterprise.jobCount, 0);

  res.json(ok({
    totalEnterprises: MOCK_ENTERPRISES.length,
    verifiedEnterprises,
    pendingEnterprises,
    activeJobs,
    subsidyApplications: MOCK_SUBSIDY_APPS.length,
    pendingSubsidies: MOCK_SUBSIDY_APPS.filter(s => s.status === '审核中').length,
  }));
});

router.get('/enterprise-verification', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string;
  const township = req.query.township as string;
  const keyword = (req.query.keyword as string)?.trim();

  let enterprises = [...MOCK_ENTERPRISES];

  if (status === 'pending') {
    enterprises = enterprises.filter(e => !e.verified);
  } else if (status === 'verified') {
    enterprises = enterprises.filter(e => e.verified);
  }

  if (township) {
    enterprises = enterprises.filter(e => e.township === township);
  }

  if (keyword) {
    const kw = keyword.toLowerCase();
    enterprises = enterprises.filter(e =>
      e.name.toLowerCase().includes(kw) ||
      e.licenseNo.includes(kw) ||
      e.contact.hrName.toLowerCase().includes(kw)
    );
  }

  enterprises.sort((a, b) => (a.verified === b.verified ? 0 : a.verified ? 1 : -1));

  const total = enterprises.length;
  const startIdx = (page - 1) * pageSize;
  const paginated = enterprises.slice(startIdx, startIdx + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  res.json({
    success: true,
    data: paginated,
    pagination: { page, pageSize, total, totalPages },
  });
});

router.post('/enterprise-verification/:id/approve', async (req: Request, res: Response): Promise<void> => {
  const enterpriseId = req.params.id;
  const { creditRating, comment } = req.body as { creditRating?: string; comment?: string };

  const enterprise = MOCK_ENTERPRISES.find(e => e.id === enterpriseId);
  if (!enterprise) {
    res.status(404).json(fail('企业不存在'));
    return;
  }

  res.json(ok({
    enterpriseId,
    verified: true,
    creditRating: creditRating || 'B',
    verifiedAt: new Date().toISOString(),
    comment: comment || '审核通过',
  }, '企业审核通过'));
});

router.post('/enterprise-verification/:id/reject', async (req: Request, res: Response): Promise<void> => {
  const enterpriseId = req.params.id;
  const { reason } = req.body as { reason?: string };

  res.json(ok({
    enterpriseId,
    rejected: true,
    rejectedAt: new Date().toISOString(),
    reason: reason || '材料不完整',
  }, '企业审核已驳回'));
});

router.get('/subsidy-audit', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string;
  const type = req.query.type as string;
  const applicantType = req.query.applicantType as string;

  let applications = [...MOCK_SUBSIDY_APPS];

  if (status) {
    applications = applications.filter(a => a.status === status);
  }
  if (type) {
    applications = applications.filter(a => a.type === type);
  }
  if (applicantType) {
    applications = applications.filter(a => a.applicantType === applicantType);
  }

  const statusPriority: Record<string, number> = {
    '审核中': 0, '已提交': 1, '草稿': 2, '已通过': 3, '已驳回': 4, '已发放': 5,
  };
  applications.sort((a, b) => (statusPriority[a.status] ?? 9) - (statusPriority[b.status] ?? 9));

  const total = applications.length;
  const startIdx = (page - 1) * pageSize;
  const paginated = applications.slice(startIdx, startIdx + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  res.json({
    success: true,
    data: paginated,
    pagination: { page, pageSize, total, totalPages },
  });
});

router.post('/subsidy-audit/:id/audit', async (req: Request, res: Response): Promise<void> => {
  const applicationId = req.params.id;
  const { step, pass, comment } = req.body as { step: string; pass: boolean; comment?: string };

  const app = MOCK_SUBSIDY_APPS.find(a => a.id === applicationId);
  if (!app) {
    res.status(404).json(fail('补贴申请不存在'));
    return;
  }

  const newStatus = pass
    ? (step === '区级审批' ? '已通过' : '审核中')
    : '已驳回';

  res.json(ok({
    applicationId,
    step,
    passed: pass,
    newStatus,
    auditedAt: new Date().toISOString(),
    comment: comment || (pass ? '审核通过' : '审核不通过'),
  }, pass ? '审核通过' : '已驳回申请'));
});

router.post('/subsidy-audit/:id/payout', async (req: Request, res: Response): Promise<void> => {
  const applicationId = req.params.id;

  res.json(ok({
    applicationId,
    payoutStatus: 'success',
    payoutAmount: MOCK_SUBSIDY_APPS.find(a => a.id === applicationId)?.amount || 0,
    payoutAt: new Date().toISOString(),
    transactionId: `TXN_${Date.now()}`,
  }, '补贴已发放'));
});

router.get('/skill-graph', async (req: Request, res: Response): Promise<void> => {
  const categories = [
    { name: '机械加工', skills: ['数控车床操作', 'CNC编程', '模具设计', '钳工装配', '焊接技术', '机械制图CAD'] },
    { name: '电气自动化', skills: ['PLC编程', '电气控制', '工业机器人', '电工操作', '变频技术', '传感器应用'] },
    { name: '电子装配', skills: ['SMT贴片', '电子维修', 'PCB设计', '品质管理QC', 'LED组装', '测试技术'] },
    { name: '质量管理', skills: ['ISO9001', 'Six Sigma', '精益生产', '品质管理QC', '计量检测', '供应商管理'] },
    { name: '通用技能', skills: ['办公软件Office', '沟通协调', '生产管理', '仓库管理', '人力资源', '财务会计'] },
    { name: '智能制造', skills: ['MES系统', '工业机器人', '自动化设计', '物联网', '大数据分析', 'AI应用'] },
  ];

  const nodes = categories.map((cat, ci) => ({
    id: `cat_${ci}`,
    name: cat.name,
    type: 'category',
    value: cat.skills.length * 10,
    skills: cat.skills.map((s, si) => ({
      id: `skill_${ci}_${si}`,
      name: s,
      weight: Math.floor(Math.random() * 80) + 20,
      trend: Math.floor(Math.random() * 60) - 10,
    })),
  }));

  res.json(ok({ categories: nodes }));
});

router.post('/skill-graph', async (req: Request, res: Response): Promise<void> => {
  const { name, category, weight } = req.body as { name: string; category: string; weight?: number };
  res.json(ok({
    skillId: `skill_new_${Date.now()}`,
    name,
    category,
    weight: weight || 50,
    createdAt: new Date().toISOString(),
  }, '技能添加成功'));
});

router.get('/system-config', async (req: Request, res: Response): Promise<void> => {
  const config = {
    channels: [
      { id: 'recruit_site', name: '招聘网站', enabled: true, defaultBudget: 30000 },
      { id: 'referral', name: '内推', enabled: true, defaultBudget: 15000 },
      { id: 'township', name: '镇街', enabled: true, defaultBudget: 15000 },
      { id: 'campus', name: '校园', enabled: true, defaultBudget: 15000 },
      { id: 'headhunter', name: '猎头', enabled: true, defaultBudget: 80000 },
      { id: 'rpo', name: 'RPO', enabled: true, defaultBudget: 60000 },
    ],
    subsidyTypes: [
      { id: 'enterprise_hire', name: '企业吸纳就业补贴', maxAmount: 20000, requiredDocs: 5 },
      { id: 'graduate', name: '高校毕业生就业补贴', maxAmount: 8000, requiredDocs: 4 },
      { id: 'skill_upgrade', name: '技能提升补贴', maxAmount: 5000, requiredDocs: 4 },
      { id: 'social_insurance', name: '社保补贴', maxAmount: 3000, requiredDocs: 4 },
    ],
    rolePermissions: [
      { role: '运营专员', modules: ['企业审核', '镇街运营', '技能图谱'] },
      { role: '政府专员', modules: ['补贴审核', '数据看板', '补贴发放'] },
      { role: '超级管理员', modules: ['全部模块', '系统配置', '用户管理'] },
    ],
    notifications: {
      email: true,
      sms: true,
      wechat: true,
      thresholdEnterprisePending: 5,
      thresholdSubsidyPending: 10,
    },
  };

  res.json(ok(config));
});

export default router;
