import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware';
import { WorkOrder, NPSRecord } from '../types';

const router = Router();

const createOrderSchema = z.object({
  contract_id: z.string().optional(),
  type: z.enum(['complaint', 'maintenance', 'consultation', 'warranty']),
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const result = createOrderSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO work_orders (id, contract_id, type, title, description, submitter_id, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    id,
    result.data.contract_id || null,
    result.data.type,
    result.data.title,
    result.data.description || null,
    req.user!.id,
    now
  );

  const order = db.prepare(`
    SELECT w.*, u.real_name as submitter_name, h.real_name as handler_name
    FROM work_orders w
    LEFT JOIN users u ON w.submitter_id = u.id
    LEFT JOIN users h ON w.handler_id = h.id
    WHERE w.id = ?
  `).get(id);

  res.status(201).json(order);
});

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const { status, type, contract_id } = req.query;
  let query = `
    SELECT w.*,
      u.real_name as submitter_name,
      h.real_name as handler_name,
      c.contract_no
    FROM work_orders w
    LEFT JOIN users u ON w.submitter_id = u.id
    LEFT JOIN users h ON w.handler_id = h.id
    LEFT JOIN decoration_contracts c ON w.contract_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (req.user!.role === 'owner') {
    query += ' AND w.submitter_id = ?';
    params.push(req.user!.id);
  } else if (req.user!.role === 'store_manager' || req.user!.role === 'supervisor') {
    query += ` AND (w.handler_id = ? OR w.handler_id IS NULL)`;
    params.push(req.user!.id);
  }

  if (status) {
    query += ' AND w.status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND w.type = ?';
    params.push(type);
  }
  if (contract_id) {
    query += ' AND w.contract_id = ?';
    params.push(contract_id);
  }

  query += ' ORDER BY w.created_at DESC';
  const orders = db.prepare(query).all(...params);
  res.json(orders);
});

router.post('/:id/assign', authMiddleware, roleMiddleware('store_manager'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { handler_id } = req.body;

  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id) as WorkOrder | undefined;
  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }

  db.prepare(`
    UPDATE work_orders
    SET handler_id = ?, status = 'processing'
    WHERE id = ?
  `).run(handler_id, id);

  res.json({ message: '工单已分配' });
});

router.post('/:id/resolve', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { resolution, nps_score } = req.body;

  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id) as WorkOrder | undefined;
  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE work_orders
    SET status = 'resolved', description = description || '\\n解决方案：' || ?, resolved_at = ?, nps_score = ?
    WHERE id = ?
  `).run(resolution || '已解决', now, nps_score || null, id);

  if (order.contract_id && nps_score !== undefined) {
    const contract = db.prepare('SELECT owner_id FROM decoration_contracts WHERE id = ?').get(order.contract_id) as any;
    if (contract) {
      db.prepare(`
        INSERT INTO nps_records (id, contract_id, owner_id, score, feedback, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), order.contract_id, contract.owner_id, nps_score, resolution || '', now);
    }
  }

  res.json({ message: '工单已解决' });
});

router.post('/:id/close', authMiddleware, roleMiddleware('owner', 'store_manager'), (req, res) => {
  const { id } = req.params;

  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id) as WorkOrder | undefined;
  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }

  if (order.status !== 'resolved') {
    return res.status(400).json({ error: '请先解决工单' });
  }

  db.prepare("UPDATE work_orders SET status = 'closed' WHERE id = ?").run(id);
  res.json({ message: '工单已关闭' });
});

router.get('/nps/stats', authMiddleware, roleMiddleware('store_manager'), (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      AVG(score) as avg_score,
      SUM(CASE WHEN score >= 9 THEN 1 ELSE 0 END) as promoters,
      SUM(CASE WHEN score = 7 OR score = 8 THEN 1 ELSE 0 END) as passives,
      SUM(CASE WHEN score <= 6 THEN 1 ELSE 0 END) as detractors
    FROM nps_records
  `).get() as any;

  const nps = stats.total > 0
    ? Math.round(((stats.promoters - stats.detractors) / stats.total) * 100)
    : 0;

  res.json({
    ...stats,
    nps_score: nps,
    avg_score: stats.avg_score ? parseFloat(stats.avg_score.toFixed(2)) : 0
  });
});

router.get('/nps', authMiddleware, roleMiddleware('store_manager'), (req, res) => {
  const records = db.prepare(`
    SELECT n.*, c.contract_no, u.real_name as owner_name
    FROM nps_records n
    LEFT JOIN decoration_contracts c ON n.contract_id = c.id
    LEFT JOIN users u ON n.owner_id = u.id
    ORDER BY n.created_at DESC
    LIMIT 100
  `).all();
  res.json(records);
});

router.get('/stats', authMiddleware, (req: AuthRequest, res) => {
  let filter = '';
  const params: any[] = [];

  if (req.user!.role === 'owner') {
    filter = ' WHERE submitter_id = ?';
    params.push(req.user!.id);
  }

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
    FROM work_orders
    ${filter}
  `).get(...params);

  res.json(stats);
});

export default router;
