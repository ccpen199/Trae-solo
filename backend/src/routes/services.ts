import { Router } from 'express';
import db from '../database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { successResponse, errorResponse, generateRequestNo, paginate } from '../utils/common.js';

const router = Router();

router.get('/categories', (req, res) => {
  const categories = db.prepare(
    'SELECT * FROM service_categories WHERE status = 1 ORDER BY sort_order ASC, id ASC'
  ).all();

  return successResponse(res, categories);
});

router.get('/categories/:id', (req, res) => {
  const { id } = req.params;
  
  const category = db.prepare('SELECT * FROM service_categories WHERE id = ?').get(id);
  
  if (!category) {
    return errorResponse(res, '分类不存在', 404);
  }

  const services = db.prepare(
    'SELECT * FROM services WHERE category_id = ? AND status = 1 ORDER BY sort_order ASC, id ASC'
  ).all(id);

  return successResponse(res, { ...category, services });
});

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, category_id, keyword } = req.query as any;
  
  let sql = 'SELECT s.*, c.name as category_name FROM services s LEFT JOIN service_categories c ON s.category_id = c.id WHERE s.status = 1';
  const params: any[] = [];

  if (category_id) {
    sql += ' AND s.category_id = ?';
    params.push(category_id);
  }

  if (keyword) {
    sql += ' AND (s.name LIKE ? OR s.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ' ORDER BY s.sort_order ASC, s.id ASC';
  
  const services = db.prepare(sql).all(...params);
  const result = paginate(services, parseInt(page), parseInt(pageSize));

  return successResponse(res, result);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const service: any = db.prepare(
    'SELECT s.*, c.name as category_name FROM services s LEFT JOIN service_categories c ON s.category_id = c.id WHERE s.id = ?'
  ).get(id);

  if (!service) {
    return errorResponse(res, '服务不存在', 404);
  }

  if (service.required_materials) {
    service.required_materials = JSON.parse(service.required_materials);
  }
  if (service.handling_process) {
    service.handling_process = JSON.parse(service.handling_process);
  }
  if (service.fee_standard) {
    service.fee_standard = JSON.parse(service.fee_standard);
  }

  return successResponse(res, service);
});

router.post('/apply', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { service_id, application_data } = req.body;

  if (!service_id) {
    return errorResponse(res, '服务ID不能为空');
  }

  const service = db.prepare('SELECT * FROM services WHERE id = ? AND status = 1').get(service_id);
  if (!service) {
    return errorResponse(res, '服务不存在或已下架');
  }

  const requestNo = generateRequestNo('BJ');
  
  const userCertificates = db.prepare(
    'SELECT id FROM certificates WHERE user_id = ? AND status = 1'
  ).all(userId as number);
  
  const certificateIds = userCertificates.map((c: any) => c.id);

  const result = db.prepare(
    `INSERT INTO service_applications 
     (request_no, user_id, service_id, application_data, certificate_ids, total_steps) 
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    requestNo,
    userId,
    service_id,
    JSON.stringify(application_data || {}),
    JSON.stringify(certificateIds),
    3
  );

  const application = db.prepare(
    `SELECT sa.*, s.name as service_name, s.code as service_code 
     FROM service_applications sa 
     LEFT JOIN services s ON sa.service_id = s.id 
     WHERE sa.id = ?`
  ).get(result.lastInsertRowid);

  return successResponse(res, {
    id: application.id,
    request_no: application.request_no,
    service_name: application.service_name,
    service_code: application.service_code,
    status: application.status,
    current_step: application.current_step,
    total_steps: application.total_steps,
    submit_time: application.submit_time,
    estimated_complete_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    certificate_count: certificateIds.length
  }, '申请提交成功');
});

router.get('/applications/list', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { page = 1, pageSize = 10, status } = req.query as any;

  let sql = `SELECT sa.*, s.name as service_name, s.icon as service_icon 
             FROM service_applications sa 
             LEFT JOIN services s ON sa.service_id = s.id 
             WHERE sa.user_id = ?`;
  const params: any[] = [userId];

  if (status) {
    sql += ' AND sa.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY sa.created_at DESC';

  const applications = db.prepare(sql).all(...params);
  const result = paginate(applications, parseInt(page), parseInt(pageSize));

  return successResponse(res, result);
});

router.get('/applications/:request_no', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { request_no } = req.params;

  const application: any = db.prepare(
    `SELECT sa.*, s.name as service_name, s.code as service_code, s.description as service_description,
            s.handling_time, s.handling_place
     FROM service_applications sa 
     LEFT JOIN services s ON sa.service_id = s.id 
     WHERE sa.request_no = ? AND sa.user_id = ?`
  ).get(request_no, userId);

  if (!application) {
    return errorResponse(res, '办件不存在', 404);
  }

  if (application.application_data) {
    application.application_data = JSON.parse(application.application_data);
  }
  if (application.certificate_ids) {
    const certIds = JSON.parse(application.certificate_ids);
    application.certificates = db.prepare(
      'SELECT id, cert_type, cert_name, cert_no, issuer FROM certificates WHERE id IN (' + certIds.map(() => '?').join(',') + ')'
    ).all(...certIds);
  }

  application.progress_logs = [
    { step: 1, name: '提交申请', status: 'completed', time: application.submit_time, remark: '已成功提交申请' },
    { step: 2, name: '材料审核', status: application.current_step >= 1 ? 'completed' : 'processing', time: application.accept_time, remark: application.accept_time ? '材料审核通过' : '待审核' },
    { step: 3, name: '业务办理', status: application.current_step >= 2 ? 'completed' : 'pending', time: null, remark: '待办理' },
    { step: 4, name: '办结出证', status: application.current_step >= 3 ? 'completed' : 'pending', time: application.complete_time, remark: application.complete_time ? '已办结' : '待办结' }
  ];

  return successResponse(res, application);
});

router.post('/applications/:request_no/evaluate', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { request_no } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return errorResponse(res, '评分必须在1-5之间');
  }

  const application = db.prepare(
    'SELECT * FROM service_applications WHERE request_no = ? AND user_id = ?'
  ).get(request_no, userId);

  if (!application) {
    return errorResponse(res, '办件不存在', 404);
  }

  if (application.status !== 'completed') {
    return errorResponse(res, '只能对已办结的办件进行评价');
  }

  db.prepare(
    'UPDATE service_applications SET rating = ?, comment = ?, updated_at = datetime(\"now\") WHERE request_no = ?'
  ).run(rating, comment || null, request_no);

  return successResponse(res, null, '评价成功');
});

export default router;
