import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 30, keyword, api_status } = req.query as any;
  const offset = (page - 1) * pageSize;
  let where = [];
  let params: any[] = [];
  if (keyword) { where.push('(name LIKE ? OR code LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }
  if (api_status) { where.push('api_status = ?'); params.push(api_status); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (db.prepare(`SELECT COUNT(*) c FROM courier_brands ${whereSql}`).get(...params) as any).c;
  const list = db.prepare(`SELECT * FROM courier_brands ${whereSql} ORDER BY rating DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset);
  res.json({ list, total, page: +page, pageSize: +pageSize });
});

router.get('/all', (_req, res) => {
  const list = db.prepare('SELECT id, code, name, base_price, per_kg_price, avg_delivery_hours, coverage_score, rating, api_status FROM courier_brands WHERE api_status = ? ORDER BY rating DESC').all('active');
  res.json({ list });
});

router.get('/:id', (req, res) => {
  const brand = db.prepare(`SELECT b.*, (SELECT COUNT(*) FROM couriers WHERE brand_id = b.id) courier_count, (SELECT COUNT(*) FROM branches WHERE brand_id = b.id) branch_count FROM courier_brands b WHERE b.id = ?`).get(req.params.id);
  if (!brand) return res.status(404).json({ code: 'NOT_FOUND', message: '品牌不存在' });
  res.json(brand);
});

router.get('/:id/branches', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query as any;
  const offset = (page - 1) * pageSize;
  const total = (db.prepare('SELECT COUNT(*) c FROM branches WHERE brand_id = ?').get(req.params.id) as any).c;
  const list = db.prepare('SELECT * FROM branches WHERE brand_id = ? LIMIT ? OFFSET ?').all(req.params.id, pageSize, offset);
  res.json({ list, total, page: +page, pageSize: +pageSize });
});

router.get('/:id/couriers', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query as any;
  const offset = (page - 1) * pageSize;
  const total = (db.prepare('SELECT COUNT(*) c FROM couriers WHERE brand_id = ?').get(req.params.id) as any).c;
  const list = db.prepare('SELECT * FROM couriers WHERE brand_id = ? LIMIT ? OFFSET ?').all(req.params.id, pageSize, offset);
  res.json({ list, total, page: +page, pageSize: +pageSize });
});

router.post('/:id/toggle-api', (req, res) => {
  const brand = db.prepare('SELECT * FROM courier_brands WHERE id = ?').get(req.params.id) as any;
  if (!brand) return res.status(404).json({ code: 'NOT_FOUND', message: '品牌不存在' });
  const newStatus = brand.api_status === 'active' ? 'inactive' : 'active';
  db.prepare('UPDATE courier_brands SET api_status = ? WHERE id = ?').run(newStatus, req.params.id);
  res.json({ message: 'API状态已更新', api_status: newStatus });
});

export default router;
