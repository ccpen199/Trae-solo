import { Router } from 'express';
import db from '../db';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

function formatDate(d: Date) { return d.toISOString().slice(0, 19).replace('T', ' '); }

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 20, status, type, keyword } = req.query as any;
  const offset = (page - 1) * pageSize;
  let where = [];
  let params: any[] = [];
  if (req.user.role === 'user') { where.push('c.user_id = ?'); params.push(req.user.id); }
  if (status && status !== 'all') { where.push('c.status = ?'); params.push(status); }
  if (type) { where.push('c.type = ?'); params.push(type); }
  if (keyword) { where.push('(o.order_no LIKE ? OR o.tracking_no LIKE ? OR c.description LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (db.prepare(`SELECT COUNT(*) c FROM complaints c LEFT JOIN shipment_orders o ON c.order_id = o.id ${whereSql}`).get(...params) as any).c;
  const list = db.prepare(`
    SELECT c.*, o.order_no, o.tracking_no, o.brand_id,
           u.name user_name, u.phone user_phone,
           cr.name courier_name, cr.phone courier_phone,
           b.name brand_name
    FROM complaints c
    LEFT JOIN shipment_orders o ON c.order_id = o.id
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN couriers cr ON c.courier_id = cr.id
    LEFT JOIN courier_brands b ON o.brand_id = b.id
    ${whereSql}
    ORDER BY c.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);
  const stats = {
    pending: (db.prepare("SELECT COUNT(*) c FROM complaints c LEFT JOIN shipment_orders o ON c.order_id = o.id WHERE c.status = 'pending'").get(...params.slice(0, where.length > 0 && req.user.role === 'user' ? 1 : 0)) as any).c,
    processing: (db.prepare("SELECT COUNT(*) c FROM complaints c LEFT JOIN shipment_orders o ON c.order_id = o.id WHERE c.status = 'processing'").get(...params.slice(0, where.length > 0 && req.user.role === 'user' ? 1 : 0)) as any).c,
    resolved: (db.prepare("SELECT COUNT(*) c FROM complaints c LEFT JOIN shipment_orders o ON c.order_id = o.id WHERE c.status = 'resolved'").get(...params.slice(0, where.length > 0 && req.user.role === 'user' ? 1 : 0)) as any).c,
    sla_warning: (db.prepare("SELECT COUNT(*) c FROM complaints c WHERE c.status IN ('pending','processing') AND c.sla_deadline < DATETIME('now','+4 hours')").get() as any).c
  };
  res.json({ list, total, page: +page, pageSize: +pageSize, stats });
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const { order_id, type, description, images } = req.body;
  if (!order_id || !type || !description) return res.status(400).json({ code: 'BAD_REQUEST', message: '请填写完整信息' });
  const order = db.prepare('SELECT id, courier_id FROM shipment_orders WHERE id = ?').get(order_id) as any;
  if (!order) return res.status(404).json({ code: 'NOT_FOUND', message: '订单不存在' });
  const info = db.prepare(`INSERT INTO complaints (order_id, user_id, courier_id, type, description, images, status, sla_deadline, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    order_id, req.user.id, order.courier_id, type, description, images ? JSON.stringify(images) : null,
    'pending', formatDate(new Date(Date.now() + 8 * 3600 * 1000)), formatDate(new Date())
  );
  db.prepare('UPDATE shipment_orders SET complaint_status = ?, updated_at = ? WHERE id = ?').run('pending', formatDate(new Date()), order_id);
  res.json({ message: '投诉已提交', id: info.lastInsertRowid });
});

router.patch('/:id/status', authMiddleware, (req: AuthRequest, res) => {
  const { status, resolution } = req.body;
  if (!['processing', 'resolved', 'rejected'].includes(status)) return res.status(400).json({ code: 'BAD_REQUEST', message: '无效状态' });
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id) as any;
  if (!complaint) return res.status(404).json({ code: 'NOT_FOUND', message: '投诉不存在' });
  const now = formatDate(new Date());
  db.prepare('UPDATE complaints SET status = ?, resolution = ?, handler_id = ?, resolved_at = ? WHERE id = ?').run(
    status, resolution || null, req.user.id, status === 'resolved' ? now : null, req.params.id
  );
  if (status === 'resolved') {
    db.prepare('UPDATE shipment_orders SET complaint_status = ? WHERE id = ?').run('resolved', complaint.order_id);
  }
  res.json({ message: '状态已更新' });
});

router.get('/:id', (req, res) => {
  const complaint = db.prepare(`
    SELECT c.*, o.order_no, o.tracking_no, o.receiver_address,
           u.name user_name, u.phone user_phone,
           cr.name courier_name, cr.phone courier_phone, cr.rating courier_rating,
           b.name brand_name
    FROM complaints c
    LEFT JOIN shipment_orders o ON c.order_id = o.id
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN couriers cr ON c.courier_id = cr.id
    LEFT JOIN courier_brands b ON o.brand_id = b.id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!complaint) return res.status(404).json({ code: 'NOT_FOUND', message: '投诉不存在' });
  res.json(complaint);
});

export default router;
