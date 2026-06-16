import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, keyword, city, brand_id } = req.query as any;
  const offset = (page - 1) * pageSize;
  let where = ['br.status = ?'];
  let params: any[] = ['active'];
  if (keyword) { where.push('(br.name LIKE ? OR br.code LIKE ? OR br.address LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  if (city) { where.push('br.city = ?'); params.push(city); }
  if (brand_id) { where.push('br.brand_id = ?'); params.push(brand_id); }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const total = (db.prepare(`SELECT COUNT(*) c FROM branches br ${whereSql}`).get(...params) as any).c;
  const list = db.prepare(`
    SELECT br.*, b.name brand_name, b.code brand_code
    FROM branches br LEFT JOIN courier_brands b ON br.brand_id = b.id
    ${whereSql} ORDER BY br.daily_throughput DESC LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);
  res.json({ list, total, page: +page, pageSize: +pageSize });
});

router.get('/throughput-stats', (_req, res) => {
  const byCity = db.prepare(`
    SELECT city, SUM(daily_throughput) total, COUNT(*) branch_count,
           SUM(max_capacity) total_capacity,
           ROUND(SUM(daily_throughput) * 100.0 / NULLIF(SUM(max_capacity),0), 2) usage_rate
    FROM branches GROUP BY city ORDER BY total DESC LIMIT 20
  `).all();
  const byBrand = db.prepare(`
    SELECT b.id, b.name, b.code,
           SUM(br.daily_throughput) total, COUNT(*) branch_count,
           SUM(br.max_capacity) total_capacity
    FROM branches br LEFT JOIN courier_brands b ON br.brand_id = b.id
    GROUP BY b.id ORDER BY total DESC LIMIT 15
  `).all();
  const overload = db.prepare(`
    SELECT br.*, b.name brand_name FROM branches br LEFT JOIN courier_brands b ON br.brand_id = b.id
    WHERE br.daily_throughput > br.max_capacity * 0.85 ORDER BY br.daily_throughput DESC LIMIT 20
  `).all();
  res.json({ by_city: byCity, by_brand: byBrand, overload_branches: overload });
});

router.get('/:id', (req, res) => {
  const branch = db.prepare(`
    SELECT br.*, b.name brand_name, b.code brand_code
    FROM branches br LEFT JOIN courier_brands b ON br.brand_id = b.id WHERE br.id = ?
  `).get(req.params.id);
  if (!branch) return res.status(404).json({ code: 'NOT_FOUND', message: '网点不存在' });
  res.json(branch);
});

export default router;
