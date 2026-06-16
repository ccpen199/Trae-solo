import { Router } from 'express';
import db from '../db';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, keyword, work_status, brand_id, rating_min } = req.query as any;
  const offset = (page - 1) * pageSize;
  let where = [];
  let params: any[] = [];
  if (keyword) { where.push('(name LIKE ? OR employee_no LIKE ? OR phone LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  if (work_status) { where.push('work_status = ?'); params.push(work_status); }
  if (brand_id) { where.push('c.brand_id = ?'); params.push(brand_id); }
  if (rating_min) { where.push('c.rating >= ?'); params.push(rating_min); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (db.prepare(`SELECT COUNT(*) c FROM couriers c ${whereSql}`).get(...params) as any).c;
  const list = db.prepare(`SELECT c.*, b.name brand_name, b.code brand_code FROM couriers c LEFT JOIN courier_brands b ON c.brand_id = b.id ${whereSql} ORDER BY c.rating DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset);
  res.json({ list, total, page: +page, pageSize: +pageSize });
});

router.get('/pool', (_req, res) => {
  const list = db.prepare(`SELECT c.*, b.name brand_name, b.code brand_code, b.rating brand_rating FROM couriers c LEFT JOIN courier_brands b ON c.brand_id = b.id WHERE c.work_status = 'online' AND b.api_status = 'active' ORDER BY c.rating DESC`).all() as any[];
  const stats = {
    total: list.length,
    online: list.filter((c: any) => c.work_status === 'online').length,
    busy: list.filter((c: any) => c.work_status === 'busy').length,
    avg_rating: list.length ? +(list.reduce((s: number, c: any) => s + c.rating, 0) / list.length).toFixed(2) : 0
  };
  res.json({ list, stats });
});

router.get('/me/workbench', (req: AuthRequest, res) => {
  let courier = db.prepare('SELECT * FROM couriers WHERE user_id = ?').get(req.user.id) as any;
  if (!courier && req.user.role === 'admin') {
    courier = db.prepare('SELECT * FROM couriers LIMIT 1').get() as any;
  }
  if (!courier) return res.status(404).json({ code: 'NOT_FOUND', message: '快递员信息不存在' });

  const pending = (db.prepare("SELECT COUNT(*) c FROM shipment_orders WHERE courier_id = ? AND status IN ('created','picked','in_transit','arrived_branch','out_for_delivery')").get(courier.id) as any).c;
  const outForDelivery = (db.prepare("SELECT COUNT(*) c FROM shipment_orders WHERE courier_id = ? AND status = 'out_for_delivery'").get(courier.id) as any).c;
  const todaySigned = (db.prepare("SELECT COUNT(*) c FROM shipment_orders WHERE courier_id = ? AND status = 'signed' AND DATE(updated_at) = DATE('now')").get(courier.id) as any).c;
  const complaints = (db.prepare("SELECT COUNT(*) c FROM complaints WHERE courier_id = ? AND status != 'resolved'").get(courier.id) as any).c;
  const slaWarning = (db.prepare("SELECT COUNT(*) c FROM complaints WHERE courier_id = ? AND status = 'pending' AND sla_deadline < DATETIME('now','+4 hours')").get(courier.id) as any).c;

  const orders = db.prepare(`
    SELECT o.*, b.name brand_name, b.code brand_code
    FROM shipment_orders o LEFT JOIN courier_brands b ON o.brand_id = b.id
    WHERE o.courier_id = ? AND o.status IN ('out_for_delivery','arrived_branch','in_transit','picked')
    ORDER BY CASE o.status WHEN 'out_for_delivery' THEN 1 WHEN 'arrived_branch' THEN 2 ELSE 3 END, o.created_at DESC
    LIMIT 30
  `).all(courier.id);

  const complaintList = db.prepare(`
    SELECT c.*, o.order_no, o.tracking_no
    FROM complaints c LEFT JOIN shipment_orders o ON c.order_id = o.id
    WHERE c.courier_id = ? AND c.status != 'resolved'
    ORDER BY c.created_at DESC
    LIMIT 10
  `).all(courier.id);

  const stats = {
    pending_orders: pending,
    out_for_delivery: outForDelivery,
    today_signed: todaySigned,
    open_complaints: complaints,
    sla_warning: slaWarning,
    rating: courier.rating,
    total_orders: courier.total_orders,
    on_time_rate: courier.on_time_rate
  };

  res.json({ courier, stats, orders, complaints: complaintList });
});

router.get('/:id', (req, res) => {
  const courier = db.prepare(`SELECT c.*, b.name brand_name, b.code brand_code FROM couriers c LEFT JOIN courier_brands b ON c.brand_id = b.id WHERE c.id = ?`).get(req.params.id);
  if (!courier) return res.status(404).json({ code: 'NOT_FOUND', message: '快递员不存在' });
  res.json(courier);
});

router.patch('/:id/status', (req, res) => {
  const { work_status } = req.body;
  if (!['online', 'offline', 'busy'].includes(work_status)) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: '无效状态' });
  }
  db.prepare('UPDATE couriers SET work_status = ? WHERE id = ?').run(work_status, req.params.id);
  res.json({ message: '状态更新成功', work_status });
});

export default router;
