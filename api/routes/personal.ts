import { Router, Request, Response } from 'express';
import db from '../database';
import { authMiddleware, authLevelMiddleware } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../utils/response';
import type { Certificate, ProgressItem, ProgressStep, Policy } from '../../shared/types';

const router = Router();

router.use(authMiddleware(), authLevelMiddleware(1));

router.get('/certificates', auditMiddleware('list_certificates', 'certificate'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const certs = db
    .prepare(
      `SELECT c.*, ct.name as cert_type_name, ct.category
       FROM certificates c
       JOIN certificate_types ct ON c.cert_type_id = ct.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`
    )
    .all(req.user.userId) as any[];

  const result: Certificate[] = certs.map((c) => ({
    id: c.id,
    userId: c.user_id,
    certType: c.cert_type_id,
    certTypeName: c.cert_type_name,
    certNo: c.cert_no.substring(0, 4) + '****' + c.cert_no.slice(-4),
    issuer: c.issuer,
    issueDate: c.issue_date,
    expiryDate: c.expiry_date || undefined,
    status: c.status,
    metadata: JSON.parse(c.metadata || '{}'),
    qrCode: c.qr_code,
    verifyUrl: c.verify_url,
    category: c.category,
  }));

  successResponse(res, result, '获取证照列表成功');
});

router.get('/certificates/:id', auditMiddleware('view_certificate', 'certificate'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const cert = db
    .prepare(
      `SELECT c.*, ct.name as cert_type_name, ct.category
       FROM certificates c
       JOIN certificate_types ct ON c.cert_type_id = ct.id
       WHERE c.id = ? AND c.user_id = ?`
    )
    .get(req.params.id, req.user.userId) as any;

  if (!cert) {
    return errorResponse(res, '证照不存在', 404);
  }

  const result: Certificate = {
    id: cert.id,
    userId: cert.user_id,
    certType: cert.cert_type_id,
    certTypeName: cert.cert_type_name,
    certNo: cert.cert_no.substring(0, 4) + '****' + cert.cert_no.slice(-4),
    issuer: cert.issuer,
    issueDate: cert.issue_date,
    expiryDate: cert.expiry_date || undefined,
    status: cert.status,
    metadata: JSON.parse(cert.metadata || '{}'),
    qrCode: cert.qr_code,
    verifyUrl: cert.verify_url,
    category: cert.category,
  };

  successResponse(res, result, '获取证照详情成功');
});

router.get('/progress', auditMiddleware('list_progress', 'application'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const { status, page = 1, pageSize = 10 } = req.query;

  let query = `
    SELECT a.*, s.name as service_name, s.category as service_type
    FROM applications a
    JOIN one_stop_services s ON a.service_id = s.id
    WHERE a.user_id = ?
  `;
  const params: any[] = [req.user.userId];

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }

  query += ' ORDER BY a.submit_time DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const apps = db.prepare(query).all(...params) as any[];

  const result: ProgressItem[] = apps.map((app) => {
    const steps = db
      .prepare('SELECT * FROM application_steps WHERE application_id = ? ORDER BY step_id')
      .all(app.id) as any[];

    const progressSteps: ProgressStep[] = steps.map((s, idx) => ({
      stepNo: idx + 1,
      name: s.step_name,
      status: s.status,
      time: s.end_time || s.start_time || undefined,
      operator: s.operator || undefined,
      remark: s.remark || undefined,
      department: s.department || undefined,
    }));

    return {
      id: app.id,
      serviceName: app.service_name,
      serviceType: app.service_type,
      status: app.status,
      currentStep: app.current_step,
      totalSteps: app.total_steps,
      steps: progressSteps,
      submitTime: app.submit_time,
      estimatedTime: app.complete_time || undefined,
    };
  });

  const total = db
    .prepare(
      `SELECT COUNT(*) as count FROM applications a WHERE a.user_id = ? ${status ? 'AND a.status = ?' : ''}`
    )
    .get(...(status ? [req.user.userId, status] : [req.user.userId])) as { count: number };

  successResponse(
    res,
    {
      items: result,
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total.count / Number(pageSize)),
    },
    '获取办件进度成功'
  );
});

router.get('/progress/:id', auditMiddleware('view_progress', 'application'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const app = db
    .prepare(
      `SELECT a.*, s.name as service_name, s.category as service_type, s.flow_steps
       FROM applications a
       JOIN one_stop_services s ON a.service_id = s.id
       WHERE a.id = ? AND a.user_id = ?`
    )
    .get(req.params.id, req.user.userId) as any;

  if (!app) {
    return errorResponse(res, '办件不存在', 404);
  }

  const steps = db
    .prepare('SELECT * FROM application_steps WHERE application_id = ? ORDER BY step_id')
    .all(app.id) as any[];

  const progressSteps: ProgressStep[] = steps.map((s, idx) => ({
    stepNo: idx + 1,
    name: s.step_name,
    status: s.status,
    time: s.end_time || s.start_time || undefined,
    operator: s.operator || undefined,
    remark: s.remark || undefined,
    department: s.department || undefined,
  }));

  const result: ProgressItem = {
    id: app.id,
    serviceName: app.service_name,
    serviceType: app.service_type,
    status: app.status,
    currentStep: app.current_step,
    totalSteps: app.total_steps,
    steps: progressSteps,
    submitTime: app.submit_time,
    estimatedTime: app.complete_time || undefined,
  };

  successResponse(res, result, '获取办件详情成功');
});

router.get('/policies', auditMiddleware('list_policies', 'policy'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const { category, page = 1, pageSize = 10 } = req.query;

  let query = 'SELECT * FROM policies';
  const params: any[] = [];

  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  query += ' ORDER BY publish_date DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const policies = db.prepare(query).all(...params) as any[];

  const result: Policy[] = policies.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    source: p.source,
    publishDate: p.publish_date,
    summary: p.summary,
    matchScore: Math.floor(Math.random() * 30 + 70),
    eligibility: JSON.parse(p.eligibility || '[]'),
    applyUrl: p.apply_url || undefined,
    tags: JSON.parse(p.tags || '[]'),
    viewCount: p.view_count,
  }));

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM policies ${category ? 'WHERE category = ?' : ''}`)
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
    '获取政策列表成功'
  );
});

router.get('/policies/:id', auditMiddleware('view_policy', 'policy'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  db.prepare('UPDATE policies SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id) as any;

  if (!policy) {
    return errorResponse(res, '政策不存在', 404);
  }

  const result: Policy = {
    id: policy.id,
    title: policy.title,
    category: policy.category,
    source: policy.source,
    publishDate: policy.publish_date,
    summary: policy.summary,
    matchScore: Math.floor(Math.random() * 30 + 70),
    eligibility: JSON.parse(policy.eligibility || '[]'),
    applyUrl: policy.apply_url || undefined,
    tags: JSON.parse(policy.tags || '[]'),
    viewCount: policy.view_count + 1,
  };

  successResponse(res, result, '获取政策详情成功');
});

export default router;
