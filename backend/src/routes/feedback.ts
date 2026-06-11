import { Router } from 'express';
import db from '../database.js';
import { authMiddleware, AuthRequest, adminMiddleware } from '../middleware/auth.js';
import { successResponse, errorResponse, generateRequestNo, paginate } from '../utils/common.js';

const router = Router();

router.post('/submit', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { type, title, content, images } = req.body;

  if (!type || !title || !content) {
    return errorResponse(res, '反馈类型、标题和内容不能为空');
  }

  const ticketNo = generateRequestNo('FK');

  const result = db.prepare(
    `INSERT INTO feedbacks 
     (user_id, type, title, content, images, ticket_no) 
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    type,
    title,
    content,
    JSON.stringify(images || []),
    ticketNo
  );

  const feedback = db.prepare(
    'SELECT id, ticket_no, type, title, content, status, created_at FROM feedbacks WHERE id = ?'
  ).get(result.lastInsertRowid);

  return successResponse(res, feedback, '反馈提交成功');
});

router.get('/list', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { page = 1, pageSize = 10, status, type } = req.query as any;

  let sql = 'SELECT * FROM feedbacks WHERE user_id = ?';
  const params: any[] = [userId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY created_at DESC';

  const feedbacks = db.prepare(sql).all(...params);
  const result = paginate(feedbacks, parseInt(page), parseInt(pageSize));

  return successResponse(res, result);
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  const feedback: any = db.prepare(
    'SELECT * FROM feedbacks WHERE id = ? AND user_id = ?'
  ).get(id, userId);

  if (!feedback) {
    return errorResponse(res, '反馈不存在', 404);
  }

  if (feedback.images) {
    feedback.images = JSON.parse(feedback.images);
  }

  return successResponse(res, feedback);
});

router.get('/ticket/:ticket_no', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { ticket_no } = req.params;

  const feedback: any = db.prepare(
    'SELECT * FROM feedbacks WHERE ticket_no = ? AND user_id = ?'
  ).get(ticket_no, userId);

  if (!feedback) {
    return errorResponse(res, '工单不存在', 404);
  }

  if (feedback.images) {
    feedback.images = JSON.parse(feedback.images);
  }

  feedback.handle_logs = [
    { time: feedback.created_at, action: '提交反馈', operator: '用户', remark: '反馈已提交，等待处理' },
    feedback.handle_time ? { time: feedback.handle_time, action: '处理完成', operator: '管理员', remark: feedback.handle_result } : { time: null, action: '处理中', operator: null, remark: '正在处理中，请耐心等待' }
  ].filter(log => log.time);

  return successResponse(res, feedback);
});

router.put('/:ticket_no/handle', adminMiddleware, (req: AuthRequest, res) => {
  const { ticket_no } = req.params;
  const { handle_result, handler_id } = req.body;

  if (!handle_result) {
    return errorResponse(res, '处理结果不能为空');
  }

  const feedback = db.prepare('SELECT * FROM feedbacks WHERE ticket_no = ?').get(ticket_no);
  if (!feedback) {
    return errorResponse(res, '工单不存在', 404);
  }

  db.prepare(
    `UPDATE feedbacks 
     SET status = 'resolved', handle_result = ?, handler_id = ?, handle_time = datetime(\"now\"), updated_at = datetime(\"now\") 
     WHERE ticket_no = ?`
  ).run(handle_result, handler_id || req.user?.id, ticket_no);

  const updatedFeedback = db.prepare('SELECT * FROM feedbacks WHERE ticket_no = ?').get(ticket_no);

  return successResponse(res, updatedFeedback, '工单处理完成');
});

router.post('/:ticket_no/evaluate', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { ticket_no } = req.params;
  const { satisfaction_rating, satisfaction_comment } = req.body;

  if (!satisfaction_rating || satisfaction_rating < 1 || satisfaction_rating > 5) {
    return errorResponse(res, '满意度评分必须在1-5之间');
  }

  const feedback = db.prepare(
    'SELECT * FROM feedbacks WHERE ticket_no = ? AND user_id = ?'
  ).get(ticket_no, userId);

  if (!feedback) {
    return errorResponse(res, '工单不存在', 404);
  }

  if (feedback.status !== 'resolved') {
    return errorResponse(res, '只能对已处理的工单进行评价');
  }

  db.prepare(
    `UPDATE feedbacks 
     SET satisfaction_rating = ?, satisfaction_comment = ?, updated_at = datetime(\"now\") 
     WHERE ticket_no = ?`
  ).run(satisfaction_rating, satisfaction_comment || null, ticket_no);

  return successResponse(res, {
    ticket_no,
    satisfaction_rating,
    satisfaction_comment,
    evaluated: true
  }, '评价成功');
});

router.get('/admin/list', adminMiddleware, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 10, status, type } = req.query as any;

  let sql = `SELECT f.*, u.username, u.real_name 
             FROM feedbacks f 
             LEFT JOIN users u ON f.user_id = u.id`;
  const params: any[] = [];
  const conditions: string[] = [];

  if (status) {
    conditions.push('f.status = ?');
    params.push(status);
  }

  if (type) {
    conditions.push('f.type = ?');
    params.push(type);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY f.created_at DESC';

  const feedbacks = db.prepare(sql).all(...params);
  const result = paginate(feedbacks, parseInt(page), parseInt(pageSize));

  return successResponse(res, result);
});

export default router;
