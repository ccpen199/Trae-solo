import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || parseInt(req.query.page_size as string) || 10;
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (req.query.origin_province) {
      where += ' AND dr.origin_province = ?';
      params.push(req.query.origin_province);
    }
    if (req.query.origin_city) {
      where += ' AND dr.origin_city = ?';
      params.push(req.query.origin_city);
    }
    if (req.query.dest_province) {
      where += ' AND dr.dest_province = ?';
      params.push(req.query.dest_province);
    }
    if (req.query.dest_city) {
      where += ' AND dr.dest_city = ?';
      params.push(req.query.dest_city);
    }
    if (req.query.status) {
      where += ' AND dr.status = ?';
      params.push(req.query.status);
    }
    if (req.query.keyword) {
      where += ' AND (dr.route_name LIKE ? OR dr.description LIKE ?)';
      params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`);
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM dedicated_routes dr ${where}`).get(...params) as any).count;
    const items = db.prepare(`SELECT dr.id, dr.carrier_id, dr.route_name, dr.origin_province, dr.origin_city, dr.dest_province, dr.dest_city, dr.origin_lat, dr.origin_lng, dr.dest_lat, dr.dest_lng, dr.carrier_qualification, dr.delivery_promise, dr.complaint_rate, dr.on_time_rate, dr.price_per_ton, dr.description, dr.status, dr.created_at, dr.updated_at, CASE WHEN dr.carrier_qualification IS NOT NULL AND dr.carrier_qualification != '' THEN 1 ELSE 0 END as is_qualified, u.username as carrier_name, u.real_name as carrier_real_name, u.company_name as carrier_company FROM dedicated_routes dr LEFT JOIN users u ON dr.carrier_id = u.id ${where} ORDER BY dr.created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);

    res.json({ items, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: '获取专线列表失败' });
  }
});

router.post('/', requireRole('carrier', 'admin'), async (req: Request, res: Response) => {
  try {
    const {
      route_name, origin_province, origin_city, dest_province, dest_city,
      origin_lat, origin_lng, dest_lat, dest_lng,
      carrier_qualification, delivery_promise, complaint_rate, on_time_rate,
      price_per_ton, description,
    } = req.body;

    if (!route_name) {
      res.status(400).json({ error: '专线名称为必填项' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO dedicated_routes (carrier_id, route_name, origin_province, origin_city, dest_province, dest_city,
        origin_lat, origin_lng, dest_lat, dest_lng, carrier_qualification, delivery_promise,
        complaint_rate, on_time_rate, price_per_ton, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user!.userId, route_name,
      origin_province || '', origin_city || '', dest_province || '', dest_city || '',
      origin_lat || 0, origin_lng || 0, dest_lat || 0, dest_lng || 0,
      carrier_qualification || '', delivery_promise || '',
      complaint_rate || 0, on_time_rate || 0, price_per_ton || 0, description || '',
    );

    const route = db.prepare('SELECT * FROM dedicated_routes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(route);
  } catch (err) {
    res.status(500).json({ error: '创建专线失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const route = db.prepare(`SELECT dr.*, CASE WHEN dr.carrier_qualification IS NOT NULL AND dr.carrier_qualification != '' THEN 1 ELSE 0 END as is_qualified, u.username as carrier_name, u.real_name as carrier_real_name, u.company_name as carrier_company, u.credit_score as carrier_credit FROM dedicated_routes dr LEFT JOIN users u ON dr.carrier_id = u.id WHERE dr.id = ?`).get(req.params.id);
    if (!route) {
      res.status(404).json({ error: '专线不存在' });
      return;
    }
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: '获取专线详情失败' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const route = db.prepare('SELECT * FROM dedicated_routes WHERE id = ?').get(req.params.id) as any;
    if (!route) {
      res.status(404).json({ error: '专线不存在' });
      return;
    }
    if (route.carrier_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: '无权修改此专线' });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];
    const allowedFields = [
      'route_name', 'origin_province', 'origin_city', 'dest_province', 'dest_city',
      'origin_lat', 'origin_lng', 'dest_lat', 'dest_lng',
      'carrier_qualification', 'delivery_promise', 'complaint_rate', 'on_time_rate',
      'price_per_ton', 'description', 'status',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ error: '没有要更新的字段' });
      return;
    }

    fields.push("updated_at = datetime('now')");
    values.push(req.params.id);

    db.prepare(`UPDATE dedicated_routes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM dedicated_routes WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新专线失败' });
  }
});

export default router;
