import { Router } from 'express';
import db from '../database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { successResponse, errorResponse, paginate } from '../utils/common.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { page = 1, pageSize = 10, cert_type } = req.query as any;

  let sql = 'SELECT * FROM certificates WHERE user_id = ? AND status = 1';
  const params: any[] = [userId];

  if (cert_type) {
    sql += ' AND cert_type = ?';
    params.push(cert_type);
  }

  sql += ' ORDER BY created_at DESC';

  const certificates = db.prepare(sql).all(...params);
  const result = paginate(certificates, parseInt(page), parseInt(pageSize));

  return successResponse(res, result);
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  const certificate: any = db.prepare(
    'SELECT * FROM certificates WHERE id = ? AND user_id = ? AND status = 1'
  ).get(id, userId);

  if (!certificate) {
    return errorResponse(res, '证照不存在', 404);
  }

  if (certificate.cert_data) {
    certificate.cert_data = JSON.parse(certificate.cert_data);
  }

  return successResponse(res, certificate);
});

router.post('/verify', authMiddleware, (req: AuthRequest, res) => {
  const { cert_no, cert_type } = req.body;

  if (!cert_no) {
    return errorResponse(res, '证照编号不能为空');
  }

  const certificate: any = db.prepare(
    'SELECT * FROM certificates WHERE cert_no = ? AND status = 1'
  ).get(cert_no);

  if (!certificate) {
    return errorResponse(res, '证照不存在或已失效', 404);
  }

  if (cert_type && certificate.cert_type !== cert_type) {
    return errorResponse(res, '证照类型不匹配');
  }

  if (certificate.expire_date && new Date(certificate.expire_date) < new Date()) {
    return errorResponse(res, '证照已过期');
  }

  if (certificate.cert_data) {
    certificate.cert_data = JSON.parse(certificate.cert_data);
  }

  return successResponse(res, {
    id: certificate.id,
    cert_type: certificate.cert_type,
    cert_name: certificate.cert_name,
    cert_no: certificate.cert_no,
    issuer: certificate.issuer,
    issue_date: certificate.issue_date,
    expire_date: certificate.expire_date,
    status: 'valid',
    verify_time: new Date().toISOString(),
    message: '证照核验通过'
  }, '核验通过');
});

router.post('/:id/link-application', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { request_no } = req.body;

  if (!request_no) {
    return errorResponse(res, '办件编号不能为空');
  }

  const certificate = db.prepare(
    'SELECT * FROM certificates WHERE id = ? AND user_id = ? AND status = 1'
  ).get(id, userId);

  if (!certificate) {
    return errorResponse(res, '证照不存在', 404);
  }

  const application: any = db.prepare(
    'SELECT * FROM service_applications WHERE request_no = ? AND user_id = ?'
  ).get(request_no, userId);

  if (!application) {
    return errorResponse(res, '办件不存在', 404);
  }

  let certificateIds = application.certificate_ids ? JSON.parse(application.certificate_ids) : [];
  
  if (!certificateIds.includes(parseInt(id))) {
    certificateIds.push(parseInt(id));
    db.prepare(
      'UPDATE service_applications SET certificate_ids = ?, updated_at = datetime(\"now\") WHERE request_no = ?'
    ).run(JSON.stringify(certificateIds), request_no);
  }

  return successResponse(res, {
    request_no: request_no,
    certificate_id: id,
    linked: true,
    total_certificates: certificateIds.length
  }, '证照已关联到办件');
});

router.post('/add', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { cert_type, cert_no, cert_name, issuer, issue_date, expire_date, cert_data } = req.body;

  if (!cert_type || !cert_no || !cert_name) {
    return errorResponse(res, '证照类型、编号和名称不能为空');
  }

  const existingCert = db.prepare('SELECT * FROM certificates WHERE cert_no = ?').get(cert_no);
  if (existingCert) {
    return errorResponse(res, '该证照编号已存在');
  }

  const result = db.prepare(
    `INSERT INTO certificates 
     (user_id, cert_type, cert_no, cert_name, issuer, issue_date, expire_date, cert_data) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    cert_type,
    cert_no,
    cert_name,
    issuer || null,
    issue_date || null,
    expire_date || null,
    JSON.stringify(cert_data || {})
  );

  const certificate = db.prepare('SELECT * FROM certificates WHERE id = ?').get(result.lastInsertRowid);

  return successResponse(res, certificate, '证照添加成功');
});

export default router;
