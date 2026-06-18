import { Router, Request, Response } from 'express';
import db from '../database';
import { authMiddleware, authLevelMiddleware } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../utils/response';
import type { EnterpriseInfo, LifecycleNode, SubsidyPolicy } from '../../shared/types';

const router = Router();

router.use(authMiddleware(['enterprise', 'government']), authLevelMiddleware(2));

router.get('/info', auditMiddleware('get_enterprise_info', 'enterprise'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const enterprise = db
    .prepare('SELECT * FROM enterprises WHERE user_id = ?')
    .get(req.user.userId) as any;

  if (!enterprise) {
    return errorResponse(res, '企业信息不存在', 404);
  }

  const result: EnterpriseInfo = {
    id: enterprise.id,
    name: enterprise.name,
    creditCode: enterprise.credit_code.substring(0, 8) + '********' + enterprise.credit_code.slice(-4),
    legalPerson: enterprise.legal_person,
    establishDate: enterprise.establish_date,
    status: enterprise.status,
    industry: enterprise.industry,
    registeredAddress: enterprise.registered_address,
    businessScope: enterprise.business_scope,
    lifecycleStage: enterprise.lifecycle_stage,
  };

  successResponse(res, result, '获取企业信息成功');
});

router.get('/lifecycle', auditMiddleware('get_lifecycle', 'enterprise'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const enterprise = db
    .prepare('SELECT * FROM enterprises WHERE user_id = ?')
    .get(req.user.userId) as any;

  if (!enterprise) {
    return errorResponse(res, '企业信息不存在', 404);
  }

  const lifecycleNodes: LifecycleNode[] = [
    {
      id: 'n1',
      name: '企业设立',
      type: 'milestone',
      status: 'completed',
      date: enterprise.establish_date,
      description: '完成工商注册登记，取得营业执照',
      services: ['企业开办一窗通'],
    },
    {
      id: 'n2',
      name: '税务登记',
      type: 'service',
      status: 'completed',
      date: enterprise.establish_date,
      description: '完成税务报到，核定税种',
      services: ['税务登记', '发票申领'],
    },
    {
      id: 'n3',
      name: '社保开户',
      type: 'service',
      status: 'completed',
      date: '2024-03-20',
      description: '开立社保账户，开始缴纳社保',
      services: ['社保开户', '公积金开户'],
    },
    {
      id: 'n4',
      name: '高新技术企业认定',
      type: 'milestone',
      status: 'current',
      description: '正在申请高新技术企业认定',
      services: ['高企认定辅导', '研发费用补贴'],
    },
    {
      id: 'n5',
      name: '股权融资',
      type: 'event',
      status: 'upcoming',
      description: '计划进行A轮融资',
      services: ['科技型中小企业贷款', '融资对接服务'],
    },
    {
      id: 'n6',
      name: '规模升级',
      type: 'milestone',
      status: 'upcoming',
      description: '计划2025年达到规模以上企业标准',
      services: ['小升规培育', '企业上市辅导'],
    },
  ];

  successResponse(res, { enterprise, lifecycle: lifecycleNodes }, '获取企业生命周期成功');
});

router.get('/subsidies', auditMiddleware('list_subsidies', 'subsidy'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const { category, page = 1, pageSize = 10 } = req.query;

  let query = 'SELECT * FROM subsidy_policies WHERE active = 1';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY application_end DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const subsidies = db.prepare(query).all(...params) as any[];

  const result: SubsidyPolicy[] = subsidies.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    amount: s.amount,
    eligibility: JSON.parse(s.eligibility || '[]'),
    applicationPeriod: {
      start: s.application_start,
      end: s.application_end,
    },
    requiredMaterials: JSON.parse(s.required_materials || '[]'),
    processSteps: JSON.parse(s.process_steps || '[]'),
    description: s.description,
    active: s.active ? true : false,
  }));

  const total = db
    .prepare(
      `SELECT COUNT(*) as count FROM subsidy_policies WHERE active = 1 ${category ? 'AND category = ?' : ''}`
    )
    .get(...(category ? [category] : [])) as { count: number };

  successResponse(
    res,
    {
      items: result,
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total.count / Number(pageSize)),
    },
    '获取补贴政策成功'
  );
});

router.get('/subsidies/:id', auditMiddleware('view_subsidy', 'subsidy'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const subsidy = db.prepare('SELECT * FROM subsidy_policies WHERE id = ?').get(req.params.id) as any;

  if (!subsidy) {
    return errorResponse(res, '补贴政策不存在', 404);
  }

  const result: SubsidyPolicy = {
    id: subsidy.id,
    name: subsidy.name,
    category: subsidy.category,
    amount: subsidy.amount,
    eligibility: JSON.parse(subsidy.eligibility || '[]'),
    applicationPeriod: {
      start: subsidy.application_start,
      end: subsidy.application_end,
    },
    requiredMaterials: JSON.parse(subsidy.required_materials || '[]'),
    processSteps: JSON.parse(subsidy.process_steps || '[]'),
    description: subsidy.description,
    active: subsidy.active ? true : false,
  };

  successResponse(res, result, '获取补贴详情成功');
});

router.post('/subsidy/apply', auditMiddleware('apply_subsidy', 'subsidy'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const { policyId, materials } = req.body;

  if (!policyId) {
    return errorResponse(res, '请选择要申请的补贴政策', 400);
  }

  const enterprise = db
    .prepare('SELECT * FROM enterprises WHERE user_id = ?')
    .get(req.user.userId) as any;

  if (!enterprise) {
    return errorResponse(res, '企业信息不存在', 404);
  }

  const policy = db.prepare('SELECT * FROM subsidy_policies WHERE id = ? AND active = 1').get(policyId) as any;
  if (!policy) {
    return errorResponse(res, '补贴政策不存在或已结束', 404);
  }

  const applicationId = 'subsidy_app_' + Date.now();

  db.prepare(`
    INSERT INTO subsidy_applications (id, enterprise_id, policy_id, status, apply_time, materials)
    VALUES (?, ?, ?, 'submitted', ?, ?)
  `).run(
    applicationId,
    enterprise.id,
    policyId,
    new Date().toISOString(),
    JSON.stringify(materials || [])
  );

  successResponse(
    res,
    { applicationId, status: 'submitted', policyName: policy.name },
    '补贴申请提交成功'
  );
});

router.get('/subsidy/applications', auditMiddleware('list_subsidy_applications', 'subsidy'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const enterprise = db
    .prepare('SELECT * FROM enterprises WHERE user_id = ?')
    .get(req.user.userId) as any;

  if (!enterprise) {
    return errorResponse(res, '企业信息不存在', 404);
  }

  const applications = db
    .prepare(
      `SELECT sa.*, sp.name as policy_name, sp.amount as policy_amount
       FROM subsidy_applications sa
       JOIN subsidy_policies sp ON sa.policy_id = sp.id
       WHERE sa.enterprise_id = ?
       ORDER BY sa.apply_time DESC`
    )
    .all(enterprise.id) as any[];

  const result = applications.map((a) => ({
    id: a.id,
    policyId: a.policy_id,
    policyName: a.policy_name,
    policyAmount: a.policy_amount,
    appliedAmount: a.amount,
    status: a.status,
    applyTime: a.apply_time,
    reviewTime: a.review_time,
    paymentTime: a.payment_time,
  }));

  successResponse(res, result, '获取补贴申请记录成功');
});

export default router;
