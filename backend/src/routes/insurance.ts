import { Router, Response } from 'express';
import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/policies', authMiddleware(), (req: AuthRequest, res: Response) => {
  const { worker_id, status } = req.query;

  let where = [];
  let params: any[] = [];

  if (worker_id) {
    where.push('worker_id = ?');
    params.push(worker_id);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const list = db.prepare(`
    SELECT ip.*, w.name as worker_name, o.title as order_title
    FROM insurance_policies ip
    LEFT JOIN workers w ON ip.worker_id = w.id
    LEFT JOIN orders o ON ip.order_id = o.id
    ${whereSql}
    ORDER BY ip.created_at DESC
  `).all(...params);

  res.json({ list });
});

router.get('/policies/:id', authMiddleware(), (req: AuthRequest, res: Response) => {
  const policy = db.prepare(`
    SELECT ip.*, w.name as worker_name, o.title as order_title
    FROM insurance_policies ip
    LEFT JOIN workers w ON ip.worker_id = w.id
    LEFT JOIN orders o ON ip.order_id = o.id
    WHERE ip.id = ?
  `).get(req.params.id);

  if (!policy) {
    return res.status(404).json({ error: '保单不存在' });
  }

  res.json({ policy });
});

router.post('/policies', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const { worker_id, order_id, insurance_type, coverage_amount, premium, start_date, end_date } = req.body;

  if (!worker_id || !insurance_type || !coverage_amount || !premium || !start_date || !end_date) {
    return res.status(400).json({ error: '必填项不能为空' });
  }

  const policyNumber = `INS${Date.now()}`;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO insurance_policies (id, worker_id, order_id, policy_number, insurance_type, coverage_amount, premium, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(id, worker_id, order_id || null, policyNumber, insurance_type, coverage_amount, premium, start_date, end_date);

  res.json({ success: true, id, policy_number: policyNumber, message: '投保成功' });
});

router.get('/disputes', authMiddleware(), (req: AuthRequest, res: Response) => {
  const { page = 1, pageSize = 10, status } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = [];
  let params: any[] = [];

  if (status) {
    where.push('status = ?');
    params.push(status);
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM dispute_tickets ${whereSql}`).get(...params) as any;
  const list = db.prepare(`
    SELECT dt.*,
      o.title as order_title,
      w.name as worker_name,
      e.name as employer_name
    FROM dispute_tickets dt
    LEFT JOIN orders o ON dt.order_id = o.id
    LEFT JOIN workers w ON o.worker_id = w.id
    LEFT JOIN employers e ON o.employer_id = e.id
    ${whereSql}
    ORDER BY dt.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  res.json({
    list,
    total: total.count,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});

router.get('/disputes/:id', authMiddleware(), (req: AuthRequest, res: Response) => {
  const dispute = db.prepare(`
    SELECT dt.*,
      o.title as order_title,
      o.actual_amount,
      w.name as worker_name,
      e.name as employer_name
    FROM dispute_tickets dt
    LEFT JOIN orders o ON dt.order_id = o.id
    LEFT JOIN workers w ON o.worker_id = w.id
    LEFT JOIN employers e ON o.employer_id = e.id
    WHERE dt.id = ?
  `).get(req.params.id);

  if (!dispute) {
    return res.status(404).json({ error: '工单不存在' });
  }

  res.json({ dispute });
});

router.post('/disputes', authMiddleware(['worker', 'employer']), (req: AuthRequest, res: Response) => {
  const { order_id, title, description, evidence } = req.body;

  if (!order_id || !title || !description) {
    return res.status(400).json({ error: '必填项不能为空' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id) as any;
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const reporterType = req.user!.role === 'worker' ? 'worker' : 'employer';
  const id = uuidv4();

  db.prepare(`
    INSERT INTO dispute_tickets (id, order_id, reporter_id, reporter_type, title, description, evidence, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(id, order_id, req.user!.id, reporterType, title, description, evidence ? JSON.stringify(evidence) : null);

  db.prepare("UPDATE orders SET status = 'disputed' WHERE id = ?").run(order_id);

  res.json({ success: true, id, message: '纠纷工单已提交' });
});

router.post('/disputes/:id/process', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const { resolution } = req.body;

  db.prepare(`
    UPDATE dispute_tickets SET
      status = 'processing',
      handler_id = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user!.id, req.params.id);

  res.json({ success: true, message: '工单已受理' });
});

router.post('/disputes/:id/resolve', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const { resolution } = req.body;

  if (!resolution) {
    return res.status(400).json({ error: '处理结果不能为空' });
  }

  const ticket = db.prepare('SELECT * FROM dispute_tickets WHERE id = ?').get(req.params.id) as any;

  db.prepare(`
    UPDATE dispute_tickets SET
      status = 'resolved',
      resolution = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(resolution, req.params.id);

  db.prepare("UPDATE orders SET status = 'completed' WHERE id = ?").run(ticket.order_id);

  res.json({ success: true, message: '纠纷已处理完成' });
});

router.get('/salaries', authMiddleware(), (req: AuthRequest, res: Response) => {
  const { page = 1, pageSize = 10, worker_id, status } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = [];
  let params: any[] = [];

  if (worker_id) {
    where.push('worker_id = ?');
    params.push(worker_id);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM salary_records ${whereSql}`).get(...params) as any;
  const list = db.prepare(`
    SELECT sr.*,
      w.name as worker_name,
      o.title as order_title
    FROM salary_records sr
    LEFT JOIN workers w ON sr.worker_id = w.id
    LEFT JOIN orders o ON sr.order_id = o.id
    ${whereSql}
    ORDER BY sr.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending
    FROM salary_records
  `).get();

  res.json({
    list,
    total: total.count,
    page: Number(page),
    pageSize: Number(pageSize),
    stats,
  });
});

router.post('/salaries/:id/pay', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const transactionId = `TXN${Date.now()}`;

  db.prepare(`
    UPDATE salary_records SET
      status = 'paid',
      transaction_id = ?,
      paid_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(transactionId, req.params.id);

  res.json({ success: true, transaction_id: transactionId, message: '薪资已发放' });
});

export default router;
